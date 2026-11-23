import test from "node:test";
import assert from "node:assert/strict";
import {
  getSocialAuthStartUrl,
  parseSocialCallbackParams,
  sanitizeSocialRedirect,
} from "../src/app/backend/phpAccounts.ts";
import { normalizePhoneNumber } from "../src/app/backend/authValidation.ts";
import {
  IDEA_GOOGLE_CLIENT_ID,
  isProductionIdeaOrigin,
  isValidGoogleClientId,
} from "../src/app/backend/googleIdentity.ts";

test("IDEA_GOOGLE_CLIENT_ID is the valid configured public Google OAuth Web Client ID", () => {
  assert.equal(
    IDEA_GOOGLE_CLIENT_ID,
    "248124470809-kfsdd38rgblg2dvd5020j14kgrm0j38p.apps.googleusercontent.com"
  );
  assert.equal(isValidGoogleClientId(IDEA_GOOGLE_CLIENT_ID), true);
  assert.equal(isValidGoogleClientId("not-a-client-id"), false);
  assert.equal(isProductionIdeaOrigin("idea-dh.com"), true);
  assert.equal(isProductionIdeaOrigin("www.idea-dh.com"), true);
  assert.equal(isProductionIdeaOrigin("localhost"), false);
});

test("sanitizeSocialRedirect blocks open redirects, protocol-relative URLs, backslashes, and admin routes", () => {
  assert.equal(sanitizeSocialRedirect("https://evil.example/steal"), "/account");
  assert.equal(sanitizeSocialRedirect("//evil.example/steal"), "/account");
  assert.equal(sanitizeSocialRedirect("/\\evil.example"), "/account");
  assert.equal(sanitizeSocialRedirect("/admin"), "/account");
  assert.equal(sanitizeSocialRedirect("/admin/users"), "/account");
  assert.equal(sanitizeSocialRedirect(""), "/account");
  assert.equal(sanitizeSocialRedirect(undefined), "/account");
  // Allowed internal customer routes pass through intact
  assert.equal(sanitizeSocialRedirect("/account"), "/account");
  assert.equal(sanitizeSocialRedirect("/account/orders"), "/account/orders");
  assert.equal(sanitizeSocialRedirect("/products"), "/products");
  assert.equal(sanitizeSocialRedirect("/favorites"), "/favorites");
});

test("getSocialAuthStartUrl constructs clean cPanel social-auth start URLs with sanitized redirect", () => {
  const url = getSocialAuthStartUrl("google", "login", "/account");
  assert.equal(url, "/api/social-auth.php?action=start&provider=google&mode=login&redirect=%2Faccount");

  const unsafe = getSocialAuthStartUrl("microsoft", "register", "https://attacker.tld/phish");
  assert.equal(unsafe, "/api/social-auth.php?action=start&provider=microsoft&mode=register&redirect=%2Faccount");
});

test("parseSocialCallbackParams parses error and success query notices safely", () => {
  assert.deepEqual(
    parseSocialCallbackParams("?social_error=admin_social_login_disabled&social_provider=Google"),
    { kind: "error", code: "ADMIN_SOCIAL_LOGIN_DISABLED", provider: "google" }
  );
  assert.deepEqual(
    parseSocialCallbackParams("?social_status=linked&social_provider=apple"),
    { kind: "success", code: "LINKED", provider: "apple" }
  );
  assert.equal(parseSocialCallbackParams(""), null);
});

test("normalizePhoneNumber converts regional Egyptian and GCC numbers to strict E.164 for WhatsApp OTP", () => {
  assert.deepEqual(normalizePhoneNumber("+20", "01012345678"), {
    valid: true,
    e164: "+201012345678",
    whatsappDigits: "201012345678",
  });
  assert.deepEqual(normalizePhoneNumber("+966", "0551234567"), {
    valid: true,
    e164: "+966551234567",
    whatsappDigits: "966551234567",
  });
  assert.equal(normalizePhoneNumber("+20", "123").valid, false);
});
