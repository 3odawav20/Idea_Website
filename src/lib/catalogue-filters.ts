import type { CollectionSlug, Locale, Product } from "../app/data/types";
import {
  isColourLabel,
  isLargeFormat,
  isOutdoor20mm,
  isUsageLabel,
  matchesApplication,
} from "../app/data/discovery";

export type MaterialCategoryKey = "all" | "ceramics" | "tiles" | "porcelain" | "marble";
export type SurfaceLookKey = "marble-look" | "wood-look" | "stone-look" | "mosaic-pattern";
export type ColorFamilyKey =
  | "grey"
  | "beige"
  | "white"
  | "brown"
  | "black"
  | "blue"
  | "green"
  | "terracotta";

export interface FilterOption<T extends string = string> {
  key: T;
  label: Record<Locale, string>;
  count: number;
  swatch?: string;
}

export const MATERIAL_CATEGORY_OPTIONS: {
  key: MaterialCategoryKey;
  label: Record<Locale, string>;
}[] = [
  { key: "all", label: { en: "All Materials", ar: "كل الخامات", fr: "Tous les matériaux" } },
  { key: "ceramics", label: { en: "Ceramics", ar: "سيراميك", fr: "Céramique" } },
  { key: "porcelain", label: { en: "Porcelain", ar: "بورسلين", fr: "Porcelaine" } },
  { key: "tiles", label: { en: "Tiles", ar: "بلاط", fr: "Carrelage" } },
  { key: "marble", label: { en: "Marble", ar: "رخام", fr: "Marbre" } },
];

export const SURFACE_LOOK_OPTIONS: {
  key: SurfaceLookKey;
  label: Record<Locale, string>;
  pattern: RegExp;
}[] = [
  {
    key: "marble-look",
    label: { en: "Marble Look", ar: "تأثير الرخام", fr: "Aspect Marbre" },
    pattern:
      /\b(marble|calacatta|carrara|statuario|onyx|travertin\w*|marfil|crema|emperador|venato|marmo|arabescato|alpino)\b/i,
  },
  {
    key: "wood-look",
    label: { en: "Wood Look", ar: "تأثير الخشب", fr: "Aspect Bois" },
    pattern:
      /\b(wood|oak|walnut|cedar|timber|plank|parquet|teak|pine|bamboo|acacia|forest|chestnut|mahogany)\b/i,
  },
  {
    key: "stone-look",
    label: { en: "Stone & Cement", ar: "حجر وإسمنت", fr: "Pierre & Ciment" },
    pattern:
      /\b(stone|sandstone|slate|granite|basalt|quartz|concrete|cement|cemento|rock|canyon|lava|cliff|terrazzo|pebble|terra|soil|mineral)\b/i,
  },
  {
    key: "mosaic-pattern",
    label: { en: "Mosaic & Decor", ar: "موزاييك وزخرفي", fr: "Mosaïque & Décor" },
    pattern:
      /\b(mosaic|decor|décor|geometric|hex|chevron|floral|vintage|moroccan|patchwork|wave|fluted|trapeze)\b/i,
  },
];

export const COLOR_FAMILY_OPTIONS: {
  key: ColorFamilyKey;
  label: Record<Locale, string>;
  swatch: string;
  pattern: RegExp;
}[] = [
  {
    key: "grey",
    label: { en: "Grey", ar: "رمادي", fr: "Gris" },
    swatch: "#8e9399",
    pattern: /\b(grey|gray|greyish)\b/i,
  },
  {
    key: "beige",
    label: { en: "Beige", ar: "بيج", fr: "Beige" },
    swatch: "#d4c3a3",
    pattern: /\b(beige|cream|crema|sand)\b/i,
  },
  {
    key: "white",
    label: { en: "White & Ivory", ar: "أبيض وعاجي", fr: "Blanc & Ivoire" },
    swatch: "#f0eee9",
    pattern: /\b(white|offwhite|off\s+white|ivory)\b/i,
  },
  {
    key: "brown",
    label: { en: "Brown & Cafe", ar: "بني وكافيه", fr: "Marron & Café" },
    swatch: "#7b5a42",
    pattern: /\b(brown|cafe|walnut|havan)\b/i,
  },
  {
    key: "black",
    label: { en: "Black", ar: "أسود", fr: "Noir" },
    swatch: "#232529",
    pattern: /\b(black)\b/i,
  },
  {
    key: "blue",
    label: { en: "Blue & Teal", ar: "أزرق وبترولي", fr: "Bleu & Sarcelle" },
    swatch: "#3e7898",
    pattern: /\b(blue|celeste|teal|aquamarine)\b/i,
  },
  {
    key: "green",
    label: { en: "Green", ar: "أخضر", fr: "Vert" },
    swatch: "#4e7a5b",
    pattern: /\b(green|olive)\b/i,
  },
  {
    key: "terracotta",
    label: { en: "Red & Cotto", ar: "أحمر وتيراكوتا", fr: "Rouge & Cotto" },
    swatch: "#a85644",
    pattern: /\b(red|cotto|copper|mauve)\b/i,
  },
];

const SURFACE_SPEC_LABELS: Record<string, Record<Locale, string>> = {
  nature: { en: "Nature", ar: "طبيعي", fr: "Nature" },
  "high resistance": { en: "High Resistance", ar: "مقاومة عالية", fr: "Haute résistance" },
  "anti slip": { en: "Anti-Slip", ar: "مانع للانزلاق", fr: "Antidérapant" },
};

const USAGE_LABELS: Record<string, Record<Locale, string>> = {
  wall: { en: "Wall", ar: "حوائط", fr: "Mur" },
  floor: { en: "Floor", ar: "أرضيات", fr: "Sol" },
  "wall and floor": { en: "Wall & Floor", ar: "حوائط وأرضيات", fr: "Mur & Sol" },
  bathroom: { en: "Bathroom", ar: "حمام", fr: "Salle de bain" },
  kitchen: { en: "Kitchen", ar: "مطبخ", fr: "Cuisine" },
  "outdoor - floor": { en: "Outdoor Floor", ar: "أرضيات خارجية", fr: "Sol extérieur" },
  "outdoor - wall": { en: "Outdoor Wall", ar: "حوائط خارجية", fr: "Mur extérieur" },
  outdoor: { en: "Outdoor", ar: "خارجي", fr: "Extérieur" },
  "living room": { en: "Living Room", ar: "معيشة", fr: "Salon" },
  bedroom: { en: "Bedroom", ar: "غرفة نوم", fr: "Chambre" },
};

export function localizeSurfaceSpec(value: string, locale: Locale): string {
  const mapped = SURFACE_SPEC_LABELS[value.trim().toLowerCase()];
  return mapped ? mapped[locale] : value;
}

export function localizeUsage(value: string, locale: Locale): string {
  const mapped = USAGE_LABELS[value.trim().toLowerCase()];
  return mapped ? mapped[locale] : value;
}

export function localizeApplication(value: string, locale: Locale): string {
  const normalized = value.trim().toLowerCase();
  if (normalized === "wall") return locale === "ar" ? "حوائط" : locale === "fr" ? "Murs" : "Wall";
  if (normalized === "floor") return locale === "ar" ? "أرضيات" : locale === "fr" ? "Sols" : "Floor";
  if (normalized === "wall and floor") {
    return locale === "ar" ? "حوائط وأرضيات" : locale === "fr" ? "Murs & Sols" : "Wall & Floor";
  }
  return value;
}

export function extractSurfaceSpecs(product: Product): string[] {
  const raw = product.source?.originalSurface ?? "";
  if (!raw) return [];
  return raw
    .split("/")
    .map((part) => part.trim())
    .filter((part) => Boolean(part) && !/^(matt|matte|glossy)$/i.test(part));
}

export function matchesMaterialCategory(
  product: Product,
  categoryKey: MaterialCategoryKey | string | null | undefined,
): boolean {
  if (!categoryKey || categoryKey === "all") return true;
  if (categoryKey === "ceramics") {
    return product.collection === "ceramics" || product.type?.toLowerCase() === "ceramic";
  }
  if (categoryKey === "porcelain") {
    return product.collection === "porcelain" || product.type?.toLowerCase() === "porcelain";
  }
  if (categoryKey === "tiles") {
    return product.collection === "ceramics" || product.collection === "porcelain";
  }
  if (categoryKey === "marble") {
    return (
      product.collection === "marble" ||
      product.texture?.toLowerCase() === "marble" ||
      product.type?.toLowerCase() === "marble"
    );
  }
  return product.collection === (categoryKey as CollectionSlug);
}

export function matchesSurfaceLook(product: Product, lookKey: SurfaceLookKey | string): boolean {
  const entry = SURFACE_LOOK_OPTIONS.find((item) => item.key === lookKey);
  if (!entry) return false;
  const hay = [product.name.en, product.texture, product.type].filter(Boolean).join(" ");
  return entry.pattern.test(hay);
}

export function matchesColorFamily(product: Product, colorKey: string): boolean {
  const normalized = colorKey.trim().toLowerCase();
  const entry = COLOR_FAMILY_OPTIONS.find((item) => item.key === normalized);
  const validColors = (product.colors ?? []).filter(isColourLabel);
  if (entry) {
    return validColors.some((color) => entry.pattern.test(color));
  }
  return validColors.some((color) => color.toLowerCase() === normalized);
}

export function matchesSurfaceSpec(product: Product, spec: string): boolean {
  const target = spec.trim().toLowerCase();
  return extractSurfaceSpecs(product).some((item) => item.toLowerCase() === target);
}

export interface CatalogueFilterState {
  category: string | null;
  material: string | null;
  look: string | null;
  surface: string | null;
  format: string | null;
  finish: string | null;
  application: string | null;
  size: string | null;
  usage: string | null;
  color: string | null;
  brand: string | null;
  type: string | null;
  texture: string | null;
}

export function resolveActiveMaterialCategory(
  category: string | null,
  material: string | null,
): MaterialCategoryKey {
  if (material === "tiles") return "tiles";
  if (material === "marble") return "marble";
  if (category === "ceramics" || category === "porcelain" || category === "marble") {
    return category;
  }
  return "all";
}

export function filterCatalogueProduct(product: Product, filters: CatalogueFilterState): boolean {
  if (filters.category && !matchesMaterialCategory(product, filters.category)) return false;
  if (filters.material && !matchesMaterialCategory(product, filters.material)) return false;
  if (filters.format === "large" && !isLargeFormat(product)) return false;
  if (filters.format === "outdoor20" && !isOutdoor20mm(product)) return false;
  if (filters.look && !matchesSurfaceLook(product, filters.look)) return false;
  if (filters.surface && !matchesSurfaceSpec(product, filters.surface)) return false;
  if (filters.application && !matchesApplication(product, filters.application)) return false;
  if (filters.finish && product.finish !== filters.finish) return false;
  if (filters.size && !product.sizes.some((item) => item.label === filters.size)) return false;
  if (filters.usage && !(product.usage ?? []).includes(filters.usage)) return false;
  if (filters.color && !matchesColorFamily(product, filters.color)) return false;
  if (filters.brand && product.brand !== filters.brand) return false;
  if (filters.type && product.type !== filters.type) return false;
  if (filters.texture && product.texture !== filters.texture) return false;
  return true;
}

export function buildSidebarFacets(distinctAllProducts: Product[], distinctScopedProducts: Product[]) {
  const materialCategories: FilterOption<MaterialCategoryKey>[] = MATERIAL_CATEGORY_OPTIONS.map(
    (option) => ({
      key: option.key,
      label: option.label,
      count:
        option.key === "all"
          ? distinctAllProducts.length
          : distinctAllProducts.filter((product) => matchesMaterialCategory(product, option.key))
              .length,
    }),
  );

  const surfaceLooks: FilterOption<SurfaceLookKey>[] = SURFACE_LOOK_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    count: distinctScopedProducts.filter((product) => matchesSurfaceLook(product, option.key))
      .length,
  })).filter((option) => option.count > 0);

  const countMap = (values: string[]) => {
    const counts = new Map<string, number>();
    for (const value of values) {
      if (!value) continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
    return [...counts.entries()].sort((a, b) => b[1] - a[1]);
  };

  const finishes = countMap(
    distinctScopedProducts.map((p) => p.finish).filter((v): v is string => Boolean(v)),
  );
  const surfaceSpecs = countMap(distinctScopedProducts.flatMap((p) => extractSurfaceSpecs(p)));
  const applications = countMap(
    distinctScopedProducts.map((p) => p.application).filter((v): v is string => Boolean(v)),
  );
  const sizes = countMap(
    distinctScopedProducts.flatMap((p) => [...new Set(p.sizes.map((s) => s.label))]),
  );
  const usages = countMap(
    distinctScopedProducts.flatMap((p) =>
      [...new Set((p.usage ?? []).filter(isUsageLabel))],
    ),
  );
  const brands = countMap(
    distinctScopedProducts.map((p) => p.brand).filter((v): v is string => Boolean(v)),
  );
  const colors: FilterOption<ColorFamilyKey>[] = COLOR_FAMILY_OPTIONS.map((option) => ({
    key: option.key,
    label: option.label,
    swatch: option.swatch,
    count: distinctScopedProducts.filter((product) => matchesColorFamily(product, option.key))
      .length,
  })).filter((option) => option.count > 0);

  const largeFormatCount = distinctScopedProducts.filter(isLargeFormat).length;

  return {
    materialCategories,
    surfaceLooks,
    finishes,
    surfaceSpecs,
    applications,
    sizes,
    usages,
    brands,
    colors,
    largeFormatCount,
  };
}
