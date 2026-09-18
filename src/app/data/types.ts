// ── IDEA domain model ─────────────────────────────────────────────────────
// Every product field maps to a source-of-truth value that (in production)
// originates from an approved PDF catalogue import. Public prices are NEVER
// stored here — only private internal tiers on the admin/staging side.

export type Locale = "en" | "ar" | "fr";

export type CollectionSlug =
  | "ceramics"
  | "porcelain"
  | "sanitary-ware"
  | "faucets"
  | "bathroom-sets"
  | "bathroom-units"
  | "bathtubs"
  | "shower-units"
  | "bathroom-accessories";

export interface LocalizedText {
  en: string;
  ar: string;
  fr: string;
}

export interface ProductSize {
  id: string;
  /** Exact immutable source text, e.g. "60x120". */
  originalSourceValue?: string;
  /** Presentation/search value; it never replaces originalSourceValue. */
  normalizedDisplayValue?: string;
  /** Legacy UI alias for normalizedDisplayValue. */
  label: string;
  widthMm?: number;
  heightMm?: number;
  thicknessMm?: number;
  sourceUnit?: "cm" | "mm";
  sourcePage?: number;
}

export interface Product {
  id: string;
  slug: string;
  name: LocalizedText;
  collection: CollectionSlug;
  brand: string;
  model?: string;
  code?: string; // exact source code only; never generated from an internal ID
  origin?: string; // country of origin
  texture?: string; // Marble / Wood / Stone …
  finish?: string; // Matte / Glossy / Semi-Matte …
  type?: string; // Ceramic / Porcelain / Laser Cut …
  description?: string;
  series?: string;
  material?: string;
  surface?: string;
  specificationGroups?: { title: string; attributes: { label: string; value: string }[] }[];
  options?: { name: string; values: string[] }[];
  variants?: { id: string; title: string; sku?: string; available?: boolean; options: Record<string, string> }[];
  featured?: boolean;
  variant?: string; // Light / Dark / Décor / Skirting …
  usage?: string[]; // Kitchen / Bathroom / Facade …
  application?: string; // Wall / Floor / Wall and Floor
  colors?: string[];
  sizes: ProductSize[];
  image: string;
  gallery?: string[];
  family?: string; // collection/family key linking variants
  sourcePdf?: string;
  sourcePage?: number;
  source?: {
    sourceId?: string;
    provider: string;
    recordId: string;
    originalUrl?: string | null;
    productPageUrl?: string | null;
    extractionTimestamp?: string;
    reviewStatus: "source-imported" | "needs-human-review";
    originalSurface?: string;
    original?: {
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
    };
    rawRecord?: unknown;
  };
  approved: boolean; // only approved products render publicly
  status: "sample" | "imported" | "staged";
}

export interface CollectionMeta {
  slug: CollectionSlug;
  title: LocalizedText;
  blurb: LocalizedText;
  image: string;
  group: "ceramics" | "porcelain" | "sanitary";
}
