import { useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronDown, Search, SlidersHorizontal, Check } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { Container } from "./ui";

function uniq<T>(arr: (T | undefined)[]): T[] {
  return [...new Set(arr.filter(Boolean) as T[])];
}

/** Custom Black & Gold dropdown (native <select> can't be themed to match). */
function Dropdown({
  placeholder, value, options, onChange,
}: {
  placeholder: string;
  value: string | null;
  options: { value: string; label: string }[];
  onChange: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((o) => o.value === value);

  return (
    <div ref={ref} style={{ position: "relative" }}
      onBlur={(e) => { if (!ref.current?.contains(e.relatedTarget as Node)) setOpen(false); }}>
      <button type="button" onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
          padding: "12px 16px", background: "var(--idea-bg)", border: "var(--idea-hairline)",
          borderRadius: "var(--idea-radius-md)", cursor: "pointer",
          color: selected ? "var(--idea-text)" : "var(--idea-text-muted)",
          fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)",
        }}>
        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {selected ? selected.label : placeholder}
        </span>
        <ChevronDown size={16} color="var(--idea-gold)" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .2s", flexShrink: 0 }} />
      </button>
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", insetInline: 0, zIndex: 30, maxHeight: 260, overflowY: "auto",
          background: "var(--idea-surface)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)",
          boxShadow: "var(--idea-shadow-lg, 0 20px 40px rgba(0,0,0,.4))", padding: 4,
        }}>
          {options.map((o) => (
            <button type="button" key={o.value} onClick={() => { onChange(o.value === value ? null : o.value); setOpen(false); }}
              style={{
                width: "100%", textAlign: "start", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
                padding: "10px 12px", background: o.value === value ? "var(--idea-gold-soft)" : "transparent", border: "none",
                borderRadius: "var(--idea-radius-sm)", cursor: "pointer", fontFamily: "var(--idea-font-body)",
                fontSize: "var(--idea-text-sm)", color: o.value === value ? "var(--idea-gold-bright)" : "var(--idea-text)",
              }}
              onMouseEnter={(e) => { if (o.value !== value) e.currentTarget.style.background = "var(--idea-surface-2)"; }}
              onMouseLeave={(e) => { if (o.value !== value) e.currentTarget.style.background = "transparent"; }}>
              <span>{o.label}</span>
              {o.value === value && <Check size={14} color="var(--idea-gold-bright)" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function HeroSearchPanel() {
  const { t, locale } = useI18n();
  const { products } = useStore();
  const nav = useNavigate();
  const [tab, setTab] = useState<"filter" | "search">("filter");

  const [collection, setCollection] = useState<string | null>(null);
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [usage, setUsage] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const opts = useMemo(() => ({
    collection: COLLECTIONS.map((c) => ({ value: c.slug, label: c.title[locale] })),
    color: uniq(products.flatMap((p) => p.colors ?? [])).map((v) => ({ value: v, label: v })),
    size: uniq(products.flatMap((p) => p.sizes.map((s) => s.label))).map((v) => ({ value: v, label: v })),
    usage: uniq(products.flatMap((p) => p.usage ?? [])).map((v) => ({ value: v, label: v })),
  }), [products, locale]);

  const applyFilters = () => {
    const params = new URLSearchParams();
    if (color) params.set("color", color);
    if (size) params.set("size", size);
    if (usage) params.set("usage", usage);
    const base = collection ? `/collections/${collection}` : "/products";
    const qs = params.toString();
    nav(qs ? `${base}?${qs}` : base);
  };

  const runSearch = (e: React.FormEvent) => {
    e.preventDefault();
    nav(`/products?q=${encodeURIComponent(q.trim())}`);
  };

  const L = {
    filter: { en: "Filter By", ar: "تصفية حسب", fr: "Filtrer par" },
    search: { en: "Search By", ar: "بحث", fr: "Rechercher" },
    collection: { en: "Select Category", ar: "اختر الفئة", fr: "Catégorie" },
    color: { en: "Select Color", ar: "اختر اللون", fr: "Couleur" },
    size: { en: "Select Size", ar: "اختر المقاس", fr: "Format" },
    usage: { en: "Select Usage", ar: "اختر الاستخدام", fr: "Usage" },
    apply: { en: "Filter", ar: "تصفية", fr: "Filtrer" },
    go: { en: "Search", ar: "ابحث", fr: "Rechercher" },
    ph: { en: "Search ceramics, porcelain, marble, faucets…", ar: "ابحث في السيراميك والبورسلين والرخام والخلاطات…", fr: "Rechercher céramique, porcelaine, marbre…" },
  } as const;

  return (
    <Container className="idea-hero-search-shell" style={{ position: "relative", zIndex: 20, paddingBlock: "var(--idea-space-6)" }}>
      <div style={{
        background: "rgba(14,13,17,.86)", backdropFilter: "blur(16px)",
        border: "1px solid var(--idea-gold-soft)", borderRadius: "var(--idea-radius-lg)",
        boxShadow: "0 30px 60px rgba(0,0,0,.5)", padding: "var(--idea-space-6)", maxWidth: 1000, margin: "0 auto",
      }}>
        {/* Tabs */}
        <div style={{ display: "flex", justifyContent: "center", gap: "var(--idea-space-7)", marginBottom: "var(--idea-space-6)" }}>
          {(["filter", "search"] as const).map((k) => (
            <button key={k} type="button" onClick={() => setTab(k)}
              style={{
                background: "none", border: "none", cursor: "pointer", padding: "0 0 10px",
                fontFamily: "var(--idea-font-display)", fontSize: "var(--idea-text-base)", letterSpacing: "0.04em", textTransform: "uppercase",
                color: tab === k ? "var(--idea-gold-bright)" : "rgba(246,241,230,.6)",
                borderBottom: `2px solid ${tab === k ? "var(--idea-gold)" : "transparent"}`, transition: "color .2s, border-color .2s",
                display: "inline-flex", alignItems: "center", gap: 8,
              }}>
              {k === "filter" ? <SlidersHorizontal size={15} /> : <Search size={15} />}
              {L[k][locale]}
            </button>
          ))}
        </div>

        {tab === "filter" ? (
          <div className="idea-hero-filter-row" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr) auto", gap: "var(--idea-space-3)", alignItems: "center" }}>
            <Dropdown placeholder={L.collection[locale]} value={collection} options={opts.collection} onChange={setCollection} />
            <Dropdown placeholder={L.color[locale]} value={color} options={opts.color} onChange={setColor} />
            <Dropdown placeholder={L.size[locale]} value={size} options={opts.size} onChange={setSize} />
            <Dropdown placeholder={L.usage[locale]} value={usage} options={opts.usage} onChange={setUsage} />
            <button type="button" onClick={applyFilters}
              style={{
                padding: "12px 28px", background: "linear-gradient(135deg, var(--idea-gold-bright), var(--idea-gold))",
                color: "var(--idea-on-gold)", border: "none", borderRadius: "var(--idea-radius-md)", cursor: "pointer",
                fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)", fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", boxShadow: "var(--idea-shadow-gold)",
              }}>
              {L.apply[locale]}
            </button>
          </div>
        ) : (
          <form onSubmit={runSearch} className="idea-hero-filter-row" style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "var(--idea-space-3)", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "var(--idea-bg)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-md)" }}>
              <Search size={16} color="var(--idea-gold)" />
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={L.ph[locale]}
                style={{ background: "transparent", border: "none", outline: "none", color: "var(--idea-text)", width: "100%", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)" }} />
            </div>
            <button type="submit"
              style={{
                padding: "12px 28px", background: "linear-gradient(135deg, var(--idea-gold-bright), var(--idea-gold))",
                color: "var(--idea-on-gold)", border: "none", borderRadius: "var(--idea-radius-md)", cursor: "pointer",
                fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)", fontWeight: 600,
                letterSpacing: "0.06em", textTransform: "uppercase", whiteSpace: "nowrap", boxShadow: "var(--idea-shadow-gold)",
              }}>
              {L.go[locale]}
            </button>
          </form>
        )}
      </div>
      <style>{`@media (max-width: 760px){ .idea-hero-search-shell{ padding-block: var(--idea-space-5) !important; } .idea-hero-filter-row{ grid-template-columns: 1fr !important; } .idea-hero-carousel .idea-hero-content{ padding-block-end: var(--idea-space-8) !important; } }`}</style>
    </Container>
  );
}
