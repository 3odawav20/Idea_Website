import type { CollectionSlug, Product } from "./types";

const SOURCE_ID = "source-13";
const SOURCE_PROVIDER = "Mazloum Home catalogue";
const SOURCE_URL = "https://mazloumhome.com/";
const CACHE_KEY = "idea.source-13.catalogue.v3";
const CACHE_TTL_MS = 6 * 60 * 60 * 1000;

interface RawMazloumProduct {
  id: string;
  name: string;
  productUrl: string;
  image: string | null;
  category: string | null;
  price: string | null;
  previousPrice: string | null;
  discount: string | null;
  badges: string[];
}

interface MazloumPageResponse {
  ok: boolean;
  error?: string;
  page: number;
  pageSize: number;
  total: number | null;
  totalPages: number | null;
  source?: { fetchedAt?: string };
  products: RawMazloumProduct[];
}

interface CachedCatalogue {
  savedAt: number;
  products: Product[];
}

function clean(value = "") {
  return value.trim().replace(/\s+/g, " ");
}

export function inferMazloumCollection(category?: string | null, name?: string | null): CollectionSlug {
  const source = `${category || ""} ${name || ""}`.toLowerCase();

  if (/\b(bathtub|bath tub|jacuzzi)\b/.test(source)) return "bathtubs";
  if (/\b(faucet|mixer|tap)\b/.test(source)) return "faucets";
  if (/\b(shower|shower cabin|shower unit)\b/.test(source)) return "shower-units";
  if (/\b(basin|wash basin|toilet|wc|sanitary)\b/.test(source)) return "sanitary-ware";
  if (/\b(vanity|bathroom unit|bath unit)\b/.test(source)) return "bathroom-units";
  if (/\b(porcelain tile|porcelain tiles|porcelain slab)\b/.test(source)) return "porcelain";
  if (/\b(ceramic tile|ceramic tiles|wall tile|floor tile)\b/.test(source)) return "ceramics";

  if (/(living rooms?|sofa|chairs?|bed rooms?|bedrooms?|dining rooms?|occas+sional tables?|entertainment)/.test(source)) {
    return "furniture";
  }

  if (/(pendent lamp|pendant lamp|chandelier|wall lamp|floor lamp|table lamp|ceiling lamp|lighting|outdoor lamp)/.test(source)) {
    return "lighting";
  }

  return "home-decor";
}

function slugify(value: string) {
  return clean(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function mapListingProduct(source: RawMazloumProduct, fetchedAt?: string): Product {
  const category = clean(source.category || "") || undefined;
  return {
    id: `${SOURCE_ID}:${source.id}`,
    slug: `mazloum-${source.id}-${slugify(source.name)}`,
    name: { en: source.name, ar: source.name, fr: source.name },
    collection: inferMazloumCollection(category, source.name),
    subcategory: category,
    brand: "",
    type: category,
    sizes: [],
    image: source.image || "",
    gallery: source.image ? [source.image] : [],
    badges: [...new Set([...(source.badges || []), source.discount].filter(Boolean) as string[])],
    priceText: source.price || undefined,
    compareAtPriceText: source.previousPrice || undefined,
    currency: source.price?.includes("EGP") ? "EGP" : undefined,
    source: {
      sourceId: SOURCE_ID,
      provider: SOURCE_PROVIDER,
      recordId: String(source.id),
      originalUrl: SOURCE_URL,
      productPageUrl: source.productUrl,
      extractionTimestamp: fetchedAt || new Date().toISOString(),
      reviewStatus: "source-imported",
      sourceCategory: category,
      sourceSubcategory: category,
      rawRecord: source,
    },
    approved: true,
    status: "imported",
  };
}

async function fetchPage(page: number, signal?: AbortSignal): Promise<MazloumPageResponse> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    try {
      const response = await fetch(`/api/mazloum?page=${page}`, { signal });
      const payload = await response.json() as MazloumPageResponse;
      if (response.ok && payload.ok) return payload;
      lastError = new Error(payload.error || `Mazloum page ${page} failed`);
    } catch (error) {
      if ((error as { name?: string })?.name === "AbortError") throw error;
      lastError = error;
    }
    if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 400 * (attempt + 1)));
  }
  throw lastError instanceof Error ? lastError : new Error(`Mazloum page ${page} failed`);
}

function unique(products: Product[]) {
  return [...new Map(products.map((product) => [product.id, product])).values()];
}

export async function loadMazloumProducts(
  onBatch: (products: Product[]) => void,
  signal?: AbortSignal
): Promise<void> {
  try {
    const rawCache = localStorage.getItem(CACHE_KEY);
    if (rawCache) {
      const cache = JSON.parse(rawCache) as CachedCatalogue;
      if (Array.isArray(cache.products) && cache.products.length && Date.now() - cache.savedAt < CACHE_TTL_MS) {
        onBatch(cache.products);
        return;
      }
    }
  } catch {
    // Ignore invalid browser cache and refresh from the source proxy.
  }

  const first = await fetchPage(1, signal);
  const all: Product[] = first.products.map((product) => mapListingProduct(product, first.source?.fetchedAt));
  onBatch(all);

  const totalPages = Math.max(1, Math.min(first.totalPages || 1, 100));
  const concurrency = 4;

  for (let start = 2; start <= totalPages; start += concurrency) {
    if (signal?.aborted) return;
    const pageNumbers = Array.from({ length: Math.min(concurrency, totalPages - start + 1) }, (_, index) => start + index);
    const settled = await Promise.allSettled(pageNumbers.map((page) => fetchPage(page, signal)));
    const batch = settled.flatMap((result) =>
      result.status === "fulfilled"
        ? result.value.products.map((product) => mapListingProduct(product, result.value.source?.fetchedAt))
        : []
    );
    if (batch.length) {
      all.push(...batch);
      onBatch(batch);
    }
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), products: unique(all) } satisfies CachedCatalogue));
  } catch {
    // Catalogue still works when storage is unavailable or full.
  }
}
