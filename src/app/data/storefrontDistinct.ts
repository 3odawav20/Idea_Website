import type { Product } from "./types";

/**
 * Public listing policy: show one visible design per brand/manufacturer.
 * Never delete or merge catalogue records. Distinct manufacturers stay separate.
 * Source variants (floor/wall, colourways) remain addressable by exact product links,
 * search and material filters; this only selects cards in storefront grids.
 */
const norm = (value: string) => value.normalize("NFKC").trim().toLocaleLowerCase("en").replace(/\s+/g, " ");

function catalogueMaker(product: Product): string {
  // Verified manufacturer wins. An unverified brand/source is only a catalogue
  // grouping fallback, not a claim that the brand is the physical manufacturer.
  return norm(product.manufacturer || product.brand || product.source?.provider || product.id);
}

function designSeries(product: Product): string {
  if (product.family?.trim()) return norm(product.family);
  let name = norm(product.source?.original?.name || product.name.en || product.model);
  name = name.replace(/\s*[-–—]\s*(?:floor|wall|ground|decoupage)\s*$/i, "").trim();
  const colour = norm(product.source?.original?.color || "");
  if (colour && name.endsWith(" " + colour)) name = name.slice(0, -colour.length - 1).trim();
  return name || norm(product.id);
}

/** A stable key for the *original* image, not a generated or visually guessed resemblance. */
function tileFace(product: Product): string | null {
  const face = product.source?.original?.tiles?.[0]?.trim();
  return face || null;
}

export function distinctStorefrontProducts(products: readonly Product[]): Product[] {
  const seenDesigns = new Set<string>();
  const seenFaces = new Set<string>();
  const visible: Product[] = [];

  for (const product of products) {
    const owner = catalogueMaker(product);
    const prefix = [owner, product.collection].join("|");
    const designKey = prefix + "|design|" + designSeries(product);
    const face = tileFace(product);
    const faceKey = face ? prefix + "|face|" + face : null;
    if (seenDesigns.has(designKey) || (faceKey && seenFaces.has(faceKey))) continue;
    seenDesigns.add(designKey);
    if (faceKey) seenFaces.add(faceKey);
    visible.push(product);
  }
  return visible;
}
