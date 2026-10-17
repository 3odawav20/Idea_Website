import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { supabase, backendConfigurationError } from "../backend/supabaseClient";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";

function AuthShell({ mode, accountType = "personal" }: { mode: "login" | "register"; accountType?: "personal" | "business" }) {
  const { t, locale } = useI18n(); const nav = useNavigate();
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const configured = Boolean(supabase);
  const submit = async () => {
    if (!supabase || !email || !password || (mode === "register" && (!name || accountType === "business" && !company.trim()))) return;
    setBusy(true); setMessage("");
    const result = mode === "register"
      ? await supabase.auth.signUp({ email, password, options: { data: { display_name: name, requested_account_type: accountType, company_name: accountType === "business" ? company.trim() : undefined }, emailRedirectTo: `${window.location.origin}/account` } })
      : await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    if (mode === "register" && !result.data.session) { setMessage("Check your email to confirm your account, then sign in."); return; }
    nav("/account");
  };
  const reset = async () => {
    if (!supabase || !email) return;
    setBusy(true); const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/login` }); setBusy(false);
    setMessage(error ? error.message : "Password reset instructions were sent to your email.");
  };
  return <Section style={{ paddingTop: "var(--idea-space-8)" }}><Container style={{ maxWidth: 440 }}><Panel>
    <div style={{ textAlign: "center", marginBottom: "var(--idea-space-5)" }}><div className="idea-eyebrow">IDEA</div><h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 0" }}>{mode === "login" ? t("auth.signIn") : t("auth.createAccount")}</h1></div>
    {!configured ? <p role="alert" style={{ padding: "var(--idea-space-3)", color: "var(--idea-danger)", background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", fontSize: "var(--idea-text-sm)" }}>{backendConfigurationError}</p> : <>
      {mode === "register" && <Field label={locale==="ar"?"الاسم":locale==="fr"?"Nom":"Name"}><input style={inputStyle} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Field>}
      {mode === "register" && accountType === "business" && <>
        <Field label={locale==="ar"?"اسم الشركة":locale==="fr"?"Nom de l'entreprise":"Company name"}><input style={inputStyle} value={company} onChange={e=>setCompany(e.target.value)} autoComplete="organization"/></Field>
        <p role="note" style={{fontSize:"var(--idea-text-xs)",color:"var(--idea-text-muted)",lineHeight:1.7}}>
        {locale==="ar"?"النموذج ده بيسجّل طلب حساب الشركة. خدمات البيع للتجار بتحتاج مراجعة واعتماد قبل التفعيل.":locale==="fr"?"Cette demande est enregistrée. La vente nécessite la vérification de votre entreprise.":"Your business account request is recorded. Seller tools require independent verification and approval."}
        </p>
      </>}
      <Field label={t("auth.email")}><input style={inputStyle} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></Field>
      <Field label={locale==="ar"?"كلمة المرور":locale==="fr"?"Mot de passe":"Password"}><input style={inputStyle} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} /></Field>
      {message && <p role="status" style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginBottom: "var(--idea-space-3)" }}>{message}</p>}
      <Button style={{ width: "100%" }} disabled={busy} onClick={() => void submit()}><Mail size={16} />{busy ? "Working…" : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}<ArrowRight size={16} /></Button>
      {mode === "login" && <button type="button" disabled={busy} onClick={() => void reset()} style={{ display: "inline-flex", alignItems: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-4)", border: 0, background: "transparent", color: "var(--idea-gold-bright)", cursor: "pointer", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)" }}><KeyRound size={14} />{locale==="ar"?"إعادة تعيين كلمة المرور":locale==="fr"?"Réinitialiser le mot de passe":"Reset password"}</button>}
    </>}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-5)", color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}><ShieldCheck size={13} color="var(--idea-gold)" />{locale==="ar"?"الحسابات الجديدة تبدأ كمشتري، وصلاحيات التاجر والإدارة تُمنح بعد الاعتماد.":locale==="fr"?"Les comptes commencent comme acheteur. L'accès fournisseur requiert une validation.":"New accounts begin as buyers. Supplier and admin permissions require approval."}</div>
    <div style={{ textAlign: "center", marginTop: "var(--idea-space-4)", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{mode === "login" ? <><span>{t("auth.noAccount")} </span><Link to="/register" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.createAccount")}</Link></> : <><span>{t("auth.haveAccount")} </span><Link to="/login" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.signIn")}</Link></>}</div>
  </Panel></Container></Section>;
}
export function Login() { return <AuthShell mode="login" />; }
export function Register() { return <AuthShell mode="register" />; }
export function RegisterCustomer() { return <AuthShell mode="register" />; }
export function RegisterBusiness() { return <AuthShell mode="register" accountType="business" />; }
export function RoleSelect() { return <Login />; }
