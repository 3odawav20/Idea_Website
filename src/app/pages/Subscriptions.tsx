import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Building2, UserRound, Check } from "lucide-react";
import { useBackend } from "../backend/db";
import { accountRequest } from "../backend/accountsApi";
import { Container, Section, Button } from "../components/ui";
import { Panel } from "../components/dash";
import { MembershipChoices, useMembershipText } from "./Membership";

export function SubscriptionsHome() { return <MembershipChoices subscriptions />; }

export function SubscriptionPanel({ audience }: { audience: "customer" | "business" }) {
  const text = useMembershipText(), { session } = useBackend(), nav = useNavigate();
  const business = audience === "business", Icon = business ? Building2 : UserRound;
  const [interval, setInterval] = useState<"monthly" | "annual">("monthly"), [state, setState] = useState<"idle" | "busy" | "saved" | "error">("idle");
  useEffect(() => {
    if (!session) return;
    let active = true;
    void accountRequest('session').then(({membership: data}) => {
      if (active && data?.audience === audience && data.status !== "cancelled") {
        setInterval(data.billing_interval === "annual" ? "annual" : "monthly"); setState("saved");
      }
    }).catch(() => {});
    return () => { active = false; };
  }, [session?.id, audience]);
  const choose = async () => {
    if (!session) { nav(`/register/${audience}?interval=${interval}`); return; }
    if (session.role !== (business ? "business" : "customer")) { setState("error"); return; }
    setState("busy");
    try {
      await accountRequest('membership',{audience,interval}); setState('saved');
    } catch { setState("error"); }
  };
  return <div style={{ maxWidth: 760, margin: "0 auto" }}>
    <Panel>
      <Icon size={32} color="var(--idea-gold)" />
      <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", margin: "16px 0" }}>{business ? text("Company membership", "اشتراك الشركات") : text("Customer membership", "اشتراك العملاء")}</h1>
      <p style={{ color: "var(--idea-text-muted)", lineHeight: 1.9 }}>{business ? text("Create your company profile and prepare your product catalogue for review.", "أنشئ ملف شركتك وجهّز كتالوج منتجاتك للمراجعة.") : text("A free account to browse materials, save favourites and request quotations.", "حساب مجاني لتصفح الخامات وحفظ المفضلة وطلب عروض الأسعار.")}</p>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "24px 0" }}>{(["monthly", "annual"] as const).map(value => <Button key={value} variant={interval === value ? "gold" : "ghost"} type="button" onClick={() => setInterval(value)} aria-pressed={interval === value}>{value === "monthly" ? text("Monthly", "شهري") : text("Annual", "سنوي")}</Button>)}</div>
      <ul style={{ paddingInlineStart: 20, color: "var(--idea-text-muted)", lineHeight: 2.2 }}>
        {(business ? [text("Company information and contact details", "بيانات الشركة ووسائل التواصل"), text("Upload your tile, marble and porcelain products", "رفع منتجات السيراميك والرخام والبورسلين"), text("Products become public after company verification", "نشر المنتجات بعد اعتماد الشركة")] : [text("Customer account: free", "حساب العميل: مجاني"), text("Private supplier quotation requests", "طلبات عروض أسعار خاصة للموردين"), text("Access to the room visualizer", "الدخول إلى مصمم الغرفة")]).map(item => <li key={item}>{item}</li>)}
      </ul>
      <p style={{ padding: 16, background: "var(--idea-surface-2)", borderRadius: 8, fontSize: "var(--idea-text-sm)", lineHeight: 1.9 }}>{business ? text("Company applications are reviewed. Paid plan prices and payment options will be shown when available; submitting this request does not charge you.", "طلبات اشتراك الشركات بتخضع للمراجعة. أسعار الباقات المدفوعة وطرق الدفع هتظهر عند إتاحتها؛ إرسال الطلب لا يخصم أي مبلغ.") : text("AI generation needs an enabled image service. Paid generation packages will be shown separately when available.", "توليد الصور يحتاج خدمة صور مفعّلة. باقات التوليد المدفوعة هتظهر بشكل منفصل عند إتاحتها.")}</p>
      {state === "saved" ? <p role="status" style={{ color: "var(--idea-success)" }}><Check size={18} /> {business ? text("Your company membership request was saved for review.", "تم حفظ طلب اشتراك شركتك للمراجعة.") : text("Your free customer membership is active.", "اشتراك العميل المجاني مفعّل.")}</p> : <Button onClick={() => void choose()} disabled={state === "busy"}>{state === "busy" ? text("Saving…", "جارٍ الحفظ…") : business ? text("Request company membership", "طلب اشتراك شركة") : text("Start your free membership", "ابدأ اشتراكك المجاني")}</Button>}
      {state === "error" && <p role="alert">{text("We could not save this membership. Sign in with the matching account type and try again.", "تعذّر حفظ الاشتراك. سجّل الدخول بنوع الحساب المناسب وحاول مرة أخرى.")}</p>}
    </Panel>
    <Link to={`/subscriptions/${business ? "customers" : "businesses"}`} style={{ display: "block", textAlign: "center", padding: 24, color: "var(--idea-gold)" }}>{business ? text("Looking for a customer membership?", "بتدور على اشتراك عميل؟") : text("Looking for a company membership?", "بتدور على اشتراك شركة؟")}</Link>
  </div>;
}
export function SubscriptionsCustomers() { return <Section><Container><SubscriptionPanel audience="customer" /></Container></Section>; }
export function SubscriptionsBusinesses() { return <Section><Container><SubscriptionPanel audience="business" /></Container></Section>; }
export function AccountSubscription() { return <SubscriptionPanel audience="customer" />; }
export function BusinessSubscription() { return <SubscriptionPanel audience="business" />; }
