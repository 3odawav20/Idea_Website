import type { LocalizedText, Product } from "./types";
export const LOOKS = [
  { id: "stone", image: "stone", label: { en: "Stone look", ar: "تأثير الحجر", fr: "Aspect pierre" } },
  { id: "wood", image: "wood", label: { en: "Wood look", ar: "تأثير الخشب", fr: "Aspect bois" } },
  { id: "marble", image: "marble", label: { en: "Marble look", ar: "تأثير الرخام", fr: "Aspect marbre" } },
  { id: "colour", image: "colour", label: { en: "Colour look", ar: "تأثير الألوان", fr: "Aspect couleur" } },
  { id: "pattern", image: "pattern", label: { en: "Pattern look", ar: "تأثير النقوش", fr: "Aspect motif" } },
] satisfies { id: string; image: string; label: LocalizedText }[];
export const DESTINATIONS = [
  {
    id: "bathroom",
    image: "ceramics",
    usageKey: "bathroom",
    kicker: { en: "Bath & Wellness", ar: "حمامات واستجمام", fr: "Bain & bien-être" },
    label: { en: "Luxury Bathroom", ar: "الحمام الفاخر", fr: "Salle de bain de luxe" },
    subtitle: {
      en: "Glazed ceramic walls & serene bath details",
      ar: "سيراميك لامع وتفاصيل استجمام راقية",
      fr: "Céramique émaillée & détails raffinés",
    },
  },
  {
    id: "reception",
    image: "porcelain",
    usageKey: "living room",
    kicker: { en: "Reception & Salon", ar: "صالات واستقبال", fr: "Réception & salon" },
    label: { en: "Grand Reception Hall", ar: "صالة الاستقبال والريسبشن", fr: "Grand salon de réception" },
    subtitle: {
      en: "Expansive marble-effect porcelain slabs",
      ar: "ألواح بورسلين فاخرة للمساحات الواسعة",
      fr: "Grandes dalles en porcelaine effet marbre",
    },
  },
  {
    id: "lobby",
    image: "marble",
    usageKey: "living room",
    kicker: { en: "Grand Spaces", ar: "بهو وصالات مفتوحة", fr: "Grands espaces" },
    label: { en: "Architectural Hall & Lobby", ar: "البهو والصالة المفتوحة", fr: "Hall & lobby architectural" },
    subtitle: {
      en: "Statement marble veining with natural light",
      ar: "أسطح رخامية فاخرة بإطلالة بانورامية",
      fr: "Surfaces marbrées et lumière naturelle",
    },
  },
  {
    id: "living",
    image: "wood",
    usageKey: "living room",
    kicker: { en: "Living Space", ar: "معيشة عائلية", fr: "Espace de vie" },
    label: { en: "Warm Living Room", ar: "غرفة المعيشة", fr: "Salon chaleureux" },
    subtitle: {
      en: "Natural wood-look warmth for everyday living",
      ar: "دفء المظهر الخشبي لمعيشة يومية مريحة",
      fr: "Chaleur de l’aspect bois au quotidien",
    },
  },
  {
    id: "spa-bath",
    image: "stone",
    usageKey: "bathroom",
    kicker: { en: "Spa Sanctuary", ar: "سبا وحجر طبيعي", fr: "Sanctuaire spa" },
    label: { en: "Natural Stone Spa Bath", ar: "حمام سبا بالحجر الطبيعي", fr: "Salle de bain spa en pierre" },
    subtitle: {
      en: "Travertine textures & calm organic finishes",
      ar: "ملمس الحجر الهادئ لأجواء استرخاء طبيعية",
      fr: "Textures travertin & finitions organiques",
    },
  },
  {
    id: "modern-bath",
    image: "colour",
    usageKey: "bathroom",
    kicker: { en: "Contemporary Bath", ar: "تصميم عصري", fr: "Design contemporain" },
    label: { en: "Modern Terrazzo Bathroom", ar: "حمام عصري ومودرن", fr: "Salle de bain contemporaine" },
    subtitle: {
      en: "Expressive colour tiles & terrazzo floors",
      ar: "تناغم الألوان العصرية مع أرضيات الترازو",
      fr: "Carreaux colorés & sols terrazzo",
    },
  },
  {
    id: "outdoor",
    image: "tiles",
    usageKey: "outdoor",
    kicker: { en: "Outdoor Living", ar: "مساحات خارجية", fr: "Extérieur" },
    label: { en: "Outdoor Courtyard & Patio", ar: "التراس والفناء الخارجي", fr: "Patio & cour extérieure" },
    subtitle: {
      en: "Patterned tiles crafted for open-air spaces",
      ar: "بلاطات منقوشة مصممة للمساحات المفتوحة",
      fr: "Carreaux à motifs pour l’extérieur",
    },
  },
] satisfies {
  id: string;
  image: string;
  usageKey: string;
  kicker: LocalizedText;
  label: LocalizedText;
  subtitle: LocalizedText;
}[];
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
