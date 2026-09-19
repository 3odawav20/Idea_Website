import type { CollectionSlug, Product, ProductSpecificationItem } from "./types";
import { isPresentableImageUrl } from "./catalogPresentation";

const API_BASE = (import.meta.env.VITE_CATALOG_API_BASE_URL || "").replace(/\/$/, "");
const catalogUrl = (query: string) => API_BASE ? `${API_BASE}/api.php?${query}` : `/api/catalog?${query}`;

interface DetailAttribute {
  attribute_key: string;
  attribute_value: string;
  source_value?: string | null;
  position?: number;
}

interface DetailImage {
  source_url: string;
  local_url?: string | null;
  position?: number;
}

interface DetailProductRow {
  id: number;
  source_id: string;
  source_record_id: string;
  slug: string;
  name: string;
  brand?: string | null;
  sku?: string | null;
  collection_slug: string;
  subcategory?: string | null;
  product_type?: string | null;
  description?: string | null;
  material?: string | null;
  color?: string | null;
  dimension_text?: string | null;
  price_text?: string | null;
  compare_at_price_text?: string | null;
  currency?: string | null;
  availability?: string | null;
  primary_image_url?: string | null;
  source_url?: string | null;
  last_source_sync_at?: string | null;
}

interface DetailResponse {
  ok: boolean;
  product: DetailProductRow;
  images: DetailImage[];
  attributes: DetailAttribute[];
}

const VALID_COLLECTIONS = new Set<CollectionSlug>([
  "ceramics",
  "porcelain",
  "marble",
  "sanitary-ware",
  "faucets",
  "bathroom-sets",
  "bathroom-units",
  "bathtubs",
  "shower-units",
  "bathroom-accessories",
  "plumbing-products",
  "furniture",
  "lighting",
  "home-decor",
]);

function clean(value?: string | null) {
  const text = (value || "").trim().replace(/\s+/g, " ");
  return text || undefined;
}

function normalizeCollection(value: string): CollectionSlug | null {
  if (value === "plumbing") return "plumbing-products";
  return VALID_COLLECTIONS.has(value as CollectionSlug) ? value as CollectionSlug : null;
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
  if (currency && raw.toLowerCase().startsWith(currency.toLowerCase())) return raw;
  return [currency, raw].filter(Boolean).join(" ");
}

function catalogId(product: Product) {
  const raw = product.source?.rawRecord;
  if (!raw || typeof raw !== "object") return undefined;
  const value = (raw as { catalogId?: unknown }).catalogId;
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function findAttribute(attributes: DetailAttribute[], matcher: RegExp) {
  return attributes.find((item) => matcher.test(item.attribute_key))?.attribute_value;
}

function galleryFromPayload(payload: DetailResponse) {
  return [...new Set(
    (payload.images || [])
      .map((image) => clean(image.local_url) || clean(image.source_url))
      .filter((value): value is string => Boolean(value && isPresentableImageUrl(value)))
  )];
}

function specificationItems(payload: DetailResponse): ProductSpecificationItem[] {
  return (payload.attributes || [])
    .filter((item) => clean(item.attribute_key) && clean(item.attribute_value))
    .map((item) => ({
      label: item.attribute_key,
      value: item.attribute_value,
      originalSourceValue: item.source_value || item.attribute_value,
      normalizedValue: item.attribute_value,
    }));
}

function enrichProduct(product: Product, payload: DetailResponse): Product {
  const attributes = (payload.attributes || []).filter((item) => clean(item.attribute_key) && clean(item.attribute_value));
  const specs = specificationItems(payload);
  const gallery = galleryFromPayload(payload);
  const dimension =
    clean(payload.product.dimension_text) ||
    clean(findAttribute(attributes, /size|dimension|measure|مقاس|أبعاد|ابعاد/i));
  const color =
    clean(payload.product.color) ||
    clean(findAttribute(attributes, /color|colour|لون/i));
  const material =
    clean(payload.product.material) ||
    clean(findAttribute(attributes, /material|خامة|الخامة/i));
  const finish = clean(findAttribute(attributes, /finish|surface|texture|تشطيب|ملمس/i));
  const origin = clean(findAttribute(attributes, /origin|country of origin|بلد المنشأ|المنشأ/i));
  const weight = clean(findAttribute(attributes, /weight|وزن/i));
  const packaging = clean(findAttribute(attributes, /pack|packaging|box|عبوة|كرتونة/i));

  return {
    ...product,
    brand: clean(payload.product.brand) || product.brand,
    code: clean(payload.product.sku) || product.code,
    description: clean(payload.product.description) || product.description,
    material: material || product.material,
    finish: finish || product.finish,
    origin: origin || product.origin,
    weight: weight || product.weight,
    packaging: packaging || product.packaging,
    availability: clean(payload.product.availability) || product.availability,
    colors: color ? [...new Set([...(product.colors || []), color])] : product.colors,
    sizes: dimension
      ? [{
          id: `${product.id}:source-size`,
          originalSourceValue: dimension,
          normalizedDisplayValue: dimension,
          label: dimension,
        }]
      : product.sizes,
    image: gallery[0] || product.image,
    gallery: gallery.length ? gallery : product.gallery,
    specificationGroups: specs.length
      ? [{ title: "Technical specifications", items: specs }]
      : product.specificationGroups,
  };
}

export async function loadLiveCatalogDetail(product: Product): Promise<Product | null> {
  const id = catalogId(product);
  if (!id) return null;

  const response = await fetch(catalogUrl(`action=product&id=${id}`), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;

  const payload = await response.json() as DetailResponse;
  if (!payload.ok || !payload.product) return null;
  return enrichProduct(product, payload);
}

export async function loadLiveCatalogProductBySlug(slug: string): Promise<Product | null> {
  const response = await fetch(catalogUrl(`action=product&slug=${encodeURIComponent(slug)}`), {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;

  const payload = await response.json() as DetailResponse;
  if (!payload.ok || !payload.product) return null;

  const row = payload.product;
  const collection = normalizeCollection(row.collection_slug);
  const name = clean(row.name);
  const gallery = galleryFromPayload(payload);
  const primaryImage = gallery[0] || clean(row.primary_image_url);

  if (!collection || !name || !primaryImage || !isPresentableImageUrl(primaryImage)) return null;

  const dimension =
    clean(row.dimension_text) ||
    clean(findAttribute(payload.attributes || [], /size|dimension|measure|مقاس|أبعاد|ابعاد/i));
  const color =
    clean(row.color) ||
    clean(findAttribute(payload.attributes || [], /color|colour|لون/i));
  const specs = specificationItems(payload);

  const base: Product = {
    id: `catalog:${row.source_id}:${row.source_record_id}`,
    slug: row.slug || slug,
    name: { en: name, ar: name, fr: name },
    collection,
    subcategory: clean(row.subcategory),
    brand: clean(row.brand) || "",
    code: clean(row.sku),
    type: clean(row.product_type),
    description: clean(row.description),
    material: clean(row.material),
    colors: color ? [color] : undefined,
    sizes: dimension
      ? [{
          id: `catalog:${row.source_id}:${row.source_record_id}:size`,
          originalSourceValue: dimension,
          normalizedDisplayValue: dimension,
          label: dimension,
        }]
      : [],
    image: primaryImage,
    gallery: gallery.length ? gallery : [primaryImage],
    priceText: displayPrice(row.price_text, row.currency),
    compareAtPriceText: displayPrice(row.compare_at_price_text, row.currency),
    currency: clean(row.currency),
    availability: clean(row.availability),
    specificationGroups: specs.length ? [{ title: "Technical specifications", items: specs }] : undefined,
    source: {
      sourceId: row.source_id,
      provider: "IDEA catalog source",
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

  return enrichProduct(base, payload);
}

export function isLiveCatalogProduct(product?: Product) {
  return Boolean(product && product.source?.provider === "IDEA catalog source" && catalogId(product));
}
