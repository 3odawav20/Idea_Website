import type { LocalizedText, Product } from "./types";
export const LOOKS = [
  { id: "stone", image: "stone", label: { en: "Stone look", ar: "تأثير الحجر", fr: "Aspect pierre" } },
  { id: "wood", image: "wood", label: { en: "Wood look", ar: "تأثير الخشب", fr: "Aspect bois" } },
  { id: "marble", image: "marble", label: { en: "Marble look", ar: "تأثير الرخام", fr: "Aspect marbre" } },
  { id: "colour", image: "colour", label: { en: "Colour look", ar: "تأثير الألوان", fr: "Aspect couleur" } },
  { id: "pattern", image: "pattern", label: { en: "Pattern look", ar: "تأثير النقوش", fr: "Aspect motif" } },
] satisfies { id: string; image: string; label: LocalizedText }[];
export const DESTINATIONS = [
  { id: "bathroom", image: "ceramics", label: { en: "Bathroom", ar: "الحمام", fr: "Salle de bain" } },
  { id: "living", image: "porcelain", label: { en: "Living room", ar: "غرفة المعيشة", fr: "Salon" } },
  { id: "kitchen", image: "marble", label: { en: "Kitchen", ar: "المطبخ", fr: "Cuisine" } },
  { id: "bedroom", image: "wood", label: { en: "Bedroom", ar: "غرفة النوم", fr: "Chambre" } },
  { id: "commercial", image: "stone", label: { en: "Commercial", ar: "المساحات التجارية", fr: "Espaces commerciaux" } },
  { id: "pool", image: "colour", label: { en: "Swimming pool", ar: "حمام السباحة", fr: "Piscine" } },
  { id: "outdoor", image: "tiles", label: { en: "Outdoor", ar: "المساحات الخارجية", fr: "Extérieur" } },
] satisfies { id: string; image: string; label: LocalizedText }[];
// Only explicit source fields support catalogue filters. Inspiration is never a certification.
export function isLargeFormat(p: Product) {
  return p.sizes.some(s => s.widthMm && s.heightMm && Math.min(s.widthMm, s.heightMm) >= 600 && Math.max(s.widthMm, s.heightMm) >= 1200);
}
export function isOutdoor20mm(p: Product) {
  return p.sizes.some(s => s.thicknessMm === 20) && (p.usage ?? []).some(u => /^(outdoor|exterior)$/i.test(u));
}
export function matchesApplication(p: Product, value: string) {
  return value === "Floor" ? /floor/i.test(p.application ?? "") : value === "Wall" ? /wall/i.test(p.application ?? "") : p.application === value;
}
export const unique = (values: (string | undefined)[]) => [...new Set(values.filter(Boolean) as string[])].sort((a,b) => a.localeCompare(b));
