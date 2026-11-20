import test from "node:test";
import assert from "node:assert/strict";
import {
  isCorporateDomainEmail,
  isGmailAddress,
  normalizePhoneNumber,
  validateBusinessEmailForMethod,
  resolvePostAuthRoute,
} from "./authValidation.ts";

test("corporate business domain rejects consumer webmail and accepts company domains", () => {
  assert.equal(isCorporateDomainEmail("sales@ceramica-group.com"), true);
  assert.equal(isCorporateDomainEmail("owner@al-nour.eg"), true);
  assert.equal(isCorporateDomainEmail("user@gmail.com"), false);
  assert.equal(isCorporateDomainEmail("user@yahoo.com"), false);
  assert.equal(isCorporateDomainEmail("user@hotmail.com"), false);
  assert.equal(isCorporateDomainEmail("not-an-email"), false);
});

test("gmail verification accepts gmail/googlemail and rejects corporate or invalid domains", () => {
  assert.equal(isGmailAddress("partner@gmail.com"), true);
  assert.equal(isGmailAddress("partner@googlemail.com"), true);
  assert.equal(isGmailAddress("partner@company.com"), false);
});

test("normalizePhoneNumber handles Egypt local 0-prefix and international formats", () => {
  const egLocal = normalizePhoneNumber("+20", "01012345678");
  assert.equal(egLocal.valid, true);
  assert.equal(egLocal.e164, "+201012345678");
  assert.equal(egLocal.whatsappDigits, "201012345678");

  const saLocal = normalizePhoneNumber("+966", "0551234567");
  assert.equal(saLocal.valid, true);
  assert.equal(saLocal.e164, "+966551234567");

  const fullIntl = normalizePhoneNumber("+20", "+971 50 123 4567");
  assert.equal(fullIntl.valid, true);
  assert.equal(fullIntl.e164, "+971501234567");

  const short = normalizePhoneNumber("+20", "123");
  assert.equal(short.valid, false);
});

test("validateBusinessEmailForMethod enforces method-specific rules", () => {
  assert.deepEqual(validateBusinessEmailForMethod("business_domain", "ops@gmail.com"), {
    ok: false,
    code: "corporate_domain_required",
  });
  assert.deepEqual(validateBusinessEmailForMethod("business_domain", "ops@idea-tiles.com"), {
    ok: true,
  });
  assert.deepEqual(validateBusinessEmailForMethod("gmail", "ops@idea-tiles.com"), {
    ok: false,
    code: "gmail_required",
  });
  assert.deepEqual(validateBusinessEmailForMethod("gmail", "supplier.eg@gmail.com"), {
    ok: true,
  });
  assert.deepEqual(validateBusinessEmailForMethod("business_phone", ""), {
    ok: true,
  });
});

test("resolvePostAuthRoute accepts only server-confirmed PHP/MySQL roles", () => {
  assert.equal(resolvePostAuthRoute("admin"), "/admin");
  assert.equal(resolvePostAuthRoute("supplier"), "/business");
  assert.equal(resolvePostAuthRoute("buyer"), "/account");
  assert.equal(resolvePostAuthRoute("business"), null);
  assert.equal(resolvePostAuthRoute("designer"), null);
  assert.equal(resolvePostAuthRoute("contractor"), null);
  assert.equal(resolvePostAuthRoute(undefined), null);
});
