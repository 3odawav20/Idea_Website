// ── IDEA domain model ─────────────────────────────────────────────────────
// Product fields preserve source truth while allowing normalized commercial
// presentation. Public UI must omit missing fields instead of fabricating data.

export type Locale = "en" | "ar" | "fr";

export type CollectionSlug =
  | "ceramics"
  | "porcelain"
  | "marble"
  | "sanitary-ware"
  | "faucets"
  | "bathroom-sets"
  | "bathroom-units"
  | "bathtubs"
  | "shower-units"
  | "bathroom-accessories"
  | "plumbing-products"
  | "furniture"
  | "lighting"
  | "home-decor";

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

export interface ProductVariant {
  id: string;
  label: string;
  sku?: string;
  available?: boolean;
  image?: string;
  originalSourceValue?: string;
  attributes?: Record<string, string>;
}

export interface ProductSpecificationItem {
  label: string;
  value: string;
  originalSourceValue?: string;
  normalizedValue?: string;
}

export interface ProductSpecificationGroup {
  title: string;
  items: ProductSpecificationItem[];
}

export interface Product {
  id: string;
  slug: string;
  name: LocalizedText;
  collection: CollectionSlug;
  subcategory?: string;
  brand: string;
  series?: string;
  model?: string;
  code?: string; // exact source code only; never generated from an internal ID
  origin?: string; // country of origin
  texture?: string;
  material?: string;
  surface?: string;
  pattern?: string;
  finish?: string;
  type?: string;
  description?: string;
  variant?: string;
  variants?: ProductVariant[];
  usage?: string[];
  application?: string;
  colors?: string[];
  sizes: ProductSize[];
  image: string;
  gallery?: string[];
  family?: string;
  badges?: string[];
  packaging?: string;
  piecesPerBox?: number;
  squareMetersPerBox?: number;
  weight?: string;
  priceText?: string;
  compareAtPriceText?: string;
  currency?: string;
  availability?: string;
  specificationGroups?: ProductSpecificationGroup[];
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
    sourceCategory?: string;
    sourceSubcategory?: string;
    sourceCollection?: string;
    sourceBreadcrumb?: string[];
    sourceProductType?: string;
    sourceVariantStructure?: string[];
    sourceSpecificationGroups?: string[];
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
  approved: boolean;
  status: "sample" | "imported" | "staged";
}

export interface CollectionMeta {
  slug: CollectionSlug;
  title: LocalizedText;
  blurb: LocalizedText;
  image: string;
  group: "ceramics" | "porcelain" | "marble" | "sanitary" | "plumbing" | "furniture" | "lighting" | "decor";
}
