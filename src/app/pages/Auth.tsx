import { useState } from "react";
import { useNavigate } from "react-router";
import { Loader2 } from "lucide-react";
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
import { GoogleBrandIcon } from "../components/SocialAuthIcons";
import { AccountEntry } from "./AccountEntry";

/**
 * Primary "Login with Google" button connected directly to the cPanel PHP/MySQL
 * backend (/api/social-auth.php) using official Google OAuth or Google Identity
 * Services (RS256 ID token verification)
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

/* Customer, business and admin use distinct PHP/MySQL account entry screens. */
export function Login() { return <AccountEntry audience="customer" mode="login" googleLoginSlot={<LoginWithGoogleButton mode="login" redirectTo="/account" />} />; }
export function Register() { return <AccountEntry audience="customer" mode="register" googleLoginSlot={<LoginWithGoogleButton mode="register" redirectTo="/account" />} />; }
export function RegisterCustomer() { return <AccountEntry audience="customer" mode="register" googleLoginSlot={<LoginWithGoogleButton mode="register" redirectTo="/account" />} />; }
export function RegisterBusiness() { return <AccountEntry audience="business" mode="register" />; }
export function BusinessLogin() { return <AccountEntry audience="business" mode="login" />; }
export function AdminLogin() { return <AccountEntry audience="admin" mode="login" />; }
export function RoleSelect() { return <Login />; }
