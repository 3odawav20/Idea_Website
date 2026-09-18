import type { Product, ProductSpecificationItem, ProductVariant } from "./types";
import { CATALOG_API_BASE } from "./catalogBackendImport";

interface CatalogAttribute {
  attribute_key: string;
  attribute_value: string;
  position: number | string;
}

interface CatalogImage {
  url: string;
  position: number | string;
}

interface CatalogDetailRow {
  id: number | string;
  brand: string | null;
  sku: string | null;
  description: string | null;
  material: string | null;
  color: string | null;
  dimension_text: string | null;
  price_text: string | null;
  compare_at_price_text: string | null;
  currency: string | null;
  availability: string | null;
  product_type: string | null;
  subcategory: string | null;
  images?: CatalogImage[];
  attributes?: CatalogAttribute[];
}

interface CatalogDetailResponse {
  ok: boolean;
  product: CatalogDetailRow;
}

const cache = new Map<string, Promise<CatalogDetailRow | null>>();

export function catalogIdOf(product: Product): string | null {
  const raw = product.source?.rawRecord as { catalogId?: string | number } | undefined;
  return raw?.catalogId !== undefined ? String(raw.catalogId) : null;
}

export function loadCatalogProductDetail(product: Product): Promise<CatalogDetailRow | null> {
  const catalogId = catalogIdOf(product);
  if (!catalogId) return Promise.resolve(null);

  const cached = cache.get(catalogId);
  if (cached) return cached;

  const request = fetch(`${CATALOG_API_BASE}/api.php?action=product&id=${encodeURIComponent(catalogId)}`)
    .then(async (response) => {
      const payload = await response.json() as CatalogDetailResponse;
      if (!response.ok || !payload.ok) return null;
      return payload.product;
    })
    .catch(() => null);

  cache.set(catalogId, request);
  void request.then((value) => { if (!value) cache.delete(catalogId); });
  return request;
}

function splitExact(value?: string | null) {
  return [...new Set((value || "").split("|").map((item) => item.trim()).filter(Boolean))];
}

export function applyCatalogProductDetail(product: Product, detail: CatalogDetailRow | null): Product {
  if (!detail) return product;

  const attributes = detail.attributes || [];
  const images = [...new Set((detail.images || []).map((item) => item.url).filter(Boolean))];
  const sizeValues = new Set(splitExact(detail.dimension_text));
  const colors = new Set(product.colors || []);
  const variants: ProductVariant[] = [];
  const specificationItems: ProductSpecificationItem[] = [];

  for (const attribute of attributes) {
    const key = attribute.attribute_key?.trim();
    const value = attribute.attribute_value?.trim();
    if (!key || !value) continue;

    const lower = key.toLowerCase();
    if (lower === "size" || lower.includes("dimension") || lower.includes("مقاس") || lower.includes("أبعاد") || lower.includes("ابعاد")) {
      sizeValues.add(value);
    }
    if (lower === "color" || lower.includes("لون")) colors.add(value);

    if (lower === "variant") {
      try {
        const raw = JSON.parse(value) as Record<string, unknown>;
        const label = String(raw.title || raw.name || raw.sku || `Variant ${variants.length + 1}`);
        const attrs: Record<string, string> = {};
        for (const option of ["option1", "option2", "option3"]) {
          if (raw[option]) attrs[option] = String(raw[option]);
        }
        variants.push({
          id: String(raw.id || `${product.id}-variant-${variants.length + 1}`),
          label,
          sku: raw.sku ? String(raw.sku) : undefined,
          available: typeof raw.available === "boolean" ? raw.available : undefined,
          originalSourceValue: value,
          attributes: Object.keys(attrs).length ? attrs : undefined,
        });
      } catch {
        specificationItems.push({ label: key, value, originalSourceValue: value });
      }
      continue;
    }

    specificationItems.push({
      label: key,
      value,
      originalSourceValue: value,
      normalizedValue: value,
    });
  }

  const sizes = [...sizeValues].map((value, index) => ({
    id: `${product.id}-detail-size-${index + 1}`,
    originalSourceValue: value,
    normalizedDisplayValue: value,
    label: value,
  }));

  return {
    ...product,
    brand: detail.brand?.trim() || product.brand,
    code: detail.sku?.trim() || product.code,
    description: detail.description?.trim() || product.description,
    material: detail.material?.trim() || product.material,
    type: detail.product_type?.trim() || product.type,
    subcategory: detail.subcategory?.trim() || product.subcategory,
    colors: colors.size ? [...colors] : product.colors,
    sizes: sizes.length ? sizes : product.sizes,
    variants: variants.length ? variants : product.variants,
    image: images[0] || product.image,
    gallery: images.length ? images : product.gallery,
    priceText: detail.price_text?.trim() || product.priceText,
    compareAtPriceText: detail.compare_at_price_text?.trim() || product.compareAtPriceText,
    currency: detail.currency?.trim() || product.currency,
    availability: detail.availability?.trim() || product.availability,
    specificationGroups: specificationItems.length
      ? [{ title: "Product specifications", items: specificationItems }]
      : product.specificationGroups,
  };
}
