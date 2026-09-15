import type { Product } from "./types";
import artceramic from "./artceramic.json";

interface RawArtCeramicProduct {
  id: string;
  slug: string;
  name: string;
  color: string | null;
  colorCategory: string | null;
  size: string;
  texture: string;
  types: string[];
  featured: boolean;
  image: string;
  tiles: string[];
}

const SOURCE_PROVIDER = "Art Ceramic catalogue export";
const SOURCE_ID = "source-20";
const EXTRACTION_TIMESTAMP = "2026-09-15T00:00:00.000Z";

function titleCase(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function finishFromSource(value: string) {
  const finish = value.split("/").map((part) => part.trim()).find((part) => /^(matt|matte|glossy)$/i.test(part));
  return finish ? (finish.toLowerCase() === "matt" ? "Matte" : titleCase(finish)) : undefined;
}

function applicationFromSource(types: string[]) {
  const wall = types.some((value) => /wall/i.test(value));
  const floor = types.some((value) => /floor/i.test(value));
  if (wall && floor) return "Wall and Floor";
  if (wall) return "Wall";
  if (floor) return "Floor";
  return undefined;
}

function sizeFromSource(id: string, rawSize: string): Product["sizes"][number] {
  const compact = rawSize.replace(/\s+/g, "");
  const match = compact.match(/^(\d+(?:\.\d+)?)x(\d+(?:\.\d+)?)(?:cm)?$/i);
  if (!match) return {
    id: `${id}-size-1`,
    originalSourceValue: rawSize,
    normalizedDisplayValue: rawSize.trim(),
    label: rawSize.trim(),
  };

  const widthCm = Number(match[1]);
  const heightCm = Number(match[2]);
  return {
    id: `${id}-size-1`,
    originalSourceValue: rawSize,
    normalizedDisplayValue: `${widthCm} × ${heightCm} cm`,
    label: `${widthCm} × ${heightCm} cm`,
    widthMm: Math.round(widthCm * 10),
    heightMm: Math.round(heightCm * 10),
    sourceUnit: "cm",
  };
}

function cleanGallery(image: string, tiles: string[]) {
  return [...new Set([image, ...tiles].filter(Boolean))];
}

/**
 * Normalizes only values present in the Art Ceramic source export. Fields the
 * export does not contain (product code, origin, certified material type and
 * translations) remain unset rather than being fabricated for the storefront.
 */
function mapProduct(source: RawArtCeramicProduct): Product {
  const colors = [...new Set([source.color, source.colorCategory].filter(Boolean) as string[])]
    .map(titleCase);
  const usage = [...new Set(source.types.filter(Boolean).map(titleCase))];
  const gallery = cleanGallery(source.image, source.tiles);

  return {
    id: source.id,
    slug: source.slug,
    name: { en: source.name, ar: source.name, fr: source.name },
    collection: "ceramics",
    // Catalogue-level affiliation only; the export has no per-record brand/model fields.
    brand: "Art Ceramic",
    finish: finishFromSource(source.texture),
    variant: source.color ?? undefined,
    usage,
    application: applicationFromSource(usage),
    colors,
    sizes: [sizeFromSource(source.id, source.size)],
    image: source.image,
    gallery,
    source: {
      sourceId: SOURCE_ID,
      provider: SOURCE_PROVIDER,
      recordId: source.id,
      originalUrl: "https://share.google/mfxy31a2wo5I8Zd3a",
      productPageUrl: null,
      extractionTimestamp: EXTRACTION_TIMESTAMP,
      reviewStatus: "needs-human-review",
      originalSurface: source.texture,
      original: {
        id: source.id,
        slug: source.slug,
        name: source.name,
        color: source.color,
        colorCategory: source.colorCategory,
        size: source.size,
        texture: source.texture,
        types: [...source.types],
        featured: source.featured,
        image: source.image,
        tiles: [...source.tiles],
      },
    },
    approved: true,
    status: "imported",
  };
}

export const ART_CERAMIC_PRODUCTS: Product[] = (artceramic as RawArtCeramicProduct[])
  .filter((record) => Boolean(record.image && record.size && record.name))
  .map(mapProduct)
  .sort((a, b) => a.name.en.localeCompare(b.name.en) || a.id.localeCompare(b.id));

/**
 * Read-only catalogue metadata for storefront summaries and future database
 * migration. Counts derive directly from the normalized source records.
 */
export const ART_CERAMIC_CATALOGUE = {
  provider: SOURCE_PROVIDER,
  totalProducts: ART_CERAMIC_PRODUCTS.length,
  totalImages: ART_CERAMIC_PRODUCTS.reduce((total, product) => total + (product.gallery?.length ?? 1), 0),
  sizes: [...new Set(ART_CERAMIC_PRODUCTS.flatMap((product) => product.sizes.map((size) => size.label)))],
  colors: [...new Set(ART_CERAMIC_PRODUCTS.flatMap((product) => product.colors ?? []))],
  usage: [...new Set(ART_CERAMIC_PRODUCTS.flatMap((product) => product.usage ?? []))],
} as const;
