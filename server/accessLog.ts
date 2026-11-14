import type { Request, Response, NextFunction } from "express";
import { clipText, geoFromHeaders } from "./requestGeo";

export type AccessLogEntry = {
  time: string;
  level: "info";
  msg: "access";
  method: string;
  path: string;
  status: number;
  duration_ms: number;
  referer: string | null;
  user_agent: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
};

type Writer = (line: string) => void;

function emptyToNull(value: string): string | null {
  return value ? value : null;
}

export function createAccessLog(write: Writer = (line) => {
  process.stdout.write(line);
}): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    const start = process.hrtime.bigint();
    const method = req.method;
    const path = req.path;
    const geo = geoFromHeaders(req.headers);
    const referer = clipText(req.headers.referer, 1024);
    const userAgent = clipText(req.headers["user-agent"], 512);
    let logged = false;

    const emit = () => {
      if (logged) return;
      logged = true;
      const durationMs = Math.round(Number(process.hrtime.bigint() - start) / 1e6);
      const entry: AccessLogEntry = {
        time: new Date().toISOString(),
        level: "info",
        msg: "access",
        method,
        path,
        status: res.statusCode,
        duration_ms: durationMs,
        referer: emptyToNull(referer),
        user_agent: emptyToNull(userAgent),
        country: emptyToNull(geo.country),
        region: emptyToNull(geo.region),
        city: emptyToNull(geo.city),
      };
      write(`${JSON.stringify(entry)}\n`);
    };

    res.on("finish", emit);
    res.on("close", emit);
    next();
  };
}

export const accessLog = createAccessLog();
