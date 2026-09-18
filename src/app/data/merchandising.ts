import type { Product, ProductSize } from "./types";

/** Units are inferred only from source text or an explicit source contract. */
export function normalizeSize(id: string, originalSourceValue: string, defaultUnit?: "cm" | "mm"): ProductSize {
  const text = originalSourceValue.trim();
  const comparable = text.replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit))).replace(/٫/g, ".");
  const match = comparable.match(/^(\d+(?:\.\d+)?)\s*[x×*]\s*(\d+(?:\.\d+)?)(?:\s*[x×*]\s*(\d+(?:\.\d+)?))?\s*(cm|mm|سم|مم)?$/i);
  if (!match) return { id, originalSourceValue, normalizedDisplayValue: text, label: text };
  const unit = match[4] ? (/^(cm|سم)$/i.test(match[4]) ? "cm" : "mm") : defaultUnit;
  const dimensions = match.slice(1, 4).filter(Boolean).map(Number);
  const label = dimensions.join(" × ") + (unit ? ` ${unit}` : "");
  const factor = unit === "cm" ? 10 : 1;
  return { id, originalSourceValue, label, normalizedDisplayValue: label, sourceUnit: unit,
    ...(unit ? { widthMm: dimensions[0] * factor, heightMm: dimensions[1] * factor,
      ...(dimensions[2] !== undefined ? { thicknessMm: dimensions[2] * factor } : {}) } : {}) };
}

export function productGallery(product: Product): string[] {
  return [...new Set([product.image, ...(product.gallery ?? [])].filter(Boolean))];
}

export function relatedProducts(product: Product, products: Product[]): Product[] {
  return products.filter((candidate) => candidate.id !== product.id && candidate.approved && candidate.status !== "staged")
    .map((candidate) => ({ candidate, score:
      (product.family && candidate.family === product.family ? 8 : 0) +
      (product.series && candidate.series === product.series && candidate.brand === product.brand ? 6 : 0) +
      (product.brand && candidate.brand === product.brand ? 2 : 0) +
      (candidate.collection === product.collection ? 1 : 0) }))
    .filter(({ score }) => score > 0).sort((a, b) => b.score - a.score)
    .slice(0, 4).map(({ candidate }) => candidate);
}
