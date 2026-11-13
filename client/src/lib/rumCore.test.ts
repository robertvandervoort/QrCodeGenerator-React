import assert from "node:assert/strict";
import test from "node:test";
import {
  AI_REFERRER_HOSTS,
  commonAttributes,
  encodeOtlp,
  externalHostname,
  foregroundDuration,
  getOrCreateSessionId,
  isDoNotTrack,
  isSessionSampled,
  loadAttribution,
  normalizeRoute,
  readSampleRate,
  spanTimes,
  type KeyValueStorage,
} from "./rumCore";

function memoryStorage(initial: Record<string, string> = {}): KeyValueStorage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

test("do not track and sample rate", () => {
  assert.equal(isDoNotTrack({ doNotTrack: "1" }), true);
  assert.equal(isDoNotTrack({ doNotTrack: "yes" }), true);
  assert.equal(isDoNotTrack({ doNotTrack: "0" }), false);
  assert.equal(isDoNotTrack({ doNotTrack: null, globalPrivacyControl: true }), true);
  assert.equal(readSampleRate(undefined), 1);
  assert.equal(readSampleRate("0"), 0);
  assert.equal(readSampleRate("0.25"), 0.25);
  assert.equal(readSampleRate("nope"), 1);
  const storage = memoryStorage();
  assert.equal(isSessionSampled(0, 0.1, storage), false);
  assert.equal(isSessionSampled(1, 0.1, storage), true);
  const sampled = memoryStorage();
  assert.equal(isSessionSampled(0.5, 0.1, sampled), true);
  assert.equal(isSessionSampled(0.5, 0.9, sampled), true);
  const dropped = memoryStorage();
  assert.equal(isSessionSampled(0.5, 0.9, dropped), false);
  assert.equal(isSessionSampled(0.5, 0.1, dropped), false);
});

test("first-touch referrer, AI hosts, and utm defaults", () => {
  for (const host of AI_REFERRER_HOSTS) {
    assert.equal(externalHostname(`https://${host}/path?q=1`, "qr.vdvlabs.ai"), host);
    assert.equal(externalHostname(`https://www.${host}/`, "qr.vdvlabs.ai"), host);
  }
  assert.equal(externalHostname("", "qr.vdvlabs.ai"), "direct");
  assert.equal(externalHostname("https://qr.vdvlabs.ai/docs", "qr.vdvlabs.ai"), "direct");
  assert.equal(externalHostname("not a url", "qr.vdvlabs.ai"), "direct");

  const storage = memoryStorage();
  const first = loadAttribution(storage, {
    referrer: "https://www.chatgpt.com/c/abc",
    href: "https://qr.vdvlabs.ai/?utm_source=chatgpt&utm_medium=referral&utm_campaign=spring",
    host: "qr.vdvlabs.ai",
    route: "/",
  });
  assert.deepEqual(first, {
    referrer: "chatgpt.com",
    utmSource: "chatgpt",
    utmMedium: "referral",
    utmCampaign: "spring",
    landingRoute: "/",
  });
  const second = loadAttribution(storage, {
    referrer: "https://example.com/",
    href: "https://qr.vdvlabs.ai/test?utm_source=other",
    host: "qr.vdvlabs.ai",
    route: "/test",
  });
  assert.equal(second.referrer, "chatgpt.com");
  assert.equal(second.utmSource, "chatgpt");
  assert.equal(second.landingRoute, "/");

  const direct = loadAttribution(memoryStorage(), {
    referrer: "",
    href: "https://qr.vdvlabs.ai/batch",
    host: "qr.vdvlabs.ai",
    route: "/batch",
  });
  assert.equal(direct.referrer, "direct");
  assert.equal(direct.utmSource, "none");
  assert.equal(direct.utmMedium, "none");
  assert.equal(direct.utmCampaign, "none");
  assert.equal(direct.landingRoute, "/batch");
  assert.equal(normalizeRoute("test?x=1#y"), "/test");
});

test("session id is stable", () => {
  const storage = memoryStorage();
  const first = getOrCreateSessionId(storage);
  const second = getOrCreateSessionId(storage);
  assert.equal(first, second);
  assert.match(first, /^[0-9a-f-]{16,36}$/i);
});

test("foreground time uses visibility-state entries and falls back when absent", () => {
  assert.equal(foregroundDuration([], 25, 80), 55);
  assert.equal(foregroundDuration([
    { name: "visible", startTime: 0 },
    { name: "hidden", startTime: 40 },
    { name: "visible", startTime: 70 },
  ], 0, 100), 70);
  assert.equal(foregroundDuration([
    { name: "visible", startTime: 0 },
  ], 25, 80), 55);
  assert.equal(foregroundDuration([
    { name: "hidden", startTime: 0 },
  ], 0, 100), 0);
});

test("OTLP JSON uses the qr-web-rum service and marketing attributes", () => {
  const times = spanTimes(1, 1_700_000_000_000);
  const attributes = commonAttributes({
    route: "/",
    referrer: "perplexity.ai",
    utmSource: "none",
    utmMedium: "none",
    utmCampaign: "none",
    landingRoute: "/",
    country: "US",
    region: "California",
    sessionId: "11111111-1111-1111-1111-111111111111",
  });
  const payload = encodeOtlp([
    {
      name: "page_view",
      ...times,
      traceId: "0123456789abcdef0123456789abcdef",
      spanId: "0123456789abcdef",
      attributes: {
        ...attributes,
        "rum.engagement_time_ms": 1500,
      },
    },
    {
      name: "rum.web_vital",
      ...times,
      traceId: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
      spanId: "bbbbbbbbbbbbbbbb",
      attributes: {
        ...attributes,
        "rum.web_vital.name": "CLS",
        "rum.web_vital.value": 0.0125,
      },
    },
  ]);
  const resource = payload.resourceSpans[0]?.resource.attributes[0];
  assert.equal(resource?.key, "service.name");
  assert.deepEqual(resource?.value, { stringValue: "qr-web-rum" });
  const spans = payload.resourceSpans[0]?.scopeSpans[0]?.spans ?? [];
  assert.equal(spans[0]?.name, "page_view");
  assert.equal(spans[0]?.traceId.length, 32);
  assert.equal(spans[0]?.spanId.length, 16);
  const referrer = spans[0]?.attributes.find((item) => item.key === "rum.referrer");
  const source = spans[0]?.attributes.find((item) => item.key === "rum.utm_source");
  const landing = spans[0]?.attributes.find((item) => item.key === "rum.landing_route");
  const session = spans[0]?.attributes.find((item) => item.key === "session.id");
  const engaged = spans[0]?.attributes.find((item) => item.key === "rum.engagement_time_ms");
  assert.deepEqual(referrer?.value, { stringValue: "perplexity.ai" });
  assert.deepEqual(source?.value, { stringValue: "none" });
  assert.deepEqual(landing?.value, { stringValue: "/" });
  assert.deepEqual(session?.value, { stringValue: "11111111-1111-1111-1111-111111111111" });
  assert.deepEqual(engaged?.value, { intValue: "1500" });
  const cls = spans[1]?.attributes.find((item) => item.key === "rum.web_vital.value");
  assert.deepEqual(cls?.value, { doubleValue: 0.0125 });
  assert.equal(spans[0]?.startTimeUnixNano < spans[0]?.endTimeUnixNano, true);
});
