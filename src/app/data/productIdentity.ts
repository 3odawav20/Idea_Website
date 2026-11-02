import type { Product } from "./types";

/**
 * IDEA's numeric identity is NOT the maker's SKU and is NOT evidence of
 * manufacturer identity. Format: two-digit source registry ID + eight-digit
 * immutable numeric source record ID.
 *
 * Other/unverified records require allocation in the authenticated catalogue
 * registry; never guess a code from a title or visual similarity.
 */
export function numericIdeaCode(product: Product): string | null {
  if (product.ideaCode && /^\d{10}$/.test(product.ideaCode)) return product.ideaCode;
  const source = product.source?.sourceId || "";
  const record = String(product.source?.recordId ?? "");
  const match = /^source-(\d{2})$/.exec(source);
  if (!match || !/^\d{1,8}$/.test(record)) return null;
  return match[1] + record.padStart(8, "0");
}

export function documentedManufacturer(product: Product): string | null {
  return product.manufacturerVerified && product.manufacturerName?.trim()
    ? product.manufacturerName.trim()
    : null;
}

/** Only actual tile faces, never ambient rooms, cars, kitchens or villas. */
export function tileFaceReference(product: Product): string | null {
  if (!product.approved || !["ceramics", "porcelain"].includes(product.collection)) return null;
  const face = product.source?.original?.tiles?.find((url) => {
    const filename = url.split("/").pop()?.split("?")[0] || "";
    return /\.(?:png|jpe?g|webp)$/i.test(filename) &&
      /(?:^|[_-])F\d+(?:[_-]|\.)/i.test(filename) &&
      !/(?:amb|bathroom|living|room|villa|kitchen|facade|entrance)/i.test(filename);
  });
  return face || null;
}

export function tilesForArea(
  squareMetres: number,
  widthMm: number,
  heightMm: number,
  wastePercent: number = 10,
): { tiles: number; coveredSqm: number; requestedSqm: number } | null {
  if (![squareMetres, widthMm, heightMm, wastePercent].every(Number.isFinite) ||
      squareMetres <= 0 || widthMm <= 0 || heightMm <= 0 ||
      wastePercent < 0 || wastePercent > 30) return null;
  const tileSqm = (widthMm * heightMm) / 1_000_000;
  const requestedSqm = squareMetres * (1 + wastePercent / 100);
  const tiles = Math.ceil(requestedSqm / tileSqm);
  return { tiles, coveredSqm: tiles * tileSqm, requestedSqm };
}