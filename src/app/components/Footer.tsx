import { Link } from "react-router";
import { ArrowUpRight, Layers3, Sparkles } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { IdeaLogo } from "./IdeaLogo";
import "./Footer.css";

export function Footer() {
  const { locale, t } = useI18n();
  const text = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  const groups = [
    { title: text("IDEA", "عن IDEA", "IDEA"), links: [
      ["/about", text("Our approach", "فكرتنا", "Notre approche")],
      ["/how-it-works", t("nav.how")],
      ["/subscriptions", t("nav.subscriptions")],
      ["/register/business", text("Professionals", "المحترفون والشركات", "Professionnels")],
    ] },
    { title: text("Products", "المنتجات", "Produits"), links: [
      ["/collections/ceramics", text("Ceramic tiles", "السيراميك", "Céramique")],
      ["/collections/porcelain", text("Porcelain tiles", "البورسلين", "Porcelaine")],
      ["/products?material=tiles", text("Tiles", "البلاط", "Carrelage")],
      ["/products?material=marble", text("Marble", "الرخام", "Marbre")],
      ["/products?format=large", text("Large formats", "المقاسات الكبيرة", "Grands formats")],
      ["/collections", text("Bathroom collections", "أقسام الحمامات", "Collections de bain")],
    ] },
    { title: text("Explore", "استكشف", "Explorer"), links: [
      ["/showrooms", text("Showrooms", "المعارض", "Showrooms")],
      ["/projects", text("Projects", "المشروعات", "Projets")],
      ["/journal", text("News & guides", "الأخبار والأدلة", "Actualités & guides")],
      ["/videos", text("Videos", "الفيديوهات", "Vidéos")],
      ["/downloads", text("Downloads", "التنزيلات", "Téléchargements")],
      ["/glossary", text("Tile glossary", "دليل المصطلحات", "Glossaire")],
    ] },
    { title: text("Connect & plan", "تواصل وخطط", "Contact & conception"), links: [
      ["/contact", text("Contact & appointments", "التواصل والمواعيد", "Contact & rendez-vous")],
      ["/room-designer/3d", text("Offline 3D Studio", "استوديو 3D بدون AI", "Studio 3D hors ligne")],
      ["/ai-room-visualizer", t("nav.visualizer")],
      ["/favorites", t("fav.title")],
      ["/request-quote/new", text("Request a quote", "اطلب عرض سعر", "Demander un devis")],
      ["/updates", text("Email updates", "التحديثات البريدية", "Actualités email")],
    ] },
  ] as const;

  return (
    <footer className="idea-editorial-footer">
      <div className="idea-footer-promo">
        <div className="idea-footer-promo-copy">
          <span className="idea-footer-kicker"><span /> {text("IMAGINE WHAT'S NEXT", "تخيّل مساحتك الجاية", "IMAGINEZ LA SUITE")}</span>
          <h2>{text("A new space.", "مساحة جديدة.", "Un nouvel espace.")}<br /><em>{text("A new perspective.", "ورؤية مختلفة.", "Une nouvelle perspective.")}</em></h2>
          <p>{text("Discover surfaces that transform the way you see your space.", "اكتشف خامات تغير نظرتك لمساحتك.", "Découvrez des surfaces qui transforment votre espace.")}</p>
          <Link to="/products">{text("Explore our collection", "استكشف مجموعتنا", "Explorer la collection")} <ArrowUpRight size={19} aria-hidden="true" /></Link>
        </div>
        <div className="idea-footer-promo-image" role="img" aria-label={text("Premium surface inspiration", "إلهام لخامات راقية", "Inspiration surfaces haut de gamme")} />
      </div>

      <div className="idea-footer-body">
        <div className="idea-footer-brand">
          <IdeaLogo />
          <p>{t("tagline")}</p>
          <div className="idea-footer-mini-links">
            <Link to="/room-designer/3d"><Layers3 size={17} aria-hidden="true" /> {text("3D Studio", "استوديو 3D", "Studio 3D")}</Link>
            <Link to="/ai-room-visualizer"><Sparkles size={17} aria-hidden="true" /> {t("nav.visualizer")}</Link>
          </div>
        </div>
        <nav className="idea-footer-nav" aria-label={text("Footer navigation", "روابط أسفل الموقع", "Navigation pied de page")}>
          {groups.map(g => (
            <div className="idea-footer-group" key={g.title}>
              <h3>{g.title}</h3>
              <div>{g.links.map(([to, label]) => <Link key={to} to={to}>{label}</Link>)}</div>
            </div>
          ))}
        </nav>
      </div>
      <div className="idea-footer-bottom">
        <span>© {new Date().getFullYear()} IDEA. {text("All rights reserved.", "جميع الحقوق محفوظة.", "Tous droits réservés.")}</span>
        <span>{text("Private quotes · Product availability confirmed by suppliers", "عروض أسعار خاصة · التوفر يؤكده المورد", "Devis privés · Disponibilité confirmée par les fournisseurs")}</span>
      </div>
    </footer>
  );
}
