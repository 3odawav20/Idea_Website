import type { Product, ProductSpecificationItem } from "./types";
import { inferMazloumCollection } from "./mazloumImport";

export interface MazloumDetail {
  ok: boolean;
  error?: string;
  sourceUrl: string;
  name: string;
  description: string | null;
  sku: string | null;
  brand: string | null;
  gallery: string[];
  breadcrumbs: string[];
  features: { label: string; value: string }[];
  price: string | null;
  priceCurrency: string | null;
  availability: string | null;
  fetchedAt?: string;
}

const CATALOG_API_BASE = (import.meta.env.VITE_CATALOG_API_BASE_URL || "").replace(/\/$/, "");
const cache = new Map<string, Promise<MazloumDetail | null>>();
const queue: Array<() => void> = [];
const CONCURRENCY = 3;
let active = 0;

function pump() {
  while (active < CONCURRENCY && queue.length) {
    const run = queue.shift();
    run?.();
  }
}

function formatPrice(value: string | null, currency: string | null) {
  if (!value) return undefined;
  const number = Number(value);
  if (!Number.isFinite(number)) return [currency, value].filter(Boolean).join(" ");
  return `${currency || "EGP"} ${number.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function loadMazloumDetail(productUrl: string): Promise<MazloumDetail | null> {
  const existing = cache.get(productUrl);
  if (existing) return existing;

  const request = new Promise<MazloumDetail | null>((resolve) => {
    const run = () => {
      active += 1;
      const endpoint = CATALOG_API_BASE
        ? `${CATALOG_API_BASE}/detail.php?url=${encodeURIComponent(productUrl)}`
        : `/api/mazloum-detail?url=${encodeURIComponent(productUrl)}`;
      fetch(endpoint)
        .then(async (response) => {
          const payload = await response.json() as MazloumDetail;
          if (!response.ok || !payload.ok) return null;
          return payload;
        })
        .then(resolve)
        .catch(() => resolve(null))
        .finally(() => {
          active = Math.max(0, active - 1);
          pump();
        });
    };

    queue.push(run);
    pump();
  });

  cache.set(productUrl, request);
  void request.then((result) => {
    if (!result) cache.delete(productUrl);
  });
  return request;
}

function feature(detail: MazloumDetail, label: RegExp) {
  return detail.features.find((item) => label.test(item.label))?.value;
}

export function applyMazloumDetail(product: Product, detail: MazloumDetail | null): Product {
  if (!detail) return product;

  const color = feature(detail, /^color$/i);
  const material = feature(detail, /^material$/i);
  const dimension = feature(detail, /dimension|model/i);
  const subcategory = detail.breadcrumbs.length >= 3
    ? detail.breadcrumbs[detail.breadcrumbs.length - 2]
    : product.subcategory;

  const specificationItems: ProductSpecificationItem[] = detail.features.map((item) => ({
    label: item.label,
    value: item.value,
    originalSourceValue: item.value,
    normalizedValue: item.value,
  }));

  return {
    ...product,
    name: {
      en: detail.name || product.name.en,
      ar: detail.name || product.name.ar,
      fr: detail.name || product.name.fr,
    },
    collection: inferMazloumCollection(subcategory, detail.description || detail.name),
    subcategory,
    brand: detail.brand || product.brand,
    code: detail.sku || product.code,
    description: detail.description || product.description,
    material: material || product.material,
    model: dimension || product.model,
    colors: color ? [...new Set([...(product.colors || []), color])] : product.colors,
    sizes: dimension
      ? [{
          id: `${product.id}-source-size`,
          originalSourceValue: dimension,
          normalizedDisplayValue: dimension,
          label: dimension,
        }]
      : product.sizes,
    image: detail.gallery[0] || product.image,
    gallery: detail.gallery.length ? detail.gallery : product.gallery,
    priceText: product.priceText || formatPrice(detail.price, detail.priceCurrency),
    currency: detail.priceCurrency || product.currency,
    availability: detail.availability || product.availability,
    specificationGroups: specificationItems.length
      ? [{ title: "Source product data", items: specificationItems }]
      : product.specificationGroups,
    source: {
      ...(product.source || {
        provider: "Mazloum Home catalogue",
        recordId: product.id,
        reviewStatus: "source-imported" as const,
      }),
      productPageUrl: detail.sourceUrl || product.source?.productPageUrl,
      extractionTimestamp: detail.fetchedAt || product.source?.extractionTimestamp,
      sourceBreadcrumb: detail.breadcrumbs,
      sourceSubcategory: subcategory,
      sourceProductType: subcategory,
      sourceSpecificationGroups: specificationItems.map((item) => item.label),
    },
  };
}
