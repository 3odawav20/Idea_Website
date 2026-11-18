export type BusinessAuthMethod = "business_domain" | "gmail" | "business_phone";
export type SafeRole = "customer" | "business" | "designer" | "contractor" | "admin";

export const FREE_EMAIL_DOMAINS = new Set([
  "gmail.com",
  "googlemail.com",
  "yahoo.com",
  "yahoo.co.uk",
  "yahoo.fr",
  "hotmail.com",
  "outlook.com",
  "live.com",
  "msn.com",
  "icloud.com",
  "me.com",
  "mac.com",
  "aol.com",
  "proton.me",
  "protonmail.com",
  "yandex.com",
  "mail.ru",
  "gmx.com",
]);

export function isValidEmailFormat(email: string): boolean {
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed);
}

export function extractEmailDomain(email: string): string {
  const trimmed = email.trim().toLowerCase();
  const at = trimmed.lastIndexOf("@");
  return at === -1 ? "" : trimmed.slice(at + 1);
}

export function isCorporateDomainEmail(email: string): boolean {
  if (!isValidEmailFormat(email)) return false;
  const domain = extractEmailDomain(email);
  return Boolean(domain) && !FREE_EMAIL_DOMAINS.has(domain);
}

export function isGmailAddress(email: string): boolean {
  if (!isValidEmailFormat(email)) return false;
  const domain = extractEmailDomain(email);
  return domain === "gmail.com" || domain === "googlemail.com";
}

export interface NormalizedPhone {
  valid: boolean;
  e164: string;
  whatsappDigits: string;
}

export function normalizePhoneNumber(dialCode: string, rawPhone: string): NormalizedPhone {
  const cleanDial = dialCode.trim().startsWith("+")
    ? "+" + dialCode.replace(/\D/g, "")
    : "+" + dialCode.replace(/\D/g, "");
  let digits = rawPhone.replace(/[^\d+]/g, "");

  if (digits.startsWith("+")) {
    const e164 = "+" + digits.slice(1).replace(/\D/g, "");
    const valid = /^\+[1-9]\d{7,14}$/.test(e164);
    return { valid, e164: valid ? e164 : "", whatsappDigits: valid ? e164.slice(1) : "" };
  }

  digits = digits.replace(/\D/g, "");
  // Strip single leading national 0 for Egypt (+20) and GCC countries
  if (digits.startsWith("0") && cleanDial.length > 1) {
    digits = digits.slice(1);
  }
  const e164 = cleanDial + digits;
  const valid = /^\+[1-9]\d{7,14}$/.test(e164);
  return { valid, e164: valid ? e164 : "", whatsappDigits: valid ? e164.slice(1) : "" };
}

export function validateBusinessEmailForMethod(
  method: BusinessAuthMethod,
  email: string
): { ok: true } | { ok: false; code: "invalid_email" | "corporate_domain_required" | "gmail_required" } {
  if (method === "business_phone") {
    if (email.trim() && !isValidEmailFormat(email)) {
      return { ok: false, code: "invalid_email" };
    }
    return { ok: true };
  }
  if (!isValidEmailFormat(email)) {
    return { ok: false, code: "invalid_email" };
  }
  if (method === "business_domain" && !isCorporateDomainEmail(email)) {
    return { ok: false, code: "corporate_domain_required" };
  }
  if (method === "gmail" && !isGmailAddress(email)) {
    return { ok: false, code: "gmail_required" };
  }
  return { ok: true };
}

export function resolvePostAuthRoute(role: string | null | undefined): string {
  if (role === "admin") return "/admin";
  if (role === "business") return "/business";
  return "/account";
}
