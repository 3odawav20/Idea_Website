import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const backend = readFileSync("src/app/backend/db.tsx", "utf8");
const buyer = readFileSync("src/app/pages/RequestQuote.tsx", "utf8");
const supplier = readFileSync("src/app/pages/Business.tsx", "utf8");
const offers = readFileSync("src/app/pages/Account.tsx", "utf8");

test("RFQ server adapter awaits saved UUID and rejects persistence failures", () => {
  assert.match(backend, /createRequest: async \(r\) =>/);
  assert.match(backend, /await requireSupabase\(\)\.rpc\("create_buyer_request"/);
  assert.match(backend, /if \(error\) throw error;/);
  assert.match(backend, /did not confirm a saved request ID/);
  assert.doesNotMatch(backend, /id: "pending"/);
  assert.match(backend, /submitOffer: async \(offer\) =>/);
  assert.match(backend, /await requireSupabase\(\)\.rpc\("submit_supplier_quote"/);
});

test("customer basket only removes confirmed rows and keeps unsubmitted items on failure", () => {
  const start = buyer.indexOf("const submit = async");
  const end = buyer.indexOf("\n  return (", start);
  assert.ok(start >= 0 && end > start);
  const action = buyer.slice(start, end);
  const awaited = action.indexOf("await api.createRequest(");
  const removed = action.indexOf("removeFromQuote(item.productId)");
  assert.ok(awaited >= 0 && removed > awaited);
  assert.match(action, /catch \(error\)/);
  assert.match(action, /setSubmitError\(/);
  assert.doesNotMatch(action, /clearQuote\(/);
  assert.match(buyer, /disabled=\{submitting\}/);
});

test("supplier quote submission waits for server and rejects unassigned companies", () => {
  assert.match(backend, /request\.matchedBusinessIds\.includes\(offer\.businessId\)/);
  assert.match(supplier, /await api\.submitOffer\(/);
  assert.match(supplier, /setSubmitError\(error instanceof Error/);
  assert.match(supplier, /!req\.matchedBusinessIds\.includes\(biz\.id\)/);
  assert.doesNotMatch(supplier, /unitPrice: 180, shipping: 4000/);
  assert.doesNotMatch(supplier, /availability: "In stock"/);
  assert.match(supplier, /exactProduct: true/);
});

test("buyer sorts offers for comparison but never automatically awards a winner", () => {
  assert.match(offers, /\.sort\(\(a, b\) => \(a\.unitPrice \* a\.quantity/);
  assert.match(offers, /Choose this supplier/);
  assert.match(offers, /setSelectionError\(/);
  assert.match(offers, /req\.customerId !== session\?\.id/);
});

test("account flows remain subject to server-side approval; static tests do not certify PHP/MySQL", () => {
  // This test intentionally warns against treating a successful Vite build as
  // a deployed production RFQ/selection, identity migration or payment test.
  assert.match(backend, /requireSupabase/);
  assert.match(backend, /acceptOffer: unavailable/);
});
