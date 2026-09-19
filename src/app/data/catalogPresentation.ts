import type { Locale, Product } from "./types";

const ARABIC_RE = /[\u0600-\u06FF]/u;
const LATIN_RE = /[A-Za-z]/u;
const ARABIC_CHAR_RE = /[\u0600-\u06FF]/u;
const LATIN_CHAR_RE = /[A-Za-z]/u;
const MOJIBAKE_RE = /[�ÃÂÐÑØÙ╪╣╚╔║├┤┘┐└┬┴│─]/u;

export function hasArabic(value?: string | null) {
  return Boolean(value && ARABIC_RE.test(value));
}

export function hasLatin(value?: string | null) {
  return Boolean(value && LATIN_RE.test(value));
}

export function cleanCatalogText(value?: string | null) {
  return (value || "")
    .replace(/&nbsp;|&#160;/gi, " ")
    .replace(/&amp;|&#38;/gi, "&")
    .replace(/&quot;|&#34;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&ndash;|&#8211;/gi, "–")
    .replace(/&mdash;|&#8212;/gi, "—")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function textMatchesLocale(value: string | undefined | null, locale: Locale, allowNeutral = true) {
  const text = cleanCatalogText(value);
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
  const direct = cleanCatalogText(product.name[locale]);
  if (direct && !MOJIBAKE_RE.test(direct) && textMatchesLocale(direct, locale, false)) return direct;

  const sourceCandidates = [direct, product.name[locale], product.name.en, product.name.ar, product.name.fr].filter(Boolean);

  if (locale === "ar") {
    for (const candidate of sourceCandidates) {
      if (MOJIBAKE_RE.test(candidate)) continue;
      const cleaned = cleanLocalizedTokens(candidate, locale);
      const letterCount = [...cleaned].filter((char) => ARABIC_CHAR_RE.test(char)).length;
      if (letterCount >= 3 && textMatchesLocale(cleaned, locale, true)) return cleaned;
    }
  }

  // If the source has no translation for the selected UI language, keep the
  // exact clean source title instead of hiding a valid marketplace product.
  for (const candidate of sourceCandidates) {
    const cleaned = cleanCatalogText(candidate);
    if (cleaned && !MOJIBAKE_RE.test(cleaned) && (hasArabic(cleaned) || hasLatin(cleaned))) return cleaned;
  }
  return undefined;
}

export function localizedOptional(value: string | undefined | null, locale: Locale, allowNeutral = true) {
  const text = cleanCatalogText(value);
  if (!text || MOJIBAKE_RE.test(text)) return undefined;
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
  let price = value.trim()
    .replace(/^(EGP\s*){2,}/i, "EGP ")
    .replace(/^(ج\.م\s*){2,}/u, "ج.م ");
  price = locale === "ar"
    ? price.replace(/^EGP\s*/i, "ج.م ")
    : price.replace(/^ج\.م\s*/u, "EGP ");
  return price;
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

export function hasPublicProductDetails(product: Product) {
  return Boolean(
    product.brand?.trim() ||
    product.subcategory?.trim() ||
    product.type?.trim() ||
    product.description?.trim() ||
    product.code?.trim() ||
    product.model?.trim() ||
    product.material?.trim() ||
    product.finish?.trim() ||
    product.application?.trim() ||
    product.priceText?.trim() ||
    product.sizes.length ||
    (product.colors?.length ?? 0) ||
    (product.usage?.length ?? 0) ||
    (product.variants?.length ?? 0) ||
    product.specificationGroups?.some((group) => group.items.length > 0)
  );
}

export function marketplaceProductQuality(product: Product, locale: Locale) {
  const name = localizedProductName(product, locale);
  if (!name || !product.approved || !product.image || !isPresentableImageUrl(product.image)) return -1000;

  let score = 40;
  if (cleanCatalogText(product.brand)) score += 10;
  if (cleanCatalogText(product.subcategory)) score += 8;
  if (cleanCatalogText(product.type)) score += 5;
  if (product.code?.trim()) score += 8;
  if (cleanCatalogText(product.material)) score += 6;
  if (cleanCatalogText(product.finish)) score += 4;
  if (product.sizes.length) score += 7;
  if (product.colors?.length) score += 5;
  if (product.priceText?.trim()) score += 8;
  if (product.availability?.trim()) score += 3;
  if (product.description?.trim()) score += 5;
  if ((product.gallery?.filter((image) => image !== product.image).length ?? 0) > 0) score += 3;
  if (product.specificationGroups?.some((group) => group.items.length >= 2)) score += 5;
  if (product.source?.productPageUrl) score += 3;
  return score;
}

export function isMarketplaceReadyProduct(product: Product, locale: Locale) {
  if (!product.approved || !localizedProductName(product, locale) || !product.image || !isPresentableImageUrl(product.image)) return false;

  const meaningfulSignals = [
    cleanCatalogText(product.brand),
    cleanCatalogText(product.subcategory),
    cleanCatalogText(product.type),
    product.code?.trim(),
    cleanCatalogText(product.material),
    cleanCatalogText(product.finish),
    product.sizes.length ? "size" : "",
    product.colors?.length ? "color" : "",
    product.priceText?.trim(),
    product.availability?.trim(),
    product.description?.trim(),
    product.variants?.length ? "variants" : "",
    product.specificationGroups?.some((group) => group.items.length) ? "specs" : "",
  ].filter(Boolean).length;

  return meaningfulSignals >= 2;
}

export function dedupeProductsForLocale(products: Product[], locale: Locale) {
  const seenImages = new Set<string>();
  const seenProducts = new Set<string>();
  const ranked = [...products].sort((a, b) =>
    marketplaceProductQuality(b, locale) - marketplaceProductQuality(a, locale)
  );

  return ranked.filter((product) => {
    const name = localizedProductName(product, locale);
    if (!name || !isMarketplaceReadyProduct(product, locale)) return false;

    const imageKey = presentationImageKey(product.image);
    const brand = cleanCatalogText(product.brand);
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
