import assert from "node:assert/strict";
import { createServer } from "node:http";
import { once } from "node:events";
import test, { after, before } from "node:test";
import { apiFetch, requireSavedId } from "../src/app/backend/apiClient.ts";
import { resolveExplicitVariant } from "../src/app/backend/rfqContract.ts";

const id = "a".repeat(32);
const csrf = "test-csrf-token-with-enough-entropy";
let server;
let origin;
let responseMode = "saved";
let requestCount = 0;
let lastMarketplaceRequest;
let originalFetch;

function sendJson(response, status, value) {
  response.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(value));
}

before(async () => {
  server = createServer((request, response) => {
    requestCount += 1;
    const url = new URL(request.url, "http://127.0.0.1");
    if (url.pathname === "/api/accounts.php" && url.searchParams.get("action") === "session") {
      sendJson(response, 200, {
        user: { id: "b".repeat(32), name: "Test buyer", email: "buyer@example.test", role: "buyer" },
        company: null,
        membership: null,
        csrf,
      });
      return;
    }
    if (url.pathname === "/api/marketplace.php" && url.searchParams.get("action") === "ad-request") {
      lastMarketplaceRequest = {
        method: request.method,
        headers: request.headers,
        body: "",
      };
      request.setEncoding("utf8");
      request.on("data", (chunk) => { lastMarketplaceRequest.body += chunk; });
      request.on("end", () => {
        if (responseMode === "no-content") {
          response.writeHead(204);
          response.end();
        } else if (responseMode === "empty") {
          response.writeHead(200, { "Content-Type": "application/json" });
          response.end();
        } else if (responseMode === "null") {
          sendJson(response, 200, null);
        } else if (responseMode === "html") {
          response.writeHead(200, { "Content-Type": "text/html" });
          response.end("<html>login page</html>");
        } else if (responseMode === "not-saved") {
          sendJson(response, 200, { saved: false, id });
        } else if (responseMode === "missing-id") {
          sendJson(response, 200, { saved: true });
        } else if (responseMode === "saved") {
          sendJson(response, 200, { saved: true, id });
        }
      });
      return;
    }
    response.writeHead(404, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ error: "NOT_FOUND" }));
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  origin = `http://127.0.0.1:${server.address().port}`;
  Object.defineProperty(globalThis, "window", { configurable: true, value: { location: { origin } } });
  originalFetch = globalThis.fetch;
  globalThis.fetch = (input, init) => originalFetch(new URL(String(input), origin), init);
});

after(async () => {
  globalThis.fetch = originalFetch;
  delete globalThis.window;
  if (server?.listening) {
    server.close();
    await once(server, "close");
  }
});

test("variant resolution requires the exact selected ID and never defaults to the first size", () => {
  const variants = [{ id: "small", label: "30x60" }, { id: "large", label: "60x120" }];
  assert.equal(resolveExplicitVariant(variants, undefined), null);
  assert.equal(resolveExplicitVariant(variants, ""), null);
  assert.equal(resolveExplicitVariant(variants, "unknown"), null);
  assert.equal(resolveExplicitVariant(variants, "large"), variants[1]);
});

test("PHP write client sends same-origin session/CSRF and requires a saved server ID", async () => {
  responseMode = "saved";
  const result = await apiFetch(`${origin}/api/marketplace.php?action=ad-request`, {
    method: "POST",
    body: { company_id: "c".repeat(32), title: "test" },
    authRequired: true,
  });
  assert.equal(requireSavedId(result), id);
  assert.equal(lastMarketplaceRequest.method, "POST");
  assert.equal(lastMarketplaceRequest.headers["x-csrf-token"], csrf);
  assert.equal(lastMarketplaceRequest.headers.authorization, undefined);
  assert.deepEqual(JSON.parse(lastMarketplaceRequest.body), { company_id: "c".repeat(32), title: "test" });
});

test("204, empty, null, and HTML success responses cannot confirm a write", async () => {
  for (const [mode, code] of [
    ["no-content", "EMPTY_API_RESPONSE"],
    ["empty", "EMPTY_API_RESPONSE"],
    ["null", "EMPTY_API_RESPONSE"],
    ["html", "API_RESPONSE_NOT_JSON"],
  ]) {
    responseMode = mode;
    await assert.rejects(
      apiFetch(`${origin}/api/marketplace.php?action=ad-request`, { method: "POST", body: {}, authRequired: true }),
      (error) => error.code === code
    );
  }
});

test("write acknowledgment requires saved=true and a server-shaped 32-hex ID", async () => {
  for (const mode of ["not-saved", "missing-id"]) {
    responseMode = mode;
    const result = await apiFetch(`${origin}/api/marketplace.php?action=ad-request`, { method: "POST", body: {}, authRequired: true });
    assert.throws(() => requireSavedId(result), (error) => error.code === "PERSISTENCE_NOT_CONFIRMED");
  }
  for (const malformed of [null, {}, { saved: false, id }, { saved: true, id: "pending" }, { saved: true, id: "g".repeat(32) }]) {
    assert.throws(() => requireSavedId(malformed), (error) => error.code === "PERSISTENCE_NOT_CONFIRMED");
  }
});

test("unverified legacy RFQ paths are rejected before any network request", async () => {
  const previousCount = requestCount;
  await assert.rejects(
    apiFetch("/api/requests", { method: "POST", body: {}, authRequired: true }),
    (error) => error.code === "PHP_API_ROUTE_NOT_VERIFIED"
  );
  assert.equal(requestCount, previousCount);
});
