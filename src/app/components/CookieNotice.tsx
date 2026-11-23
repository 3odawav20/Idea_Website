import { useEffect, useState } from "react";
import { Link } from "react-router";
import { Cookie } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import "../pages/Legal.css";

const STORAGE_KEY = "idea-cookie-consent-v1";

export function CookieNotice() {
  const { locale } = useI18n();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (!saved) setVisible(true);
    } catch {
      setVisible(false);
    }
  }, []);

  if (!visible) return null;

  const choose = (choice: "accepted" | "essential") => {
    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ choice, at: new Date().toISOString() })
      );
    } catch {
      // Ignore storage failures in restricted browsing modes
    }
    setVisible(false);
  };

  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  return (
    <aside
      className="idea-cookie-notice"
      role="region"
      aria-label={tr("إشعار ملفات تعريف الارتباط", "Cookie notice", "Avis sur les cookies")}
      data-testid="cookie-notice"
    >
      <div className="idea-cookie-notice-title">
        <Cookie size={15} color="var(--idea-gold)" aria-hidden="true" />
        <span>{tr("الخصوصية وملفات تعريف الارتباط", "Privacy & Cookies", "Confidentialité et cookies")}</span>
      </div>
      <p>
        {tr(
          "نستخدم ملفات ارتباط أساسية لتأمين الجلسة وحفظ اللغة والمظهر دون أي تتبع إعلاني. راجع ",
          "We use essential cookies for session security and saved language/theme preferences without ad trackers. Review our ",
          "Nous utilisons des cookies essentiels pour la sécurité de session et vos préférences sans traceurs publicitaires. Consultez notre "
        )}
        <Link to="/cookies">{tr("سياسة ملفات الارتباط", "Cookie Policy", "Politique de cookies")}</Link>
        {tr(" و", " and ", " et ")}
        <Link to="/privacy">{tr("سياسة الخصوصية", "Privacy Policy", "Politique de confidentialité")}</Link>.
      </p>
      <div className="idea-cookie-notice-actions">
        <button
          type="button"
          className="idea-cookie-btn idea-cookie-btn--primary"
          onClick={() => choose("accepted")}
        >
          {tr("موافق", "Accept", "Accepter")}
        </button>
        <button
          type="button"
          className="idea-cookie-btn idea-cookie-btn--ghost"
          onClick={() => choose("essential")}
        >
          {tr("الأساسية فقط", "Essential only", "Essentiels uniquement")}
        </button>
      </div>
    </aside>
  );
}
