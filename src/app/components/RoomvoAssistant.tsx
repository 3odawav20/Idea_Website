import { useEffect } from "react";
import { useI18n } from "../i18n/i18n";
import "./RoomvoAssistant.css";

const ROOMVO_SCRIPT_ID = "roomvoAssistant";
const ROOMVO_SCRIPT_SRC = "https://www.roomvo.com/static/scripts/b2b/common/assistant.js";

/**
 * Loads the official Roomvo Assistant snippet once for the IDEA storefront.
 * Roomvo controls the catalogue and branding rendered inside its cross-origin
 * widget; this loader applies the exact locale and position supplied by Roomvo.
 */
export function RoomvoAssistant() {
  useEffect(() => {
    const existing = document.getElementById(ROOMVO_SCRIPT_ID);
    if (existing) {
      document.body.classList.add("idea-roomvo-assistant-active");
      return;
    }

    const script = document.createElement("script");
    script.async = true;
    script.id = ROOMVO_SCRIPT_ID;
    script.type = "text/javascript";
    script.setAttribute("data-locale", "ar-eg");
    script.setAttribute("data-position", "bottom-right");
    script.src = ROOMVO_SCRIPT_SRC;

    script.addEventListener("load", () => {
      script.dataset.loadState = "loaded";
      document.body.classList.add("idea-roomvo-assistant-active");
    }, { once: true });

    script.addEventListener("error", () => {
      script.dataset.loadState = "error";
      document.body.classList.remove("idea-roomvo-assistant-active");
      console.error("Roomvo Assistant failed to load.");
    }, { once: true });

    document.body.appendChild(script);
  }, []);

  return null;
}

/** IDEA-branded explanation; Roomvo's own catalogue remains account-managed. */
export function RoomvoAssistantPanel() {
  const { locale } = useI18n();
  const ar = locale === "ar";

  return (
    <section className="idea-roomvo-panel" lang={locale} dir={ar ? "rtl" : "ltr"} aria-label={ar ? "مساعد Roomvo من IDEA" : "IDEA Roomvo Assistant"}>
      <div className="idea-roomvo-panel-copy">
        <span className="idea-roomvo-panel-kicker">IDEA <i>×</i> ROOMVO</span>
        <h2>{ar ? "جرّب الخامات في مساحتك" : "Visualize materials in your space"}</h2>
        <p>{ar
          ? "افتح مساعد Roomvo من الزر العائم أسفل يمين الشاشة، وارفع صورة غرفتك لتجربة المنتجات المتاحة في حساب IDEA على Roomvo."
          : "Open Roomvo Assistant from the floating button at the bottom-right, upload your room photo, and try the products enabled for IDEA in Roomvo."}</p>
      </div>
      <div className="idea-roomvo-panel-mark">
        <span>ROOMVO ASSISTANT</span>
        <strong>{ar ? "مدعوم من Roomvo" : "Powered by Roomvo"}</strong>
        <small>{ar ? "عربي مصري · أسفل اليمين" : "Arabic (Egypt) · Bottom-right"}</small>
      </div>
      <p className="idea-roomvo-panel-note">
        {ar
          ? "مهم: المنتجات التي تظهر داخل مساعد Roomvo تأتي من كتالوج حسابك لدى Roomvo. كتالوج IDEA الموجود في MySQL والمعروض أسفل الاستوديو يظل كما هو، ولا تتم مزامنته مع Roomvo تلقائيًا بمجرد إضافة السكريبت؛ يجب أن يكون كتالوج IDEA مفعّلًا ومستوردًا داخل حساب Roomvo."
          : "Important: products inside Roomvo Assistant come from the catalogue enabled in your Roomvo account. IDEA's MySQL catalogue below remains unchanged and is not automatically synchronized to Roomvo by this script; the IDEA catalogue must be enabled and onboarded in your Roomvo account."}
      </p>
    </section>
  );
}
