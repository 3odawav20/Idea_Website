import { Link } from "react-router";
import { Building2, UserRound, ArrowRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Container, Section, Button } from "../components/ui";

export function useMembershipText() {
  const { locale } = useI18n();
  return (en: string, ar: string) => locale === "ar" ? ar : en;
}

export function MembershipChoices({ subscriptions = false }: { subscriptions?: boolean }) {
  const text = useMembershipText();
  return <Section><Container style={{ maxWidth: 1000 }}>
    <div style={{ textAlign: "center", marginBottom: 32 }}>
      <div className="idea-eyebrow">{text("JOIN IDEA", "انضم إلى IDEA")}</div>
      <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", margin: "12px 0" }}>{subscriptions ? text("A membership for your needs", "اشتراك يناسب احتياجك") : text("Choose your account", "اختار نوع حسابك")}</h1>
      <p style={{ color: "var(--idea-text-muted)" }}>{text("Shopping for your space, or showcasing your business? Start here.", "بتجهّز بيتك، ولا بتعرض منتجات شركتك؟ ابدأ من هنا.")}</p>
    </div>
    <div className="idea-access-grid">
      {(["customer", "business"] as const).map(audience => {
        const business = audience === "business", Icon = business ? Building2 : UserRound;
        return <article className="idea-access-card" key={audience} data-account-type={audience}>
          <Icon size={32} color="var(--idea-gold)" />
          <h2>{business ? text("Company / supplier account", "حساب شركة أو مورد") : text("Customer account", "حساب عميل")}</h2>
          <p>{business ? text("Showcase your company, brands and ceramic, porcelain and marble products.", "اعرض بيانات شركتك وعلاماتك التجارية ومنتجات السيراميك والبورسلين والرخام.") : text("Find your tiles, preview them in your room and request supplier quotations.", "اختار خاماتك، جرّبها في صورة غرفتك، واطلب عروض أسعار من الموردين.")}</p>
          <ul>{(business ? [text("Company profile and contact details", "ملف الشركة وبيانات التواصل"), text("Upload product photos and specifications", "رفع صور المنتجات ومواصفاتها"), text("Company verification before public publishing", "مراجعة الشركة قبل النشر للجمهور")] : [text("Browse and save your favourite materials", "تصفح الخامات واحفظ المفضلة"), text("Room visualizer for customer accounts", "تصميم الغرفة متاح لحسابات العملاء"), text("Private quotation requests", "طلبات عروض أسعار خاصة")]).map(item => <li key={item}>{item}</li>)}</ul>
          <Link to={subscriptions ? `/subscriptions/${business ? "businesses" : "customers"}` : `/register/${audience}`}><Button style={{ width: "100%" }}>{business ? text("Join as a company", "سجّل كشركة") : text("Join as a customer", "سجّل كعميل")}<ArrowRight size={16} /></Button></Link>
          <Link to={subscriptions ? `/register/${audience}` : `/subscriptions/${business ? "businesses" : "customers"}`} style={{ color: "var(--idea-text-muted)", textAlign: "center", fontSize: "var(--idea-text-sm)" }}>{subscriptions ? text("Create your account", "إنشاء الحساب") : text("View membership", "عرض الاشتراك")}</Link>
        </article>;
      })}
    </div>
    <p style={{ textAlign: "center", marginTop: 24, fontSize: "var(--idea-text-sm)" }}>{text("Already a member?", "عندك حساب؟")} <Link to="/login" style={{ color: "var(--idea-gold)" }}>{text("Sign in", "تسجيل الدخول")}</Link></p>
  </Container></Section>;
}
