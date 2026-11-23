import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router";
import { CheckCircle2, Loader2, ShieldCheck, X } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { normalizePhoneNumber } from "../backend/authValidation";
import {
  getSocialAuthStartUrl,
  parseSocialCallbackParams,
  sendWhatsAppOtp,
  socialProviderDetails,
  verifyGoogleIdTokenPhp,
  verifyWhatsAppOtp,
  type PhpOAuthProvider,
  type PhpSocialProvider,
  type PhpSocialProviderStatus,
} from "../backend/phpAccounts";
import {
  IDEA_GOOGLE_CLIENT_ID,
  requestGoogleIdToken,
} from "../backend/googleIdentity";
import { useBackend } from "../backend/db";
import {
  AppleBrandIcon,
  FacebookBrandIcon,
  GoogleBrandIcon,
  MicrosoftBrandIcon,
  WhatsAppBrandIcon,
  XBrandIcon,
} from "./SocialAuthIcons";

interface ProviderSpec {
  id: PhpSocialProvider;
  label: string;
  arLabel: string;
}

const PROVIDERS: readonly ProviderSpec[] = [
  { id: "google", label: "Google", arLabel: "Google" },
  { id: "whatsapp", label: "WhatsApp", arLabel: "WhatsApp" },
  { id: "facebook", label: "Facebook", arLabel: "Facebook" },
  { id: "apple", label: "Apple", arLabel: "Apple" },
  { id: "microsoft", label: "Microsoft", arLabel: "Microsoft" },
  { id: "x", label: "X", arLabel: "X" },
] as const;

const WA_COUNTRIES = [
  { code: "EG", dial: "+20" },
  { code: "SA", dial: "+966" },
  { code: "AE", dial: "+971" },
  { code: "KW", dial: "+965" },
  { code: "QA", dial: "+974" },
  { code: "JO", dial: "+962" },
] as const;

function ProviderIcon({ id }: { id: PhpSocialProvider }) {
  switch (id) {
    case "google":
      return <GoogleBrandIcon className="idea-social-icon" />;
    case "whatsapp":
      return <WhatsAppBrandIcon className="idea-social-icon" />;
    case "facebook":
      return <FacebookBrandIcon className="idea-social-icon" />;
    case "apple":
      return <AppleBrandIcon className="idea-social-icon idea-social-icon--mono" />;
    case "microsoft":
      return <MicrosoftBrandIcon className="idea-social-icon" />;
    case "x":
      return <XBrandIcon className="idea-social-icon idea-social-icon--mono" />;
  }
}

function localizedCallbackError(
  code: string,
  tr: (ar: string, en: string, fr?: string) => string
): string {
  switch (code) {
    case "SOCIAL_CANCELLED":
    case "ACCESS_DENIED":
      return tr(
        "تم إلغاء عملية تسجيل الدخول قبل إتمامها.",
        "Sign-in was cancelled before completion.",
        "La connexion a été annulée avant d'être terminée."
      );
    case "STATE_INVALID":
    case "STATE_EXPIRED":
      return tr(
        "انتهت صلاحية جلسة التحقق الأمني. حاول مرة أخرى.",
        "Security verification expired. Please try again.",
        "La vérification de sécurité a expiré. Veuillez réessayer."
      );
    case "EMAIL_UNVERIFIED":
    case "GOOGLE_EMAIL_UNVERIFIED":
      return tr(
        "لا يمكن ربط الحساب لأن البريد الإلكتروني غير موثّق لدى مزوّد الهوية.",
        "Cannot link account because the email address is not verified by the provider.",
        "Impossible de lier le compte : l'adresse e-mail n'est pas vérifiée."
      );
    case "ADMIN_SOCIAL_LOGIN_DISABLED":
    case "ACCOUNT_ROLE_PROTECTED":
      return tr(
        "حسابات الإدارة والشركات تستخدم بوابة الدخول المخصصة لها فقط ولا تُربط بتسجيل العملاء الاجتماعي.",
        "Administrator and supplier accounts must use their dedicated sign-in portal and cannot be linked through customer social login.",
        "Les comptes administrateur et entreprise utilisent leur portail dédié."
      );
    case "RATE_LIMITED":
      return tr(
        "تم تجاوز عدد المحاولات المسموح بها مؤقتًا. انتظر قليلًا ثم أعد المحاولة.",
        "Too many verification attempts. Please wait a moment and try again.",
        "Trop de tentatives. Veuillez patienter avant de réessayer."
      );
    case "PROVIDER_NOT_CONFIGURED":
      return tr(
        "وسيلة الدخول المختارة غير مفعّلة على الخادم حاليًا.",
        "This sign-in provider is not configured on the server yet.",
        "Ce fournisseur de connexion n'est pas encore configuré sur le serveur."
      );
    case "OTP_INVALID":
      return tr("رمز التحقق غير صحيح.", "Invalid verification code.", "Code de vérification invalide.");
    case "OTP_EXPIRED":
      return tr(
        "انتهت صلاحية رمز التحقق. اطلب رمزًا جديدًا.",
        "Verification code expired. Request a new code.",
        "Le code a expiré. Demandez un nouveau code."
      );
    default:
      return tr(
        "تعذّر إتمام المصادقة عبر مزوّد الهوية. حاول مرة أخرى أو استخدم البريد الإلكتروني.",
        "Could not complete sign-in with the selected provider. Please try again or use email.",
        "Impossible de finaliser la connexion. Réessayez ou utilisez l'e-mail."
      );
  }
}

/**
 * Customer-only 6-provider social authentication matrix.
 * Connects strictly to the cPanel PHP/MySQL identity backend (/api/social-auth.php).
 * Providers without confirmed server-side credentials stay securely disabled.
 * WhatsApp uses a genuine verified phone-number OTP workflow, never OAuth.
 * Zero Firebase dependencies.
 */
export function SocialAuth({
  mode = "login",
  redirectTo = "/account",
}: {
  mode?: "login" | "register";
  redirectTo?: string;
}) {
  const { locale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const { refresh } = useBackend();
  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  const [providerReady, setProviderReady] = useState<PhpSocialProviderStatus | null>(null);
  const [phpGoogleMode, setPhpGoogleMode] = useState<"oauth" | "gis" | null>(null);
  const [phpGoogleClientId, setPhpGoogleClientId] = useState<string | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);
  const [pending, setPending] = useState<PhpSocialProvider | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  // WhatsApp verified OTP workflow state (only opens when server confirms whatsapp === true)
  const [waOpen, setWaOpen] = useState(false);
  const [waDial, setWaDial] = useState("+20");
  const [waPhone, setWaPhone] = useState("");
  const [waName, setWaName] = useState("");
  const [waCode, setWaCode] = useState("");
  const [waStep, setWaStep] = useState<"phone" | "code">("phone");
  const [waBusy, setWaBusy] = useState(false);
  const [waE164, setWaE164] = useState("");

  const callbackNotice = useMemo(
    () => parseSocialCallbackParams(location.search),
    [location.search]
  );

  useEffect(() => {
    if (!callbackNotice) return;
    if (callbackNotice.kind === "error") {
      setError(localizedCallbackError(callbackNotice.code, tr));
    } else if (callbackNotice.code === "LINKED") {
      setNotice(
        tr(
          "تم ربط حسابك بنجاح.",
          "Your social account was linked successfully.",
          "Votre compte a été lié avec succès."
        )
      );
    }
  }, [callbackNotice, locale]);

  useEffect(() => {
    let active = true;
    setStatusLoading(true);
    socialProviderDetails()
      .then((info) => {
        if (active) {
          setProviderReady(info.providers);
          setPhpGoogleMode(info.googleMode);
          setPhpGoogleClientId(info.googleClientId);
          setStatusLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setProviderReady(null);
          setPhpGoogleMode(null);
          setPhpGoogleClientId(null);
          setStatusLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const isProviderReady = (id: PhpSocialProvider): boolean => {
    return providerReady?.[id] === true;
  };

  const enabledCount = useMemo(
    () => PROVIDERS.filter((item) => isProviderReady(item.id)).length,
    [providerReady]
  );

  const startProvider = async (provider: PhpSocialProvider) => {
    if (pending || waBusy) return;
    if (!isProviderReady(provider)) {
      setError(
        tr(
          "هذه الوسيلة غير مفعّلة على الخادم حاليًا حتى يتم استكمال بيانات الربط الرسمية.",
          "This sign-in provider is currently disabled until its official server credentials are configured.",
          "Ce mode de connexion est désactivé tant que les identifiants serveur ne sont pas configurés."
        )
      );
      return;
    }
    setError("");
    setNotice("");

    if (provider === "whatsapp") {
      setWaOpen(true);
      setWaStep("phone");
      setWaCode("");
      return;
    }

    if (provider === "google" && phpGoogleMode === "gis") {
      setPending("google");
      try {
        const idToken = await requestGoogleIdToken(phpGoogleClientId || IDEA_GOOGLE_CLIENT_ID);
        await verifyGoogleIdTokenPhp(idToken);
        await refresh();
        navigate(redirectTo);
      } catch (err) {
        const code = err instanceof Error ? err.message : "";
        setError(localizedCallbackError(code === "GOOGLE_PROMPT_DISMISSED" ? "SOCIAL_CANCELLED" : code, tr));
      } finally {
        setPending(null);
      }
      return;
    }

    setPending(provider);
    const targetUrl = getSocialAuthStartUrl(provider as PhpOAuthProvider, mode, redirectTo);
    window.location.assign(targetUrl);
  };

  const handleWhatsAppSend = async () => {
    if (waBusy) return;
    const normalized = normalizePhoneNumber(waDial, waPhone);
    if (!normalized.valid) {
      setError(
        tr(
          "أدخل رقم واتساب صحيح متضمنًا مفتاح الدولة.",
          "Enter a valid WhatsApp phone number including country code.",
          "Saisissez un numéro WhatsApp valide avec l'indicatif pays."
        )
      );
      return;
    }
    setError("");
    setNotice("");
    setWaBusy(true);
    try {
      await sendWhatsAppOtp(normalized.e164, mode);
      setWaE164(normalized.e164);
      setWaStep("code");
      setNotice(
        tr(
          "تم إرسال رمز تحقق من 6 أرقام عبر WhatsApp Business. أدخل الرمز لتأكيد ملكية الرقم.",
          "A 6-digit verification code was sent via WhatsApp Business. Enter it to verify phone ownership.",
          "Un code à 6 chiffres a été envoyé via WhatsApp Business."
        )
      );
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(localizedCallbackError(code, tr));
    } finally {
      setWaBusy(false);
    }
  };

  const handleWhatsAppVerify = async () => {
    if (waBusy) return;
    const digits = waCode.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError(
        tr(
          "أدخل رمز التحقق المكون من 6 أرقام.",
          "Enter the 6-digit verification code.",
          "Saisissez le code de vérification à 6 chiffres."
        )
      );
      return;
    }
    if (mode === "register" && waName.trim().length < 2) {
      setError(
        tr(
          "أدخل اسمك الكامل لإتمام إنشاء الحساب.",
          "Enter your full name to complete registration.",
          "Saisissez votre nom complet pour finaliser l'inscription."
        )
      );
      return;
    }
    setError("");
    setNotice("");
    setWaBusy(true);
    try {
      await verifyWhatsAppOtp({
        phone: waE164,
        code: digits,
        mode,
        name: mode === "register" ? waName.trim() : undefined,
      });
      await refresh();
      navigate(redirectTo);
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(localizedCallbackError(code, tr));
    } finally {
      setWaBusy(false);
    }
  };

  return (
    <section
      className="idea-auth-social"
      aria-label={tr("تسجيل الدخول عبر الحسابات الاجتماعية", "Social authentication", "Connexion sociale")}
    >
      <div className="idea-auth-social-divider">
        <span>
          {mode === "register"
            ? tr("أو أنشئ حسابك عبر", "Or sign up with", "Ou inscrivez-vous avec")
            : tr("أو سجّل الدخول عبر", "Or continue with", "Ou continuer avec")}
        </span>
      </div>

      <div className="idea-auth-social-grid" role="group" aria-label={tr("خيارات الدخول السريع", "Social sign-in providers")}>
        {PROVIDERS.map((item) => {
          const isReady = isProviderReady(item.id);
          const isBusy = pending === item.id;
          const label = locale === "ar" ? item.arLabel : item.label;
          const actionAria =
            mode === "register"
              ? tr(`التسجيل عبر ${label}`, `Sign up with ${label}`, `S'inscrire avec ${label}`)
              : tr(`تسجيل الدخول عبر ${label}`, `Continue with ${label}`, `Continuer avec ${label}`);

          return (
            <button
              key={item.id}
              type="button"
              data-provider={item.id}
              className={`idea-social-btn idea-social-btn--${item.id}${isReady ? " is-ready" : " is-unavailable"}${isBusy ? " is-loading" : ""}`}
              disabled={!isReady || pending !== null || waBusy}
              aria-disabled={!isReady || pending !== null || waBusy}
              aria-busy={isBusy}
              aria-label={actionAria}
              title={
                statusLoading && !isReady
                  ? tr("جاري التحقق من جاهزية المزوّد...", "Checking provider status...")
                  : isReady
                  ? actionAria
                  : tr(
                      `${label} — بانتظار تفعيل بيانات الربط على الخادم`,
                      `${label} — awaiting server configuration`
                    )
              }
              onClick={() => void startProvider(item.id)}
            >
              <span className="idea-social-btn-icon" aria-hidden="true">
                {isBusy ? <Loader2 size={18} className="idea-social-spin" /> : <ProviderIcon id={item.id} />}
              </span>
              <span className="idea-social-btn-label">{label}</span>
            </button>
          );
        })}
      </div>

      {waOpen && providerReady?.whatsapp === true && (
        <div className="idea-wa-otp-box" role="region" aria-label={tr("التحقق عبر واتساب", "WhatsApp phone verification")}>
          <div className="idea-wa-otp-head">
            <span className="idea-wa-otp-title">
              <WhatsAppBrandIcon width={18} height={18} />
              <strong>{tr("التحقق برقم واتساب", "WhatsApp phone verification")}</strong>
            </span>
            <button
              type="button"
              className="idea-wa-otp-close"
              onClick={() => setWaOpen(false)}
              aria-label={tr("إغلاق", "Close")}
            >
              <X size={16} />
            </button>
          </div>

          {waStep === "phone" ? (
            <div className="idea-wa-otp-body">
              <p className="idea-wa-otp-hint">
                {tr(
                  "سنرسل لك رمز تحقق رسمي عبر WhatsApp Business لتأكيد ملكية رقمك.",
                  "We will send an official one-time verification code via WhatsApp Business to confirm phone ownership."
                )}
              </p>
              <div className="idea-wa-otp-row">
                <select
                  value={waDial}
                  onChange={(e) => setWaDial(e.currentTarget.value)}
                  aria-label={tr("مفتاح الدولة", "Country code")}
                  className="idea-wa-otp-select"
                >
                  {WA_COUNTRIES.map((c) => (
                    <option key={c.code} value={c.dial}>
                      {c.code} {c.dial}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  inputMode="tel"
                  autoComplete="tel-national"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.currentTarget.value)}
                  placeholder={tr("رقم الهاتف", "Phone number")}
                  className="idea-wa-otp-input"
                />
              </div>
              <button
                type="button"
                className="idea-wa-otp-action"
                disabled={waBusy}
                onClick={() => void handleWhatsAppSend()}
              >
                {waBusy ? <Loader2 size={15} className="idea-social-spin" /> : null}
                <span>{tr("إرسال رمز التحقق", "Send verification code")}</span>
              </button>
            </div>
          ) : (
            <div className="idea-wa-otp-body">
              {mode === "register" && (
                <input
                  type="text"
                  autoComplete="name"
                  value={waName}
                  onChange={(e) => setWaName(e.currentTarget.value)}
                  placeholder={tr("الاسم الكامل", "Full name")}
                  className="idea-wa-otp-input"
                />
              )}
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={waCode}
                onChange={(e) => setWaCode(e.currentTarget.value.replace(/\D/g, "").slice(0, 6))}
                placeholder={tr("أدخل الرمز المكون من 6 أرقام", "Enter 6-digit code")}
                className="idea-wa-otp-input idea-wa-otp-code"
              />
              <div className="idea-wa-otp-actions">
                <button
                  type="button"
                  className="idea-wa-otp-action"
                  disabled={waBusy}
                  onClick={() => void handleWhatsAppVerify()}
                >
                  {waBusy ? <Loader2 size={15} className="idea-social-spin" /> : null}
                  <span>{tr("تأكيد الرقم والدخول", "Verify & continue")}</span>
                </button>
                <button
                  type="button"
                  className="idea-wa-otp-secondary"
                  disabled={waBusy}
                  onClick={() => setWaStep("phone")}
                >
                  {tr("تغيير الرقم", "Change number")}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {!statusLoading && enabledCount === 0 && (
        <p className="idea-auth-social-note">
          <ShieldCheck size={14} aria-hidden="true" />
          <span>
            {tr(
              "تتفعّل خيارات الدخول الاجتماعي تلقائيًا فور ربط بيانات كل مزوّد على خادم idea-dh.com.",
              "Social sign-in buttons unlock automatically once each provider's server credentials are verified on idea-dh.com.",
              "Les options de connexion sociale s'activent dès que les identifiants serveur sont vérifiés."
            )}
          </span>
        </p>
      )}

      {notice && (
        <p role="status" className="idea-auth-feedback idea-auth-feedback--success">
          <CheckCircle2 size={16} aria-hidden="true" />
          <span>{notice}</span>
        </p>
      )}

      {error && (
        <p role="alert" className="idea-auth-feedback idea-auth-feedback--error">
          {error}
        </p>
      )}
    </section>
  );
}
