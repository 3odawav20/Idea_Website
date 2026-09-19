import type { Product, ProductSpecificationItem } from "./types";
import { isPresentableImageUrl } from "./catalogPresentation";

const API_BASE = (import.meta.env.VITE_CATALOG_API_BASE_URL || "https://api.fuzzycell.com/idea-catalog").replace(/\/$/, "");

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

interface DetailResponse {
  ok: boolean;
  product: {
    id: number;
    description?: string | null;
    brand?: string | null;
    sku?: string | null;
    material?: string | null;
    color?: string | null;
    dimension_text?: string | null;
    availability?: string | null;
  };
  images: DetailImage[];
  attributes: DetailAttribute[];
}

function clean(value?: string | null) {
  const text = (value || "").trim().replace(/\s+/g, " ");
  return text || undefined;
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

export async function loadLiveCatalogDetail(product: Product): Promise<Product | null> {
  const id = catalogId(product);
  if (!id) return null;

  const response = await fetch(`${API_BASE}/api.php?action=product&id=${id}`, {
    headers: { Accept: "application/json" },
  });
  if (!response.ok) return null;

  const payload = await response.json() as DetailResponse;
  if (!payload.ok || !payload.product) return null;

  const attributes = (payload.attributes || []).filter((item) => clean(item.attribute_key) && clean(item.attribute_value));
  const specificationItems: ProductSpecificationItem[] = attributes.map((item) => ({
    label: item.attribute_key,
    value: item.attribute_value,
    originalSourceValue: item.source_value || item.attribute_value,
    normalizedValue: item.attribute_value,
  }));

  const gallery = [...new Set(
    (payload.images || [])
      .map((image) => clean(image.local_url) || clean(image.source_url))
      .filter((value): value is string => Boolean(value && isPresentableImageUrl(value)))
  )];

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
    specificationGroups: specificationItems.length
      ? [{ title: "Technical specifications", items: specificationItems }]
      : product.specificationGroups,
  };
}

export function isLiveCatalogProduct(product?: Product) {
  return Boolean(product && product.source?.provider === "IDEA catalog source" && catalogId(product));
}
