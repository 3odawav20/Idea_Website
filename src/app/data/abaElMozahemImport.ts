import type { Product } from "./types";

const SOURCE_ID = "source-08";
const SOURCE_URL = "https://share.google/jHbUMvzaSf66k5GW9";
const PRODUCT_BASE_URL = "https://abaelmozahem.com/products/";
const CATALOGUE_URL = "https://abaelmozahem.com/collections/ceramic/products.json?limit=250";
const CACHE_KEY = "idea.source-08.raw.v1";

interface RawVariant { id: number; title: string; sku: string | null; available: boolean; price: string; compare_at_price: string | null; option1: string | null; option2: string | null; option3: string | null; }
interface RawImage { id: number; src: string; alt: string | null; position: number; }
interface RawProduct { id: number; handle: string; title: string; body_html: string | null; vendor: string; tags: string[]; variants: RawVariant[]; images: RawImage[]; image: RawImage | null; created_at: string; updated_at: string; }

function cleanText(html: string | null) { return html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || undefined; }

function normalize(raw: RawProduct): Product {
  const images = [...new Set(raw.images.map((image) => image.src).filter(Boolean))];
  const primary = raw.image?.src || images[0];
  if (!primary) throw new Error(`Product ${raw.id} has no source image`);
  const variants = raw.variants.map((variant) => variant.title).filter((value) => value && value !== "Default Title");
  const colors = [...new Set(raw.variants.map((variant) => variant.option1).filter((value): value is string => Boolean(value)))];
  const sourceTime = raw.updated_at || raw.created_at;
  return {
    id: `${SOURCE_ID}:${raw.id}`,
    slug: `aba-${raw.handle}`,
    name: { ar: raw.title, en: raw.title, fr: raw.title },
    collection: "ceramics",
    brand: raw.vendor || "",
    model: "",
    code: raw.variants.find((variant) => variant.sku)?.sku || undefined,
    description: cleanText(raw.body_html),
    variant: variants[0],
    colors,
    usage: raw.tags,
    sizes: [],
    image: primary,
    gallery: images,
    source: {
      sourceId: SOURCE_ID,
      provider: "AbaElMozahem Shopify catalogue",
      recordId: String(raw.id),
      originalUrl: SOURCE_URL,
      productPageUrl: `${PRODUCT_BASE_URL}${raw.handle}`,
      extractionTimestamp: sourceTime,
      reviewStatus: "needs-human-review",
      rawRecord: raw,
    },
    approved: false,
    status: "staged",
  };
}

export async function fetchAbaElMozahemProducts(): Promise<Product[]> {
  const cached = localStorage.getItem(CACHE_KEY);
  const rawProducts: RawProduct[] = cached
    ? JSON.parse(cached)
    : (await (await fetch(CATALOGUE_URL)).json() as { products: RawProduct[] }).products;
  if (!cached) localStorage.setItem(CACHE_KEY, JSON.stringify(rawProducts));
  return rawProducts.map(normalize);
}
