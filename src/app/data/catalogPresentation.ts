import type { Locale, Product } from "./types";

const ARABIC_RE = /[\u0600-\u06FF]/u;
const LATIN_RE = /[A-Za-z]/u;

export function hasArabic(value?: string | null) {
  return Boolean(value && ARABIC_RE.test(value));
}

export function hasLatin(value?: string | null) {
  return Boolean(value && LATIN_RE.test(value));
}

export function textMatchesLocale(value: string | undefined | null, locale: Locale, allowNeutral = true) {
  const text = (value || "").trim();
  if (!text) return false;
  const arabic = hasArabic(text);
  const latin = hasLatin(text);

  if (locale === "ar") {
    if (arabic) return true;
    return allowNeutral && !latin;
  }

  if (arabic) return false;
  if (latin) return true;
  return allowNeutral;
}

export function localizedOptional(value: string | undefined | null, locale: Locale, allowNeutral = true) {
  const text = (value || "").trim();
  return text && textMatchesLocale(text, locale, allowNeutral) ? text : undefined;
}

export function productMatchesLocale(product: Product, locale: Locale) {
  return textMatchesLocale(product.name[locale], locale, false);
}

export function localizedPrice(value: string | undefined, locale: Locale) {
  if (!value) return value;
  return locale === "ar"
    ? value.replace(/^EGP\s*/i, "ج.م ")
    : value.replace(/^ج\.م\s*/u, "EGP ");
}
