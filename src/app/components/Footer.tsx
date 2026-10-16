import { Link } from "react-router";
import { useI18n } from "../i18n/i18n";
import { Container } from "./ui";
import { IdeaLogo } from "./IdeaLogo";
export function Footer() {
  const { locale, t } = useI18n();
  const text=(en:string,ar:string,fr:string)=>({en,ar,fr})[locale];
  const groups = [
    {title:text("IDEA","عن IDEA","IDEA"),links:[["/about",text("Our approach","فكرتنا","Notre approche")],["/how-it-works",t("nav.how")],["/subscriptions",t("nav.subscriptions")],["/register/business",text("Professionals","المحترفون والشركات","Professionnels")]]},
    {title:text("Products","المنتجات","Produits"),links:[["/collections/ceramics",text("Ceramic tiles","السيراميك","Céramique")],["/collections/porcelain",text("Porcelain tiles","البورسلين","Porcelaine")],["/products?material=tiles",text("Tiles","البلاط","Carrelage")],["/products?material=marble",text("Marble","الرخام","Marbre")],["/products?format=large",text("Large formats","المقاسات الكبيرة","Grands formats")],["/collections",text("Bathroom collections","أقسام الحمامات","Collections de bain")]]},
    {title:text("Explore","استكشف","Explorer"),links:[["/showrooms",text("Showrooms","المعارض","Showrooms")],["/projects",text("Projects","المشروعات","Projets")],["/journal",text("News & guides","الأخبار والأدلة","Actualités & guides")],["/videos",text("Videos","الفيديوهات","Vidéos")],["/downloads",text("Downloads","التنزيلات","Téléchargements")],["/glossary",text("Tile glossary","دليل المصطلحات","Glossaire")]]},
    {title:text("Connect & plan","تواصل وخطط","Contact & conception"),links:[["/contact",text("Contact & appointments","التواصل والمواعيد","Contact & rendez-vous")],["/room-designer",t("nav.roomDesigner")],["/tile-showroom",text("Online showroom","المعرض الإلكتروني","Showroom virtuel")],["/favorites",t("fav.title")],["/request-quote/new",text("Request a quote","اطلب عرض سعر","Demander un devis")],["/updates",text("Email updates","التحديثات البريدية","Actualités email")]]},
  ];
  return <footer style={{borderTop:"var(--idea-hairline)",background:"var(--idea-bg-2)",paddingTop:56,marginTop:48}}>
    <Container><IdeaLogo/><p style={{color:"var(--idea-text-muted)",fontSize:14,marginBlock:"16px 32px"}}>{t("tagline")}</p></Container>
    <Container className="idea-footer-groups" style={{display:"grid",gridTemplateColumns:"repeat(4,minmax(0,1fr))",gap:32,paddingBottom:40}}>{groups.map(g=><div key={g.title}><h2 style={{fontSize:13,fontWeight:600,color:"var(--idea-text)",margin:"0 0 18px"}}>{g.title}</h2><div style={{display:"flex",flexDirection:"column",gap:12}}>{g.links.map(([to,label])=><Link key={to} to={to} style={{color:"var(--idea-text-muted)",textDecoration:"none",fontSize:13,lineHeight:1.5}}>{label}</Link>)}</div></div>)}</Container>
    <Container style={{borderTop:"var(--idea-hairline)",paddingBlock:20,display:"flex",justifyContent:"space-between",gap:16,flexWrap:"wrap",fontSize:12,color:"var(--idea-text-muted)"}}><span>© {new Date().getFullYear()} IDEA. {text("All rights reserved.","جميع الحقوق محفوظة.","Tous droits réservés.")}</span><span>{text("Private quotes · Product availability confirmed by suppliers","عروض أسعار خاصة · التوفر يؤكده المورد","Devis privés · Disponibilité confirmée par les fournisseurs")}</span></Container>
    <style>{`@media(max-width:700px){.idea-footer-groups{grid-template-columns:repeat(2,minmax(0,1fr)) !important;gap:32px 20px !important;}}`}</style>
  </footer>;
}
