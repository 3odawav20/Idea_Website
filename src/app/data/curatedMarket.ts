import type { CollectionSlug, Product } from "./types";
import { GEMMA_VERIFIED_BULK } from "./gemmaVerifiedBulk";
import { CLEOPATRA_VERIFIED_BULK } from "./cleopatraVerifiedBulk";
import { PLATINO_VERIFIED_BULK } from "./platinoVerifiedBulk";
import { INNOVA_VERIFIED_BULK } from "./innovaVerifiedBulk";
import { getFiveMahgoubSourceUrl } from "./fiveSourceUrls";
import { isPresentableImageUrl, cleanCatalogText } from "./catalogPresentation";

// Public presentation scope. Other backend records are preserved at their source.
export const MARKET_FOCUS_COLLECTIONS: CollectionSlug[] = [
  "ceramics", "porcelain", "tiles", "marble", "basins", "bathtubs",
];
export const isMarketFocusProduct = (product: Product) =>
  MARKET_FOCUS_COLLECTIONS.includes(product.collection);

const dimOnly = /^\d+(?:\.\d+)?\s*[x×]\s*\d+(?:\.\d+)?(?:\s*cm)?$/i;
const brokenText = /(?:^|\b)(?:undefined|null|placeholder|no image|image not available)(?:$|\b)/i;
const isRealImage = (src?: string) =>
  Boolean(src && /^https:\/\//i.test(src) && isPresentableImageUrl(src));

export function isPublishableMarketProduct(p: Product) {
  const name = cleanCatalogText(p.name.en || p.name.ar);
  const manufacturer = cleanCatalogText(p.brand);
  const signalCount = [
    p.code, p.type, p.material, p.application, p.finish,
    p.sizes[0]?.label, p.colors?.[0], p.description,
    p.specificationGroups?.[0]?.items?.[0]?.value,
  ].filter(Boolean).length;
  return Boolean(
    p.approved && p.status !== "sample" &&
    isMarketFocusProduct(p) && name && !brokenText.test(name) &&
    manufacturer && !brokenText.test(manufacturer) &&
    isRealImage(p.image) && signalCount >= 2
  );
}

function exactCollection(p: Product): CollectionSlug {
  // Product's material wins over retail category. A porcelain tile is porcelain,
  // never ceramic/tiles/marble, even if its surface has a marble pattern.
  if (p.collection === "ceramics" || p.collection === "porcelain" || p.collection === "tiles" || p.collection === "marble") {
    if (/\bporcelain\b/i.test(p.type || "") || /\bporcelain\b/i.test(p.material || "")) return "porcelain";
    if (/\bceramic\b/i.test(p.type || "") || /\bceramic\b/i.test(p.material || "")) return "ceramics";
  }
  // A basin is a basin even when made from ceramic/porcelain.
  if (p.collection === "sanitary-ware" && /\b(?:wash\s*basin|basin|sink)\b|(?:حوض|أحواض|احواض)/iu.test(
    [p.name.en, p.name.ar, p.subcategory, p.type].filter(Boolean).join(" ")
  ) && !/\b(?:toilet|wc|bidet|urinal)\b|(?:مرحاض|قاعدة حمام|تواليت|بيديه|مبولة)/iu.test(p.name.en + " " + p.name.ar)) return "basins";
  return p.collection;
}

function cleanColors(colors?: string[]) {
  const result = (colors || []).map(x=>x.trim()).filter(x =>
    x.length >= 3 &&
    !/^(?:wall|floor|kitchen|rectified|heavy duty|glossy|matt|marble|wooden)$/i.test(x)
  );
  return result.length ? [...new Set(result)] : undefined;
}
export function normalizeMarketProduct(p: Product): Product {
  const collection = exactCollection(p);
  return {
    ...p, collection,
    model: p.model && !dimOnly.test(p.model) ? p.model.trim() : undefined,
    brand: p.brand?.trim() || "",
    colors: cleanColors(p.colors),
    priceText: undefined, compareAtPriceText: undefined,
    gallery: [...new Set([p.image, ...(p.gallery || [])].filter(isRealImage))],
  };
}
export const FIVE_VERIFIED_SURFACES: Product[] = [
  ...GEMMA_VERIFIED_BULK, ...CLEOPATRA_VERIFIED_BULK,
  ...PLATINO_VERIFIED_BULK, ...INNOVA_VERIFIED_BULK,
].map((original) => {
  const url = getFiveMahgoubSourceUrl(original.brand, original.code || "");
  return normalizeMarketProduct({
    ...original,
    material: original.type,
    sizes: original.sizes.map(s=>({
      ...s, originalSourceValue: s.label, normalizedDisplayValue: s.label,
    })),
    source: {
      sourceId: "source-03",
      provider: "Mahgoub",
      recordId: original.code || original.id,
      productPageUrl: url || null,
      originalUrl: url || null,
      reviewStatus: "source-imported",
      originalSurface: original.finish,
    },
  });
}).filter(isPublishableMarketProduct);

export function mergeMarketProducts(products: Product[]) {
  const selected = new Map<string,Product>();
  for (const raw of products) {
    const p = normalizeMarketProduct(raw);
    if (!isPublishableMarketProduct(p)) continue;
    const code=p.code?.trim().toLowerCase();
    const identity = code ? `${p.brand.toLowerCase()}:${code}` :
      `${p.brand.toLowerCase()}:${p.name.en.toLowerCase()}:${p.sizes[0]?.label || ""}`;
    const existing=selected.get(identity);
    const richness = (x:Product) => [
      x.code,x.model,x.type,x.finish,x.material,x.application,x.description,
      x.colors?.length,x.gallery?.length,x.specificationGroups?.length
    ].filter(Boolean).length;
    if (!existing || richness(p)>richness(existing)) selected.set(identity,p);
  }
  return [...selected.values()];
}
