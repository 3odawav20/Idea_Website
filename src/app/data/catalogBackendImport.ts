import type { CollectionSlug, Product, ProductSize } from "./types";

const CATALOG_API_BASE = (import.meta.env.VITE_CATALOG_API_BASE_URL || "https://api.fuzzycell.com/idea-catalog").replace(/\/$/, "");

interface CatalogRow {
  id: number | string;
  source_id: string;
  source_record_id: string;
  slug: string;
  name: string;
  brand: string | null;
  sku: string | null;
  collection_slug: string;
  subcategory: string | null;
  product_type: string | null;
  description: string | null;
  material: string | null;
  color: string | null;
  dimension_text: string | null;
  price_text: string | null;
  compare_at_price_text: string | null;
  currency: string | null;
  availability: string | null;
  primary_image_url: string | null;
  source_url: string;
  last_source_sync_at: string | null;
}

interface CatalogPage {
  ok: boolean;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  products: CatalogRow[];
}

const COLLECTIONS = new Set<CollectionSlug>([
  "ceramics",
  "porcelain",
  "sanitary-ware",
  "faucets",
  "bathroom-sets",
  "bathroom-units",
  "bathtubs",
  "shower-units",
  "bathroom-accessories",
  "furniture",
  "lighting",
  "home-decor",
  "plumbing-products",
]);

function collectionOf(value: string): CollectionSlug {
  return COLLECTIONS.has(value as CollectionSlug) ? value as CollectionSlug : "home-decor";
}

function clean(value?: string | null) {
  return value?.trim().replace(/\s+/g, " ") || undefined;
}

function exactSizes(row: CatalogRow): ProductSize[] {
  const values = (row.dimension_text || "")
    .split("|")
    .map((value) => value.trim())
    .filter(Boolean);

  return [...new Set(values)].map((value, index) => ({
    id: `catalog-${row.id}-size-${index + 1}`,
    originalSourceValue: value,
    normalizedDisplayValue: value,
    label: value,
  }));
}

function mapRow(row: CatalogRow): Product {
  const color = clean(row.color);
  const name = clean(row.name) || `Product ${row.source_record_id}`;
  const image = clean(row.primary_image_url) || "";

  return {
    id: `catalog:${row.id}`,
    slug: clean(row.slug) || `catalog-${row.id}`,
    name: { en: name, ar: name, fr: name },
    collection: collectionOf(row.collection_slug),
    subcategory: clean(row.subcategory),
    brand: clean(row.brand) || "",
    code: clean(row.sku),
    type: clean(row.product_type) || clean(row.subcategory),
    description: clean(row.description),
    material: clean(row.material),
    colors: color ? [color] : undefined,
    sizes: exactSizes(row),
    image,
    gallery: image ? [image] : [],
    priceText: clean(row.price_text),
    compareAtPriceText: clean(row.compare_at_price_text),
    currency: clean(row.currency),
    availability: clean(row.availability),
    source: {
      sourceId: row.source_id,
      provider: "IDEA unified catalogue",
      recordId: row.source_record_id,
      productPageUrl: row.source_url,
      extractionTimestamp: row.last_source_sync_at || undefined,
      reviewStatus: "source-imported",
      sourceCategory: clean(row.subcategory),
      sourceSubcategory: clean(row.subcategory),
      sourceProductType: clean(row.product_type),
      rawRecord: { catalogId: row.id },
    },
    approved: true,
    status: "imported",
  };
}

async function page(pageNumber: number, signal?: AbortSignal): Promise<CatalogPage> {
  const response = await fetch(
    `${CATALOG_API_BASE}/api.php?action=products&page=${pageNumber}&per_page=500`,
    { signal }
  );
  const payload = await response.json() as CatalogPage;
  if (!response.ok || !payload.ok) throw new Error(`Catalogue page ${pageNumber} failed`);
  return payload;
}

export async function loadUnifiedCatalog(
  onBatch: (products: Product[], progress: { loaded: number; total: number }) => void,
  signal?: AbortSignal
): Promise<void> {
  const first = await page(1, signal);
  let loaded = first.products.length;
  onBatch(first.products.map(mapRow), { loaded, total: first.total });

  const concurrency = 4;
  for (let start = 2; start <= first.totalPages; start += concurrency) {
    if (signal?.aborted) return;
    const pages = Array.from(
      { length: Math.min(concurrency, first.totalPages - start + 1) },
      (_, index) => start + index
    );
    const settled = await Promise.allSettled(pages.map((number) => page(number, signal)));
    for (const result of settled) {
      if (result.status !== "fulfilled") continue;
      const batch = result.value.products.map(mapRow);
      loaded += batch.length;
      onBatch(batch, { loaded, total: first.total });
    }
  }
}

export { CATALOG_API_BASE };
