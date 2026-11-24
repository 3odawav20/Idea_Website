import { Outlet, NavLink, useNavigate } from "react-router";
import { ShieldAlert } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import { Container, Section, SectionHeader, Button } from "../components/ui";
import { Panel, StatusBadge, DashBanner } from "../components/dash";

export function AdminLayout() {
  const { t } = useI18n();
  const { session } = useBackend();
  const nav = useNavigate();
  if (!session || session.role !== "admin") {
    return (
      <Section style={{ paddingTop: "var(--idea-space-8)" }}>
        <Container style={{ maxWidth: 440, textAlign: "center" }}>
          <Panel>
            <div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-lg)" }}>
              Administrator area
            </div>
            <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "10px 0 16px" }}>
              Administrator access is assigned and verified by the production PHP/MySQL backend.
            </p>
            <Button variant="outline" onClick={() => nav("/admin/login")}>
              Sign in
            </Button>
          </Panel>
        </Container>
      </Section>
    );
  }
  const links = [
    { to: "/admin", label: "Overview" },
    { to: "/admin/subscriptions", label: t("nav.subscriptions") },
    { to: "/admin/settings/payments", label: t("admin.payments") },
  ];
  return (
    <Container style={{ padding: "var(--idea-space-7) var(--idea-space-5)" }}>
      <nav className="idea-admin-tabs idea-glass-tablist" aria-label="Administrator sections" style={{ marginBottom: "var(--idea-space-5)" }}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end
            className={({ isActive }) => `idea-glass-tab${isActive ? " is-active" : ""}`}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </Container>
  );
}

export function AdminOverview() {
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <DashBanner
      tone="info"
      title={ar ? "تم دمج لوحة الإدارة في المساحة الموحدة" : "Consolidated into Unified Admin Console"}
      body={
        ar
          ? "استخدم القائمة الجانبية في /admin للوصول إلى المستخدمين، توثيق الشركات، طلبات التسعير، والمبيعات المؤكدة عبر PHP/MySQL."
          : "Use the unified /admin sidebar for Users, Company Verifications, RFQs, and Confirmed Sales backed by PHP/MySQL."
      }
    />
  );
}

export function AdminSubscriptions() {
  const { db } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  return (
    <>
      <SectionHeader
        eyebrow={ar ? "الاشتراكات" : "Subscriptions"}
        title={ar ? "خطط الاشتراك المرجعية" : "Subscription Plans"}
        sub={
          ar
            ? "عرض مرجعي لخطط الاشتراك. تعديل الأسعار أو تفعيل الفوترة المتكررة يتطلب ربط نقطة نهاية فوترة موثقة على خادم PHP/MySQL."
            : "Reference view of subscription tiers. Plan mutations and recurring billing remain locked until a dedicated PHP/MySQL billing endpoint is deployed."
        }
      />
      <DashBanner
        tone="warning"
        title={ar ? "وضع القراءة فقط — لا يوجد حفظ وهمي محلي" : "Read-only — local simulated writes disabled"}
        body={
          ar
            ? "تم تعطيل التعديل المحلي في المتصفح لمنع حفظ تغييرات غير حقيقية لا تصل إلى قاعدة بيانات MySQL."
            : "Browser-local plan edits have been disabled so administrators are never shown unsaved or fake billing changes."
        }
      />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {db.plans.map((p) => (
          <Panel key={p.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <span style={{ color: "var(--idea-gold-bright)" }}>{p.audience}</span> ·{" "}
              <span style={{ color: "var(--idea-text)", fontWeight: 600 }}>{p.name}</span>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-xs)" }}>
                {p.monthly} EGP/mo · {p.annual} EGP/yr · {ar ? "فترة تجريبية" : "trial"} {p.trialDays}d
              </div>
            </div>
            <StatusBadge text={ar ? "يتطلب API فوترة" : "Requires billing API"} tone="muted" />
          </Panel>
        ))}
      </div>
    </>
  );
}

export function AdminPayments() {
  const { db } = useBackend();
  const { locale } = useI18n();
  const ar = locale === "ar";
  const label: Record<string, string> = {
    card: "Card (Visa · Mastercard · Meeza)",
    fawry: "Fawry Pay",
    wallet: "Mobile Wallet",
    applepay: "Apple Pay",
    bank: "Bank / Instant Transfer",
  };
  return (
    <>
      <SectionHeader
        eyebrow={ar ? "بوابات الدفع" : "Payment Gateways"}
        title={ar ? "إعدادات الدفع (محمية على الخادم)" : "Payment Configuration (Server-Managed)"}
        sub={
          ar
            ? "العملة: الجنيه المصري (EGP). مفاتيح التاجر واختبارات الـWebhook تُضبط حصريًا في بيئة خادم cPanel/PHP ولا تُحفظ أو تُحاكي داخل المتصفح."
            : "Currency: EGP. Merchant secrets, live/sandbox modes, and webhook verification are configured strictly server-side on cPanel/PHP — never simulated in the browser."
        }
      />
      <DashBanner
        tone="warning"
        title={ar ? "لا توجد أزرار محاكاة للدفع" : "Simulated dev credentials & sandbox tests removed"}
        body={
          ar
            ? "تفعيل أي بوابة دفع إنتاجية يتطلب إعداد مفاتيح Paymob / Fawry الحقيقية على الخادم وتأكيد استقبال Webhook موقّع."
            : "Enabling any payment method requires real server-side Paymob / Fawry credentials and verified webhook signatures in PHP."
        }
      />
      <div style={{ display: "grid", gap: 10, marginTop: 14 }}>
        {db.payments.map((p) => (
          <Panel key={p.key}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <div>
                <div className="idea-display" style={{ color: "var(--idea-text)" }}>
                  {label[p.key] || p.key}
                </div>
                <div style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>
                  {p.provider} · {p.currency}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                <StatusBadge text={ar ? "إعداد الخادم مطلوب" : "Server config required"} tone="muted" />
                <StatusBadge text={ar ? "Webhook غير مؤكد" : "Webhook unverified"} tone="gold" />
                <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, color: "var(--idea-text-muted)" }}>
                  <ShieldAlert size={14} /> {ar ? "غير مفعل للإنتاج" : "Not enabled"}
                </span>
              </div>
            </div>
          </Panel>
        ))}
      </div>
    </>
  );
}
