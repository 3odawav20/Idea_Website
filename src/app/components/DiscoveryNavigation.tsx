import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ChevronDown } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { LOOKS, DESTINATIONS } from "../data/discovery";
import "./DiscoveryNavigation.css";
export function DiscoveryNavigation({ onNavigate }: { onNavigate?: () => void }) {
  const { locale } = useI18n();
  const text = (en:string, ar:string, fr:string) => ({en,ar,fr})[locale];
  const [open,setOpen] = useState<string | null>(null);
  const location = useLocation();
  useEffect(() => { setOpen(null); }, [location.key]);
  const close = () => {setOpen(null); onNavigate?.();};
  const items = [
    {id:"brand",label:text("IDEA", "عن IDEA", "IDEA"),to:"/about"},
    {id:"ceramics",label:text("Ceramic tiles", "السيراميك", "Céramique"),to:"/collections/ceramics"},
    {id:"porcelain",label:text("Porcelain tiles", "البورسلين", "Porcelaine"),to:"/collections/porcelain"},
    {id:"tiles",label:text("Tiles & marble", "البلاط والرخام", "Carrelage & marbre"),to:"/products?material=tiles"},
    {id:"large",label:text("Large formats", "المقاسات الكبيرة", "Grands formats"),to:"/products?format=large"},
    {id:"outdoor",label:text("20 mm outdoor", "خارجي 20 مم", "Extérieur 20 mm"),to:"/products?format=outdoor20"},
    {id:"bath",label:text("Bathrooms", "الحمامات", "Salles de bain"),to:"/collections/sanitary-ware"},
  ];
  const resources = [
    ["/showrooms",text("Showrooms","المعارض","Showrooms")], ["/downloads",text("Downloads","التنزيلات","Téléchargements")],
    ["/projects",text("Projects","المشروعات","Projets")], ["/journal",text("News & guides","الأخبار والأدلة","Actualités & guides")],
    ["/contact",text("Contact","التواصل","Contact")], ["/products",text("Marketplace","الماركت","Catalogue")],
  ];
  return <nav className="idea-discovery-nav" aria-label={text("Explore IDEA", "استكشف IDEA", "Explorer IDEA")} onKeyDown={e => {if(e.key === "Escape") {setOpen(null); (e.target as HTMLElement).closest(".idea-discovery-nav-item")?.querySelector("button")?.focus();}}}>
    <div className="idea-discovery-nav-main">{items.map(item => <div key={item.id} className="idea-discovery-nav-item" onBlur={e => {if(!e.currentTarget.contains(e.relatedTarget)) setOpen(current => current === item.id ? null : current);}}>
      <button aria-expanded={open === item.id} aria-controls={`nav-${item.id}`} onClick={() => setOpen(open === item.id ? null : item.id)}>{item.label}<ChevronDown size={13}/></button>
      {open === item.id && <div className="idea-discovery-menu" id={`nav-${item.id}`}>
        <div><h3>{item.label}</h3><Link to={item.to} onClick={close}>{text("View collection", "تصفح القسم", "Voir la collection")}</Link>
          {item.id === "brand" ? <>{[["/about",text("Our approach","فكرتنا","Notre approche")],["/how-it-works",text("How it works","طريقة الاستخدام","Fonctionnement")],["/subscriptions",text("Memberships","العضويات","Abonnements")],["/register/business",text("For professionals","للمحترفين والشركات","Professionnels")]].map(([to,label]) => <Link key={to} to={to} onClick={close}>{label}</Link>)}</> : item.id === "bath" ? <>{[["sanitary-ware",text("Basins & sanitary ware","الأحواض والأدوات الصحية","Vasques & sanitaires")],["bathtubs",text("Bathtubs","البانيوهات","Baignoires")],["faucets",text("Faucets","الخلاطات","Robinetterie")],["shower-units",text("Showers","الدش","Douches")],["bathroom-units",text("Bathroom furniture","وحدات الحمام","Meubles de bain")]].map(([slug,label]) => <Link key={slug} to={`/collections/${slug}`} onClick={close}>{label}</Link>)}</> : <><Link to={`/products?category=${item.id === "porcelain" ? "porcelain" : "ceramics"}&application=Floor`} onClick={close}>{text("Floor tiles","بلاط الأرضيات","Sols")}</Link><Link to={`/products?category=${item.id === "porcelain" ? "porcelain" : "ceramics"}&application=Wall`} onClick={close}>{text("Wall tiles","بلاط الحوائط","Murs")}</Link></>}
        </div>
        <div><h3>{text("Looks · inspiration","شكل الخامة · إلهام","Aspects · inspiration")}</h3>{LOOKS.map(look => <Link key={look.id} to={`/tile-showroom/${look.id}`} onClick={close}>{look.label[locale]}</Link>)}</div>
        <div><h3>{text("Destination of use","المساحة والاستخدام","Destination")}</h3>{DESTINATIONS.map(d => <Link key={d.id} to={`/inspiration/${d.id}`} onClick={close}>{d.label[locale]}</Link>)}</div>
        <div><h3>{text("Explore & plan","استكشف وخطط","Explorer & concevoir")}</h3><Link to="/products?format=large" onClick={close}>{text("Large formats","مقاسات كبيرة","Grands formats")}</Link><Link to="/products?format=outdoor20" onClick={close}>{text("20 mm outdoor","خارجي 20 مم","Extérieur 20 mm")}</Link><Link to="/room-designer" onClick={close}>{text("Room configurator","مصمم الغرف","Configurateur")}</Link><Link to="/downloads" onClick={close}>{text("Catalogue & downloads","الكتالوج والتنزيلات","Catalogue & téléchargements")}</Link><Link to="/glossary" onClick={close}>{text("Tile glossary","دليل المصطلحات","Glossaire")}</Link></div>
      </div>}
    </div>)}</div>
    <div className="idea-discovery-nav-utility">{resources.map(([to,label]) => <Link key={to} to={to} onClick={close}>{label}</Link>)}</div>
  </nav>;
}
