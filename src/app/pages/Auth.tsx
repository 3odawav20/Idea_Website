import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { ArrowRight, KeyRound, Mail, ShieldCheck, House } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { supabase, backendConfigurationError } from "../backend/supabaseClient";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";

function AuthShell({ mode, accountType = "customer" }: { mode: "login" | "register"; accountType?: "customer" | "business" }) {
  const { t } = useI18n(); const nav = useNavigate(); const [sp] = useSearchParams();
  const next = sp.get("next") || "/account";
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const configured = Boolean(supabase);
  const submit = async () => {
    if (!supabase || !email || !password || (mode === "register" && !name)) return;
    setBusy(true); setMessage("");
    const result = mode === "register"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name, requested_account_type: accountType, requested_at: new Date().toISOString() }, emailRedirectTo: `${window.location.origin}${next}` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "register" && !result.data.session) { setMessage(t("auth.checkEmail")); return; }
    nav(next);
  };
  const reset = async () => {
    if (!supabase || !email) return;
    setBusy(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` }); setBusy(false);
    setMessage(error ? error.message : t("auth.resetSent"));
  };
  return <Section style={{ paddingTop: "var(--idea-space-8)" }}><Container style={{ maxWidth: 440 }}><Panel>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: "var(--idea-space-4)" }}><Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "var(--idea-text-muted)", textDecoration: "none", fontSize: "var(--idea-text-sm)" }}><House size={15} />{t("nav.home")}</Link><div className="idea-eyebrow">IDEA</div></div><div style={{ textAlign: "center", marginBottom: "var(--idea-space-5)" }}><h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 0" }}>{mode === "login" ? t("auth.signIn") : accountType === "business" ? "Create a business account request" : t("auth.createAccount")}</h1></div>
    {!configured ? <p role="alert" style={{ padding: "var(--idea-space-3)", color: "var(--idea-danger)", background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", fontSize: "var(--idea-text-sm)" }}>{backendConfigurationError}</p> : <>
      {mode === "register" && <Field label={t("auth.name")}><input style={inputStyle} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Field>}
      <Field label={t("auth.email")}><input style={inputStyle} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></Field>
      <Field label={t("auth.password")}><input style={inputStyle} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} /></Field>
      {message && <p role="status" style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginBottom: "var(--idea-space-3)" }}>{message}</p>}
      {mode === "register" && accountType === "business" && <p style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", margin: "0 0 var(--idea-space-3)", lineHeight: 1.6 }}>Business accounts are reviewed before supplier access is enabled. Your request is attached to your new account.</p>}
      <Button style={{ width: "100%" }} disabled={busy} onClick={() => void submit()}><Mail size={16} />{busy ? t("auth.working") : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}<ArrowRight size={16} /></Button>
      {mode === "login" && <button type="button" disabled={busy} onClick={() => void reset()} style={{ display: "inline-flex", alignItems: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-4)", border: 0, background: "transparent", color: "var(--idea-gold-bright)", cursor: "pointer", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)" }}><KeyRound size={14} />{t("auth.resetPassword")}</button>}
    </>}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-5)", color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}><ShieldCheck size={13} color="var(--idea-gold)" />{t("auth.buyerDefault")}</div>
    <div style={{ textAlign: "center", marginTop: "var(--idea-space-4)", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{mode === "login" ? <><span>{t("auth.noAccount")} </span><Link to="/register" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.createAccount")}</Link></> : <><span>{t("auth.haveAccount")} </span><Link to="/login" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.signIn")}</Link></>}</div>
  </Panel></Container></Section>;
}
export function Login() { return <AuthShell mode="login" />; }
export function Register() { return <AuthShell mode="register" accountType="customer" />; }
export function RegisterCustomer() { return <AuthShell mode="register" accountType="customer" />; }
export function RegisterBusiness() { return <AuthShell mode="register" accountType="business" />; }
export function RoleSelect() {
  return <Section style={{ paddingTop: "var(--idea-space-8)" }}><Container style={{ maxWidth: 760 }}>
    <div style={{ textAlign: "center", marginBottom: "var(--idea-space-6)" }}>
      <div className="idea-eyebrow">IDEA</div>
      <h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0" }}>Choose account type</h1>
      <p style={{ color: "var(--idea-text-muted)", margin: 0 }}>Create a customer account now, or request a verified business supplier account.</p>
    </div>
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: "var(--idea-space-4)" }}>
      <Panel><div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-xl)", marginBottom: 8 }}>Customer</div><p style={{ color: "var(--idea-text-muted)", lineHeight: 1.6 }}>Save products, request prices, compare offers and manage projects.</p><Link to="/register/customer"><Button style={{ width: "100%" }}>Create customer account</Button></Link></Panel>
      <Panel><div className="idea-display" style={{ color: "var(--idea-text)", fontSize: "var(--idea-text-xl)", marginBottom: 8 }}>Business</div><p style={{ color: "var(--idea-text-muted)", lineHeight: 1.6 }}>Request supplier access. Business verification is required before receiving buyer requests.</p><Link to="/register/business"><Button variant="outline" style={{ width: "100%" }}>Request business account</Button></Link></Panel>
    </div>
  </Container></Section>;
}
