import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { supabase, backendConfigurationError } from "../backend/supabaseClient";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";

function AuthShell({ mode }: { mode: "login" | "register" }) {
  const { t, locale } = useI18n(); const nav = useNavigate();
  const tr = (ar: string, en: string, fr = en) => locale === "ar" ? ar : locale === "fr" ? fr : en;
  const authFailure = (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error || "");
    return /failed to fetch|fetch failed|networkerror|load failed|network request failed/i.test(message)
      ? tr("تعذّر الاتصال بخدمة تسجيل الحسابات. المشكلة في خادم تسجيل الدخول، وليست في بياناتك. حاول لاحقًا أو تواصل مع إدارة الموقع.",
           "The account server cannot be reached. Your details are not the problem. Please try later or contact site support.",
           "Le serveur de comptes est inaccessible. Réessayez plus tard ou contactez le support.")
      : message || tr("حدث خطأ أثناء تسجيل الحساب.", "Account request could not be completed.");
  };
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [name, setName] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false);
  const configured = Boolean(supabase);
  const submit = async () => {
    if (busy) return;
    if (!supabase) {
      setMessage(tr("خدمة التسجيل غير متاحة حاليًا. يلزم إعداد خادم تسجيل الدخول.", "Registration is temporarily unavailable; the account server must be configured."));
      return;
    }
    if (!email.trim() || !password || (mode === "register" && !name.trim())) {
      setMessage(tr("أكمل البيانات المطلوبة أولًا.", "Please complete the required fields."));
      return;
    }
    if (password.length < 8) {
      setMessage(tr("كلمة المرور لازم تكون 8 أحرف على الأقل.", "Password must have at least 8 characters."));
      return;
    }
    setBusy(true); setMessage("");
    try {
      const result = mode === "register"
        ? await supabase.auth.signUp({
            email: email.trim(), password,
            options: { data: { display_name: name.trim() }, emailRedirectTo: `${window.location.origin}/account` },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) { setMessage(authFailure(result.error)); return; }
      if (mode === "register" && !result.data.session) {
        setMessage(tr("راجع بريدك الإلكتروني لتأكيد الحساب، وبعدها سجّل دخول.", "Check your email to confirm your account, then sign in."));
        return;
      }
      nav("/account");
    } catch (error) {
      setMessage(authFailure(error));
    } finally {
      setBusy(false);
    }
  };
  const reset = async () => {
    if (busy) return;
    if (!supabase) { setMessage(tr("خدمة استعادة كلمة المرور غير متاحة حاليًا.", "Password reset is temporarily unavailable.")); return; }
    if (!email.trim()) { setMessage(tr("اكتب بريدك الإلكتروني الأول.", "Enter your email address first.")); return; }
    setBusy(true); setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/login`,
      });
      setMessage(error ? authFailure(error) : tr("لو الحساب مسجّل، هتوصلك تعليمات تغيير كلمة المرور على البريد.", "If this account exists, password reset instructions will arrive by email."));
    } catch (error) {
      setMessage(authFailure(error));
    } finally {
      setBusy(false);
    }
  };
  return <Section style={{ paddingTop: "var(--idea-space-8)" }}><Container style={{ maxWidth: 440 }}><Panel>
    <div style={{ textAlign: "center", marginBottom: "var(--idea-space-5)" }}><div className="idea-eyebrow">IDEA</div><h1 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", color: "var(--idea-text)", margin: "var(--idea-space-2) 0 0" }}>{mode === "login" ? t("auth.signIn") : t("auth.createAccount")}</h1></div>
    {!configured ? <p role="alert" style={{ padding: "var(--idea-space-3)", color: "var(--idea-danger)", background: "var(--idea-surface-2)", border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", fontSize: "var(--idea-text-sm)" }}>{tr("تسجيل الحسابات غير متاح حاليًا بسبب مشكلة في إعداد خدمة الدخول. برجاء التواصل مع إدارة الموقع.", "Account registration is temporarily unavailable because the authentication service is not configured. Please contact site support.")}</p> : <>
      {mode === "register" && <Field label="Name"><input style={inputStyle} value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" /></Field>}
      <Field label={t("auth.email")}><input style={inputStyle} type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" placeholder="you@example.com" /></Field>
      <Field label="Password"><input style={inputStyle} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={8} /></Field>
      {message && <p role="alert" style={{ color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)", marginBottom: "var(--idea-space-3)" }}>{message}</p>}
      <Button style={{ width: "100%" }} disabled={busy} onClick={() => void submit()}><Mail size={16} />{busy ? "Working…" : mode === "login" ? t("auth.signIn") : t("auth.createAccount")}<ArrowRight size={16} /></Button>
      {mode === "login" && <button type="button" disabled={busy} onClick={() => void reset()} style={{ display: "inline-flex", alignItems: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-4)", border: 0, background: "transparent", color: "var(--idea-gold-bright)", cursor: "pointer", fontFamily: "var(--idea-font-body)", fontSize: "var(--idea-text-sm)" }}><KeyRound size={14} />Reset password</button>}
    </>}
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-5)", color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}><ShieldCheck size={13} color="var(--idea-gold)" />New accounts are buyers by default. Supplier and admin access is assigned server-side.</div>
    <div style={{ textAlign: "center", marginTop: "var(--idea-space-4)", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{mode === "login" ? <><span>{t("auth.noAccount")} </span><Link to="/register" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.createAccount")}</Link></> : <><span>{t("auth.haveAccount")} </span><Link to="/login" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.signIn")}</Link></>}</div>
  </Panel></Container></Section>;
}
export function Login() { return <AuthShell mode="login" />; }
export function Register() { return <AuthShell mode="register" />; }
export function RegisterCustomer() { return <AuthShell mode="register" />; }
export function RegisterBusiness() { return <AuthShell mode="register" />; }
export function RoleSelect() { return <Login />; }
