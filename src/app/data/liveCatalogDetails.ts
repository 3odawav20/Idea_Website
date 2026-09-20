import type { CollectionSlug, Product, ProductSpecificationItem } from "./types";
import { isPresentableImageUrl } from "./catalogPresentation";
import { sourceProviderName } from "./catalogSources";
import { normalizeLiveCatalogCollection } from "./liveCatalog";

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
  source_payload?: string | null;
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

type SourceRawAttribute = {
  name?: string;
  terms?: Array<string | { name?: string }>;
};

type SourceRawPayload = {
  brands?: Array<{ name?: string }>;
  attributes?: SourceRawAttribute[];
  tags?: Array<string | { name?: string }>;
  weight?: string | null;
  formatted_weight?: string | null;
  dimensions?: { length?: string; width?: string; height?: string } | null;
  formatted_dimensions?: string | null;
};

function parseSourceRaw(row: DetailProductRow): SourceRawPayload {
  if (!row.source_payload) return {};
  try {
    const parsed = JSON.parse(row.source_payload) as { raw?: SourceRawPayload };
    return parsed?.raw || {};
  } catch {
    return {};
  }
}

function sourceTerms(raw: SourceRawPayload, matcher: RegExp) {
  const attribute = (raw.attributes || []).find((item) => matcher.test(item.name || ""));
  return (attribute?.terms || [])
    .map((term) => typeof term === "string" ? term : term?.name)
    .map((term) => clean(term))
    .filter((term): term is string => Boolean(term));
}

function sourceBrand(raw: SourceRawPayload) {
  const value = clean(raw.brands?.[0]?.name);
  if (!value) return undefined;
  if (/دوفو|dovvo/iu.test(value)) return "Dovvo";
  if (/ايديال ستاندرد|ideal standard/iu.test(value)) return "Ideal Standard";
  if (/جروهي|grohe/iu.test(value)) return "Grohe";
  if (/ديورافيت|duravit/iu.test(value)) return "Duravit";
  return value;
}

function sourceWeight(raw: SourceRawPayload) {
  const rawWeight = clean(raw.weight);
  if (rawWeight && /^\d+(?:\.\d+)?$/.test(rawWeight)) return `${rawWeight} kg`;
  const formatted = clean(raw.formatted_weight);
  if (!formatted) return undefined;
  return formatted
    .replace(/كيلوجرام|كجم/gu, "kg")
    .replace(/\s+/g, " ")
    .trim();
}

function sourceDimensions(raw: SourceRawPayload) {
  const dimensions = raw.dimensions || {};
  const values = [dimensions.length, dimensions.width, dimensions.height].map((value) => clean(value)).filter(Boolean);
  if (values.length >= 2) return `${values.join(" × ")} cm`;

  const formatted = clean(raw.formatted_dimensions);
  if (!formatted) return undefined;
  return formatted
    .replace(/سنتيمتر|سم/gu, "cm")
    .replace(/\s+/g, " ")
    .trim();
}

function inferredMaterial(description?: string | null) {
  const text = clean(description) || "";
  if (/\bHPL\b/i.test(text)) return "HPL moisture-resistant board";
  return undefined;
}

function inferredWarranty(description?: string | null) {
  const text = clean(description) || "";
  const ar = text.match(/ضمان\s*(\d+)\s*سنوات?/u);
  if (ar) return `${ar[1]} years`;
  const en = text.match(/(\d+)\s*[- ]?year\s+warranty/i);
  return en ? `${en[1]} years` : undefined;
}

function clean(value?: string | null) {
  const text = (value || "").trim().replace(/\s+/g, " ");
  return text || undefined;
}

function dimensionFromName(name?: string | null) {
  const match = (name || "").match(/(\d{1,4}(?:\.\d+)?)\s*[×x*]\s*(\d{1,4}(?:\.\d+)?)(?:\s*[×x*]\s*(\d{1,4}(?:\.\d+)?))?\s*(سم|cm|مم|mm)?/iu);
  if (!match) return undefined;
  const values = [match[1], match[2], match[3]].filter(Boolean);
  const unit = match[4]?.toLowerCase();
  return values.join(" × ") + (unit ? " " + unit : "");
}

function finishFromName(name?: string | null) {
  const value = name || "";
  if (/(?:glossy|polished)/i.test(value) || /لامع/u.test(value)) return "Glossy";
  if (/(?:matt|matte)/i.test(value) || /(?:^|\s)مط(?:\s|$)/u.test(value)) return "Matte";
  return undefined;
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
  const raw = parseSourceRaw(payload.product);
  const base = (payload.attributes || [])
    .filter((item) => clean(item.attribute_key) && clean(item.attribute_value))
    .map((item) => ({
      label: item.attribute_key,
      value: item.attribute_value,
      originalSourceValue: item.source_value || item.attribute_value,
      normalizedValue: item.attribute_value,
    }));

  const extra: ProductSpecificationItem[] = [];
  const brand = sourceBrand(raw);
  const weight = sourceWeight(raw);
  const dimensions = sourceDimensions(raw);
  const warranty = inferredWarranty(payload.product.description);
  const material = clean(payload.product.material) || inferredMaterial(payload.product.description);

  if (brand) extra.push({ label: "Brand", value: brand, originalSourceValue: brand, normalizedValue: brand });
  if (dimensions) extra.push({ label: "Dimensions", value: dimensions, originalSourceValue: dimensions, normalizedValue: dimensions });
  if (weight) extra.push({ label: "Weight", value: weight, originalSourceValue: weight, normalizedValue: weight });
  if (material) extra.push({ label: "Material", value: material, originalSourceValue: material, normalizedValue: material });
  if (warranty) extra.push({ label: "Warranty", value: warranty, originalSourceValue: warranty, normalizedValue: warranty });

  const seen = new Set<string>();
  return [...base, ...extra].filter((item) => {
    const key = `${item.label.trim().toLowerCase()}|${item.value.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function enrichProduct(product: Product, payload: DetailResponse): Product {
  const attributes = (payload.attributes || []).filter((item) => clean(item.attribute_key) && clean(item.attribute_value));
  const raw = parseSourceRaw(payload.product);
  const specs = specificationItems(payload);
  const gallery = galleryFromPayload(payload);
  const dimension =
    clean(payload.product.dimension_text) ||
    clean(findAttribute(attributes, /size|dimension|measure|مقاس|أبعاد|ابعاد/i)) ||
    sourceDimensions(raw) ||
    dimensionFromName(payload.product.name);
  const directColor =
    clean(payload.product.color) ||
    clean(findAttribute(attributes, /color|colour|لون/i));
  const sourceColors = sourceTerms(raw, /color|colour|لون/i);
  const colors = [...new Set([...(product.colors || []), ...(directColor ? [directColor] : []), ...sourceColors])];
  const material =
    clean(payload.product.material) ||
    clean(findAttribute(attributes, /material|خامة|الخامة/i)) ||
    inferredMaterial(payload.product.description);
  const finish = clean(findAttribute(attributes, /finish|surface|texture|تشطيب|ملمس/i)) || finishFromName(payload.product.name);
  const origin = clean(findAttribute(attributes, /origin|country of origin|بلد المنشأ|المنشأ/i));
  const weight =
    clean(findAttribute(attributes, /weight|وزن/i)) ||
    sourceWeight(raw);
  const packaging = clean(findAttribute(attributes, /pack|packaging|box|عبوة|كرتونة/i));
  const brand = clean(payload.product.brand) || sourceBrand(raw) || product.brand;
  const warranty = inferredWarranty(payload.product.description);
  const extraBadges = warranty ? [...new Set([...(product.badges || []), `${warranty} warranty`])] : product.badges;

  return {
    ...product,
    brand,
    code: clean(payload.product.sku) || product.code,
    description: clean(payload.product.description) || product.description,
    material: material || product.material,
    finish: finish || product.finish,
    origin: origin || product.origin,
    weight: weight || product.weight,
    packaging: packaging || product.packaging,
    availability: clean(payload.product.availability) || product.availability,
    colors: colors.length ? colors : product.colors,
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
    badges: extraBadges,
    specificationGroups: specs.length
      ? [{ title: "Technical specifications", items: specs }]
      : product.specificationGroups,
  };
}

const detailCache = new Map<number, Promise<Product | null>>();

export async function loadLiveCatalogDetail(product: Product): Promise<Product | null> {
  const id = catalogId(product);
  if (!id) return null;

  const cached = detailCache.get(id);
  if (cached) return cached;

  const request = (async () => {
    try {
      const response = await fetch(catalogUrl(`action=product&id=${id}`), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) return null;

      const payload = await response.json() as DetailResponse;
      if (!payload.ok || !payload.product) return null;
      return enrichProduct(product, payload);
    } catch {
      return null;
    }
  })();

  detailCache.set(id, request);
  return request;
}

export async function loadLiveCatalogProductBySlug(slug: string): Promise<Product | null> {
  const decoded = (() => {
    try { return decodeURIComponent(slug); } catch { return slug; }
  })();
  const encodedSourceSlug = encodeURIComponent(decoded).toLowerCase();
  // The catalog stores many WooCommerce slugs as literal percent-encoded text.
  // Try that representation first to avoid a predictable 404 on direct loads.
  const candidates = [...new Set([encodedSourceSlug, slug, decoded])];

  let payload: DetailResponse | null = null;
  for (const candidate of candidates) {
    try {
      const response = await fetch(catalogUrl(`action=product&slug=${encodeURIComponent(candidate)}`), {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) continue;
      const candidatePayload = await response.json() as DetailResponse;
      if (candidatePayload.ok && candidatePayload.product) {
        payload = candidatePayload;
        break;
      }
    } catch {
      // Try the next slug representation.
    }
  }

  if (!payload?.product) return null;

  const row = payload.product;
  const collection = normalizeLiveCatalogCollection(row);
  const name = clean(row.name);
  const gallery = galleryFromPayload(payload);
  const primaryImage = gallery[0] || clean(row.primary_image_url);

  if (!collection || !name || !primaryImage || !isPresentableImageUrl(primaryImage)) return null;

  const dimension =
    clean(row.dimension_text) ||
    clean(findAttribute(payload.attributes || [], /size|dimension|measure|مقاس|أبعاد|ابعاد/i)) ||
    sourceDimensions(parseSourceRaw(row)) ||
    dimensionFromName(row.name);
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
    brand: sourceBrand(parseSourceRaw(row)) || "",
    code: clean(row.sku),
    type: clean(row.product_type),
    description: clean(row.description),
    material: clean(row.material) || inferredMaterial(row.description),
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
      provider: sourceProviderName(row.source_id) || "IDEA catalog source",
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
  return Boolean(product && catalogId(product));
}
