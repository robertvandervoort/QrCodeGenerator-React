import assert from "node:assert/strict";
import { createServer } from "node:http";
import test from "node:test";
import express from "express";
import { createAccessLog } from "./accessLog";

async function withServer(app: express.Express, run: (base: string) => Promise<void>) {
  const server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("no port");
  try {
    await run(`http://127.0.0.1:${address.port}`);
  } finally {
    server.closeAllConnections?.();
    await new Promise<void>((resolve, reject) => {
      server.close((err) => err ? reject(err) : resolve());
    });
  }
}

test("access log is one JSON line with geo captured at arrival", async () => {
  const lines: string[] = [];
  const app = express();
  app.use(createAccessLog((line) => lines.push(line)));
  app.get("/hello", (_req, res) => {
    res.status(201).send("ok");
  });

  await withServer(app, async (base) => {
    const response = await fetch(`${base}/hello`, {
      headers: {
        "user-agent": "rum-test",
        referer: "https://chatgpt.com/c/1",
        "cf-ipcountry": "US",
        "cf-region": "California",
        "cf-ipcity": "San%20Francisco",
        connection: "close",
      },
    });
    assert.equal(response.status, 201);
  });

  const entries = lines.map((line) => JSON.parse(line) as Record<string, unknown>);
  assert.equal(entries.length, 1);
  const entry = entries[0];
  assert.equal(entry?.msg, "access");
  assert.equal(entry?.method, "GET");
  assert.equal(entry?.path, "/hello");
  assert.equal(entry?.status, 201);
  assert.equal(typeof entry?.duration_ms, "number");
  assert.equal(entry?.referer, "https://chatgpt.com/c/1");
  assert.equal(entry?.user_agent, "rum-test");
  assert.equal(entry?.country, "US");
  assert.equal(entry?.region, "California");
  assert.equal(entry?.city, "San Francisco");
  assert.equal(lines[0]?.endsWith("\n"), true);
  assert.equal(lines[0]?.includes("\n", 0) && lines[0].trim().split("\n").length, 1);
});
