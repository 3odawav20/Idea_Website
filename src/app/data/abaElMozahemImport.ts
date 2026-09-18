import { normalizeSize } from "./merchandising";
import type { Product } from "./types";

const SOURCE_ID = "source-08";
const SOURCE_URL = "https://share.google/jHbUMvzaSf66k5GW9";
const PRODUCT_BASE_URL = "https://abaelmozahem.com/products/";
const CATALOGUE_URL = "https://abaelmozahem.com/collections/ceramic/products.json?limit=250";
const CACHE_KEY = "idea.source-08.raw.v1";

interface RawVariant { id: number; title: string; sku: string | null; available: boolean; price: string; compare_at_price: string | null; option1: string | null; option2: string | null; option3: string | null; }
interface RawImage { id: number; src: string; alt: string | null; position: number; }
interface RawProduct { id: number; handle: string; title: string; body_html: string | null; vendor: string; tags: string[]; variants: RawVariant[]; images: RawImage[]; image: RawImage | null; options?: { name: string; position: number; values: string[] }[]; created_at: string; updated_at: string; }

function cleanText(html: string | null) {
  if (!html) return undefined;
  const document = new DOMParser().parseFromString(html, "text/html");
  document.querySelectorAll("script, style, iframe").forEach((node) => node.remove());
  document.querySelectorAll("br").forEach((node) => node.replaceWith("\n"));
  document.querySelectorAll("p, li, h1, h2, h3, tr").forEach((node) => node.append("\n"));
  return document.body.textContent?.split("\n").map((line) => line.replace(/\s+/g, " ").trim()).filter(Boolean).join("\n") || undefined;
}

function normalize(raw: RawProduct): Product {
  const images = [...new Set([raw.image?.src, ...[...raw.images].sort((a, b) => a.position - b.position).map((image) => image.src)].filter((value): value is string => Boolean(value)))];
  const primary = raw.image?.src || images[0];
  if (!primary) throw new Error(`Product ${raw.id} has no source image`);
  const variants = raw.variants.map((variant) => variant.title).filter((value) => value && value !== "Default Title");
  const options = (raw.options ?? []).filter((option) => option.name && !(option.name === "Title" && option.values.every((value) => value === "Default Title")));
  const colors = options.filter((option) => /^(color|colour|اللون|لون)$/i.test(option.name.trim())).flatMap((option) => option.values);
  const sizes = options.filter((option) => /^(size|dimensions|المقاس|المقاسات|مقاس|الأبعاد)$/i.test(option.name.trim())).flatMap((option) => option.values).map((value, i) => normalizeSize(`${raw.id}-size-${i}`, value));
  const structuredVariants = raw.variants.map((variant) => ({
    id: String(variant.id), title: variant.title, sku: variant.sku || undefined, available: variant.available,
    options: Object.fromEntries(options.flatMap((option) => {
      const value = [variant.option1, variant.option2, variant.option3][option.position - 1];
      return value ? [[option.name, value]] : [];
    })),
  }));
  const description = cleanText(raw.body_html);
  const attributes = (description ?? "").split("\n").flatMap((line) => {
    const match = line.match(/^([^:：]{1,50})[:：]\s*(.+)$/);
    return match ? [{ label: match[1].trim(), value: match[2].trim() }] : [];
  });
  const attribute = (labels: string[]) => attributes.find((entry) => labels.includes(entry.label))?.value;
  const sourceColor = attribute(["اللون", "Color"]);
  if (sourceColor && !colors.includes(sourceColor)) colors.push(sourceColor);
  const sourceSize = attribute(["أبعاد البلاطة", "أبعاد البلاط", "الأبعاد", "Dimensions"]);
  if (sourceSize && !sizes.length) sizes.push(normalizeSize(`${raw.id}-size-description`, sourceSize));
  return {
    id: `${SOURCE_ID}:${raw.id}`,
    slug: `aba-${raw.handle}`,
    name: { ar: raw.title, en: raw.title, fr: raw.title },
    collection: "ceramics",
    brand: raw.vendor || "",
    model: "",
    code: raw.variants.find((variant) => variant.sku)?.sku || undefined,
    description,
    specificationGroups: attributes.length ? [{ title: "المواصفات", attributes }] : undefined,
    origin: attribute(["بلد المنشأ", "Country of origin"]),
    material: attribute(["الخامة", "Material"]),
    type: attribute(["النوع", "Type"]),
    variant: variants[0],
    colors,
    usage: raw.tags,
    sizes,
    options: options.map(({ name, values }) => ({ name, values })),
    variants: structuredVariants,
    image: primary,
    gallery: images,
    source: {
      sourceId: SOURCE_ID,
      provider: "AbaElMozahem Shopify catalogue",
      recordId: String(raw.id),
      originalUrl: SOURCE_URL,
      productPageUrl: `${PRODUCT_BASE_URL}${raw.handle}`,
      extractionTimestamp: new Date().toISOString(),
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
