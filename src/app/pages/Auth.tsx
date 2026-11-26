import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, KeyRound, Loader2, Mail, ShieldCheck } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { useBackend } from "../backend/db";
import {
  getSocialAuthStartUrl,
  socialProviderDetails,
  verifyGoogleIdTokenPhp,
} from "../backend/phpAccounts";
import {
  IDEA_GOOGLE_CLIENT_ID,
  isValidGoogleClientId,
  requestGoogleIdToken,
} from "../backend/googleIdentity";
import { supabase } from "../backend/supabaseClient";
import { Container, Section, Button } from "../components/ui";
import { Panel, Field, inputStyle } from "../components/dash";
import { SocialAuth } from "../components/SocialAuth";
import { GoogleBrandIcon } from "../components/SocialAuthIcons";
import { AccountEntry } from "./AccountEntry";

/**
 * Primary "Login with Google" button connected directly to the cPanel PHP/MySQL
 * backend (/api/social-auth.php) using official Google OAuth or Google Identity
 * Services (RS256 ID token verification). Zero Firebase dependencies.
 */
export function LoginWithGoogleButton({
  mode = "login",
  redirectTo = "/account",
}: {
  mode?: "login" | "register";
  redirectTo?: string;
}) {
  const { locale } = useI18n();
  const navigate = useNavigate();
  const { refresh } = useBackend();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const configured = isValidGoogleClientId(IDEA_GOOGLE_CLIENT_ID);

  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  const handleGoogleLogin = async () => {
    if (busy || !configured) return;
    setBusy(true);
    setError("");
    try {
      let phpInfo: Awaited<ReturnType<typeof socialProviderDetails>> | null = null;
      try {
        phpInfo = await socialProviderDetails();
      } catch {
        phpInfo = null;
      }

      if (!phpInfo?.providers.google) {
        setError(
          tr(
            "تسجيل الدخول عبر جوجل يعمل مباشرةً عبر خادم PHP/MySQL على النطاق الرسمي idea-dh.com بعد رفع النسخة.",
            "Google sign-in connects directly through the PHP/MySQL server on idea-dh.com once deployed.",
            "La connexion Google passe directement par le serveur PHP/MySQL sur idea-dh.com."
          )
        );
        return;
      }

      if (phpInfo.googleMode === "oauth") {
        window.location.assign(getSocialAuthStartUrl("google", mode, redirectTo));
        return;
      }

      const activeClientId = phpInfo.googleClientId || IDEA_GOOGLE_CLIENT_ID;
      const idToken = await requestGoogleIdToken(activeClientId);
      await verifyGoogleIdTokenPhp(idToken);
      await refresh();
      navigate(redirectTo);
    } catch (err: unknown) {
      const code =
        typeof err === "object" && err !== null && "code" in err
          ? String((err as { code?: unknown }).code || "")
          : err instanceof Error
          ? err.message
          : "";
      if (code === "GOOGLE_PROMPT_DISMISSED") {
        setError(
          tr(
            "تم إغلاق نافذة تسجيل الدخول بحساب جوجل قبل إتمام العملية.",
            "Google sign-in was closed before completion.",
            "La fenêtre de connexion Google a été fermée."
          )
        );
      } else if (code === "GOOGLE_ORIGIN_UNAUTHORIZED") {
        setError(
          tr(
            "أضف النطاق الحالي ضمن Authorized JavaScript Origins في إعدادات Google Cloud.",
            "Add this origin under Authorized JavaScript Origins in Google Cloud Console.",
            "Ajoutez ce domaine dans Authorized JavaScript Origins sur Google Cloud."
          )
        );
      } else if (code === "ADMIN_SOCIAL_LOGIN_DISABLED") {
        setError(
          tr(
            "حسابات الإدارة والشركات تستخدم بوابة الدخول المخصصة لها فقط.",
            "Administrator and supplier accounts must use their dedicated portal.",
            "Les comptes administrateur et entreprise utilisent leur portail dédié."
          )
        );
      } else {
        setError(
          tr(
            "تعذّر تسجيل الدخول بحساب جوجل عبر الخادم. حاول مرة أخرى.",
            "Could not sign in with Google via the server. Please try again.",
            "Impossible de se connecter avec Google via le serveur."
          )
        );
      }
    } finally {
      setBusy(false);
    }
  };

  const buttonText =
    mode === "register"
      ? tr("التسجيل بحساب Google", "Sign up with Google", "S'inscrire avec Google")
      : tr("تسجيل الدخول بحساب Google", "Login with Google", "Connexion avec Google");

  return (
    <div className="idea-google-login-wrap">
      <button
        type="button"
        className="idea-google-login-btn"
        data-testid="login-with-google-btn"
        disabled={!configured || busy}
        aria-busy={busy}
        onClick={() => void handleGoogleLogin()}
      >
        <span className="idea-google-login-icon" aria-hidden="true">
          {busy ? <Loader2 size={18} className="idea-social-spin" /> : <GoogleBrandIcon width={19} height={19} />}
        </span>
        <span>{busy ? tr("جاري الاتصال بجوجل...", "Connecting to Google...", "Connexion à Google...") : buttonText}</span>
      </button>
      {error ? (
        <p role="alert" className="idea-auth-feedback idea-auth-feedback--error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function AuthShell({ mode, redirectTo = "/account" }: { mode: "login" | "register"; redirectTo?: string }) {
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
            options: { data: { display_name: name.trim() }, emailRedirectTo: window.location.origin + redirectTo },
          })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (result.error) { setMessage(authFailure(result.error)); return; }
      if (mode === "register" && !result.data.session) {
        setMessage(tr("راجع بريدك الإلكتروني لتأكيد الحساب، وبعدها سجّل دخول.", "Check your email to confirm your account, then sign in."));
        return;
      }
      if (mode === "login" && result.data.user) {
        const { data: verifiedRole, error: roleLookupError } = await supabase
          .from("user_roles").select("role").eq("user_id", result.data.user.id).single();
        if (roleLookupError) throw roleLookupError;
        nav(verifiedRole?.role === "admin" ? "/admin"
          : verifiedRole?.role === "supplier" ? "/business" : "/account");
      } else {
        nav(redirectTo);
      }
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
    <LoginWithGoogleButton mode={mode} redirectTo={redirectTo} />
    <SocialAuth mode={mode} redirectTo={redirectTo}/>
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "var(--idea-space-2)", marginTop: "var(--idea-space-5)", color: "var(--idea-text-faint)", fontSize: "var(--idea-text-xs)" }}><ShieldCheck size={13} color="var(--idea-gold)" />New accounts are buyers by default. Supplier and admin access is assigned server-side.</div>
    <div style={{ textAlign: "center", marginTop: "var(--idea-space-4)", color: "var(--idea-text-muted)", fontSize: "var(--idea-text-sm)" }}>{mode === "login" ? <><span>{t("auth.noAccount")} </span><Link to="/register" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.createAccount")}</Link></> : <><span>{t("auth.haveAccount")} </span><Link to="/login" style={{ color: "var(--idea-gold-bright)" }}>{t("auth.signIn")}</Link></>}</div>
  </Panel></Container></Section>;
}

/* Customer, business and admin each have a distinct, owner-approved entry screen.
   The old Supabase AuthShell remains private and is no longer routed. */
export function Login() { return <AccountEntry audience="customer" mode="login" googleLoginSlot={<LoginWithGoogleButton mode="login" redirectTo="/account" />} />; }
export function Register() { return <AccountEntry audience="customer" mode="register" googleLoginSlot={<LoginWithGoogleButton mode="register" redirectTo="/account" />} />; }
export function RegisterCustomer() { return <AccountEntry audience="customer" mode="register" googleLoginSlot={<LoginWithGoogleButton mode="register" redirectTo="/account" />} />; }
export function RegisterBusiness() { return <AccountEntry audience="business" mode="register" />; }
export function BusinessLogin() { return <AccountEntry audience="business" mode="login" />; }
export function AdminLogin() { return <AccountEntry audience="admin" mode="login" />; }
export function RoleSelect() { return <Login />; }
