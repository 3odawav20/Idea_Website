import type { Locale, Product } from "./types";

const ARABIC_RE = /[\u0600-\u06FF]/u;
const LATIN_RE = /[A-Za-z]/u;
const ARABIC_CHAR_RE = /[\u0600-\u06FF]/u;
const LATIN_CHAR_RE = /[A-Za-z]/u;

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
    if (arabic && !latin) return true;
    return allowNeutral && !arabic && !latin;
  }

  if (latin && !arabic) return true;
  return allowNeutral && !arabic && !latin;
}

function cleanLocalizedTokens(value: string, locale: Locale) {
  const tokens = value
    .replace(/&(?:nbsp|amp|#8211|#8212);/gi, " ")
    .replace(/[|#]+/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  const wantsArabic = locale === "ar";
  const kept = tokens.filter((token) => {
    const hasAr = ARABIC_CHAR_RE.test(token);
    const hasLatinChar = LATIN_CHAR_RE.test(token);

    if (wantsArabic) {
      if (hasAr && !hasLatinChar) return true;
      if (!hasAr && !hasLatinChar && /\d/.test(token)) return true;
      return false;
    }

    if (hasLatinChar && !hasAr) return true;
    if (!hasAr && !hasLatinChar && /\d/.test(token)) return true;
    return false;
  });

  return kept
    .join(" ")
    .replace(/\s+([,;:])/g, "$1")
    .replace(/\s*[-–—]\s*$/g, "")
    .replace(/^[-–—]\s*/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function localizedProductName(product: Product, locale: Locale) {
  const direct = (product.name[locale] || "").trim();
  if (textMatchesLocale(direct, locale, false)) return direct;

  const sourceCandidates = [direct, product.name.en, product.name.ar, product.name.fr].filter(Boolean);
  for (const candidate of sourceCandidates) {
    const cleaned = cleanLocalizedTokens(candidate, locale);
    const letterCount = [...cleaned].filter((char) =>
      locale === "ar" ? ARABIC_CHAR_RE.test(char) : LATIN_CHAR_RE.test(char)
    ).length;
    if (letterCount >= 3 && textMatchesLocale(cleaned, locale, true)) return cleaned;
  }
  return undefined;
}

export function localizedOptional(value: string | undefined | null, locale: Locale, allowNeutral = true) {
  const text = (value || "").trim();
  if (!text) return undefined;
  if (textMatchesLocale(text, locale, allowNeutral)) return text;

  const cleaned = cleanLocalizedTokens(text, locale);
  const hasRelevantLetters = locale === "ar" ? hasArabic(cleaned) : hasLatin(cleaned);
  return cleaned && (hasRelevantLetters || (allowNeutral && !hasArabic(cleaned) && !hasLatin(cleaned)))
    ? cleaned
    : undefined;
}

export function productMatchesLocale(product: Product, locale: Locale) {
  return Boolean(localizedProductName(product, locale));
}

export function localizedPrice(value: string | undefined, locale: Locale) {
  if (!value) return value;
  return locale === "ar"
    ? value.replace(/^EGP\s*/i, "ج.م ")
    : value.replace(/^ج\.م\s*/u, "EGP ");
}

export function isPresentableImageUrl(value?: string | null) {
  const image = (value || "").trim();
  if (!/^https?:\/\//i.test(image)) return false;

  return !/(?:banner|slider|promo(?:tion)?|offer|sale|facebook|instagram|story|post[-_ ]?ad|feed[-_ ]?ad|advert|whatsapp|screen[-_ ]?shot|screenshot|logo|placeholder|no[-_ ]?image|category[-_ ]?default|copy[-_ ]of)/i.test(image);
}


export function localizedMeasurement(value: string, locale: Locale) {
  if (locale !== "ar") return value;
  return value
    .replace(/\bcm\b/gi, "سم")
    .replace(/\bmm\b/gi, "مم")
    .replace(/\bm²\b/gi, "م²")
    .replace(/\bsqm\b/gi, "م²");
}

function presentationImageKey(value: string) {
  return value
    .replace(/([?&])(width|height|w|h|quality|q)=\d+/gi, "$1")
    .replace(/[?&]+$/g, "")
    .toLowerCase();
}

export function dedupeProductsForLocale(products: Product[], locale: Locale) {
  const seenImages = new Set<string>();
  const seenProducts = new Set<string>();

  return products.filter((product) => {
    const name = localizedProductName(product, locale);
    if (!name || !product.image || !isPresentableImageUrl(product.image)) return false;

    const imageKey = presentationImageKey(product.image);
    const brand = localizedOptional(product.brand, locale, false) || "";
    const sku = (product.code || "").trim().toLowerCase();
    const identity = sku
      ? `sku:${brand.toLowerCase()}:${sku}`
      : `name:${brand.toLowerCase()}:${name.toLowerCase()}:${product.collection}`;

    if (seenImages.has(imageKey) || seenProducts.has(identity)) return false;
    seenImages.add(imageKey);
    seenProducts.add(identity);
    return true;
  });
}
