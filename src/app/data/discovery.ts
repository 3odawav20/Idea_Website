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
// Some supplier variant/grade values were imported as colours. Do not present
// those as colour choices; retain the original records unchanged.
export function isColourLabel(value: string) {
  const words = value.toLowerCase().replace(/[\/x,\-]/g," ").split(/\s+/).filter(Boolean);
  const allowed = new Set(["beige","black","blue","brown","cafe","celeste","copper","cotto","dark","gold","green","grey","gray","greyish","havan","ivory","light","mauve","multicolor","off","white","offwhite","olive","red","simon","teal","aquamarine","mix"]);
  return words.length > 0 && words.every(word => allowed.has(word)) && words.some(word => !["dark","light","mix","off"].includes(word));
}
export function isUsageLabel(value: string) {
  return /^(bathroom|kitchen|bedroom|living(?: room)?|outdoor(?: - (?:floor|wall))?|indoor|commercial|swimming pool|floor|wall|wall and floor)$/i.test(value.trim());
}
