/** Stable first-party permalink shared by product cards, detail pages and catalog audits. */
export function productSitePath(slug: string): string {
  return `/product/${encodeURIComponent(slug)}`;
}
