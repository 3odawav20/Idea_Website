import { useEffect, useState } from "react";
import { useI18n } from "../i18n/i18n";
import {
  SOCIAL_AUTH_API,
  socialProviderStatus,
  type PhpSocialProvider,
  type PhpSocialProviderStatus,
} from "../backend/phpAccounts";
import {
  AppleBrandIcon, FacebookBrandIcon, GoogleBrandIcon, WhatsAppBrandIcon,
  MicrosoftBrandIcon, LinkedInBrandIcon, GitHubBrandIcon,
} from "./SocialAuthIcons";

const PROVIDERS: { id: PhpSocialProvider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "facebook", label: "Facebook" },
  { id: "apple", label: "Apple" },
  { id: "x", label: "X" },
  { id: "microsoft", label: "Microsoft" },
  { id: "whatsapp", label: "WhatsApp" },
];

// Authentication stays on the production PHP/MySQL identity system.
// OAuth buttons are disabled unless /api/social-auth.php confirms readiness.
// WhatsApp requires a verified OTP flow; never redirect it to an unrelated login.
export function SocialAuth({ business = false }: { redirectTo?: string; business?: boolean }) {
  const { locale } = useI18n();
  const tr = (ar: string, en: string) => locale === "ar" ? ar : en;
  const [providerReady, setProviderReady] = useState<PhpSocialProviderStatus | null>(null);
  const [pending, setPending] = useState<PhpSocialProvider | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    socialProviderStatus()
      .then(flags => { if (active) setProviderReady(flags); })
      .catch(() => { if (active) setProviderReady(null); });
    return () => { active = false; };
  }, []);

  const start = (provider: PhpSocialProvider) => {
    if (pending) return;
    // WhatsApp needs an actual verification send/check screen, not an OAuth URL.
    if (provider === "whatsapp" || providerReady?.[provider] !== true) {
      setError(tr("وسيلة الدخول دي لسه مش مفعّلة على السيرفر.", "This sign-in method is not configured on the server."));
      return;
    }
    setError("");
    setPending(provider);
    window.location.assign(SOCIAL_AUTH_API + "?action=start&provider=" + encodeURIComponent(provider));
  };

  return (
    <section aria-label="Social sign-in" style={{ marginTop: 18, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 14, color: "#f7f5f2", textAlign: "center" }}>
        {tr("أو تابع بحسابك", "Or continue with")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        {PROVIDERS.map(item => {
          const enabled = item.id !== "whatsapp" && providerReady?.[item.id] === true;
          return (
            <button key={item.id} type="button"
              disabled={!enabled || pending !== null}
              aria-label={item.label}
              aria-disabled={!enabled}
              title={!enabled ? tr("غير مفعّل حاليًا", "Not configured yet") : item.label}
              onClick={() => start(item.id)}
              style={{ ...btnStyle, ...(enabled ? {background:"#fafafa",color:"#202124",borderColor:"#dadce0"} : {}), cursor: enabled ? "pointer" : "not-allowed" }}
            >
              {item.id === "google" ? <GoogleBrandIcon /> :
                item.id === "facebook" ? <FacebookBrandIcon /> :
                item.id === "apple" ? <AppleBrandIcon /> :
                item.id === "whatsapp" ? <WhatsAppBrandIcon /> :
                item.id === "microsoft" ? <MicrosoftBrandIcon /> : <span aria-hidden="true">𝕏</span>}
              <span>{item.label}{!enabled && <small style={{display:"block",fontSize:12,color:"#d0cbc5"}}>{tr("قريبًا", "Coming soon")}</small>}</span>
            </button>
          );
        })}
        {([{id:"github",label:"GitHub",Icon:GitHubBrandIcon},{id:"linkedin",label:"LinkedIn",Icon:LinkedInBrandIcon}]).map(({id,label,Icon}) => (
          <button key={id} type="button" disabled title={tr("غير مفعّل حاليًا","Not configured yet")} style={{...btnStyle,cursor:"not-allowed"}}>
            <Icon/><span>{label}<small style={{display:"block",fontSize:12,color:"#d0cbc5"}}>{tr("قريبًا","Coming soon")}</small></span>
          </button>
        ))}
      </div>
      {business && <p style={{fontSize:13,color:"#e2dcd6",textAlign:"center"}}>{tr("تسجيل الدخول الاجتماعي يثبت هويتك فقط؛ صلاحيات الشركة تحتاج استكمال الطلب والموافقة.","Social sign-in verifies your identity only. Company access requires a completed and approved application.")}</p>}
      {!providerReady && (
        <p style={{ fontSize: 13, textAlign: "center", color: "#e2dcd6" }}>
          {tr("تسجيل الدخول بالبريد الإلكتروني متاح من النموذج الأساسي.", "Use the standard email sign-in form while providers are unavailable.")}
        </p>
      )}
      {error && <p role="alert" style={{ color: "var(--idea-danger)", fontSize: 12 }}>{error}</p>}
    </section>
  );
}

const btnStyle = {
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  gap: 8, minHeight: 48, border: "1px solid rgba(255,255,255,.24)",
  borderRadius: 8, padding: "8px 10px",
  background: "rgba(255,255,255,.095)", color: "#f7f5f2",
  fontWeight: 600, fontSize: 13,
} as const;
