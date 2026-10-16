import type { Product } from "./types";

export interface AdminOverride {
  product_id: string;
  visible: boolean;
  name_en: string;
  brand: string;
  collection: "ceramics" | "porcelain" | "tiles" | "marble";
  image_url: string;
  source_proof_url: string;
  updated_at?: string;
}

export function isValidProductImage(value: string | null | undefined): boolean {
  const path = (value || "").trim();
  return path.startsWith("/images/") || /^https:\/\/[^/\s]+\//i.test(path);
}

export function normalizeAdminOverride(input: Record<string, unknown>): AdminOverride {
  const material = String(input.collection || "");
  return {
    product_id: String(input.product_id || ""),
    visible: input.visible !== false,
    name_en: String(input.name_en || "").trim(),
    brand: String(input.brand || "").trim(),
    collection: (["ceramics", "porcelain", "tiles", "marble"].includes(material)
      ? material : "ceramics") as AdminOverride["collection"],
    image_url: String(input.image_url || "").trim(),
    source_proof_url: String(input.source_proof_url || "").trim(),
    updated_at: String(input.updated_at || ""),
  };
}

/** Preserve immutable product identity and original supplier metadata. */
export function applyAdminOverride(source: Product, data: AdminOverride): Product {
  return {
    ...source,
    name: { ...source.name, en: data.name_en || source.name.en },
    brand: data.brand || source.brand,
    collection: data.collection,
    image: isValidProductImage(data.image_url) ? data.image_url : source.image,
    gallery: isValidProductImage(data.image_url)
      ? [data.image_url, ...(source.gallery || []).filter((value) => value !== data.image_url)]
      : source.gallery,
  };
}
