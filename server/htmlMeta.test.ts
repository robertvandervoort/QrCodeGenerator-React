import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { HTML_CACHE_CONTROL, injectGeoMeta, sendIndexHtml } from "./htmlMeta";

const TEMPLATE = `<!DOCTYPE html>
<html>
  <head>
    <meta name="cf-country" content="" />
    <meta name="cf-region" content="" />
  </head>
  <body></body>
</html>`;

test("injects escaped country and region", () => {
  const html = injectGeoMeta(TEMPLATE, { country: `US"><script>`, region: "CA & NV" });
  assert.match(html, /<meta name="cf-country" content="US&quot;&gt;&lt;script&gt;" \/>/);
  assert.match(html, /<meta name="cf-region" content="CA &amp; NV" \/>/);
  assert.equal(html.includes("<script>"), false);
});

test("inserts meta tags when the template has none", () => {
  const html = injectGeoMeta("<html><head></head><body></body></html>", {
    country: "DE",
    region: "BE",
  });
  assert.match(html, /<meta name="cf-country" content="DE" \/>/);
  assert.match(html, /<meta name="cf-region" content="BE" \/>/);
});

test("served html is not cached long and reads CF headers", async () => {
  const app = express();
  app.get("/", (req, res) => sendIndexHtml(req, res, TEMPLATE));
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}/`, {
      headers: {
        "CF-IPCountry": "US",
        "cf-region": "California",
        connection: "close",
      },
    });
    const html = await response.text();
    assert.equal(response.headers.get("cache-control"), HTML_CACHE_CONTROL);
    assert.match(response.headers.get("vary") || "", /CF-IPCountry/);
    assert.match(html, /<meta name="cf-country" content="US" \/>/);
    assert.match(html, /<meta name="cf-region" content="California" \/>/);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve, reject) => server.close((err) => err ? reject(err) : resolve()));
  }
});
