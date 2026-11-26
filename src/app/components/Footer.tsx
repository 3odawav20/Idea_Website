import { Link } from "react-router";
import { ArrowUpRight, CalendarDays, FileText, Layers3, Mail, Sparkles } from "lucide-react";
import { FooterBackgroundGradient, TextHoverEffect } from "@/components/ui/hover-footer";
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
    { title: text("Legal & Licenses", "الشؤون القانونية والتراخيص", "Légal & Licences"), links: [
      ["/legal", text("Legal Center", "المركز القانوني", "Centre légal")],
      ["/privacy", text("Privacy Policy", "سياسة الخصوصية", "Politique de confidentialité")],
      ["/terms", text("Terms of Use", "شروط الاستخدام", "Conditions d'utilisation")],
      ["/refund-policy", text("Orders & Returns", "الطلبات والاسترجاع", "Commandes et retours")],
      ["/cookies", text("Cookie Policy", "ملفات تعريف الارتباط", "Politique de cookies")],
      ["/intellectual-property", text("IP & Disclaimers", "الملكية الفكرية", "Propriété intellectuelle")],
      ["/licenses", text("Software Licenses", "تراخيص البرمجيات", "Licences open source")],
      ["/accessibility", text("Accessibility", "إمكانية الوصول", "Accessibilité")],
    ] },
  ] as const;

  const legalQuickLinks = [
    ["/legal", text("Legal Center", "المركز القانوني", "Centre légal")],
    ["/privacy", text("Privacy", "الخصوصية", "Confidentialité")],
    ["/terms", text("Terms", "الشروط", "Conditions")],
    ["/cookies", text("Cookies", "ملفات الارتباط", "Cookies")],
    ["/refund-policy", text("Returns", "الاسترجاع", "Retours")],
    ["/licenses", text("Licenses", "التراخيص", "Licences")],
  ] as const;

  const contactInfo = [
    { icon: Mail, label: "info@idea-dh.com", href: "mailto:info@idea-dh.com", external: true },
    { icon: CalendarDays, label: text("Contact & appointments", "التواصل والمواعيد", "Contact & rendez-vous"), href: "/contact", external: false },
    { icon: FileText, label: text("Request a quote", "اطلب عرض سعر", "Demander un devis"), href: "/request-quote/new", external: false },
  ];

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

      <div className="idea-hover-footer">
        <div className="idea-hover-footer-inner">
          <div className="idea-footer-body">
            <div className="idea-footer-brand">
              <IdeaLogo />
              <p>{t("tagline")}</p>
              <div className="idea-footer-mini-links">
                <Link to="/room-designer/3d"><Layers3 size={17} aria-hidden="true" /> {text("3D Studio", "استوديو 3D", "Studio 3D")}</Link>
                <Link to="/ai-room-visualizer"><Sparkles size={17} aria-hidden="true" /> {t("nav.visualizer")}</Link>
              </div>
              <ul className="idea-footer-contact" aria-label={text("Contact", "التواصل", "Contact")}>
                {contactInfo.map(({ icon: Icon, label, href, external }) => (
                  <li key={href}>
                    <Icon size={17} aria-hidden="true" />
                    {external ? <a href={href}>{label}</a> : <Link to={href}>{label}</Link>}
                  </li>
                ))}
              </ul>
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
            <nav className="idea-footer-legal-bar" aria-label={text("Legal links", "الروابط القانونية", "Liens légaux")}>
              {legalQuickLinks.map(([to, label]) => (
                <Link key={to} to={to}>{label}</Link>
              ))}
            </nav>
            <span>{text("Private quotes · Product availability confirmed by suppliers", "عروض أسعار خاصة · التوفر يؤكده المورد", "Devis privés · Disponibilité confirmée par les fournisseurs")}</span>
          </div>
        </div>
        <div className="idea-hover-footer-wordmark" dir="ltr">
          <TextHoverEffect text="IDEA" duration={0.2} />
        </div>
        <FooterBackgroundGradient />
      </div>
    </footer>
  );
}
