import type { Product } from "./types";

const SOURCE_ID = "source-08";
const SOURCE_URL = "https://share.google/jHbUMvzaSf66k5GW9";
const PRODUCT_BASE_URL = "https://abaelmozahem.com/products/";
const CATALOGUE_URL = "https://abaelmozahem.com/collections/ceramic/products.json?limit=250";
const CACHE_KEY = "idea.source-08.raw.v1";

interface RawVariant {
  id: number;
  title: string;
  sku: string | null;
  available: boolean;
  price: string;
  compare_at_price: string | null;
  option1: string | null;
  option2: string | null;
  option3: string | null;
}
interface RawImage { id: number; src: string; alt: string | null; position: number; }
interface RawProduct {
  id: number;
  handle: string;
  title: string;
  body_html: string | null;
  vendor: string;
  product_type?: string;
  tags: string[];
  variants: RawVariant[];
  images: RawImage[];
  image: RawImage | null;
  created_at: string;
  updated_at: string;
}

function cleanText(html: string | null) {
  return html?.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() || undefined;
}

function normalize(raw: RawProduct): Product {
  const images = [...new Set(
    [...raw.images].sort((a, b) => a.position - b.position).map((image) => image.src).filter(Boolean)
  )];
  const primary = raw.image?.src || images[0];
  if (!primary) throw new Error(`Product ${raw.id} has no source image`);

  const sourceTime = raw.updated_at || raw.created_at;
  const variants = raw.variants
    .filter((variant) => variant.title && variant.title !== "Default Title")
    .map((variant) => ({
      id: String(variant.id),
      label: variant.title,
      sku: variant.sku || undefined,
      available: variant.available,
      originalSourceValue: variant.title,
      attributes: Object.fromEntries(
        [
          ["Option 1", variant.option1],
          ["Option 2", variant.option2],
          ["Option 3", variant.option3],
        ].filter((entry): entry is [string, string] => Boolean(entry[1]))
      ),
    }));

  const colors = [...new Set(
    raw.variants.flatMap((variant) => [variant.option1, variant.option2, variant.option3])
      .filter((value): value is string => Boolean(value))
  )];

  return {
    id: `${SOURCE_ID}:${raw.id}`,
    slug: `aba-${raw.handle}`,
    name: { ar: raw.title, en: raw.title, fr: raw.title },
    collection: "ceramics",
    brand: raw.vendor || "",
    type: raw.product_type || undefined,
    code: raw.variants.find((variant) => variant.sku)?.sku || undefined,
    description: cleanText(raw.body_html),
    variant: variants[0]?.label,
    variants,
    colors,
    usage: raw.tags,
    sizes: [],
    image: primary,
    gallery: images,
    badges: raw.tags.filter((tag) => /new|sale|featured/i.test(tag)),
    source: {
      sourceId: SOURCE_ID,
      provider: "AbaElMozahem Shopify catalogue",
      recordId: String(raw.id),
      originalUrl: SOURCE_URL,
      productPageUrl: `${PRODUCT_BASE_URL}${raw.handle}`,
      extractionTimestamp: sourceTime,
      reviewStatus: "needs-human-review",
      sourceCategory: "Ceramic",
      sourceProductType: raw.product_type || undefined,
      sourceVariantStructure: variants.map((variant) => variant.label),
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
