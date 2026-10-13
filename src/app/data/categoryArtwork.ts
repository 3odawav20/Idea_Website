import type { CollectionSlug } from "./types";

/**
 * Category hero assets are intentionally centralised so the final
 * user-selected reference photos can be dropped in without changing the
 * product identity, filters, category routes or responsive card dimensions.
 *
 * Replace null with the verified asset path after the corresponding image
 * has been supplied and reviewed (e.g. "/category-photos/ceramics.webp").
 * Do not add watermarked, text-heavy or unrelated product images.
 */
export const APPROVED_CATEGORY_ARTWORK: Partial<Record<CollectionSlug, string | null>> = {
  ceramics: null,
  porcelain: null,
  tiles: null,
  basins: null,
  bathtubs: null,
};

export function categoryArtwork(slug: CollectionSlug, fallback: string): string {
  return APPROVED_CATEGORY_ARTWORK[slug] || fallback;
}
