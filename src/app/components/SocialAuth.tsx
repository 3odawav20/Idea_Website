import { useState } from "react";
import { useNavigate } from "react-router";
import {
  auth,
  googleProvider,
  facebookProvider,
  appleProvider,
  signInWithPopup,
} from "../../lib/firebase";
import { useBackend } from "../backend/db";
import { resolvePostAuthRoute } from "../backend/authValidation";
import { useI18n } from "../i18n/i18n";
import {
  AppleBrandIcon,
  FacebookBrandIcon,
  GoogleBrandIcon,
  WhatsAppBrandIcon,
} from "./SocialAuthIcons";

export function SocialAuth({ redirectTo = "/account" }: { redirectTo?: string }) {
  const { locale } = useI18n();
  const { refresh } = useBackend();
  const nav = useNavigate();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  const runPopup = async (providerKey: "google" | "apple" | "facebook") => {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const provider =
        providerKey === "google"
          ? googleProvider
          : providerKey === "apple"
            ? appleProvider
            : facebookProvider;
      await signInWithPopup(auth, provider);
      const user = await refresh({ authMethod: providerKey });
      nav(user ? resolvePostAuthRoute(user.role) : redirectTo);
    } catch (e: unknown) {
      const code = typeof e === "object" && e && "code" in e ? String((e as { code: string }).code) : "";
      if (code === "auth/operation-not-allowed") {
        setError(
          tr(
            `مزوّد ${providerKey} غير مفعّل بعد في Firebase Authentication لهذا المشروع.`,
            `${providerKey} sign-in is not yet enabled in Firebase Authentication for this project.`
          )
        );
      } else if (code !== "auth/popup-closed-by-user") {
        setError(e instanceof Error ? e.message : tr("تعذّر تسجيل الدخول.", "Sign-in failed."));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <section aria-label="Social sign-in" style={{ marginTop: 18, display: "grid", gap: 10 }}>
      <div style={{ fontSize: 12, color: "var(--idea-text-muted)", textAlign: "center" }}>
        {tr("أو تابع بسرعة باستخدام", "Or continue with")}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 8 }}>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runPopup("google")}
          style={btnStyle}
        >
          <GoogleBrandIcon /> <span>Google</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runPopup("apple")}
          style={btnStyle}
        >
          <AppleBrandIcon /> <span>Apple</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void runPopup("facebook")}
          style={btnStyle}
        >
          <FacebookBrandIcon /> <span>Facebook</span>
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => nav("/login?channel=whatsapp")}
          style={btnStyle}
        >
          <WhatsAppBrandIcon /> <span>{tr("واتساب / هاتف", "WhatsApp")}</span>
        </button>
      </div>
      {error && (
        <p role="alert" style={{ color: "var(--idea-danger)", fontSize: 12 }}>
          {error}
        </p>
      )}
    </section>
  );
}

const btnStyle: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  minHeight: 44,
  border: "var(--idea-hairline)",
  borderRadius: 8,
  padding: "8px 10px",
  cursor: "pointer",
  background: "var(--idea-surface-2)",
  color: "var(--idea-text)",
  fontWeight: 600,
  fontSize: 13,
};
