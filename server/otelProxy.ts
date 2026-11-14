import type { Express, NextFunction, Request, Response } from "express";
import express from "express";

export const DEFAULT_OTLP_TRACES_ENDPOINT = "http://otel-collector:4318/v1/traces";

const DEFAULT_RATE_LIMIT = 120;
const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_BODY_LIMIT = "128kb";
const UPSTREAM_TIMEOUT_MS = 5_000;
const MAX_TRACKED_CLIENTS = 5_000;

type Hit = { timestamps: number[] };

export function otlpTracesEndpoint(raw?: string | null): string {
  const value = (raw === undefined
    ? process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT
    : raw
  )?.trim() || DEFAULT_OTLP_TRACES_ENDPOINT;
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    throw new Error("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT is not a valid URL");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT must use http or https");
  }
  return url.toString();
}

export function telemetryClientKey(req: Request): string {
  const cf = headerText(req.headers["cf-connecting-ip"]);
  if (cf) return `cf:${cf}`;
  const forwarded = headerText(req.headers["x-forwarded-for"]);
  if (forwarded) return `xff:${forwarded.split(",")[0]?.trim() || forwarded}`;
  return `ip:${req.socket.remoteAddress || "unknown"}`;
}

function headerText(value: string | string[] | undefined): string {
  const raw = Array.isArray(value) ? value[0] : value;
  return raw?.trim() || "";
}

export function createRateLimiter(options?: {
  limit?: number;
  windowMs?: number;
  now?: () => number;
}) {
  const limit = options?.limit ?? DEFAULT_RATE_LIMIT;
  const windowMs = options?.windowMs ?? DEFAULT_WINDOW_MS;
  const now = options?.now ?? Date.now;
  const hits = new Map<string, Hit>();

  return function rateLimit(req: Request, res: Response, next: NextFunction) {
    const key = telemetryClientKey(req);
    const time = now();
    const entry = hits.get(key) ?? { timestamps: [] };
    entry.timestamps = entry.timestamps.filter((stamp) => time - stamp < windowMs);
    if (entry.timestamps.length >= limit) {
      hits.set(key, entry);
      const oldest = entry.timestamps[0] ?? time;
      const retryAfter = Math.max(1, Math.ceil((windowMs - (time - oldest)) / 1000));
      res.setHeader("Retry-After", String(retryAfter));
      res.status(429).json({ message: "Too many telemetry requests" });
      return;
    }
    entry.timestamps.push(time);
    hits.delete(key);
    hits.set(key, entry);
    if (hits.size > MAX_TRACKED_CLIENTS) {
      const oldestKey = hits.keys().next().value;
      if (oldestKey) hits.delete(oldestKey);
    }
    next();
  };
}

function isTraceContentType(header: string | undefined): boolean {
  if (!header) return false;
  const value = header.toLowerCase();
  return value.includes("application/json") || value.includes("application/x-protobuf");
}

function rawBody(limit: string) {
  const parser = express.raw({ limit, type: () => true });
  return (req: Request, res: Response, next: NextFunction) => {
    parser(req, res, (err: unknown) => {
      if (!err) {
        next();
        return;
      }
      const error = err as { type?: string; status?: number; statusCode?: number };
      if (error.type === "entity.too.large" || error.status === 413 || error.statusCode === 413) {
        res.status(413).json({ message: "Trace payload too large" });
        return;
      }
      next(err);
    });
  };
}

export function mountOtelTracesProxy(app: Express, options?: {
  limit?: number;
  windowMs?: number;
  maxBody?: string;
  now?: () => number;
  fetchImpl?: typeof fetch;
}): void {
  const limiter = createRateLimiter(options);
  const fetchImpl = options?.fetchImpl ?? fetch;
  const maxBody = options?.maxBody ?? DEFAULT_BODY_LIMIT;

  app.post(
    "/api/otel/v1/traces",
    limiter,
    rawBody(maxBody),
    (req, res, next) => {
      void forwardTraces(req, res, fetchImpl).catch(next);
    },
  );
}

async function forwardTraces(req: Request, res: Response, fetchImpl: typeof fetch): Promise<void> {
  const contentType = req.header("content-type") || "";
  if (!isTraceContentType(contentType)) {
    res.status(415).json({ message: "Content-Type must be application/json or application/x-protobuf" });
    return;
  }
  const body = req.body;
  if (!Buffer.isBuffer(body) || body.length === 0) {
    res.status(400).json({ message: "Empty trace payload" });
    return;
  }

  let endpoint: string;
  try {
    endpoint = otlpTracesEndpoint();
  } catch {
    res.status(500).json({ message: "Telemetry endpoint is not configured" });
    return;
  }

  let upstream: globalThis.Response;
  try {
    upstream = await fetchImpl(endpoint, {
      method: "POST",
      headers: { "content-type": contentType },
      body: new Uint8Array(body),
      redirect: "manual",
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    res.status(502).json({ message: "Collector unavailable" });
    return;
  }

  if (upstream.status >= 300 && upstream.status < 400) {
    res.status(502).json({ message: "Collector unavailable" });
    return;
  }

  const upstreamType = upstream.headers.get("content-type");
  const bytes = Buffer.from(await upstream.arrayBuffer());
  res.status(upstream.status);
  res.setHeader("Cache-Control", "no-store");
  if (upstreamType && (upstreamType.includes("json") || upstreamType.startsWith("text/"))) {
    res.setHeader("Content-Type", upstreamType);
  }
  res.send(bytes.subarray(0, 8_192));
}
