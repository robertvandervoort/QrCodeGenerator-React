import { onCLS, onINP, onLCP } from "web-vitals";
import { getFetchLater, type FetchLaterResult } from "./fetchLaterPolyfill";
import {
  RUM_SERVICE_NAME,
  commonAttributes,
  createSessionId,
  encodeOtlp,
  foregroundDuration,
  getOrCreateSessionId,
  isSessionSampled,
  loadAttribution,
  normalizeRoute,
  readSampleRate,
  spanTimes,
  type AttributeValue,
  type Attribution,
  type KeyValueStorage,
  type RumSpan,
  type VisibilitySlice,
} from "./rumCore";

const ENDPOINT = "/api/otel/v1/traces";
const BATCH_WINDOW_MS = 10_000;
const REFRESH_MS = 2_000;
const MAX_BODY_CHARS = 48_000;
const MAX_QUEUE = 40;

type VitalMetric = { name: string; value: number; rating: string; id: string };

let enabled = false;
let initialized = false;
let currentRoute = "/";
let attribution: Attribution = {
  referrer: "direct",
  utmSource: "none",
  utmMedium: "none",
  utmCampaign: "none",
  landingRoute: "/",
};
let sessionId = "";
let country = "unknown";
let region = "unknown";
let engagementStartedAt = 0;
let engagementRoute = "/";
let lastSnapshotAt = 0;
let sendDeadline = 0;
let controller: AbortController | null = null;
let pending: FetchLaterResult | null = null;
const committed: RumSpan[] = [];
const vitals = new Map<string, RumSpan>();
let reportingError = false;

function browserStorage(): KeyValueStorage {
  const memory = new Map<string, string>();
  return {
    getItem(key) {
      try {
        return sessionStorage.getItem(key);
      } catch {
        return memory.get(key) ?? null;
      }
    },
    setItem(key, value) {
      try {
        sessionStorage.setItem(key, value);
      } catch {
        memory.set(key, value);
      }
    },
  };
}

function metaContent(name: string): string {
  const element = document.querySelector(`meta[name="${name}"]`);
  return element?.getAttribute("content")?.trim() || "";
}

function visibilityEntries(): VisibilitySlice[] {
  const entries = performance.getEntriesByType("visibility-state");
  return entries.map((entry) => ({ name: entry.name, startTime: entry.startTime }));
}

function foregroundMs(): number {
  if (!engagementStartedAt) return 0;
  return foregroundDuration(visibilityEntries(), engagementStartedAt, performance.now());
}

function attributes(extra: Record<string, AttributeValue> = {}): Record<string, AttributeValue> {
  return {
    ...commonAttributes({
      route: currentRoute,
      referrer: attribution.referrer,
      utmSource: attribution.utmSource,
      utmMedium: attribution.utmMedium,
      utmCampaign: attribution.utmCampaign,
      landingRoute: attribution.landingRoute,
      country,
      region,
      sessionId,
    }),
    ...extra,
  };
}

function makeSpan(name: string, extra: Record<string, AttributeValue>, durationMs: number, statusCode = 1): RumSpan {
  const times = spanTimes(durationMs);
  return {
    name,
    ...times,
    attributes: attributes(extra),
    statusCode,
  };
}

function pushCommitted(span: RumSpan) {
  committed.push(span);
  if (committed.length > MAX_QUEUE) committed.splice(0, committed.length - MAX_QUEUE);
}

function buildEngagementSpan(): RumSpan | null {
  const duration = Math.round(foregroundMs());
  if (duration < 1) return null;
  return makeSpan("page_engagement", {
    "rum.route": engagementRoute,
    "rum.engagement_time_ms": duration,
  }, duration);
}

function syncActivated() {
  if (!pending?.activated) return;
  committed.length = 0;
  vitals.clear();
  engagementStartedAt = lastSnapshotAt || performance.now();
  engagementRoute = currentRoute;
  pending = null;
  controller = null;
  sendDeadline = 0;
}

function payloadBody(spans: RumSpan[]): string {
  let batch = spans;
  let body = JSON.stringify(encodeOtlp(batch, RUM_SERVICE_NAME));
  while (body.length > MAX_BODY_CHARS && batch.length > 1) {
    batch = batch.slice(1);
    body = JSON.stringify(encodeOtlp(batch, RUM_SERVICE_NAME));
  }
  return body;
}

function scheduleBeacon() {
  if (!enabled) return;
  syncActivated();
  const engagement = buildEngagementSpan();
  const spans = committed.concat(Array.from(vitals.values()));
  if (engagement) spans.push(engagement);
  const hasEvents = committed.length > 0 || vitals.size > 0;
  if (!hasEvents && (!engagement || (engagement.attributes["rum.engagement_time_ms"] as number) < 1000)) {
    return;
  }
  if (!sendDeadline) sendDeadline = Date.now() + BATCH_WINDOW_MS;
  const activateAfter = Math.max(1, sendDeadline - Date.now());
  if (controller) controller.abort();
  controller = new AbortController();
  lastSnapshotAt = performance.now();
  try {
    pending = getFetchLater()(ENDPOINT, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: payloadBody(spans),
      signal: controller.signal,
      activateAfter,
    });
  } catch {
    pending = null;
  }
}

function recordVital(metric: VitalMetric) {
  if (!enabled) return;
  const value = metric.name === "CLS"
    ? Math.round(metric.value * 10_000) / 10_000
    : Math.round(metric.value);
  vitals.set(metric.name, makeSpan("rum.web_vital", {
    "rum.web_vital.name": metric.name,
    "rum.web_vital.value": value,
    "rum.web_vital.rating": metric.rating,
    "rum.web_vital.id": metric.id,
  }, 1));
  scheduleBeacon();
}

function recordError(type: string, message: string) {
  if (!enabled || reportingError) return;
  reportingError = true;
  try {
    const text = message.replace(/\s+/g, " ").trim().slice(0, 300) || "Unknown error";
    if (text.includes(ENDPOINT)) return;
    pushCommitted(makeSpan("rum.js_error", {
      "rum.error.type": type,
      "rum.error.message": text,
    }, 1, 2));
    scheduleBeacon();
  } finally {
    reportingError = false;
  }
}

export function initRum(): void {
  if (initialized || typeof window === "undefined") return;
  initialized = true;
  try {
    const storage = browserStorage();
    const rate = readSampleRate(import.meta.env.VITE_RUM_SAMPLE_RATE);
    if (!isSessionSampled(rate, Math.random(), storage)) return;
    enabled = true;
    sessionId = getOrCreateSessionId(storage) || createSessionId();
    currentRoute = normalizeRoute(window.location.pathname);
    attribution = loadAttribution(storage, {
      referrer: document.referrer,
      href: window.location.href,
      host: window.location.hostname,
      route: currentRoute,
    });
    country = metaContent("cf-country") || "unknown";
    region = metaContent("cf-region") || "unknown";
    engagementRoute = currentRoute;
    engagementStartedAt = performance.now();

    onLCP(recordVital);
    onCLS(recordVital);
    onINP(recordVital);

    window.addEventListener("error", (event) => {
      recordError("error", event.message || "Script error");
    });
    window.addEventListener("unhandledrejection", (event) => {
      const reason = event.reason;
      const message = reason instanceof Error ? reason.message : String(reason ?? "Unhandled rejection");
      recordError("unhandledrejection", message);
    });
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") scheduleBeacon();
    });
    window.setInterval(() => {
      if (document.visibilityState === "visible") scheduleBeacon();
    }, REFRESH_MS);

    trackPageView(currentRoute);
  } catch {
    enabled = false;
  }
}

export function trackPageView(route: string): void {
  if (!enabled) return;
  try {
    const path = normalizeRoute(route);
    if (path === currentRoute && committed.some((span) => span.name === "page_view" && span.attributes["rum.route"] === path)) {
      return;
    }
    if (engagementStartedAt && path !== currentRoute) {
      const engagement = buildEngagementSpan();
      if (engagement) pushCommitted(engagement);
      engagementStartedAt = performance.now();
    }
    currentRoute = path;
    engagementRoute = path;
    if (!engagementStartedAt) engagementStartedAt = performance.now();
    pushCommitted(makeSpan("page_view", { "rum.route": path }, 1));
    scheduleBeacon();
  } catch {
    // Telemetry must not break navigation.
  }
}

export function trackCta(cta: "qr-generate" | "qr-download", count = 1): void {
  if (!enabled) return;
  try {
    const amount = Number.isFinite(count) ? Math.max(1, Math.round(count)) : 1;
    pushCommitted(makeSpan("rum.cta_event", {
      "rum.cta": cta,
      "rum.cta.count": amount,
    }, 1));
    scheduleBeacon();
  } catch {
    // Telemetry must not break QR generation or download.
  }
}
