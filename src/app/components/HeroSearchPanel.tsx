import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Search, SlidersHorizontal } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useStore } from "../store/store";
import { COLLECTIONS } from "../data/catalog";
import { unique, isColourLabel } from "../data/discovery";
import "./Discovery.css";

export function HeroSearchPanel({ advanced = false }: { advanced?: boolean }) {
  const uiText = useLocaleText();

  const { locale } = useI18n();
  const { products } = useStore();
  const nav = useNavigate();
  const text = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  const [tab, setTab] = useState("filter");
  const [category, setCategory] = useState("");
  const [filters, setFilters] = useState<Record<string,string>>({});
  const [q, setQ] = useState("");
  const keys = ["application", "finish", "color", "size"];
  const scope = useMemo(() => products.filter(p => !category || p.collection === category), [products, category]);
  const values = (key: string) => unique(scope.filter(p => keys.slice(0,keys.indexOf(key)).every(k => !filters[k] || (k === "size" ? p.sizes.some(s => s.label === filters[k]) : k === "color" ? p.colors?.includes(filters[k]) : p[k as "application" | "finish"] === filters[k])))
    .flatMap(p => key === "size" ? p.sizes.map(s => s.label) : key === "color" ? (p.colors ?? []).filter(isColourLabel) : [p[key as "application" | "finish"]]));
  const labels: Record<string,string> = {
    application: text("Application", "الاستخدام", "Application"), finish: text("Finish", "التشطيب", "Finition"),
    color: text("Colour", "اللون", "Couleur"), size: text("Size", "المقاس", "Format"),
  };
  const go = (e: React.FormEvent) => {
    e.preventDefault(); const params = new URLSearchParams();
    if (tab === "search") { if(q.trim()) params.set("q", q.trim()); }
    else { if(category) params.set("category", category); for(const [k,v] of Object.entries(filters)) if(v) params.set(k,v); }
    nav(`/products?${params.toString()}`);
  };
  return <section className={`idea-discovery-search${advanced ? " is-advanced" : ""}`} aria-label={uiText(text("Product finder", "البحث عن المنتجات", "Recherche produits"))}>
    {uiText(advanced && <h2>{uiText(text("Advanced search", "البحث المتقدم", "Recherche avancée"))}</h2>)}
    <div className="idea-discovery-tabs" role="tablist" aria-label={uiText(text("Search method", "طريقة البحث", "Méthode de recherche"))}>
      {uiText(["filter", "search"].map(k => <button key={k} role="tab" aria-selected={tab === k} aria-controls={`${advanced ? "advanced" : "hero"}-finder`} id={`${advanced ? "advanced" : "hero"}-${k}`} onClick={() => setTab(k)}>{uiText(k === "filter" ? <SlidersHorizontal size={16}/> : <Search size={16}/>)} {uiText(k === "filter" ? text("Filter by", "تصفية حسب", "Filtrer par") : text("Search by name", "البحث بالاسم", "Recherche par nom"))}</button>))}
    </div>
    <form id={`${advanced ? "advanced" : "hero"}-finder`} role="tabpanel" aria-labelledby={`${advanced ? "advanced" : "hero"}-${tab}`} onSubmit={go} className={`idea-discovery-form${tab === "search" ? " is-name" : ""}`}>
      {uiText(tab === "search" ? <label>{uiText(text("Product name or code", "اسم المنتج أو الكود", "Nom ou référence"))}<input aria-label={uiText(text("Product name or code", "اسم المنتج أو الكود", "Nom ou référence"))} value={q} onChange={e => setQ(e.target.value)} placeholder={uiText(text("Search the catalogue…", "ابحث في الكتالوج…", "Rechercher dans le catalogue…"))}/></label> : <>
        <label>{uiText(text("Category", "الفئة", "Catégorie"))}<select aria-label={uiText(text("Category", "الفئة", "Catégorie"))} value={category} onChange={e => {setCategory(e.target.value); setFilters({});}} required><option value="">{uiText(text("Choose category first", "اختر الفئة أولًا", "Choisir une catégorie"))}</option>{uiText(COLLECTIONS.filter(c => products.some(p => p.collection === c.slug)).map(c => <option key={c.slug} value={c.slug}>{uiText(c.title[locale])}</option>))}</select></label>
        {uiText(keys.map((key,index) => <label key={key}>{uiText(labels[key])}<select aria-label={uiText(labels[key])} disabled={!category || !values(key).length} value={filters[key] ?? ""} onChange={e => setFilters(old => Object.fromEntries([...keys.slice(0,index).map(k => [k,old[k] ?? ""]),[key,e.target.value]]))}><option value="">{uiText(category && !values(key).length ? text("Not specified", "غير محدد", "Non précisé") : text("All", "الكل", "Tous"))}</option>{uiText(values(key).map(v => <option key={v} value={v}>{uiText(v)}</option>))}</select></label>))}
      </>)}
      <button className="idea-discovery-submit" type="submit"><Search size={17}/>{uiText(text("Search", "ابحث", "Rechercher"))}</button>
    </form>
    {uiText(!category && tab === "filter" && <p className="idea-discovery-note">{uiText(text("Choose a category to see its available filters.", "اختر الفئة لعرض خياراتها المتاحة.", "Choisissez une catégorie pour afficher ses filtres."))}</p>)}
    {uiText(!advanced && <div className="idea-discovery-shortcuts"><Link to="/subscriptions">{uiText(text("Memberships", "العضويات", "Abonnements"))}</Link><Link to="/register/business">{uiText(text("For professionals", "للمحترفين والشركات", "Pour les professionnels"))}</Link><Link to="/room-designer">{uiText(text("Room designer", "مصمم الغرف", "Configurateur"))}</Link></div>)}
  </section>;
}
