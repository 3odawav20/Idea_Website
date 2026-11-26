import { useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { Link, useSearchParams } from "react-router";
import {
  ArrowRight,
  FileText,
  GitCompare,
  Heart,
  LayoutGrid,
  List,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
} from "lucide-react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { CollectionSlug, Locale, Product } from "../data/types";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { ART_CERAMIC_CATALOGUE } from "../data/artceramicImport";
import { ProductCard } from "../components/ProductCard";
import { distinctStorefrontProducts } from "../data/storefrontDistinct";
import { ideaInternalCode, productMaker } from "../data/ideaProductIdentity";
import { similarProducts } from "../data/recommendations";
import { localMaterialFace } from "../data/localMaterialFace";
import { Chip, Container, Section } from "../components/ui";
import "../components/Discovery.css";
import { isLargeFormat, isOutdoor20mm, matchesApplication, isColourLabel, isUsageLabel } from "../data/discovery";
import "./Products.css";

function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// ─── 3D Material Sphere Orb Renderer ──────────────────────────────────────────

function renderMaterialSphere(img: HTMLImageElement, canvas: HTMLCanvasElement): boolean {
  if (!img.naturalWidth || !img.naturalHeight) return false;
  const size = 384;
  const texW = 512;
  const texH = 256;
  const offscreen = document.createElement("canvas");
  offscreen.width = texW;
  offscreen.height = texH;
  const offCtx = offscreen.getContext("2d", { willReadFrequently: true });
  const ctx = canvas.getContext("2d");
  if (!offCtx || !ctx) return false;

  const scale = Math.max(texW / img.naturalWidth, texH / img.naturalHeight);
  const drawW = img.naturalWidth * scale;
  const drawH = img.naturalHeight * scale;
  offCtx.clearRect(0, 0, texW, texH);
  offCtx.drawImage(img, (texW - drawW) / 2, (texH - drawH) / 2, drawW, drawH);

  const srcData = offCtx.getImageData(0, 0, texW, texH);
  const dstData = ctx.createImageData(size, size);

  const lLen = Math.hypot(-0.42, 0.62, 0.66);
  const lx = -0.42 / lLen;
  const ly = 0.62 / lLen;
  const lz = 0.66 / lLen;
  const hLen = Math.hypot(lx, ly, lz + 1);
  const hx = lx / hLen;
  const hy = ly / hLen;
  const hz = (lz + 1) / hLen;

  for (let y = 0; y < size; y += 1) {
    const ny = 1 - ((y + 0.5) / size) * 2;
    for (let x = 0; x < size; x += 1) {
      const nx = ((x + 0.5) / size) * 2 - 1;
      const r2 = nx * nx + ny * ny;
      if (r2 > 1) continue;
      const nz = Math.sqrt(1 - r2);
      const u = 0.5 + Math.atan2(nx, nz) / (Math.PI * 2);
      const v = 0.5 - Math.asin(ny) / Math.PI;
      const tx = ((Math.floor(u * texW) % texW) + texW) % texW;
      const ty = Math.min(texH - 1, Math.max(0, Math.floor(v * texH)));
      const srcIdx = (ty * texW + tx) * 4;
      const dstIdx = (y * size + x) * 4;

      const diff = Math.max(0, nx * lx + ny * ly + nz * lz);
      const spec = Math.pow(Math.max(0, nx * hx + ny * hy + nz * hz), 48) * 0.22;
      const fresnel = Math.pow(1 - nz, 2.2);
      const shade = (0.56 + diff * 0.48) * (1 - fresnel * 0.1) - fresnel * 0.055;
      const edgeAlpha = Math.min(1, Math.max(0, (1 - Math.sqrt(r2)) * (size / 2)));
      const alpha = (srcData.data[srcIdx + 3] / 255) * edgeAlpha;

      dstData.data[dstIdx] = Math.min(255, srcData.data[srcIdx] * shade + 255 * spec);
      dstData.data[dstIdx + 1] = Math.min(255, srcData.data[srcIdx + 1] * shade + 255 * spec);
      dstData.data[dstIdx + 2] = Math.min(255, srcData.data[srcIdx + 2] * shade + 255 * spec);
      dstData.data[dstIdx + 3] = Math.round(alpha * 255);
    }
  }

  canvas.width = size;
  canvas.height = size;
  ctx.clearRect(0, 0, size, size);
  ctx.putImageData(dstData, 0, 0);
  return true;
}

export function MaterialOrb({
  src,
  alt,
  className = "",
  loading = "lazy",
}: {
  src: string;
  alt: string;
  className?: string;
  loading?: "lazy" | "eager";
}) {
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [rendered, setRendered] = useState(false);

  useEffect(() => {
    const img = imgRef.current;
    const canvas = canvasRef.current;
    if (!img || !canvas) return;
    let cancelled = false;
    setRendered(false);

    const handleLoad = () => {
      if (cancelled || !img.complete || !img.naturalWidth) return;
      try {
        const ok = renderMaterialSphere(img, canvas);
        if (!cancelled) setRendered(ok);
      } catch {
        if (!cancelled) setRendered(false);
      }
    };
    const handleError = () => {
      if (!cancelled) setRendered(false);
    };

    img.addEventListener("load", handleLoad);
    img.addEventListener("error", handleError);
    if (img.complete && img.naturalWidth) handleLoad();
    return () => {
      cancelled = true;
      img.removeEventListener("load", handleLoad);
      img.removeEventListener("error", handleError);
    };
  }, [src]);

  return (
    <span className={`idea-material-sphere-render ${className}`} data-rendered={rendered ? "true" : "false"}>
      <img ref={imgRef} src={src} alt={alt} loading={loading} decoding="async" />
      <canvas aria-hidden="true" ref={canvasRef} />
    </span>
  );
}

// ─── Interactive Translucent 3D GlareCard ────────────────────────────────────

const DEFAULT_GLARE = {
  glare: { x: 50, y: 50 },
  background: { x: 50, y: 50 },
  rotate: { x: 0, y: 0 },
};

function clamp(val: number, min: number, max: number) {
  return Math.min(max, Math.max(min, val));
}

function computeGlareTransform(clientX: number, clientY: number, rect: DOMRect, factor = 0.4) {
  if (rect.width <= 0 || rect.height <= 0) {
    return {
      glare: { ...DEFAULT_GLARE.glare },
      background: { ...DEFAULT_GLARE.background },
      rotate: { ...DEFAULT_GLARE.rotate },
    };
  }
  const rel = { x: clientX - rect.left, y: clientY - rect.top };
  const pct = {
    x: clamp((100 / rect.width) * rel.x, 0, 100),
    y: clamp((100 / rect.height) * rel.y, 0, 100),
  };
  const delta = { x: pct.x - 50, y: pct.y - 50 };
  return {
    background: {
      x: 50 + pct.x / 4 - 12.5,
      y: 50 + pct.y / 3 - 16.67,
    },
    rotate: {
      x: -(delta.x / 3.5) * factor,
      y: (delta.y / 2) * factor,
    },
    glare: { x: pct.x, y: pct.y },
  };
}

export function GlareCard({
  children,
  className,
  containerClassName,
  radius = "48px",
  translucent = false,
  "data-testid": testId,
}: {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  radius?: string;
  translucent?: boolean;
  "data-testid"?: string;
}) {
  const isPointerInside = useRef(false);
  const timeoutRef = useRef<number | null>(null);
  const refElement = useRef<HTMLDivElement>(null);
  const state = useRef({
    glare: { ...DEFAULT_GLARE.glare },
    background: { ...DEFAULT_GLARE.background },
    rotate: { ...DEFAULT_GLARE.rotate },
  });

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
    };
  }, []);

  const containerStyle = {
    "--m-x": "50%",
    "--m-y": "50%",
    "--r-x": "0deg",
    "--r-y": "0deg",
    "--bg-x": "50%",
    "--bg-y": "50%",
    "--duration": "300ms",
    "--delay": "0s",
    "--foil-size": "100%",
    "--opacity": "0",
    "--radius": radius,
    "--easing": "ease",
    "--transition": "var(--duration) var(--easing)",
  } as CSSProperties;

  const backgroundStyle = {
    "--step": "5%",
    "--foil-svg": `url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.99994 3.419C2.99994 3.419 21.6142 7.43646 22.7921 12.153C23.97 16.8695 3.41838 23.0306 3.41838 23.0306' stroke='white' stroke-width='5' stroke-miterlimit='3.86874' stroke-linecap='round' style='mix-blend-mode:darken'/%3E%3C/svg%3E")`,
    "--pattern": "var(--foil-svg) center/100% no-repeat",
    "--rainbow":
      "repeating-linear-gradient( 0deg,rgb(255,119,115) calc(var(--step) * 1),rgba(255,237,95,1) calc(var(--step) * 2),rgba(168,255,95,1) calc(var(--step) * 3),rgba(131,255,247,1) calc(var(--step) * 4),rgba(120,148,255,1) calc(var(--step) * 5),rgb(216,117,255) calc(var(--step) * 6),rgb(255,119,115) calc(var(--step) * 7) ) 0% var(--bg-y)/200% 700% no-repeat",
    "--diagonal":
      "repeating-linear-gradient( 128deg,#0e152e 0%,hsl(180,10%,60%) 3.8%,hsl(180,10%,60%) 4.5%,hsl(180,10%,60%) 5.2%,#0e152e 10%,#0e152e 12% ) var(--bg-x) var(--bg-y)/300% no-repeat",
    "--shade":
      "radial-gradient( farthest-corner circle at var(--m-x) var(--m-y),rgba(255,255,255,0.1) 12%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0.25) 120% ) var(--bg-x) var(--bg-y)/300% no-repeat",
    backgroundBlendMode: "hue, hue, hue, overlay",
  } as CSSProperties;

  const updateStyles = () => {
    if (refElement.current) {
      const { background, rotate, glare } = state.current;
      refElement.current.style.setProperty("--m-x", `${glare.x}%`);
      refElement.current.style.setProperty("--m-y", `${glare.y}%`);
      refElement.current.style.setProperty("--r-x", `${rotate.x}deg`);
      refElement.current.style.setProperty("--r-y", `${rotate.y}deg`);
      refElement.current.style.setProperty("--bg-x", `${background.x}%`);
      refElement.current.style.setProperty("--bg-y", `${background.y}%`);
    }
  };

  return (
    <div
      style={containerStyle}
      data-testid={testId ?? "glare-card"}
      className={cn(
        "relative isolate [contain:layout_style] [perspective:600px] transition-transform duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] will-change-transform w-[320px] max-w-full [aspect-ratio:17/21]",
        containerClassName
      )}
      ref={refElement}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        state.current = computeGlareTransform(event.clientX, event.clientY, rect, translucent ? 0.25 : 0.4);
        updateStyles();
      }}
      onPointerEnter={() => {
        isPointerInside.current = true;
        if (timeoutRef.current !== null) window.clearTimeout(timeoutRef.current);
        if (refElement.current) {
          timeoutRef.current = window.setTimeout(() => {
            if (isPointerInside.current) {
              refElement.current?.style.setProperty("--duration", "0s");
            }
          }, 300);
        }
      }}
      onPointerLeave={() => {
        isPointerInside.current = false;
        if (timeoutRef.current !== null) {
          window.clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        if (refElement.current) {
          refElement.current.style.removeProperty("--duration");
          refElement.current.style.setProperty("--r-x", "0deg");
          refElement.current.style.setProperty("--r-y", "0deg");
        }
      }}
    >
      <div
        className={cn(
          "h-full grid will-change-transform origin-center transition-transform duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] [transform:rotateY(var(--r-x))_rotateX(var(--r-y))] rounded-[var(--radius)] border overflow-hidden hover:[--duration:200ms] hover:[--easing:linear] hover:filter-none",
          translucent
            ? "idea-glare-glass-shell relative isolate border-white/15 hover:border-white/30 hover:[--opacity:0.9] focus-within:[--opacity:0.9] shadow-[0_16px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-slate-800 hover:[--opacity:0.6] focus-within:[--opacity:0.6]"
        )}
      >
        {translucent ? (
          <>
            <div
              aria-hidden="true"
              data-glare-layer="glass-base"
              className="idea-glare-glass-base pointer-events-none w-full h-full [grid-area:1/1] z-0 [clip-path:inset(0_0_0_0_round_var(--radius))]"
            />
            <div
              aria-hidden="true"
              data-glare-layer="surface-glare"
              className="pointer-events-none w-full h-full grid [grid-area:1/1] z-[1] [clip-path:inset(0_0_1px_0_round_var(--radius))] opacity-[var(--opacity)] transition-opacity duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] will-change-[background] [background:radial-gradient(farthest-corner_circle_at_var(--m-x)_var(--m-y),_rgba(255,253,248,0.34)_0%,_rgba(255,250,242,0.16)_24%,_rgba(255,255,255,0.04)_52%,_transparent_80%)]"
            />
            <div
              aria-hidden="true"
              data-glare-layer="surface-sheen"
              className="pointer-events-none w-full h-full grid [grid-area:1/1] z-[2] opacity-[var(--opacity)] will-change-[background-position] transition-opacity duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] [clip-path:inset(0_0_1px_0_round_var(--radius))] [background:linear-gradient(122deg,_transparent_24%,_rgba(255,252,246,0.05)_38%,_rgba(255,255,255,0.24)_49%,_rgba(255,248,236,0.06)_58%,_transparent_74%)] [background-size:240%_240%] [background-position:var(--bg-x)_var(--bg-y)]"
            />
            <div
              data-glare-content="above"
              className="relative z-[10] isolate w-full h-full grid [grid-area:1/1] [clip-path:inset(0_0_0_0_round_var(--radius))]"
            >
              <div className={cn("relative h-full w-full bg-transparent", className)}>{children}</div>
            </div>
          </>
        ) : (
          <>
            <div className="w-full h-full grid [grid-area:1/1] mix-blend-soft-light [clip-path:inset(0_0_0_0_round_var(--radius))]">
              <div className={cn("relative h-full w-full bg-slate-950", className)}>{children}</div>
            </div>
            <div className="pointer-events-none w-full h-full grid [grid-area:1/1] mix-blend-soft-light [clip-path:inset(0_0_1px_0_round_var(--radius))] opacity-[var(--opacity)] transition-opacity duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] will-change-[background] [background:radial-gradient(farthest-corner_circle_at_var(--m-x)_var(--m-y),_rgba(255,255,255,0.8)_10%,_rgba(255,255,255,0.65)_20%,_rgba(255,255,255,0)_90%)]" />
            <div
              className="pointer-events-none w-full h-full grid [grid-area:1/1] mix-blend-color-dodge opacity-[var(--opacity)] will-change-[background] transition-opacity [clip-path:inset(0_0_1px_0_round_var(--radius))] [background:var(--pattern),_var(--rainbow),_var(--diagonal),_var(--shade)] relative after:content-[''] after:[grid-area:inherit] after:[background-repeat:inherit] after:[background-attachment:inherit] after:[background-origin:inherit] after:[background-clip:inherit] after:[background:inherit] after:mix-blend-exclusion after:[background-size:var(--foil-size),_200%_400%,_800%,_200%] after:[background-position:center,_0%_var(--bg-y),_calc(var(--bg-x)*_-1)_calc(var(--bg-y)*_-1),_var(--bg-x)_var(--bg-y)] after:[background-blend-mode:soft-light,_hue,_hard-light]"
              style={backgroundStyle}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Material Catalogue Taxonomies & Facets ──────────────────────────────────

const MATERIAL_CATEGORIES = [
  { key: "all", label: { en: "All Materials", ar: "كل الخامات", fr: "Tous les matériaux" } },
  { key: "ceramics", label: { en: "Ceramics", ar: "سيراميك", fr: "Céramique" } },
  { key: "porcelain", label: { en: "Porcelain", ar: "بورسلين", fr: "Porcelaine" } },
  { key: "tiles", label: { en: "Tiles", ar: "بلاط", fr: "Carrelage" } },
  { key: "marble", label: { en: "Marble", ar: "رخام", fr: "Marbre" } },
] as const;

const SURFACE_LOOKS = [
  {
    key: "marble-look",
    label: { en: "Marble Look", ar: "تأثير الرخام", fr: "Aspect Marbre" },
    pattern: /\b(marble|calacatta|carrara|statuario|onyx|travertin\w*|marfil|crema|emperador|venato|marmo|arabescato|alpino)\b/i,
  },
  {
    key: "wood-look",
    label: { en: "Wood Look", ar: "تأثير الخشب", fr: "Aspect Bois" },
    pattern: /\b(wood|oak|walnut|cedar|timber|plank|parquet|teak|pine|bamboo|acacia|forest|chestnut|mahogany)\b/i,
  },
  {
    key: "stone-look",
    label: { en: "Stone & Cement", ar: "حجر وإسمنت", fr: "Pierre & Ciment" },
    pattern: /\b(stone|sandstone|slate|granite|basalt|quartz|concrete|cement|cemento|rock|canyon|lava|cliff|terrazzo|pebble|terra|soil|mineral)\b/i,
  },
  {
    key: "mosaic-pattern",
    label: { en: "Mosaic & Decor", ar: "موزاييك وزخرفي", fr: "Mosaïque & Décor" },
    pattern: /\b(mosaic|decor|décor|geometric|hex|chevron|floral|vintage|moroccan|patchwork|wave|fluted|trapeze)\b/i,
  },
] as const;

const COLOR_SWATCHES = [
  { key: "grey", label: { en: "Grey", ar: "رمادي", fr: "Gris" }, swatch: "#8e9399", pattern: /\b(grey|gray|greyish)\b/i },
  { key: "beige", label: { en: "Beige", ar: "بيج", fr: "Beige" }, swatch: "#d4c3a3", pattern: /\b(beige|cream|crema|sand)\b/i },
  { key: "white", label: { en: "White & Ivory", ar: "أبيض وعاجي", fr: "Blanc & Ivoire" }, swatch: "#f0eee9", pattern: /\b(white|offwhite|off\s+white|ivory)\b/i },
  { key: "brown", label: { en: "Brown & Cafe", ar: "بني وكافيه", fr: "Marron & Café" }, swatch: "#7b5a42", pattern: /\b(brown|cafe|walnut|havan)\b/i },
  { key: "black", label: { en: "Black", ar: "أسود", fr: "Noir" }, swatch: "#232529", pattern: /\b(black)\b/i },
  { key: "blue", label: { en: "Blue & Teal", ar: "أزرق وبترولي", fr: "Bleu & Sarcelle" }, swatch: "#3e7898", pattern: /\b(blue|celeste|teal|aquamarine)\b/i },
  { key: "green", label: { en: "Green", ar: "أخضر", fr: "Vert" }, swatch: "#4e7a5b", pattern: /\b(green|olive)\b/i },
  { key: "terracotta", label: { en: "Red & Cotto", ar: "أحمر وتيراكوتا", fr: "Rouge & Cotto" }, swatch: "#a85644", pattern: /\b(red|cotto|copper|mauve)\b/i },
] as const;

const SURFACE_SPECS_I18N: Record<string, { en: string; ar: string; fr: string }> = {
  nature: { en: "Nature", ar: "طبيعي", fr: "Nature" },
  "high resistance": { en: "High Resistance", ar: "مقاومة عالية", fr: "Haute résistance" },
  "anti slip": { en: "Anti-Slip", ar: "مانع للانزلاق", fr: "Antidérapant" },
};

const USAGE_I18N: Record<string, { en: string; ar: string; fr: string }> = {
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

function formatSurfaceSpec(value: string, locale: Locale) {
  const entry = SURFACE_SPECS_I18N[value.trim().toLowerCase()];
  return entry ? entry[locale] : value;
}

function formatUsageLabel(value: string, locale: Locale) {
  const entry = USAGE_I18N[value.trim().toLowerCase()];
  return entry ? entry[locale] : value;
}

function formatApplicationLabel(value: string, locale: Locale) {
  const key = value.trim().toLowerCase();
  if (key === "wall") return locale === "ar" ? "حوائط" : locale === "fr" ? "Murs" : "Wall";
  if (key === "floor") return locale === "ar" ? "أرضيات" : locale === "fr" ? "Sols" : "Floor";
  if (key === "wall and floor") return locale === "ar" ? "حوائط وأرضيات" : locale === "fr" ? "Murs & Sols" : "Wall & Floor";
  return value;
}

function extractSurfaceSpecs(product: Product): string[] {
  const raw = product.source?.originalSurface ?? "";
  if (!raw) return [];
  return raw
    .split("/")
    .map((part) => part.trim())
    .filter((part) => Boolean(part) && !/^(matt|matte|glossy)$/i.test(part));
}

function matchesMaterialCategory(product: Product, category: string | null): boolean {
  if (!category || category === "all") return true;
  if (category === "ceramics") return product.collection === "ceramics" || product.type?.toLowerCase() === "ceramic";
  if (category === "porcelain") return product.collection === "porcelain" || product.type?.toLowerCase() === "porcelain";
  if (category === "tiles") return product.collection === "ceramics" || product.collection === "porcelain";
  if (category === "marble") {
    return (
      product.collection === "marble" ||
      product.texture?.toLowerCase() === "marble" ||
      product.type?.toLowerCase() === "marble"
    );
  }
  return product.collection === category;
}

function matchesSurfaceLook(product: Product, lookKey: string): boolean {
  const look = SURFACE_LOOKS.find((item) => item.key === lookKey);
  if (!look) return false;
  const hay = [product.name.en, product.texture, product.type].filter(Boolean).join(" ");
  return look.pattern.test(hay);
}

function matchesColorKey(product: Product, colorKey: string): boolean {
  const normalized = colorKey.trim().toLowerCase();
  const swatch = COLOR_SWATCHES.find((item) => item.key === normalized);
  const colors = (product.colors ?? []).filter(isColourLabel);
  if (swatch) return colors.some((c) => swatch.pattern.test(c));
  return colors.some((c) => c.toLowerCase() === normalized);
}

function matchesSurfaceSpec(product: Product, spec: string): boolean {
  const target = spec.trim().toLowerCase();
  return extractSurfaceSpecs(product).some((item) => item.toLowerCase() === target);
}

function resolveActiveMaterialTab(category: string | null, material: string | null): string {
  if (material === "tiles") return "tiles";
  if (material === "marble") return "marble";
  if (category === "ceramics" || category === "porcelain" || category === "marble") return category;
  return "all";
}

interface FilterCriteria {
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

function matchesCatalogueFilters(product: Product, criteria: FilterCriteria): boolean {
  if (criteria.category && !matchesMaterialCategory(product, criteria.category)) return false;
  if (criteria.material && !matchesMaterialCategory(product, criteria.material)) return false;
  if (criteria.format === "large" && !isLargeFormat(product)) return false;
  if (criteria.format === "outdoor20" && !isOutdoor20mm(product)) return false;
  if (criteria.look && !matchesSurfaceLook(product, criteria.look)) return false;
  if (criteria.surface && !matchesSurfaceSpec(product, criteria.surface)) return false;
  if (criteria.application && !matchesApplication(product, criteria.application)) return false;
  if (criteria.finish && product.finish !== criteria.finish) return false;
  if (criteria.size && !product.sizes.some((s) => s.label === criteria.size)) return false;
  if (criteria.usage && !(product.usage ?? []).includes(criteria.usage)) return false;
  if (criteria.color && !matchesColorKey(product, criteria.color)) return false;
  if (criteria.brand && product.brand !== criteria.brand) return false;
  if (criteria.type && product.type !== criteria.type) return false;
  if (criteria.texture && product.texture !== criteria.texture) return false;
  return true;
}

function buildCatalogueFacets(allDistinct: Product[], scopedDistinct: Product[]) {
  const materialCategories = MATERIAL_CATEGORIES.map((cat) => ({
    key: cat.key,
    label: cat.label,
    count: cat.key === "all" ? allDistinct.length : allDistinct.filter((p) => matchesMaterialCategory(p, cat.key)).length,
  }));

  const surfaceLooks = SURFACE_LOOKS.map((look) => ({
    key: look.key,
    label: look.label,
    count: scopedDistinct.filter((p) => matchesSurfaceLook(p, look.key)).length,
  })).filter((look) => look.count > 0);

  const countEntries = (items: (string | undefined)[]) => {
    const map = new Map<string, number>();
    for (const item of items) {
      if (item) map.set(item, (map.get(item) ?? 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  };

  const finishes = countEntries(scopedDistinct.map((p) => p.finish).filter(Boolean));
  const surfaceSpecs = countEntries(scopedDistinct.flatMap((p) => extractSurfaceSpecs(p)));
  const applications = countEntries(scopedDistinct.map((p) => p.application).filter(Boolean));
  const sizes = countEntries(scopedDistinct.flatMap((p) => [...new Set(p.sizes.map((s) => s.label))]));
  const usages = countEntries(scopedDistinct.flatMap((p) => [...new Set((p.usage ?? []).filter(isUsageLabel))]));
  const brands = countEntries(scopedDistinct.map((p) => p.brand).filter(Boolean));

  const colors = COLOR_SWATCHES.map((swatch) => ({
    key: swatch.key,
    label: swatch.label,
    swatch: swatch.swatch,
    count: scopedDistinct.filter((p) => matchesColorKey(p, swatch.key)).length,
  })).filter((c) => c.count > 0);

  const largeFormatCount = scopedDistinct.filter(isLargeFormat).length;

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

const CATALOGUE_PAGE_SIZE = 36;
export const FEATURED_PRODUCT_IDS = ["484", "546", "39", "492"];

function formatFinishLabel(finish: string | undefined, locale: Locale): string {
  const norm = (finish ?? "").trim().toLowerCase();
  if (!norm) return "";
  if (norm === "matt" || norm === "matte") return locale === "ar" ? "مطفي" : locale === "fr" ? "Mat" : "Matte";
  if (norm === "glossy") return locale === "ar" ? "لامع" : locale === "fr" ? "Brillant" : "Glossy";
  return finish ?? "";
}

function brandRoleLabel(locale: Locale): string {
  return locale === "ar" ? "العلامة التجارية" : locale === "fr" ? "Marque" : "Brand";
}

function requestBestPriceLabel(locale: Locale): string {
  return locale === "ar" ? "اطلب أفضل سعر" : locale === "fr" ? "Demander le meilleur prix" : "Request Best Price";
}

function tryInAiLabel(locale: Locale): string {
  return locale === "ar" ? "جرّب في AI" : locale === "fr" ? "Essayer en IA" : "Try in AI";
}

function normalizeSizeLabel(label: string): string {
  return label.replace(/\s*[x×]\s*/gi, " × ").replace(/\s+/g, " ").trim();
}

// ─── Material Catalogue Product Card (JO) ────────────────────────────────────

export function Material3DProductCard({ product }: { product: Product }) {
  const { locale, t } = useI18n();
  const { isFavorite, toggleFavorite, toggleCompare, compare, addToQuote } = useStore();
  return (
    <MaterialCatalogueCard
      product={product}
      locale={locale}
      t={t}
      isFavorite={isFavorite}
      toggleFavorite={toggleFavorite}
      toggleCompare={toggleCompare}
      compare={compare}
      addToQuote={addToQuote}
    />
  );
}

function MaterialCatalogueCard({
  product,
  locale,
  t,
  isFavorite,
  toggleFavorite,
  toggleCompare,
  compare,
  addToQuote,
}: {
  product: Product;
  locale: Locale;
  t: (k: string) => string;
  isFavorite: (id: string) => boolean;
  toggleFavorite: (id: string) => void;
  toggleCompare: (id: string) => void;
  compare: string[];
  addToQuote: (id: string, unit: "sqm" | "pieces") => void;
}) {
  const maker = productMaker(product, locale);
  const makerName = product.brand || (maker.verified ? maker.value : "");
  const makerCaption = product.brand ? brandRoleLabel(locale) : maker.verified ? maker.label : "";
  const finish = formatFinishLabel(product.finish, locale);
  const orbImage =
    localMaterialFace(product.id) ||
    product.source?.original?.tiles?.[0] ||
    product.image;
  const unit = ["ceramics", "porcelain", "marble"].includes(product.collection) ? "sqm" : "pieces";
  const fav = isFavorite(product.id);
  const inCompare = compare.includes(product.id);

  return (
    <article className="idea-material-card idea-glare-product-card">
      <GlareCard
        translucent={true}
        radius="18px"
        data-testid={`products-glare-card-${product.id}`}
        containerClassName="w-full h-full [aspect-ratio:auto]"
        className="idea-glare-product-inner"
      >
        <div className="idea-material-card-media">
          <Link
            to={`/product/${product.slug}`}
            aria-label={`${product.name[locale]} — ${t("action.viewDetails")}`}
          >
            <MaterialOrb className="idea-material-orb" src={orbImage} alt={product.name[locale]} loading="lazy" />
          </Link>
          <div className="idea-material-card-actions">
            <button
              type="button"
              aria-label={t("action.favorite")}
              aria-pressed={fav}
              onClick={() => toggleFavorite(product.id)}
            >
              <Heart size={16} fill={fav ? "currentColor" : "none"} />
            </button>
            <button
              type="button"
              aria-label={t("action.compare")}
              aria-pressed={inCompare}
              onClick={() => toggleCompare(product.id)}
            >
              <GitCompare size={16} />
            </button>
          </div>
        </div>
        <div className="idea-material-card-body">
          {finish && <span className="idea-material-finish">{finish}</span>}
          {makerName && (
            <div className="idea-material-maker">
              <span>{makerName}</span>
              {makerCaption && <small>{makerCaption}</small>}
            </div>
          )}
          <Link className="idea-material-name" to={`/product/${product.slug}`} title={product.name[locale]}>
            <span>{product.name[locale]}</span>
          </Link>
          <div className="idea-material-meta">
            {product.sizes[0] && <span>{normalizeSizeLabel(product.sizes[0].label)}</span>}
            <span dir="ltr" title={ideaInternalCode(product)}>
              {ideaInternalCode(product)}
            </span>
          </div>
          <div className="idea-material-card-footer">
            <button type="button" className="idea-material-quote" onClick={() => addToQuote(product.id, unit)}>
              <FileText size={14} />
              {requestBestPriceLabel(locale)}
            </button>
            <Link
              className="idea-material-visualize"
              to={`/ai-room-visualizer?product=${encodeURIComponent(product.id)}`}
            >
              <Sparkles size={15} />
              {tryInAiLabel(locale)}
            </Link>
          </div>
        </div>
      </GlareCard>
    </article>
  );
}

// ─── Main Material Showroom & Catalogue Page (/products — QO) ────────────────

function ProductsShowroomCatalogue() {
  const { products, isFavorite, toggleFavorite, toggleCompare, compare, addToQuote } = useStore();
  const { locale, t } = useI18n();
  const [params, setParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);

  const q = (params.get("q") ?? "").trim().toLowerCase();
  const category = params.get("category");
  const material = params.get("material");
  const look = params.get("look");
  const surface = params.get("surface");
  const finish = params.get("finish");
  const size = params.get("size");
  const color = params.get("color");
  const application = params.get("application");
  const type = params.get("type");
  const texture = params.get("texture");
  const brand = params.get("brand");
  const usage = params.get("usage");
  const format = params.get("format");
  const sort = params.get("sort") ?? "source";

  const activeMaterialTab = resolveActiveMaterialTab(category, material);
  const activeFilterCount = [
    category,
    material,
    look,
    surface,
    type,
    texture,
    brand,
    finish,
    application,
    size,
    usage,
    color,
    format,
  ].filter(Boolean).length;

  const allDistinct = useMemo(() => distinctStorefrontProducts(products), [products]);
  const categoryScopedDistinct = useMemo(
    () =>
      allDistinct.filter(
        (p) =>
          !(
            (category && !matchesMaterialCategory(p, category)) ||
            (material && !matchesMaterialCategory(p, material))
          )
      ),
    [allDistinct, category, material]
  );

  const facets = useMemo(
    () => buildCatalogueFacets(allDistinct, categoryScopedDistinct.length > 0 ? categoryScopedDistinct : allDistinct),
    [allDistinct, categoryScopedDistinct]
  );

  const results = useMemo(() => {
    const filtered = products.filter((p) => {
      if (
        !matchesCatalogueFilters(p, {
          category,
          material,
          look,
          surface,
          format,
          finish,
          application,
          size,
          usage,
          color,
          brand,
          type,
          texture,
        })
      ) {
        return false;
      }
      if (q) {
        const hay = [
          p.name[locale],
          p.name.en,
          p.brand,
          p.manufacturer,
          p.model,
          p.code,
          ideaInternalCode(p),
          p.collection,
          p.origin,
          p.source?.originalSurface,
          ...(p.colors ?? []),
          ...p.sizes.map((s) => s.label),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
    const distinct = distinctStorefrontProducts(filtered);
    if (sort === "az") return [...distinct].sort((a, b) => a.name[locale].localeCompare(b.name[locale]));
    if (sort === "za") return [...distinct].sort((a, b) => b.name[locale].localeCompare(a.name[locale]));
    return distinct;
  }, [
    products,
    category,
    material,
    look,
    surface,
    format,
    finish,
    application,
    size,
    usage,
    color,
    brand,
    type,
    texture,
    q,
    locale,
    sort,
  ]);

  const featuredProducts = useMemo(() => {
    const byId = new Map(products.map((p) => [p.id, p]));
    const picked = FEATURED_PRODUCT_IDS.map((id) => byId.get(id)).filter((p): p is Product => p !== undefined);
    return picked.length === FEATURED_PRODUCT_IDS.length ? picked : distinctStorefrontProducts(products).slice(0, 4);
  }, [products]);

  const totalPages = Math.max(1, Math.ceil(results.length / CATALOGUE_PAGE_SIZE));
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const pageResults = results.slice((page - 1) * CATALOGUE_PAGE_SIZE, page * CATALOGUE_PAGE_SIZE);

  const dynamicHeading =
    format === "large"
      ? locale === "ar"
        ? "بلاط مقاسات كبيرة"
        : locale === "fr"
          ? "Grand format"
          : "Large-format tiles"
      : format === "outdoor20"
        ? locale === "ar"
          ? "بلاط خارجي 20 مم"
          : locale === "fr"
            ? "Carrelage extérieur 20 mm"
            : "20 mm outdoor tiles"
        : category
          ? COLLECTIONS.find((c) => c.slug === category)?.title[locale]
          : material
            ? MATERIAL_CATEGORIES.find((m) => m.key === material)?.label[locale]
            : t("nav.products");

  const copy = {
    en: {
      eyebrow: "FEATURED MATERIALS",
      title: "Curated Materials for Inspired Spaces",
      body: "A handpicked selection of standout surfaces from our collection.",
      cta: "Explore Featured",
      catalogueEyebrow: "PRODUCT CATALOGUE",
      catalogueTitle: "Explore Our Material Collection",
      catalogueBody: "Filter by material, surface character, finish, dimensions, and room usage.",
      filtersHeading: "Filters",
      clearAll: "Clear all",
      materialType: "MATERIAL TYPE",
      surfaceStyle: "SURFACE STYLE",
      finish: "FINISH",
      surfaceSpec: "SURFACE PROPERTIES",
      application: "APPLICATION",
      size: "SIZE",
      largeFormat: "Large Format (60×120+)",
      usage: "USAGE",
      color: "COLOR",
      brand: "BRAND",
      sortLabel: "Sort products",
      sortCatalogue: "Catalogue order",
      showing: (from: number, to: number, total: number) => `Showing ${from}–${to} of ${total} surfaces`,
      resultsBadge: (count: number) => `${count} ${count === 1 ? "surface" : "surfaces"}`,
      applyFilters: (count: number) => `Show ${count} surfaces`,
      marbleEmptyHint:
        "Natural marble slabs are sourced per project through IDEA partner suppliers. You can browse our marble-effect ceramic designs below or request a supplier quote.",
      porcelainEmptyHint:
        "Porcelain slab collections are confirmed directly with IDEA partner suppliers. Browse our large-format surfaces below or request a quote.",
      browseMarbleLook: "Browse Marble-Look Surfaces",
      browseLargeFormat: "Browse Large-Format Surfaces",
      requestSupplierQuote: "Request Supplier Quote",
    },
    ar: {
      eyebrow: "خامات مختارة",
      title: "خامات مختارة لمساحات ملهمة",
      body: "مجموعة منتقاة من أبرز الخامات في كتالوجنا.",
      cta: "استكشف الخامات المختارة",
      catalogueEyebrow: "كتالوج المنتجات",
      catalogueTitle: "اكتشف مجموعة الخامات",
      catalogueBody: "فلتر حسب نوع الخامة والطابع والتشطيب والمقاس والاستخدام بكل سهولة.",
      filtersHeading: "الفلاتر",
      clearAll: "مسح الكل",
      materialType: "نوع الخامة",
      surfaceStyle: "طابع السطح",
      finish: "التشطيب",
      surfaceSpec: "خصائص السطح",
      application: "التطبيق",
      size: "المقاس",
      largeFormat: "مقاسات كبيرة (+60×120)",
      usage: "الاستخدام",
      color: "اللون",
      brand: "العلامة التجارية",
      sortLabel: "ترتيب المنتجات",
      sortCatalogue: "ترتيب الكتالوج",
      showing: (from: number, to: number, total: number) => `عرض ${from}–${to} من ${total} خامة`,
      resultsBadge: (count: number) => `${count} خامة`,
      applyFilters: (count: number) => `عرض ${count} خامة`,
      marbleEmptyHint:
        "ألواح الرخام الطبيعي تُوفَّر حسب المشروع عبر موردين معتمدين لدى IDEA. يمكنك تصفح الخامات ذات تأثير الرخام المتاحة حالياً أو طلب عرض سعر مباشر.",
      porcelainEmptyHint:
        "تشكيلات البورسلين يتم تأكيد توفرها مباشرة عبر شركائنا من الموردين. يمكنك تصفح المقاسات الكبيرة المتاحة حالياً أو طلب عرض سعر.",
      browseMarbleLook: "تصفح خامات بتأثير الرخام",
      browseLargeFormat: "تصفح المقاسات الكبيرة",
      requestSupplierQuote: "اطلب عرض سعر من الموردين",
    },
    fr: {
      eyebrow: "MATÉRIAUX À LA UNE",
      title: "Des matières choisies pour des espaces inspirants",
      body: "Une sélection soignée de surfaces remarquables de notre collection.",
      cta: "Explorer la sélection",
      catalogueEyebrow: "CATALOGUE PRODUITS",
      catalogueTitle: "Explorez notre collection de matériaux",
      catalogueBody: "Filtrez par matériau, aspect, finition, format et usage.",
      filtersHeading: "Filtres",
      clearAll: "Tout effacer",
      materialType: "TYPE DE MATÉRIAU",
      surfaceStyle: "STYLE DE SURFACE",
      finish: "FINITION",
      surfaceSpec: "PROPRIÉTÉS",
      application: "APPLICATION",
      size: "FORMAT",
      largeFormat: "Grand format (60×120+)",
      usage: "USAGE",
      color: "COULEUR",
      brand: "MARQUE",
      sortLabel: "Trier les produits",
      sortCatalogue: "Ordre du catalogue",
      showing: (from: number, to: number, total: number) => `Affichage ${from}–${to} sur ${total} surfaces`,
      resultsBadge: (count: number) => `${count} surfaces`,
      applyFilters: (count: number) => `Afficher ${count} surfaces`,
      marbleEmptyHint:
        "Les dalles de marbre naturel sont confirmées sur demande via nos fournisseurs partenaires. Découvrez nos surfaces effet marbre ou demandez un devis.",
      porcelainEmptyHint:
        "Les collections porcelaine sont confirmées directement auprès de nos fournisseurs partenaires. Explorez nos grands formats ou demandez un devis.",
      browseMarbleLook: "Voir les surfaces effet marbre",
      browseLargeFormat: "Voir les grands formats",
      requestSupplierQuote: "Demander un devis fournisseur",
    },
  }[locale];

  const setFilter = (key: string, value: string | null) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });

  const setMaterialTab = (tabKey: string) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      next.delete("category");
      next.delete("material");
      next.delete("page");
      if (tabKey === "tiles") next.set("material", "tiles");
      else if (tabKey === "marble") next.set("material", "marble");
      else if (tabKey !== "all") next.set("category", tabKey);
      return next;
    });

  const clearAllFilters = () =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      [
        "category",
        "material",
        "look",
        "surface",
        "finish",
        "size",
        "color",
        "application",
        "type",
        "texture",
        "brand",
        "usage",
        "format",
        "q",
        "page",
      ].forEach((k) => next.delete(k));
      return next;
    });

  const switchToMarbleLook = () =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      next.delete("category");
      next.delete("material");
      next.delete("page");
      next.set("look", "marble-look");
      return next;
    });

  const switchToLargeFormat = () =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      next.delete("category");
      next.delete("material");
      next.delete("page");
      next.set("format", "large");
      return next;
    });

  const activeChips: { id: string; label: string; onRemove: () => void }[] = [];
  if (activeMaterialTab !== "all") {
    const label = MATERIAL_CATEGORIES.find((m) => m.key === activeMaterialTab)?.label[locale] ?? activeMaterialTab;
    activeChips.push({ id: "material", label, onRemove: () => setMaterialTab("all") });
  }
  if (look) {
    const label = SURFACE_LOOKS.find((l) => l.key === look)?.label[locale] ?? look;
    activeChips.push({ id: "look", label, onRemove: () => setFilter("look", null) });
  }
  if (finish) {
    activeChips.push({
      id: "finish",
      label: formatFinishLabel(finish, locale),
      onRemove: () => setFilter("finish", null),
    });
  }
  if (surface) {
    activeChips.push({
      id: "surface",
      label: formatSurfaceSpec(surface, locale),
      onRemove: () => setFilter("surface", null),
    });
  }
  if (application) {
    activeChips.push({
      id: "application",
      label: formatApplicationLabel(application, locale),
      onRemove: () => setFilter("application", null),
    });
  }
  if (size) {
    activeChips.push({ id: "size", label: size, onRemove: () => setFilter("size", null) });
  }
  if (format === "large") {
    activeChips.push({ id: "format", label: copy.largeFormat, onRemove: () => setFilter("format", null) });
  }
  if (usage) {
    activeChips.push({
      id: "usage",
      label: formatUsageLabel(usage, locale),
      onRemove: () => setFilter("usage", null),
    });
  }
  if (color) {
    const swatch = COLOR_SWATCHES.find((c) => c.key === color);
    activeChips.push({
      id: "color",
      label: swatch ? swatch.label[locale] : color,
      onRemove: () => setFilter("color", null),
    });
  }
  if (brand) {
    activeChips.push({ id: "brand", label: brand, onRemove: () => setFilter("brand", null) });
  }

  return (
    <Section style={{ paddingTop: 0, background: "var(--idea-bg)" }}>
      <div className="idea-products-showroom-section">
        <div className="idea-products-showroom-bg" aria-hidden="true">
          <img src="/assets/aistudio/image_40847349.png" alt="" loading="eager" />
        </div>
        <Container className="idea-material-catalogue" style={{ maxWidth: 1800, position: "relative", zIndex: 1 }}>
          {featuredProducts.length > 0 && (
            <section className="idea-material-featured" aria-labelledby="idea-material-featured-title">
              <div className="idea-material-featured-spacer" aria-hidden="true" />
              <div className="idea-material-featured-stage">
                <div className="idea-material-featured-header">
                  <div className="idea-material-featured-copy">
                    <p className="idea-material-featured-eyebrow">{copy.eyebrow}</p>
                    <h2 id="idea-material-featured-title">{copy.title}</h2>
                    <p className="idea-material-featured-description">{copy.body}</p>
                  </div>
                  <a
                    className="idea-material-featured-cta"
                    aria-label={`${copy.cta} (${products.length.toLocaleString(locale)})`}
                    href="#idea-material-catalogue-grid"
                    onClick={(e) => {
                      const el = document.getElementById("idea-material-catalogue-grid");
                      if (el) {
                        e.preventDefault();
                        el.scrollIntoView({ behavior: "smooth", block: "start" });
                      }
                    }}
                  >
                    <span>{copy.cta}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </a>
                </div>
                <div className="idea-material-featured-grid">
                  {featuredProducts.map((item) => {
                    const maker = productMaker(item, locale);
                    const orbImg =
                      localMaterialFace(item.id) ||
                      item.source?.original?.tiles?.[0] ||
                      item.image;
                    const unit = ["ceramics", "porcelain", "marble"].includes(item.collection) ? "sqm" : "pieces";
                    const finishLabel = formatFinishLabel(item.finish, locale);
                    const makerName = item.brand || (maker.verified ? maker.value : "");
                    const makerCaption = item.brand ? brandRoleLabel(locale) : maker.verified ? maker.label : "";

                    return (
                      <article key={item.id} className="idea-material-featured-card idea-glare-product-card">
                        <GlareCard
                          translucent={true}
                          radius="18px"
                          data-testid={`products-featured-glare-card-${item.id}`}
                          containerClassName="w-full h-full [aspect-ratio:auto]"
                          className="idea-glare-product-inner"
                        >
                          <Link
                            className="idea-material-featured-visual"
                            to={`/product/${item.slug}`}
                            aria-label={item.name[locale]}
                          >
                            <MaterialOrb
                              className="idea-material-featured-orb"
                              src={orbImg}
                              alt={item.name[locale]}
                              loading="eager"
                            />
                          </Link>
                          <div className="idea-material-featured-card-body">
                            {finishLabel && <span className="idea-material-featured-finish">{finishLabel}</span>}
                            {makerName && (
                              <div className="idea-material-featured-maker">
                                <strong>{makerName}</strong>
                                {makerCaption && <small>{makerCaption}</small>}
                              </div>
                            )}
                            <Link className="idea-material-featured-name" to={`/product/${item.slug}`}>
                              {item.name[locale]}
                            </Link>
                            <div className="idea-material-featured-meta">
                              {item.sizes[0] && <span>{normalizeSizeLabel(item.sizes[0].label)}</span>}
                              <code dir="ltr" title={ideaInternalCode(item)}>
                                {ideaInternalCode(item)}
                              </code>
                            </div>
                            <div className="idea-material-featured-actions">
                              <button type="button" onClick={() => addToQuote(item.id, unit)}>
                                <FileText size={14} aria-hidden="true" />
                                {requestBestPriceLabel(locale)}
                              </button>
                              <Link to={`/ai-room-visualizer?product=${encodeURIComponent(item.id)}`}>
                                <Sparkles size={14} aria-hidden="true" />
                                {tryInAiLabel(locale)}
                              </Link>
                            </div>
                          </div>
                        </GlareCard>
                      </article>
                    );
                  })}
                </div>
              </div>
            </section>
          )}

          <section
            className="idea-material-main-layout"
            aria-label={
              locale === "ar" ? "كتالوج المنتجات" : locale === "fr" ? "Catalogue produits" : "Product catalogue"
            }
          >
            {filterDrawerOpen && (
              <div className="idea-sidebar-scrim" onClick={() => setFilterDrawerOpen(false)} aria-hidden="true" />
            )}
            <aside className="idea-material-catalogue-aside">
              <div className="idea-material-catalogue-intro">
                <p className="idea-eyebrow">
                  {!category && !material && !format
                    ? copy.catalogueEyebrow
                    : locale === "ar"
                      ? "اكتشف خاماتنا"
                      : locale === "fr"
                        ? "DÉCOUVREZ NOS MATÉRIAUX"
                        : "EXPLORE OUR MATERIALS"}
                </p>
                <h1 className="idea-display">
                  {!category && !material && !format ? copy.catalogueTitle : dynamicHeading}
                </h1>
                <p className="idea-material-subtitle">{copy.catalogueBody}</p>
              </div>

              <div
                id="idea-catalogue-filter-panel"
                className={`idea-filter-panel${filterDrawerOpen ? " is-open" : ""}`}
                aria-label={copy.filtersHeading}
              >
                <div className="idea-filter-panel-header">
                  <div className="idea-filter-panel-title-wrap">
                    <h2 className="idea-filter-panel-title">{copy.filtersHeading}</h2>
                    {activeFilterCount > 0 && (
                      <span className="idea-filter-active-count" aria-live="polite">
                        {activeFilterCount}
                      </span>
                    )}
                  </div>
                  <div className="idea-filter-panel-header-actions">
                    <button
                      type="button"
                      className="idea-filter-clear-btn"
                      onClick={clearAllFilters}
                      disabled={activeFilterCount === 0 && !q}
                    >
                      {copy.clearAll}
                    </button>
                    <button
                      type="button"
                      className="idea-filter-close-btn"
                      onClick={() => setFilterDrawerOpen(false)}
                      aria-label={locale === "ar" ? "إغلاق الفلاتر" : "Close filters"}
                    >
                      <X size={18} aria-hidden="true" />
                    </button>
                  </div>
                </div>

                <div className="idea-filter-group">
                  <div className="idea-filter-group-label">{copy.materialType}</div>
                  <div className="idea-filter-chips" role="group" aria-label={copy.materialType}>
                    {facets.materialCategories.map((item) => {
                      const active = activeMaterialTab === item.key;
                      return (
                        <button
                          key={item.key}
                          type="button"
                          className={`idea-filter-chip${active ? " is-active" : ""}${item.count === 0 ? " is-empty" : ""}`}
                          aria-pressed={active}
                          onClick={() => setMaterialTab(item.key)}
                        >
                          <span>{item.label[locale]}</span>
                          <span className="idea-filter-chip-count">{item.count}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {facets.surfaceLooks.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.surfaceStyle}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.surfaceStyle}>
                      {facets.surfaceLooks.map((item) => {
                        const active = look === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("look", active ? null : item.key)}
                          >
                            <span>{item.label[locale]}</span>
                            <span className="idea-filter-chip-count">{item.count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.finishes.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.finish}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.finish}>
                      {facets.finishes.map(([val, count]) => {
                        const active = finish === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("finish", active ? null : val)}
                          >
                            <span>{formatFinishLabel(val, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.surfaceSpecs.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.surfaceSpec}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.surfaceSpec}>
                      {facets.surfaceSpecs.map(([val, count]) => {
                        const active = surface === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("surface", active ? null : val)}
                          >
                            <span>{formatSurfaceSpec(val, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.applications.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.application}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.application}>
                      {facets.applications.map(([val, count]) => {
                        const active = application === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("application", active ? null : val)}
                          >
                            <span>{formatApplicationLabel(val, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.sizes.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.size}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.size}>
                      {facets.largeFormatCount > 0 && (
                        <button
                          type="button"
                          className={`idea-filter-chip${format === "large" ? " is-active" : ""}`}
                          aria-pressed={format === "large"}
                          onClick={() => setFilter("format", format === "large" ? null : "large")}
                        >
                          <span>{copy.largeFormat}</span>
                          <span className="idea-filter-chip-count">{facets.largeFormatCount}</span>
                        </button>
                      )}
                      {facets.sizes.map(([val]) => {
                        const active = size === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            dir="ltr"
                            className={`idea-filter-chip idea-filter-chip--size${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("size", active ? null : val)}
                          >
                            <span>{normalizeSizeLabel(val)}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.usages.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.usage}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.usage}>
                      {facets.usages.map(([val, count]) => {
                        const active = usage === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("usage", active ? null : val)}
                          >
                            <span>{formatUsageLabel(val, locale)}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.colors.length > 0 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.color}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.color}>
                      {facets.colors.map((item) => {
                        const active = color === item.key;
                        return (
                          <button
                            key={item.key}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("color", active ? null : item.key)}
                          >
                            {item.swatch && (
                              <span
                                className="idea-filter-color-swatch"
                                style={{ backgroundColor: item.swatch }}
                                aria-hidden="true"
                              />
                            )}
                            <span>{item.label[locale]}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {facets.brands.length > 1 && (
                  <div className="idea-filter-group">
                    <div className="idea-filter-group-label">{copy.brand}</div>
                    <div className="idea-filter-chips" role="group" aria-label={copy.brand}>
                      {facets.brands.map(([val, count]) => {
                        const active = brand === val;
                        return (
                          <button
                            key={val}
                            type="button"
                            className={`idea-filter-chip${active ? " is-active" : ""}`}
                            aria-pressed={active}
                            onClick={() => setFilter("brand", active ? null : val)}
                          >
                            <span>{val}</span>
                            <span className="idea-filter-chip-count">{count}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="idea-filter-mobile-apply"
                  onClick={() => setFilterDrawerOpen(false)}
                >
                  {copy.applyFilters(results.length)}
                </button>
              </div>
            </aside>

            <div className="idea-material-results">
              <div className="idea-material-toolbar">
                <form
                  className="idea-material-search"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const data = new FormData(e.currentTarget);
                    setFilter("q", String(data.get("q") ?? "").trim() || null);
                  }}
                >
                  <div className="idea-material-search-field">
                    <button
                      type="submit"
                      aria-label={locale === "ar" ? "بحث" : locale === "fr" ? "Rechercher" : "Search"}
                    >
                      <Search size={17} aria-hidden="true" />
                    </button>
                    <input
                      key={q}
                      type="search"
                      name="q"
                      defaultValue={q}
                      aria-label={
                        locale === "ar"
                          ? "ابحث عن خامة"
                          : locale === "fr"
                            ? "Rechercher un matériau"
                            : "Search materials"
                      }
                      placeholder={
                        locale === "ar"
                          ? "ابحث بالاسم أو البراند أو المقاس أو الكود..."
                          : locale === "fr"
                            ? "Nom, marque, format ou référence..."
                            : "Search materials, names, sizes, or codes..."
                      }
                    />
                  </div>
                </form>

                <div className="idea-material-toolbar-controls">
                  <button
                    type="button"
                    className="idea-mobile-filter-trigger"
                    onClick={() => setFilterDrawerOpen(true)}
                    aria-expanded={filterDrawerOpen}
                    aria-controls="idea-catalogue-filter-panel"
                  >
                    <SlidersHorizontal size={15} aria-hidden="true" />
                    <span>{copy.filtersHeading}</span>
                    {activeFilterCount > 0 && <span className="idea-filter-active-count">{activeFilterCount}</span>}
                  </button>

                  <label className="idea-material-sort-select">
                    <select
                      aria-label={copy.sortLabel}
                      value={sort}
                      onChange={(e) => setFilter("sort", e.target.value)}
                    >
                      <option value="source">{copy.sortCatalogue}</option>
                      <option value="az">A–Z</option>
                      <option value="za">Z–A</option>
                    </select>
                  </label>

                  <div
                    className="idea-material-view-toggle"
                    role="group"
                    aria-label={
                      locale === "ar" ? "طريقة عرض المنتجات" : locale === "fr" ? "Mode d’affichage" : "View mode"
                    }
                  >
                    <button
                      type="button"
                      aria-label={locale === "ar" ? "شبكة" : locale === "fr" ? "Grille" : "Grid"}
                      aria-pressed={viewMode === "grid"}
                      onClick={() => setViewMode("grid")}
                    >
                      <LayoutGrid size={16} aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      aria-label={locale === "ar" ? "قائمة" : locale === "fr" ? "Liste" : "List"}
                      aria-pressed={viewMode === "list"}
                      onClick={() => setViewMode("list")}
                    >
                      <List size={16} aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>

              {(activeChips.length > 0 || q) && (
                <div className="idea-active-filter-bar" aria-live="polite">
                  <span className="idea-active-filter-summary">{copy.resultsBadge(results.length)}</span>
                  {q && (
                    <button type="button" className="idea-active-chip" onClick={() => setFilter("q", null)}>
                      <span>“{q}”</span>
                      <X size={13} aria-hidden="true" />
                    </button>
                  )}
                  {activeChips.map((chip) => (
                    <button key={chip.id} type="button" className="idea-active-chip" onClick={chip.onRemove}>
                      <span>{chip.label}</span>
                      <X size={13} aria-hidden="true" />
                    </button>
                  ))}
                  <button type="button" className="idea-active-filter-clear" onClick={clearAllFilters}>
                    {copy.clearAll}
                  </button>
                </div>
              )}

              {results.length === 0 ? (
                <div className="idea-material-empty">
                  <h2>
                    {locale === "ar"
                      ? "لم نعثر على خامات مطابقة"
                      : locale === "fr"
                        ? "Aucun matériau correspondant"
                        : "No matching materials"}
                  </h2>
                  <p>
                    {activeMaterialTab === "marble"
                      ? copy.marbleEmptyHint
                      : activeMaterialTab === "porcelain"
                        ? copy.porcelainEmptyHint
                        : locale === "ar"
                          ? "جرّب تغيير البحث أو مسح بعض الفلاتر."
                          : locale === "fr"
                            ? "Essayez une autre recherche ou réinitialisez vos filtres."
                            : "Try another search or reset your filters."}
                  </p>
                  <div className="idea-material-empty-actions">
                    {activeMaterialTab === "marble" && (
                      <button type="button" className="is-primary" onClick={switchToMarbleLook}>
                        {copy.browseMarbleLook}
                      </button>
                    )}
                    {activeMaterialTab === "porcelain" && (
                      <button type="button" className="is-primary" onClick={switchToLargeFormat}>
                        {copy.browseLargeFormat}
                      </button>
                    )}
                    {(activeMaterialTab === "marble" || activeMaterialTab === "porcelain") && (
                      <Link to="/request-quote/new" className="idea-empty-quote-link">
                        {copy.requestSupplierQuote}
                      </Link>
                    )}
                    <button type="button" onClick={clearAllFilters}>
                      {copy.clearAll}
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="idea-material-resultline-bar" aria-live="polite">
                    <span>
                      {copy.showing(
                        (page - 1) * CATALOGUE_PAGE_SIZE + 1,
                        Math.min(page * CATALOGUE_PAGE_SIZE, results.length),
                        results.length
                      )}
                    </span>
                  </div>
                  <div
                    className={`idea-material-grid${viewMode === "list" ? " is-list" : ""}`}
                    id="idea-material-catalogue-grid"
                  >
                    {pageResults.map((product) => (
                      <MaterialCatalogueCard
                        key={product.id}
                        product={product}
                        locale={locale}
                        t={t}
                        isFavorite={isFavorite}
                        toggleFavorite={toggleFavorite}
                        toggleCompare={toggleCompare}
                        compare={compare}
                        addToQuote={addToQuote}
                      />
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <nav
                      className="idea-material-pagination"
                      aria-label={
                        locale === "ar" ? "صفحات الخامات" : locale === "fr" ? "Pages des matériaux" : "Material pages"
                      }
                    >
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setFilter("page", String(page - 1))}
                      >
                        {locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}
                      </button>
                      {Array.from({ length: totalPages }, (_, idx) => idx + 1)
                        .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                        .map((p) => (
                          <button
                            key={p}
                            type="button"
                            aria-current={p === page ? "page" : undefined}
                            aria-label={String(p)}
                            onClick={() => setFilter("page", String(p))}
                          >
                            {p}
                          </button>
                        ))}
                      <button
                        type="button"
                        disabled={page >= totalPages}
                        onClick={() => setFilter("page", String(page + 1))}
                      >
                        {locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}
                      </button>
                    </nav>
                  )}
                </>
              )}
            </div>
          </section>
        </Container>
      </div>
    </Section>
  );
}

// ─── Collection Detail View (/collections/:slug — ZO) ────────────────────────

const COLLECTION_PAGE_SIZE = 16;

function uniq<T>(arr: (T | undefined)[]): T[] {
  return [...new Set(arr.filter(Boolean) as T[])];
}

function CollectionProducts({ fixedCollection }: { fixedCollection: CollectionSlug }) {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const [params, setParams] = useSearchParams();
  const q = (params.get("q") ?? "").trim().toLowerCase();

  const material = params.get("material");
  const category = fixedCollection ?? params.get("category");
  const format = params.get("format");
  const scope = useMemo(
    () =>
      products.filter((p) => {
        if (category && p.collection !== category) return false;
        if (format === "large" && !isLargeFormat(p)) return false;
        if (format === "outdoor20" && !isOutdoor20mm(p)) return false;
        if (material === "marble") return p.texture?.toLowerCase() === "marble" || p.type?.toLowerCase() === "marble";
        if (material === "tiles") return p.collection === "ceramics" || p.collection === "porcelain";
        return true;
      }),
    [products, category, material, format]
  );

  const finish = params.get("finish");
  const size = params.get("size");
  const usage = params.get("usage");
  const color = params.get("color");
  const application = params.get("application");
  const setFilter = (key: string, value: string | null) =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      if (value) next.set(key, value);
      else next.delete(key);
      if (key !== "page") next.delete("page");
      return next;
    });
  const setFinish = (v: string | null) => setFilter("finish", v);
  const setSize = (v: string | null) => setFilter("size", v);
  const setUsage = (v: string | null) => setFilter("usage", v);
  const setColor = (v: string | null) => setFilter("color", v);

  const facets = useMemo(
    () => ({
      application: uniq(scope.map((p) => p.application)),
      finish: uniq(scope.map((p) => p.finish)),
      size: uniq(scope.flatMap((p) => p.sizes.map((s) => s.label))),
      usage: uniq(scope.flatMap((p) => p.usage ?? []).filter(isUsageLabel)),
      color: uniq(scope.flatMap((p) => p.colors ?? []).filter(isColourLabel)),
    }),
    [scope]
  );

  const matches = (p: Product) => {
    if (application && !matchesApplication(p, application)) return false;
    if (finish && p.finish !== finish) return false;
    if (size && !p.sizes.some((s) => s.label === size)) return false;
    if (usage && !(p.usage ?? []).includes(usage)) return false;
    if (color && !(p.colors ?? []).includes(color)) return false;
    if (q) {
      const hay = [
        p.name[locale],
        p.name.en,
        p.brand,
        p.manufacturer,
        p.model,
        p.code,
        ideaInternalCode(p),
        p.collection,
        p.origin,
        ...(p.colors ?? []),
        ...p.sizes.map((s) => s.label),
      ]
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  };

  const sort = params.get("sort") ?? "source";
  const results = distinctStorefrontProducts(scope.filter(matches));
  if (sort !== "source") {
    results.sort((a, b) =>
      sort === "za" ? b.name[locale].localeCompare(a.name[locale]) : a.name[locale].localeCompare(b.name[locale])
    );
  }
  const totalPages = Math.max(1, Math.ceil(results.length / COLLECTION_PAGE_SIZE));
  const requestedPage = Number.parseInt(params.get("page") ?? "1", 10);
  const page = Math.min(Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1), totalPages);
  const pageResults = results.slice((page - 1) * COLLECTION_PAGE_SIZE, page * COLLECTION_PAGE_SIZE);
  const suggestions =
    q && results.length === 1
      ? distinctStorefrontProducts([results[0], ...similarProducts(results[0], products, 12)]).slice(1, 5)
      : [];
  const firstResult = results.length ? (page - 1) * COLLECTION_PAGE_SIZE + 1 : 0;
  const lastResult = Math.min(page * COLLECTION_PAGE_SIZE, results.length);
  const activeCount = [application, finish, size, usage, color].filter(Boolean).length;
  const [mobileOpen, setMobileOpen] = useState(false);
  const clear = () =>
    setParams((old) => {
      const next = new URLSearchParams(old);
      ["finish", "size", "usage", "color", "application", "q", "page"].forEach((k) => next.delete(k));
      return next;
    });
  const goToPage = (nextPage: number) => {
    setFilter("page", String(nextPage));
    window.requestAnimationFrame(() =>
      document.getElementById("product-results")?.scrollIntoView({ behavior: "smooth", block: "start" })
    );
  };

  const meta = category ? COLLECTIONS.find((c) => c.slug === category) : null;
  const formatTitle =
    format === "large"
      ? { en: "Large-format tiles", ar: "بلاط بمقاسات كبيرة", fr: "Carrelage grand format" }[locale]
      : format === "outdoor20"
        ? { en: "20 mm outdoor tiles", ar: "بلاط خارجي 20 مم", fr: "Carrelage extérieur 20 mm" }[locale]
        : null;
  const materialTitle =
    material === "marble"
      ? { en: "Marble surfaces", ar: "أسطح رخامية", fr: "Surfaces marbrées" }[locale]
      : material === "tiles"
        ? { en: "Tiles", ar: "بلاط", fr: "Carrelage" }[locale]
        : null;
  const catalogueSummary =
    locale === "ar"
      ? `${products.length} منتجًا في الكتالوج الحالي · ${ART_CERAMIC_CATALOGUE.totalImages} مرجع صورة لـ Art Ceramic`
      : locale === "fr"
        ? `${products.length} produits dans le catalogue actuel · ${ART_CERAMIC_CATALOGUE.totalImages} références d’images Art Ceramic`
        : `${products.length} products in the current catalogue · ${ART_CERAMIC_CATALOGUE.totalImages} Art Ceramic gallery image references`;

  const group = (label: string, values: string[], val: string | null, set: (v: string | null) => void) =>
    values.length > 1 && (
      <div style={{ marginBottom: "var(--idea-space-4)" }}>
        <div className="idea-eyebrow" style={{ color: "var(--idea-text-muted)", marginBottom: 10 }}>
          {label}
        </div>
        <div className="idea-glass-tablist idea-glass-tablist--wrap" role="group" aria-label={label}>
          {values.map((v) => (
            <Chip key={v} active={val === v} onClick={() => set(val === v ? null : v)}>
              {v}
            </Chip>
          ))}
        </div>
      </div>
    );

  return (
    <Section style={{ paddingTop: "var(--idea-space-7)" }}>
      <Container>
        <div style={{ marginBottom: "var(--idea-space-6)" }}>
          <div className="idea-eyebrow">
            {locale === "ar" ? "كتالوج المنتجات" : locale === "fr" ? "Catalogue produits" : "Product catalogue"}
          </div>
          <h1
            className="idea-display"
            style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 0" }}
          >
            {formatTitle ?? (meta ? meta.title[locale] : materialTitle ?? t("nav.products"))}
          </h1>
          {q && <p style={{ color: "var(--idea-text-muted)", marginTop: 8 }}>“{q}”</p>}
          {!q && !meta && (
            <p style={{ color: "var(--idea-text-muted)", marginTop: "var(--idea-space-2)", fontSize: "var(--idea-text-sm)" }}>
              {catalogueSummary}
            </p>
          )}
        </div>

        <div
          className="idea-filter-toolbar"
          style={{
            display: "none",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "var(--idea-space-3)",
            marginBottom: "var(--idea-space-4)",
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 18px",
              background: "var(--idea-surface)",
              border: "var(--idea-hairline)",
              borderRadius: "var(--idea-radius-full)",
              color: "var(--idea-text)",
              cursor: "pointer",
              fontFamily: "var(--idea-font-body)",
              fontSize: "var(--idea-text-sm)",
            }}
          >
            <SlidersHorizontal size={16} color="var(--idea-gold)" />
            {t("filters.title")}
            {activeCount > 0 && (
              <span
                style={{
                  minWidth: 20,
                  height: 20,
                  display: "inline-grid",
                  placeItems: "center",
                  padding: "0 6px",
                  borderRadius: "var(--idea-radius-full)",
                  background: "var(--idea-gold)",
                  color: "var(--idea-on-gold)",
                  fontSize: "var(--idea-text-xs)",
                  fontWeight: 600,
                }}
              >
                {activeCount}
              </span>
            )}
          </button>
          <span style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>
            {results.length} {t("label.results")}
          </span>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "260px 1fr", gap: "var(--idea-space-6)", alignItems: "start" }}
          className="idea-gallery-grid"
        >
          {mobileOpen && (
            <div
              onClick={() => setMobileOpen(false)}
              className="idea-filter-scrim"
              style={{ display: "none", position: "fixed", inset: 0, zIndex: 60, background: "var(--idea-scrim)" }}
            />
          )}
          <aside
            className={`idea-filters-panel${mobileOpen ? " is-open" : ""}`}
            style={{
              background: "transparent",
              border: 0,
              borderRadius: "var(--idea-radius-lg)",
              padding: "var(--idea-space-5)",
              position: "sticky",
              top: 90,
              maxHeight: "calc(100dvh - 114px)",
              overflowY: "auto",
              overscrollBehavior: "contain",
              scrollbarGutter: "stable",
              scrollbarWidth: "thin",
              backdropFilter: "blur(20px) saturate(1.4)",
              WebkitBackdropFilter: "blur(20px) saturate(1.4)",
              boxShadow: "0 12px 34px rgba(18, 24, 32, 0.06)",
            }}
          >
            <button
              className="idea-filter-close"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "none",
                position: "absolute",
                insetInlineEnd: "var(--idea-space-4)",
                top: "var(--idea-space-4)",
                background: "none",
                border: "none",
                color: "var(--idea-text-muted)",
                cursor: "pointer",
              }}
            >
              <X size={20} />
            </button>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "var(--idea-space-4)",
              }}
            >
              <span className="idea-display" style={{ fontSize: "var(--idea-text-lg)", color: "var(--idea-text)" }}>
                {t("filters.title")}
              </span>
              <button
                onClick={clear}
                style={{
                  background: "none",
                  border: "none",
                  color: "var(--idea-gold)",
                  cursor: "pointer",
                  fontSize: "var(--idea-text-xs)",
                }}
              >
                {t("filters.clear")}
              </button>
            </div>
            {group(
              locale === "ar" ? "الاستخدام" : locale === "fr" ? "Application" : "Application",
              facets.application,
              application,
              (v) => setFilter("application", v)
            )}
            {group(t("filters.finish"), facets.finish, finish, setFinish)}
            {group(t("filters.size"), facets.size, size, setSize)}
            {group(t("label.usage"), facets.usage, usage, setUsage)}
            {group(locale === "ar" ? "اللون" : locale === "fr" ? "Couleur" : "Colour", facets.color, color, setColor)}
            <button
              className="idea-filter-show"
              onClick={() => setMobileOpen(false)}
              style={{
                display: "none",
                width: "100%",
                marginTop: "var(--idea-space-4)",
                padding: "12px 20px",
                background: "linear-gradient(135deg, var(--idea-gold-bright), var(--idea-gold))",
                color: "var(--idea-on-gold)",
                border: "none",
                borderRadius: "var(--idea-radius-md)",
                cursor: "pointer",
                fontFamily: "var(--idea-font-body)",
                fontSize: "var(--idea-text-sm)",
                fontWeight: 600,
                letterSpacing: "0.04em",
                textTransform: "uppercase",
              }}
            >
              {results.length} {t("label.results")}
            </button>
          </aside>

          <div id="product-results" style={{ minWidth: 0, scrollMarginTop: 100 }}>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const data = new FormData(e.currentTarget);
                setFilter("q", String(data.get("q") ?? "").trim());
              }}
              style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 24 }}
            >
              <input
                key={q}
                name="q"
                defaultValue={q}
                aria-label={locale === "ar" ? "البحث بالاسم" : locale === "fr" ? "Recherche par nom" : "Search by name"}
                placeholder={
                  locale === "ar"
                    ? "اسم الشركة أو البراند أو كود البلاطة"
                    : locale === "fr"
                      ? "Code, marque ou fabricant"
                      : "Product code, brand or manufacturer"
                }
                style={{ flex: "1 1 180px", minWidth: 0, padding: "11px 16px", color: "var(--idea-text)", borderRadius: 12 }}
              />
              <button type="submit" className="idea-discovery-submit">
                {locale === "ar" ? "ابحث" : locale === "fr" ? "Rechercher" : "Search"}
              </button>
              <select
                aria-label={locale === "ar" ? "ترتيب المنتجات" : locale === "fr" ? "Trier les produits" : "Sort products"}
                value={sort}
                onChange={(e) => setFilter("sort", e.target.value)}
                style={{ padding: "11px 16px", color: "var(--idea-text)", borderRadius: 12 }}
              >
                <option value="source">
                  {locale === "ar" ? "ترتيب الكتالوج" : locale === "fr" ? "Ordre du catalogue" : "Catalogue order"}
                </option>
                <option value="az">A → Z</option>
                <option value="za">Z → A</option>
              </select>
            </form>
            <div style={{ color: "var(--idea-text-muted)", marginBottom: "var(--idea-space-4)", fontSize: "var(--idea-text-sm)" }}>
              {firstResult}–{lastResult}{" "}
              {locale === "ar" ? `من ${results.length}` : locale === "fr" ? `sur ${results.length}` : `of ${results.length}`}{" "}
              {t("label.results")}
            </div>
            {results.length === 0 ? (
              <div
                style={{
                  padding: "var(--idea-space-8)",
                  textAlign: "center",
                  border: "1px dashed var(--idea-border)",
                  borderRadius: "var(--idea-radius-lg)",
                  color: "var(--idea-text-muted)",
                  lineHeight: 1.7,
                }}
              >
                {t("empty.products")}
                {(category === "porcelain" || material === "marble" || format) && (
                  <p>
                    {locale === "ar"
                      ? "لا توجد منتجات موثقة بهذه المواصفات في البيانات الحالية. لا يعني ذلك تأكيد عدم توفرها لدى الموردين."
                      : locale === "fr"
                        ? "Aucun produit documenté avec ces spécifications. Cela ne confirme pas l’absence de stock chez les fournisseurs."
                        : "No products are documented with these specifications in the current data. Supplier stock has not been confirmed."}
                  </p>
                )}
                <button
                  onClick={clear}
                  style={{ color: "var(--idea-gold-bright)", background: "none", border: 0, cursor: "pointer", marginTop: 16 }}
                >
                  {t("filters.clear")}
                </button>
              </div>
            ) : (
              <div className="idea-products-showroom-section">
                <div className="idea-material-catalogue" style={{ minHeight: 0, "--mc-orb": "clamp(148px, 14vw, 196px)" } as CSSProperties}>
                  <div className="idea-material-grid">
                    {pageResults.map((p) => (
                      <Material3DProductCard key={p.id} product={p} />
                    ))}
                  </div>
                  {suggestions.length > 0 && (
                    <section className="idea-search-similar">
                      <h2>
                        {locale === "ar"
                          ? "بلاطات وخامات شبيهة بالنتيجة"
                          : locale === "fr"
                            ? "Produits similaires"
                            : "Similar tiles and materials"}
                      </h2>
                      <p>
                        {locale === "ar"
                          ? "اقتراحات حسب الخامة والمقاس والنقشة والتشطيب، وليس حسب السعر لأنه خاص بالإدارة."
                          : "Recommendations by material, size, texture and finish; price similarity is not public."}
                      </p>
                      <div className="idea-material-grid">
                        {suggestions.map((p) => (
                          <Material3DProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    </section>
                  )}
                </div>
                {totalPages > 1 && (
                  <nav
                    className="idea-catalogue-pagination"
                    aria-label={locale === "ar" ? "صفحات المنتجات" : locale === "fr" ? "Pages produits" : "Product pages"}
                  >
                    <button disabled={page === 1} onClick={() => goToPage(page - 1)}>
                      {locale === "ar" ? "السابق" : locale === "fr" ? "Précédent" : "Previous"}
                    </button>
                    <span>
                      {locale === "ar"
                        ? `صفحة ${page} من ${totalPages}`
                        : locale === "fr"
                          ? `Page ${page} sur ${totalPages}`
                          : `Page ${page} of ${totalPages}`}
                    </span>
                    <button disabled={page === totalPages} onClick={() => goToPage(page + 1)}>
                      {locale === "ar" ? "التالي" : locale === "fr" ? "Suivant" : "Next"}
                    </button>
                  </nav>
                )}
              </div>
            )}
          </div>
        </div>
      </Container>
      <style>{`
        @media (max-width: 1200px){ .idea-product-results {grid-template-columns:repeat(2,minmax(0,1fr)) !important;} }
        .idea-catalogue-pagination{
          display:flex;align-items:center;justify-content:center;gap:var(--idea-space-4);
          margin-top:var(--idea-space-7);padding-top:var(--idea-space-5);border-top:var(--idea-hairline);
          color:var(--idea-text-muted);font-size:var(--idea-text-sm);
        }
        .idea-catalogue-pagination button{
          min-height:var(--idea-control-height);padding:var(--idea-space-2) var(--idea-space-5);
          border:var(--idea-hairline);border-radius:var(--idea-radius-full);
          background:var(--idea-surface);color:var(--idea-text);font:inherit;cursor:pointer;
        }
        .idea-catalogue-pagination button:not(:disabled):hover{
          border-color:var(--idea-gold);color:var(--idea-gold);
        }
        @media (max-width: 860px){
          .idea-gallery-grid{ grid-template-columns: 1fr !important; }
          .idea-filter-toolbar{ display: flex !important; }
          .idea-filter-scrim{ display: block !important; }
          .idea-filters-panel{
            position: fixed !important; inset-block: 0; inset-inline-start: 0; z-index: 61;
            width: min(88vw, 360px); max-width: 360px; border-radius: 0 !important;
            overflow-y: auto; top: 0 !important; max-height:none !important; transform: translateX(-100%);
            transition: transform .28s ease; box-shadow: var(--idea-shadow-drawer);
          }
          [dir="rtl"] .idea-filters-panel{ inset-inline-start: auto; inset-inline-end: 0; transform: translateX(100%); }
          .idea-filters-panel.is-open{ transform: translateX(0); }
          .idea-filters-panel:not(.is-open){
            transform: translate3d(calc(-100% - 2px), 0, 0) !important;
            visibility: hidden; pointer-events: none;
          }
          [dir="rtl"] .idea-filters-panel:not(.is-open){ transform: translate3d(calc(100% + 2px), 0, 0) !important; }
          .idea-filters-panel.is-open{ visibility: visible; }
          .idea-filter-close, .idea-filter-show{ display: block !important; }
        }
        @media (max-width: 520px){
          .idea-catalogue-pagination{gap:var(--idea-space-2);justify-content:space-between;}
          .idea-catalogue-pagination button{padding-inline:var(--idea-space-4);}
        }
      `}</style>
    </Section>
  );
}

// ─── Public Export ───────────────────────────────────────────────────────────

export function Products({ fixedCollection }: { fixedCollection?: CollectionSlug }) {
  if (fixedCollection) {
    return <CollectionProducts fixedCollection={fixedCollection} />;
  }
  return <ProductsShowroomCatalogue />;
}
