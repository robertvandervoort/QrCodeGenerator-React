import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test from "node:test";
import express from "express";
import { DEFAULT_OTLP_TRACES_ENDPOINT, mountOtelTracesProxy, otlpTracesEndpoint } from "./otelProxy";

async function listen(server: Server): Promise<string> {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  return `http://127.0.0.1:${address.port}`;
}

async function close(server: Server) {
  server.closeAllConnections?.();
  await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
}

test("default OTLP traces endpoint", () => {
  assert.equal(DEFAULT_OTLP_TRACES_ENDPOINT, "http://otel-collector:4318/v1/traces");
  assert.equal(otlpTracesEndpoint(""), DEFAULT_OTLP_TRACES_ENDPOINT);
  assert.equal(otlpTracesEndpoint("http://127.0.0.1:9/v1/traces"), "http://127.0.0.1:9/v1/traces");
  assert.throws(() => otlpTracesEndpoint("ftp://example.com/v1/traces"), /http or https/);
});

test("forwards trace payloads to the configured collector", async () => {
  const received: { url?: string; type?: string; body?: string }[] = [];
  const collector = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      received.push({
        url: req.url,
        type: req.headers["content-type"],
        body: Buffer.concat(chunks).toString("utf8"),
      });
      res.writeHead(200);
      res.end();
    });
  });
  const collectorUrl = await listen(collector);

  const previous = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = `${collectorUrl}/v1/traces`;
  const app = express();
  mountOtelTracesProxy(app);
  const server = createServer(app);
  const base = await listen(server);
  try {
    const payload = JSON.stringify({ resourceSpans: [] });
    const response = await fetch(`${base}/api/otel/v1/traces`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: payload,
    });
    assert.equal(response.status, 200);
    assert.equal(received.length, 1);
    assert.equal(received[0]?.url, "/v1/traces");
    assert.equal(received[0]?.type, "application/json");
    assert.equal(received[0]?.body, payload);
  } finally {
    if (previous === undefined) delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = previous;
    await close(server);
    await close(collector);
  }
});

test("rejects unsupported content types, empty bodies, and oversized payloads", async () => {
  const previous = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = "http://127.0.0.1:9/v1/traces";
  const app = express();
  mountOtelTracesProxy(app, { maxBody: "1kb" });
  const server = createServer(app);
  const base = await listen(server);
  try {
    const unsupported = await fetch(`${base}/api/otel/v1/traces`, {
      method: "POST",
      headers: { "content-type": "text/plain", connection: "close" },
      body: "hello",
    });
    assert.equal(unsupported.status, 415);

    const empty = await fetch(`${base}/api/otel/v1/traces`, {
      method: "POST",
      headers: { "content-type": "application/json", "content-length": "0", connection: "close" },
    });
    assert.equal(empty.status, 400);

    const oversized = await fetch(`${base}/api/otel/v1/traces`, {
      method: "POST",
      headers: { "content-type": "application/json", connection: "close" },
      body: JSON.stringify({ pad: "x".repeat(2048) }),
    });
    assert.equal(oversized.status, 413);
  } finally {
    if (previous === undefined) delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = previous;
    await close(server);
  }
});

test("rate limits telemetry clients", async () => {
  const previous = process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
  process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = "http://127.0.0.1:9/v1/traces";
  let now = 1_000;
  const app = express();
  mountOtelTracesProxy(app, { limit: 2, windowMs: 60_000, now: () => now });
  const server = createServer(app);
  const base = await listen(server);
  try {
    const send = () => fetch(`${base}/api/otel/v1/traces`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "cf-connecting-ip": "203.0.113.8",
        connection: "close",
      },
      body: "{}",
    });
    const first = await send();
    const second = await send();
    const third = await send();
    assert.equal(first.status, 502);
    assert.equal(second.status, 502);
    assert.equal(third.status, 429);
    now += 61_000;
    const after = await send();
    assert.equal(after.status, 502);
  } finally {
    if (previous === undefined) delete process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT;
    else process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT = previous;
    await close(server);
  }
});
