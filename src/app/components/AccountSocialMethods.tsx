import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";

/**
 * All IDEA entry pages share this component.
 * It only enables an identity provider after the existing PHP/MySQL account
 * backend explicitly reports that provider as ready at /auth/providers.
 * Provider keys, OAuth callbacks and session issuance MUST remain server-side.
 */
type Audience = "customer" | "business" | "admin";
type Mode = "login" | "register";
type Locale = "ar" | "en" | "fr";
type Provider = "google" | "apple" | "facebook" | "twitter" | "azure";
type ProviderStatus = { providers?: string[]; phone?: boolean };
const PROVIDERS: { id: Provider; label: string }[] = [
  { id: "google", label: "Google" },
  { id: "apple", label: "Apple" },
  { id: "facebook", label: "Facebook" },
  { id: "twitter", label: "X (Twitter)" },
  { id: "azure", label: "Microsoft" },
];
const E164 = /^\+[1-9]\d{7,14}$/;

function BrandMark({ provider }: { provider: Provider }) {
  const common = { width: 20, height: 20, viewBox: "0 0 24 24", "aria-hidden": true as const };
  switch (provider) {
    case "google":
      return <svg {...common}>
        <path fill="#4285F4" d="M21.35 12.25c0-.7-.06-1.37-.18-2.02H12v3.82h5.23a4.47 4.47 0 0 1-1.94 2.92v2.43h3.14c1.84-1.69 2.92-4.18 2.92-7.15Z"/>
        <path fill="#34A853" d="M12 21.75c2.63 0 4.84-.87 6.45-2.35l-3.14-2.43c-.87.58-1.99.93-3.31.93-2.54 0-4.7-1.72-5.47-4.04H3.3v2.5A9.75 9.75 0 0 0 12 21.75Z"/>
        <path fill="#FBBC05" d="M6.53 13.86a5.86 5.86 0 0 1 0-3.72v-2.5H3.3a9.75 9.75 0 0 0 0 8.72l3.23-2.5Z"/>
        <path fill="#EA4335" d="M12 6.1c1.43 0 2.72.49 3.74 1.48l2.8-2.8A9.41 9.41 0 0 0 12 2.25a9.75 9.75 0 0 0-8.7 5.39l3.23 2.5C7.3 7.82 9.46 6.1 12 6.1Z"/>
      </svg>;
    case "facebook":
      return <svg {...common} viewBox="0 0 24 24">
        <circle cx="12" cy="12" r="12" fill="#1877F2"/>
        <path fill="#fff" d="M16.56 14.03l.53-3.45h-3.3V8.34c0-.95.46-1.87 1.94-1.87h1.5V3.53s-1.36-.23-2.65-.23c-2.7 0-4.46 1.64-4.46 4.61v2.67H7.11v3.45h3.01v8.35a12.2 12.2 0 0 0 3.67 0v-8.35h2.77Z"/>
      </svg>;
    case "apple":
      return <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M17.05 12.536c.031 3.21 2.82 4.277 2.851 4.291-.021.062-.446 1.51-1.469 3.002-.887 1.29-1.808 2.574-3.255 2.601-1.423.029-1.88-.84-3.505-.84-1.625 0-2.132.813-3.477.866-1.397.053-2.461-1.394-3.355-2.677-1.825-2.632-3.217-7.437-1.346-10.68.93-1.609 2.59-2.63 4.398-2.657 1.372-.026 2.67.947 3.51.947.838 0 2.413-1.171 4.067-.999.693.028 2.64.28 3.89 2.109-.101.063-2.324 1.353-2.3 4.037ZM15.426 4.633c.741-.896 1.241-2.141 1.104-3.383-1.07.043-2.367.713-3.131 1.608-.685.792-1.283 2.059-1.123 3.277 1.195.092 2.418-.608 3.15-1.502Z"/>
      </svg>;
    case "twitter":
      return <svg {...common} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.582-6.64 7.582H.47l8.6-9.826L0 1.154h7.594l5.24 6.93 6.067-6.931Zm-1.29 19.49h2.04L6.486 3.24H4.298z"/>
      </svg>;
    case "azure":
      return <svg {...common} viewBox="0 0 24 24">
        <path fill="#F35325" d="M1 1h10v10H1z"/>
        <path fill="#81BC06" d="M13 1h10v10H13z"/>
        <path fill="#05A6F0" d="M1 13h10v10H1z"/>
        <path fill="#FFBA08" d="M13 13h10v10H13z"/>
      </svg>;
  }
}

function secureAccountApi(value: string): URL | null {
  if (!value) return null;
  try {
    const url = new URL(value, window.location.origin);
    if (url.protocol !== "https:" && !(import.meta.env.DEV && url.origin === window.location.origin)) return null;
    return url;
  } catch { return null; }
}

export function AccountSocialMethods({
  audience, mode, api, consent, locale,
}: {
  audience: Audience; mode: Mode; api: string; consent: boolean; locale: Locale;
}) {
  const ar = locale === "ar";
  const t = (arabic: string, english: string) => ar ? arabic : english;
  const [ready, setReady] = useState<Set<string>>(new Set());
  const [phoneReady, setPhoneReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const base = secureAccountApi(api);

  useEffect(() => {
    const controller = new AbortController();
    setReady(new Set());
    setPhoneReady(false);
    if (!base) return () => controller.abort();
    const statusUrl = new URL(base.href.replace(/\/$/, "") + "/auth/providers/");
    void fetch(statusUrl.href, {
      method: "GET", credentials: "include", redirect: "error",
      headers: { Accept: "application/json" }, signal: controller.signal,
    }).then(async result => {
      if (!result.ok || !(result.headers.get("content-type") || "").includes("application/json")) return;
      const status = await result.json() as ProviderStatus;
      if (!Array.isArray(status.providers)) return;
      const valid = new Set(PROVIDERS.map(p => p.id));
      if (!controller.signal.aborted) {
        setReady(new Set(status.providers.filter(p => valid.has(p as Provider))));
        setPhoneReady(status.phone === true);
      }
    }).catch(() => {/* Fail closed: an unreachable backend is not an OAuth provider. */});
    return () => controller.abort();
  }, [api]);

  const start = (provider: Provider) => {
    if (!base || !ready.has(provider)) return;
    if (mode === "register" && !consent) {
      setError(t("لازم توافق على الشروط وسياسة الخصوصية أولًا.", "Please accept the terms and privacy policy first."));
      return;
    }
    const url = new URL(base.href.replace(/\/$/, "") + "/oauth/" + provider + "/");
    url.searchParams.set("audience", audience);
    url.searchParams.set("intent", mode);
    // Server MUST create/validate state, nonce, PKCE and account role.
    window.location.assign(url.href);
  };
  const requestCode = async () => {
    if (!base || !phoneReady || busy) return;
    if (!E164.test(phone)) {
      setError(t("اكتب الرقم بصيغة دولية، مثل +201xxxxxxxxx.", "Use international phone format, e.g. +201xxxxxxxxx."));
      return;
    }
    if (mode === "register" && !consent) {
      setError(t("وافق على الشروط وسياسة الخصوصية أولًا.", "Accept the terms and privacy policy first."));
      return;
    }
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(new URL(base.href.replace(/\/$/, "") + "/auth/phone/start/").href, {
        method: "POST", credentials: "include", redirect: "error",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone, audience, intent: mode }),
      });
      if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) throw new Error(t("خدمة الرسائل غير متاحة حاليًا.", "SMS service is currently unavailable."));
      const data = await response.json() as { ok?: boolean };
      if (data.ok !== true) throw new Error(t("تعذّر إرسال رمز التحقق.", "Could not send verification code."));
      setCodeSent(true);
      setMessage(t("لو الرقم متاح للتسجيل، هيوصلك كود تحقق.", "If eligible, you will receive a verification code."));
    } catch (e) { setError(e instanceof Error ? e.message : t("فشل إرسال الكود.", "Failed to send code.")); }
    finally { setBusy(false); }
  };
  const verifyCode = async () => {
    if (!base || !phoneReady || busy || !/^\d{4,8}$/.test(code)) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const response = await fetch(new URL(base.href.replace(/\/$/, "") + "/auth/phone/verify/").href, {
        method: "POST", credentials: "include", redirect: "error",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ phone, code, audience, intent: mode }),
      });
      if (!response.ok || !(response.headers.get("content-type") || "").includes("application/json")) throw new Error(t("فشل تأكيد الرقم.", "Phone verification failed."));
      const result = await response.json() as { ok?: boolean; role?: string };
      if (result.ok !== true || !["customer","business","admin"].includes(result.role || "")) throw new Error(t("الخادم لم يؤكد الحساب وصلاحياته.", "Server did not confirm identity and role."));
      // Authenticated session must be issued server-side as a secure cookie.
      window.location.assign(result.role === "admin" ? "/admin" : result.role === "business" ? "/business" : "/account");
    } catch (e) { setError(e instanceof Error ? e.message : t("تعذّر إتمام التحقق.", "Verification failed.")); }
    finally { setBusy(false); }
  };
  // No public admin social enrollment or OTP-only privilege escalation.
  // Admin uses the existing PHP/MySQL account flow with server-enforced MFA.
  if (audience === "admin") return null;
  return <div className="idea-auth-social" aria-label={t("طرق الدخول الأخرى", "Other sign-in methods")}>
    <p>{t("أو أكمل باستخدام", "Or continue with")}</p>
    <div className="idea-auth-social-grid">
      {PROVIDERS.map(provider => {
        const isReady = ready.has(provider.id);
        return <button className="idea-auth-provider" type="button" key={provider.id}
          onClick={() => start(provider.id)} disabled={!isReady || busy}
          title={!isReady ? t("غير متصل بخدمة حسابات الموقع حاليًا", "Not yet connected to the site's account service") : undefined}
          aria-label={provider.label + (isReady ? "" : t(" - غير مفعل", " - unavailable"))}>
          <BrandMark provider={provider.id}/>
          <span>{provider.label}</span>
          {!isReady && <small aria-hidden="true">{t("غير مفعل", "Unavailable")}</small>}
        </button>;
      })}
      <button type="button" className="idea-auth-provider idea-auth-provider--phone"
        onClick={() => { if (phoneReady) setMessage(t("اكتب رقمك لإرسال كود تحقق.", "Enter your phone to request a code.")); }}
        disabled={!phoneReady || busy} aria-label={t("الدخول برقم الموبايل", "Phone sign in")}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/>
        </svg>
        <span>{t("رقم الموبايل", "Phone")}</span>
        {!phoneReady && <small aria-hidden="true">{t("غير مفعل", "Unavailable")}</small>}
      </button>
    </div>
    {phoneReady && <div className="idea-auth-otp">
      <label htmlFor={"idea-social-phone-" + audience}>{t("رقم الموبايل الدولي", "International phone number")}</label>
      <div className="idea-auth-otp-row">
        <input id={"idea-social-phone-" + audience} type="tel" inputMode="tel" autoComplete="tel"
          placeholder="+201xxxxxxxxx" value={phone} onChange={(e: ChangeEvent<HTMLInputElement>) => { setPhone(e.target.value.trim()); setCodeSent(false); }}/>
        <button type="button" disabled={busy} onClick={() => void requestCode()}>{t("إرسال الكود", "Send code")}</button>
      </div>
      {codeSent && <div className="idea-auth-otp-row">
        <input type="text" inputMode="numeric" autoComplete="one-time-code" maxLength={8}
          value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ""))}
          aria-label={t("رمز التحقق", "Verification code")} placeholder={t("رمز التحقق", "Verification code")}/>
        <button type="button" disabled={busy || !/^\d{4,8}$/.test(code)} onClick={() => void verifyCode()}>{t("تأكيد", "Verify")}</button>
      </div>}
    </div>}
    {message && <p role="status" className="idea-auth-social-message">{message}</p>}
    {error && <p role="alert" className="idea-auth-feedback idea-auth-feedback--error">{error}</p>}
    {!base && <p className="idea-auth-social-caption">{t("طرق الدخول دي هتتفعل بعد ربط خدمة الحسابات الآمنة بالموقع.", "These methods become available after connecting the site's secure account backend.")}</p>}
  </div>;
}
