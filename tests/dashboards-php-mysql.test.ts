import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

import {
  EMPTY_SUPPLIER_QUOTE_DRAFT,
  PHP_MARKETPLACE_API,
  PHP_QUOTES_API,
  canApproveCompanyVerification,
  computeQuoteBreakdown,
  describeDashboardError,
  filterSupplierRfqs,
  normalizeAdminOverview,
  normalizeAiQuota,
  normalizeMailboxPayload,
  normalizeVerificationRecord,
  validateSupplierQuoteInput,
  type CompanyVerificationRecord,
  type LiveRfq,
} from "../src/app/backend/dashboardApi.ts";

const ROOT = process.cwd();

test("EMPTY_SUPPLIER_QUOTE_DRAFT has zero prefabricated commercial values", () => {
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.unitPrice, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.quantity, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.shipping, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.taxPercent, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.prepDays, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.deliveryDays, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.validityDays, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.paymentTerms, "");
  assert.equal(EMPTY_SUPPLIER_QUOTE_DRAFT.exactProduct, true);
});

test("validateSupplierQuoteInput blocks empty, zero, negative, or incomplete drafts", () => {
  assert.ok(validateSupplierQuoteInput(EMPTY_SUPPLIER_QUOTE_DRAFT, "en"));
  assert.ok(validateSupplierQuoteInput(EMPTY_SUPPLIER_QUOTE_DRAFT, "ar"));

  const valid = {
    ...EMPTY_SUPPLIER_QUOTE_DRAFT,
    unitPrice: "420",
    quantity: "120",
    shipping: "1500",
    taxPercent: "14",
    prepDays: "2",
    deliveryDays: "5",
    validityDays: "7",
    paymentTerms: "50% advance, 50% on delivery",
  };
  assert.equal(validateSupplierQuoteInput(valid, "en"), null);

  assert.ok(validateSupplierQuoteInput({ ...valid, unitPrice: "0" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, unitPrice: "-50" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, quantity: "0" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, shipping: "-1" }, "en"));
  assert.equal(validateSupplierQuoteInput({ ...valid, shipping: "0" }, "en"), null);
  assert.ok(validateSupplierQuoteInput({ ...valid, taxPercent: "150" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, deliveryDays: "0" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, validityDays: "120" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, paymentTerms: "ok" }, "en"));
  assert.ok(validateSupplierQuoteInput({ ...valid, exactProduct: false, proposedEquivalent: "" }, "en"));
  assert.equal(
    validateSupplierQuoteInput({ ...valid, exactProduct: false, proposedEquivalent: "Gemma Royal 60x120" }, "en"),
    null
  );
});

test("computeQuoteBreakdown computes accurate EGP subtotal, VAT, shipping, and total", () => {
  const b = computeQuoteBreakdown({
    unitPrice: 350,
    quantity: 100,
    taxPercent: 14,
    shipping: 2500,
  });
  assert.equal(b.subtotal, 35000);
  assert.equal(b.taxAmount, 4900);
  assert.equal(b.shipping, 2500);
  assert.equal(b.total, 42400);
});

test("filterSupplierRfqs filters accurately by status, deadline, governorate, query, and sort order", () => {
  const now = 1_750_000_000_000;
  const rfqs: LiveRfq[] = [
    {
      id: "rfq-1",
      reference: "RFQ-101",
      customerId: "u-1",
      productId: "p-1",
      productTitle: "Calacatta Gold Porcelain",
      variantLabel: "60x120 cm",
      quantity: 200,
      unit: "sqm",
      governorate: "Cairo",
      destination: "New Cairo",
      deliveryDate: "2026-12-01",
      projectType: "Villa",
      phased: false,
      notes: "",
      status: "submitted",
      createdAt: now - 3600_000,
      deadlineAt: now + 6 * 3600_000, // urgent < 24h
      offersCount: 0,
      acceptedQuoteId: null,
    },
    {
      id: "rfq-2",
      reference: "RFQ-102",
      customerId: "u-2",
      productId: "p-2",
      productTitle: "Nero Marquina Marble",
      variantLabel: "80x80 cm",
      quantity: 80,
      unit: "sqm",
      governorate: "Alexandria",
      destination: "Smouha",
      deliveryDate: "2026-12-10",
      projectType: "Hotel",
      phased: true,
      notes: "",
      status: "quoted",
      createdAt: now - 7200_000,
      deadlineAt: now + 72 * 3600_000, // open > 24h
      offersCount: 2,
      acceptedQuoteId: null,
      supplierResponseStatus: "submitted",
    },
    {
      id: "rfq-3",
      reference: "RFQ-103",
      customerId: "u-3",
      productId: "p-3",
      productTitle: "Travertine Beige Ceramic",
      variantLabel: "30x60 cm",
      quantity: 50,
      unit: "sqm",
      governorate: "Cairo",
      destination: "Maadi",
      deliveryDate: "2026-11-01",
      projectType: "Apartment",
      phased: false,
      notes: "",
      status: "expired",
      createdAt: now - 10 * 86400_000,
      deadlineAt: now - 3600_000, // expired
      offersCount: 1,
      acceptedQuoteId: null,
    },
  ];

  assert.deepEqual(
    filterSupplierRfqs(rfqs, { deadline: "urgent24h", now }).map((r) => r.id),
    ["rfq-1"]
  );
  assert.deepEqual(
    filterSupplierRfqs(rfqs, { deadline: "open", now, sortBy: "deadline" }).map((r) => r.id),
    ["rfq-1", "rfq-2"]
  );
  assert.deepEqual(
    filterSupplierRfqs(rfqs, { deadline: "expired", now }).map((r) => r.id),
    ["rfq-3"]
  );
  assert.deepEqual(
    filterSupplierRfqs(rfqs, { governorate: "Cairo", now }).map((r) => r.id),
    ["rfq-1", "rfq-3"]
  );
  assert.deepEqual(
    filterSupplierRfqs(rfqs, { status: "quoted", now }).map((r) => r.id),
    ["rfq-2"]
  );
  assert.deepEqual(
    filterSupplierRfqs(rfqs, { query: "marquina", now }).map((r) => r.id),
    ["rfq-2"]
  );
});

test("canApproveCompanyVerification strictly requires legal/public names AND >= 1 uploaded document", () => {
  const base: CompanyVerificationRecord = {
    companyId: "c-1",
    legalName: "Al-Nour Ceramics LLC",
    publicName: "Al-Nour Showrooms",
    representative: "Ahmed Hassan",
    email: "sales@alnour.example",
    phone: "+201000000000",
    governorate: "Cairo",
    companyType: "Distributor",
    crNumber: "CR-9821",
    taxNumber: "100-200-300",
    categories: ["Porcelain"],
    serviceAreas: ["Cairo"],
    status: "submitted",
    reviewNotes: "",
    submittedAt: Date.now(),
    reviewedAt: null,
    documents: [],
  };
  assert.equal(canApproveCompanyVerification(base), false);
  assert.equal(
    canApproveCompanyVerification({
      ...base,
      documents: [{ id: "d1", kind: "commercial_register", filename: "cr.pdf", uploadedAt: Date.now(), status: "uploaded" }],
    }),
    true
  );
  assert.equal(
    canApproveCompanyVerification({
      ...base,
      legalName: "A",
      documents: [{ id: "d1", kind: "commercial_register", filename: "cr.pdf", uploadedAt: Date.now(), status: "uploaded" }],
    }),
    false
  );
});

test("normalizers parse snake_case PHP/MySQL payloads accurately without inventing figures", () => {
  const mailbox = normalizeMailboxPayload({
    role: "supplier",
    rfqs: [
      {
        id: "r1",
        ref_code: "RFQ-2026-01",
        product_title: "Statuario Gloss",
        size_label: "60x120 cm",
        quantity: 140,
        governorate: "Giza",
        status: "submitted",
        created_at: 1750000000,
        deadline_at: 1750100000,
      },
    ],
    quotes: [
      {
        id: "q1",
        request_id: "r1",
        company_id: "c1",
        company_name: "Delta Porcelain",
        unit_price_cents: 45000,
        quantity: 140,
        shipping_cents: 200000,
        tax_percent: 14,
        delivery_days: 4,
        validity_days: 7,
        payment_terms: "50% deposit",
        status: "submitted",
      },
    ],
    orders: [
      {
        id: "o1",
        request_id: "r1",
        quote_id: "q1",
        total_cents: 7382000,
        status: "confirmed",
        payment_status: "unpaid",
      },
    ],
  });

  assert.equal(mailbox.requests.length, 1);
  assert.equal(mailbox.requests[0].reference, "RFQ-2026-01");
  assert.equal(mailbox.quotes[0].unitPrice, 450);
  assert.equal(mailbox.quotes[0].shipping, 2000);
  assert.equal(mailbox.quotes[0].total, 73820);
  assert.equal(mailbox.orders[0].total, 73820);
  assert.equal(mailbox.orders[0].paymentStatus, "unpaid");

  const overview = normalizeAdminOverview({
    counts: { users_count: 14, companies_count: 3, verified_companies: 2, pending_companies: 1, requests_count: 8, quotes_count: 19, orders_count: 4 },
    users: [{ id: "u1", name: "Mona", email: "mona@example.com", role: "buyer", status: "active" }],
  });
  assert.equal(overview.counts.users, 14);
  assert.equal(overview.counts.verifiedCompanies, 2);
  assert.equal(overview.counts.pendingCompanies, 1);
  assert.equal(overview.users[0].name, "Mona");

  const quota = normalizeAiQuota({ role: "buyer", quota: { limit: 5, remaining: 3, unlimited: false }, provider: "Runpod", configured: true });
  assert.equal(quota.used, 2);
  assert.equal(quota.remaining, 3);
  assert.equal(quota.unlimited, false);

  const ver = normalizeVerificationRecord({ company_id: "c9", legal_name: "Nile Stone", public_name: "Nile Stone", status: "submitted", documents: [] });
  assert.equal(ver.companyId, "c9");
  assert.equal(ver.documents.length, 0);

  assert.equal(PHP_MARKETPLACE_API, "/api/marketplace.php");
  assert.equal(PHP_QUOTES_API, "/api/quotes-api.php");
  assert.ok(describeDashboardError(new Error("COMPANY_NOT_VERIFIED"), "ar").includes("اعتماد"));
});

test("Static contract: zero Supabase or Firebase imports in owned dashboards and real PHP endpoints wired", async () => {
  const ownedFiles = [
    "src/app/backend/dashboardApi.ts",
    "src/app/pages/Account.tsx",
    "src/app/pages/Business.tsx",
    "src/app/pages/RequestQuote.tsx",
    "src/app/pages/CompanyControlCenter.tsx",
    "src/app/pages/BusinessGrowth.tsx",
    "src/app/pages/AdminStudio.tsx",
    "src/app/pages/Admin.tsx",
    "src/app/pages/AdminCodeLookup.tsx",
    "src/app/pages/AdminPromotions.tsx",
  ];

  for (const rel of ownedFiles) {
    const src = await readFile(resolve(ROOT, rel), "utf8");
    assert.ok(!/supabaseClient|requireSupabase|@supabase\/supabase-js/i.test(src), `${rel} must not import Supabase`);
    assert.ok(!/firebase\/app|firebase\/auth|firebase\/firestore/i.test(src), `${rel} must not import Firebase`);
    assert.ok(!/sandboxPay|Sandbox Authorized|Set creds \(dev\)/i.test(src), `${rel} must not contain fake sandbox payments or dev credentials`);
  }

  const businessSrc = await readFile(resolve(ROOT, "src/app/pages/Business.tsx"), "utf8");
  assert.ok(/export function RFQDataGrid\b/.test(businessSrc), "Business.tsx must export RFQDataGrid");
  assert.ok(/export function QuotationSubmissionForm\b/.test(businessSrc), "Business.tsx must export QuotationSubmissionForm");
  assert.ok(/fetchSupplierRfqsFromQuotesApi/.test(businessSrc), "Business.tsx must query /api/quotes-api.php via fetchSupplierRfqsFromQuotesApi");
  assert.ok(!/unitPrice:\s*180|shipping:\s*4000/.test(businessSrc), "Business.tsx must not prefill fake quotation numbers");
});
