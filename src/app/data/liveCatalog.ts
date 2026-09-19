import type { CollectionSlug, Product, ProductSpecificationItem } from "./types";

const API_BASE = (import.meta.env.VITE_CATALOG_API_BASE_URL || "https://api.fuzzycell.com/idea-catalog").replace(/\/$/, "");
const PAGE_SIZE = 500;
const PAGE_CONCURRENCY = 6;

const SOURCE_COLLECTIONS = [
  "ceramics",
  "porcelain",
  "sanitary-ware",
  "faucets",
  "bathroom-units",
  "bathtubs",
  "shower-units",
  "bathroom-accessories",
  "furniture",
  "lighting",
  "home-decor",
  "plumbing",
  "plumbing-products",
] as const;

const DISPLAY_COLLECTIONS = new Set<CollectionSlug>([
  "ceramics",
  "porcelain",
  "marble",
  "sanitary-ware",
  "faucets",
  "bathroom-units",
  "bathtubs",
  "shower-units",
  "bathroom-accessories",
  "plumbing-products",
  "furniture",
  "lighting",
  "home-decor",
]);

const SKIP_SOURCES = new Set(["source-20"]);

interface CatalogRow {
  id: number;
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
  last_source_sync_at?: string | null;
}

interface ProductPage {
  ok: boolean;
  page: number;
  perPage: number;
  total: number;
  totalPages: number;
  products: CatalogRow[];
}

function clean(value?: string | null) {
  const text = (value || "").trim().replace(/\s+/g, " ");
  return text || undefined;
}

function displayPrice(value?: string | null, currency?: string | null) {
  const raw = clean(value);
  if (!raw) return undefined;
  const number = Number(raw);
  if (Number.isFinite(number)) {
    return `${currency || "EGP"} ${number.toLocaleString("en-US", {
      minimumFractionDigits: number % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    })}`;
  }
  return [currency, raw].filter(Boolean).join(" ");
}

function normalizedCollection(row: CatalogRow): CollectionSlug | null {
  const raw = row.collection_slug;
  if (raw === "plumbing" || raw === "plumbing-products") return "plumbing-products";

  const sourceTaxonomy = `${row.subcategory || ""} ${row.product_type || ""}`.toLowerCase();
  if (
    (raw === "ceramics" || raw === "porcelain") &&
    /(^|\b)(marble|natural stone)(\b|$)|رخام|حجر طبيعي/u.test(sourceTaxonomy)
  ) {
    return "marble";
  }

  if (DISPLAY_COLLECTIONS.has(raw as CollectionSlug)) return raw as CollectionSlug;
  return null;
}

function mapRow(row: CatalogRow): Product | null {
  if (SKIP_SOURCES.has(row.source_id)) return null;

  const collection = normalizedCollection(row);
  if (!collection) return null;

  const name = clean(row.name);
  if (!name) return null;

  const dimension = clean(row.dimension_text);
  const color = clean(row.color);
  const material = clean(row.material);
  const subcategory = clean(row.subcategory);
  const type = clean(row.product_type) || subcategory;
  const brand = clean(row.brand) || "";
  const image = row.primary_image_url && row.primary_image_url !== "Array" ? row.primary_image_url : "";

  const specs: ProductSpecificationItem[] = [
    dimension ? { label: "Dimensions", value: dimension, originalSourceValue: dimension, normalizedValue: dimension } : null,
    material ? { label: "Material", value: material, originalSourceValue: material, normalizedValue: material } : null,
    color ? { label: "Color", value: color, originalSourceValue: color, normalizedValue: color } : null,
    row.sku ? { label: "SKU / Product code", value: row.sku, originalSourceValue: row.sku, normalizedValue: row.sku } : null,
    row.availability ? { label: "Availability", value: row.availability, originalSourceValue: row.availability, normalizedValue: row.availability } : null,
  ].filter(Boolean) as ProductSpecificationItem[];

  return {
    id: `catalog:${row.source_id}:${row.source_record_id}`,
    slug: row.slug || `${row.source_id}-${row.source_record_id}`,
    name: { en: name, ar: name, fr: name },
    collection,
    subcategory,
    brand,
    code: clean(row.sku),
    type,
    description: clean(row.description),
    material,
    colors: color ? [color] : undefined,
    sizes: dimension
      ? [{
          id: `catalog:${row.source_id}:${row.source_record_id}:size`,
          originalSourceValue: dimension,
          normalizedDisplayValue: dimension,
          label: dimension,
        }]
      : [],
    image,
    gallery: image ? [image] : [],
    priceText: displayPrice(row.price_text, row.currency),
    compareAtPriceText: displayPrice(row.compare_at_price_text, row.currency),
    currency: clean(row.currency),
    availability: clean(row.availability),
    specificationGroups: specs.length ? [{ title: "Product information", items: specs }] : undefined,
    source: {
      sourceId: row.source_id,
      provider: "IDEA catalog source",
      recordId: row.source_record_id,
      productPageUrl: row.source_url,
      extractionTimestamp: row.last_source_sync_at || undefined,
      reviewStatus: "source-imported",
      sourceCategory: subcategory,
      sourceSubcategory: subcategory,
      sourceProductType: type,
      rawRecord: { catalogId: row.id },
    },
    approved: true,
    status: "imported",
  };
}

async function fetchPage(collection: string, page: number, signal?: AbortSignal): Promise<ProductPage> {
  const url = `${API_BASE}/api.php?action=products&collection=${encodeURIComponent(collection)}&per_page=${PAGE_SIZE}&page=${page}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`Catalog request failed: ${response.status}`);
  const payload = await response.json() as ProductPage;
  if (!payload.ok) throw new Error("Catalog request failed");
  return payload;
}

function mappedProducts(payload: ProductPage) {
  return payload.products.map(mapRow).filter(Boolean) as Product[];
}

export async function loadLiveCatalog(
  onBatch: (products: Product[]) => void,
  signal?: AbortSignal
): Promise<void> {
  const firstPages = await Promise.allSettled(
    SOURCE_COLLECTIONS.map(async (collection) => ({ collection, payload: await fetchPage(collection, 1, signal) }))
  );

  const remaining: Array<{ collection: string; page: number }> = [];
  for (const result of firstPages) {
    if (result.status !== "fulfilled") continue;
    const { collection, payload } = result.value;
    const firstBatch = mappedProducts(payload);
    if (firstBatch.length) onBatch(firstBatch);
    for (let page = 2; page <= Math.max(1, payload.totalPages || 1); page += 1) {
      remaining.push({ collection, page });
    }
  }

  let cursor = 0;
  const worker = async () => {
    while (cursor < remaining.length) {
      if (signal?.aborted) return;
      const task = remaining[cursor++];
      try {
        const payload = await fetchPage(task.collection, task.page, signal);
        const batch = mappedProducts(payload);
        if (batch.length) onBatch(batch);
      } catch (error) {
        if ((error as { name?: string })?.name === "AbortError") return;
        // Keep the already-visible catalogue and continue loading other pages.
      }
    }
  };

  await Promise.all(Array.from({ length: Math.min(PAGE_CONCURRENCY, remaining.length) }, () => worker()));
}
