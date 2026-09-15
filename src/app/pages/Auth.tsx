import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Mail, Phone, ArrowRight, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend, type Role } from "../backend/db";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";
import { PROVIDERS } from "../components/BrandIcons";

function ProviderButtons({ onPick }: { onPick: (key: string) => void }) {
  const { locale } = useI18n();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {PROVIDERS.map((p) => (
        <button key={p.key} onClick={() => onPick(p.key)} style={{
          display: "flex", alignItems: "center", gap: 12, width: "100%", padding: "12px 16px", cursor: "pointer",
          background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-full)",
          color: "var(--idea-text)", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)",
        }}>
          <span style={{ width: "calc(var(--idea-space-4) + var(--idea-space-3))", height: "calc(var(--idea-space-4) + var(--idea-space-3))", borderRadius: "var(--idea-radius-full)", background: "var(--idea-bg)", border: "var(--idea-hairline)", color: "var(--idea-text)", display: "grid", placeItems: "center", flexShrink: 0 }}><p.Icon /></span>
          <span>{p[locale]}</span>
        </button>
      ))}
    </div>
  );
}

function Divider({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "var(--idea-space-4) 0", color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>
      <span style={{ flex: 1, height: 1, background: "var(--idea-border-neutral)" }} /> {text} <span style={{ flex: 1, height: 1, background: "var(--idea-border-neutral)" }} />
    </div>
  );
}

/* ── Auth shell used by /login and /register ─────────────────────────────── */
function AuthShell({ mode, presetRole }: { mode: "login" | "register"; presetRole?: Role }) {
  const { t, locale } = useI18n();
  const { api } = useBackend();
  const nav = useNavigate();
  const [tab, setTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState("");

  const finish = (provider: string, info?: { email?: string; phone?: string }) => {
    // Business preset goes straight into onboarding; others choose role (unless preset).
    api.signIn(provider, presetRole || "customer", info);
    if (presetRole === "business") nav("/business/onboarding");
    else if (presetRole) nav("/account");
    else nav("/onboarding/role");
  };

  const normalizeEg = (v: string) => {
    let d = v.replace(/[^\d]/g, "");
    if (d.startsWith("0")) d = d.slice(1);
    if (d.startsWith("20")) d = d.slice(2);
    return "+20" + d;
  };

  return (
    <Section style={{ paddingTop: "var(--idea-space-8)" }}>
      <Container style={{ maxWidth: 440 }}>
        <Panel>
          <div style={{ textAlign: "center", marginBottom: "var(--idea-space-5)" }}>
            <div className="idea-eyebrow">{presetRole === "business" ? t("auth.forBusiness") : "IDEA"}</div>
            <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "8px 0 0" }}>
              {mode === "login" ? t("auth.signIn") : t("auth.createAccount")}
            </h1>
          </div>

          <ProviderButtons onPick={(k) => finish(k)} />
          <Divider text={t("auth.or")} />

          <div style={{ display: "flex", gap: 8, marginBottom: "var(--idea-space-4)" }}>
            {(["email", "phone"] as const).map((x) => (
              <button key={x} onClick={() => { setTab(x); setOtpSent(false); }} style={{
                flex: 1, padding: "8px", cursor: "pointer", borderRadius: "var(--idea-radius-sm)", fontSize: "var(--idea-text-sm)",
                display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6,
                border: `1px solid ${tab === x ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
                background: tab === x ? "var(--idea-gold-soft)" : "transparent", color: tab === x ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
              }}>{x === "email" ? <Mail size={15} /> : <Phone size={15} />}{x === "email" ? t("auth.email") : t("auth.phone")}</button>
            ))}
          </div>

          {tab === "email" ? (
            <>
              <Field label={t("auth.email")}>
                <input style={inputStyle} type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
              </Field>
              <Button style={{ width: "100%" }} onClick={() => email && finish("email", { email })}>{t("auth.continue")} <ArrowRight size={16} /></Button>
            </>
          ) : (
            <>
              <Field label={t("auth.phone")}>
                <input style={inputStyle} inputMode="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+20 1x xxx xxxx" />
              </Field>
              {!otpSent ? (
                <Button style={{ width: "100%" }} onClick={() => phone && setOtpSent(true)}>{t("auth.sendOtp")}</Button>
              ) : (
                <>
                  <Field label={t("auth.otp")}>
                    <input style={{ ...inputStyle, letterSpacing: "0.5em", textAlign: "center" }} inputMode="numeric" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} placeholder="••••••" />
                  </Field>
                  <div style={{ fontSize: "var(--idea-text-xs)", color: "var(--idea-text-faint)", marginBottom: 10 }}>{t("auth.otpDev")}</div>
                  <Button style={{ width: "100%" }} onClick={() => otp.length >= 4 && finish("phone", { phone: normalizeEg(phone) })}>{t("auth.verify")}</Button>
                </>
              )}
            </>
          )}

          <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", marginTop: "var(--idea-space-5)", color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}>
            <ShieldCheck size={13} color="var(--idea-gold)" /> {t("auth.secure")}
          </div>
          <div style={{ textAlign: "center", marginTop: "var(--idea-space-4)", fontSize: "var(--idea-text-sm)", color: "var(--idea-text-muted)" }}>
            {mode === "login" ? (
              <>{t("auth.noAccount")} <Link to="/register" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.createAccount")}</Link></>
            ) : (
              <>{t("auth.haveAccount")} <Link to="/login" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.signIn")}</Link></>
            )}
          </div>
        </Panel>
        {mode === "register" && !presetRole && (
          <div style={{ display: "flex", gap: 10, marginTop: "var(--idea-space-4)" }}>
            <Link to="/register/customer" style={{ flex: 1 }}><Button variant="ghost" style={{ width: "100%" }}>{t("role.customer")}</Button></Link>
            <Link to="/register/business" style={{ flex: 1 }}><Button variant="outline" style={{ width: "100%" }}>{t("role.business")}</Button></Link>
          </div>
        )}
        <div lang={locale} />
      </Container>
    </Section>
  );
}

export function Login() { return <AuthShell mode="login" />; }
export function Register() { return <AuthShell mode="register" />; }
export function RegisterCustomer() { return <AuthShell mode="register" presetRole="customer" />; }
export function RegisterBusiness() { return <AuthShell mode="register" presetRole="business" />; }

/* ── Role selection after first login ────────────────────────────────────── */
export function RoleSelect() {
  const { t } = useI18n();
  const { api, session } = useBackend();
  const nav = useNavigate();
  const roles: { key: Role; label: string; desc: string }[] = [
    { key: "customer", label: t("role.customer"), desc: t("role.customerDesc") },
    { key: "business", label: t("role.business"), desc: t("role.businessDesc") },
    { key: "designer", label: t("role.designer"), desc: t("role.designerDesc") },
    { key: "contractor", label: t("role.contractor"), desc: t("role.contractorDesc") },
  ];
  const pick = (r: Role) => {
    api.setRole(r);
    if (r === "business") nav("/business/onboarding");
    else nav("/account");
  };
  if (!session) { nav("/login"); return null; }
  return (
    <Section style={{ paddingTop: "var(--idea-space-8)" }}>
      <Container style={{ maxWidth: 620 }}>
        <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", textAlign: "center" }}>{t("role.question")}</h1>
        <div style={{ display: "grid", gap: "var(--idea-space-3)", marginTop: "var(--idea-space-6)" }}>
          {roles.map((r) => (
            <button key={r.key} onClick={() => pick(r.key)} style={{
              textAlign: "start", cursor: "pointer", padding: "var(--idea-space-5)", borderRadius: "var(--idea-radius-md)",
              background: "var(--idea-surface)", border: "var(--idea-hairline)", color: "var(--idea-text)",
            }}>
              <div className="idea-display" style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-lg)" }}>{r.label}</div>
              <div style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginTop: 4 }}>{r.desc}</div>
            </button>
          ))}
        </div>
        <p style={{ color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)", textAlign: "center", marginTop: "var(--idea-space-5)" }}>{t("role.verifyNote")}</p>
      </Container>
    </Section>
  );
}
