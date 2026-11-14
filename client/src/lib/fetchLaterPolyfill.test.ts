import assert from "node:assert/strict";
import { createServer, type Server } from "node:http";
import test from "node:test";
import { getFetchLater } from "./fetchLaterPolyfill";

class FakeDocument extends EventTarget {
  visibilityState: DocumentVisibilityState = "visible";
}

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

test("fetchLater fallback sends on activateAfter and skips aborted beacons", async () => {
  const previousDocument = globalThis.document;
  const previousFetchLater = (globalThis as { fetchLater?: unknown }).fetchLater;
  const fakeDocument = new FakeDocument();
  Object.defineProperty(globalThis, "document", { configurable: true, value: fakeDocument });
  delete (globalThis as { fetchLater?: unknown }).fetchLater;

  const received: string[] = [];
  const collector = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => {
      received.push(Buffer.concat(chunks).toString("utf8"));
      res.writeHead(200);
      res.end();
    });
  });
  const base = await listen(collector);
  try {
    const fetchLater = getFetchLater();
    const aborted = new AbortController();
    fetchLater(`${base}/abort`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "abort-me",
      signal: aborted.signal,
      activateAfter: 50,
    });
    aborted.abort();

    fetchLater(`${base}/send`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "page-view",
      activateAfter: 40,
    });
    await new Promise((resolve) => setTimeout(resolve, 120));
    assert.deepEqual(received, ["page-view"]);

    const hidden = fetchLater(`${base}/hidden`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: "on-hide",
      activateAfter: 10_000,
    });
    fakeDocument.visibilityState = "hidden";
    fakeDocument.dispatchEvent(new Event("visibilitychange"));
    await new Promise((resolve) => setTimeout(resolve, 30));
    assert.equal(hidden.activated, true);
    assert.deepEqual(received, ["page-view", "on-hide"]);
  } finally {
    if (previousFetchLater === undefined) delete (globalThis as { fetchLater?: unknown }).fetchLater;
    else (globalThis as { fetchLater?: unknown }).fetchLater = previousFetchLater;
    Object.defineProperty(globalThis, "document", { configurable: true, value: previousDocument });
    await close(collector);
  }
});
