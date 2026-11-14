export const RUM_SERVICE_NAME = "qr-web-rum";

export const AI_REFERRER_HOSTS = [
  "chatgpt.com",
  "perplexity.ai",
  "gemini.google.com",
  "copilot.microsoft.com",
  "claude.ai",
] as const;

export type AttributeValue = string | number | boolean;

export type RumSpan = {
  name: string;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes: Record<string, AttributeValue>;
  statusCode?: number;
  traceId?: string;
  spanId?: string;
};

export type Attribution = {
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingRoute: string;
};

export interface KeyValueStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const SESSION_KEY = "qr.rum.session.id";
const ATTRIBUTION_KEY = "qr.rum.attribution";
const SAMPLE_KEY = "qr.rum.sampled";

export function readSampleRate(raw: unknown): number {
  if (raw === undefined || raw === null || raw === "") return 1;
  const value = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(value)) return 1;
  if (value <= 0) return 0;
  if (value >= 1) return 1;
  return value;
}

/** Stable for the browser session so a sampled visit is not split across beacons. */
export function isSessionSampled(rate: number, random: number, storage: KeyValueStorage): boolean {
  if (rate >= 1) return true;
  if (rate <= 0) return false;
  const stored = storage.getItem(SAMPLE_KEY);
  if (stored === "1") return true;
  if (stored === "0") return false;
  const sampled = random < rate;
  storage.setItem(SAMPLE_KEY, sampled ? "1" : "0");
  return sampled;
}

export function normalizeRoute(route: string): string {
  const path = route.split("?")[0]?.split("#")[0] || "/";
  if (!path.startsWith("/")) return `/${path}`;
  return path || "/";
}

export function externalHostname(referrer: string, selfHost: string): string {
  if (!referrer) return "direct";
  try {
    const url = new URL(referrer);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    const self = selfHost.toLowerCase().replace(/^www\./, "").split(":")[0];
    if (!host || host === self) return "direct";
    return host;
  } catch {
    return "direct";
  }
}

function utmValue(url: URL, key: string): string {
  const value = url.searchParams.get(key)?.trim() || "";
  if (!value) return "none";
  return value.slice(0, 128);
}

function parseAttribution(raw: string): Attribution | null {
  try {
    const value = JSON.parse(raw) as Partial<Attribution>;
    if (!value || typeof value !== "object") return null;
    if (typeof value.referrer !== "string" || typeof value.landingRoute !== "string") return null;
    if (typeof value.utmSource !== "string") return null;
    if (typeof value.utmMedium !== "string") return null;
    if (typeof value.utmCampaign !== "string") return null;
    return {
      referrer: value.referrer || "direct",
      utmSource: value.utmSource || "none",
      utmMedium: value.utmMedium || "none",
      utmCampaign: value.utmCampaign || "none",
      landingRoute: normalizeRoute(value.landingRoute),
    };
  } catch {
    return null;
  }
}

/** First external referrer and first UTM values win for the rest of the tab session. */
export function loadAttribution(storage: KeyValueStorage, input: {
  referrer: string;
  href: string;
  host: string;
  route: string;
}): Attribution {
  const existing = storage.getItem(ATTRIBUTION_KEY);
  if (existing) {
    const parsed = parseAttribution(existing);
    if (parsed) return parsed;
  }
  let url: URL;
  try {
    url = new URL(input.href);
  } catch {
    url = new URL("https://qr.vdvlabs.ai/");
  }
  const created: Attribution = {
    referrer: externalHostname(input.referrer, input.host),
    utmSource: utmValue(url, "utm_source"),
    utmMedium: utmValue(url, "utm_medium"),
    utmCampaign: utmValue(url, "utm_campaign"),
    landingRoute: normalizeRoute(input.route),
  };
  storage.setItem(ATTRIBUTION_KEY, JSON.stringify(created));
  return created;
}

export function createSessionId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return randomHex(16);
}

export function getOrCreateSessionId(storage: KeyValueStorage): string {
  const existing = storage.getItem(SESSION_KEY);
  if (existing && /^[0-9a-f-]{16,36}$/i.test(existing)) return existing;
  const id = createSessionId();
  storage.setItem(SESSION_KEY, id);
  return id;
}

export function commonAttributes(input: {
  route: string;
  referrer: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  landingRoute: string;
  country: string;
  region: string;
  sessionId: string;
}): Record<string, string> {
  return {
    "rum.route": input.route,
    "rum.referrer": input.referrer,
    "rum.utm_source": input.utmSource,
    "rum.utm_medium": input.utmMedium,
    "rum.utm_campaign": input.utmCampaign,
    "rum.landing_route": input.landingRoute,
    "rum.country": input.country,
    "rum.region": input.region,
    "session.id": input.sessionId,
  };
}

export type VisibilitySlice = { name: string; startTime: number };

/**
 * Foreground time between `since` and `now`.
 * An empty visibility timeline means the browser has no VisibilityStateEntry
 * support, so the elapsed time is used as an upper bound.
 */
export function foregroundDuration(entries: VisibilitySlice[], since: number, now: number): number {
  if (entries.length === 0) return Math.max(0, now - since);
  let total = 0;
  for (let i = 0; i < entries.length; i++) {
    if (entries[i]?.name !== "visible") continue;
    const start = entries[i].startTime;
    const end = i + 1 < entries.length ? entries[i + 1].startTime : now;
    const overlapStart = Math.max(start, since);
    const overlapEnd = Math.min(end, now);
    if (overlapEnd > overlapStart) total += overlapEnd - overlapStart;
  }
  return total;
}

export function randomHex(bytes: number): string {
  const buffer = new Uint8Array(bytes);
  crypto.getRandomValues(buffer);
  let out = "";
  for (let index = 0; index < buffer.length; index++) {
    out += buffer[index].toString(16).padStart(2, "0");
  }
  return out;
}

export function msToNano(ms: number): string {
  return (BigInt(Math.max(0, Math.round(ms))) * BigInt(1_000_000)).toString();
}

export function spanTimes(durationMs: number, nowMs = Date.now()): {
  startTimeUnixNano: string;
  endTimeUnixNano: string;
} {
  const duration = Math.max(1, Math.round(durationMs));
  const end = Math.max(0, Math.round(nowMs));
  const start = Math.max(0, end - duration);
  return {
    startTimeUnixNano: msToNano(start),
    endTimeUnixNano: msToNano(end),
  };
}

function otlpValue(value: AttributeValue): Record<string, string | number | boolean> {
  if (typeof value === "string") return { stringValue: value };
  if (typeof value === "boolean") return { boolValue: value };
  if (Number.isInteger(value)) return { intValue: String(value) };
  return { doubleValue: value };
}

export function encodeOtlp(spans: RumSpan[], serviceName = RUM_SERVICE_NAME) {
  return {
    resourceSpans: [
      {
        resource: {
          attributes: [
            { key: "service.name", value: { stringValue: serviceName } },
          ],
        },
        scopeSpans: [
          {
            scope: { name: serviceName, version: "1.0.0" },
            spans: spans.map((span) => ({
              traceId: span.traceId ?? randomHex(16),
              spanId: span.spanId ?? randomHex(8),
              name: span.name,
              kind: 1,
              startTimeUnixNano: span.startTimeUnixNano,
              endTimeUnixNano: span.endTimeUnixNano,
              attributes: Object.entries(span.attributes).map(([key, value]) => ({
                key,
                value: otlpValue(value),
              })),
              status: { code: span.statusCode ?? 1 },
            })),
          },
        ],
      },
    ],
  };
}
