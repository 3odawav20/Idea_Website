import { useEffect, useState } from "react";
import { Link } from "react-router";
import {
  Accessibility,
  ArrowUpRight,
  Check,
  Cookie,
  Copy,
  FileCheck2,
  FileText,
  Mail,
  Printer,
  RotateCcw,
  Scale,
  ShieldCheck,
} from "lucide-react";
import { useI18n } from "../i18n/i18n";
import {
  getLegalCanonicalUrl,
  getLegalDocumentBySlug,
  LEGAL_CONTACT_EMAIL,
  LEGAL_DOCUMENTS,
  LEGAL_EFFECTIVE_DATE,
  LEGAL_HUB_META,
  OPEN_SOURCE_LICENSES,
  PRIVACY_CONTACT_EMAIL,
  type LegalDocument,
  type LegalSlug,
} from "../data/legalDocuments";
import "./Legal.css";

function DocIcon({ slug }: { slug: LegalSlug }) {
  switch (slug) {
    case "privacy":
      return <ShieldCheck size={20} aria-hidden="true" />;
    case "terms":
      return <FileText size={20} aria-hidden="true" />;
    case "cookies":
      return <Cookie size={20} aria-hidden="true" />;
    case "refund-policy":
      return <RotateCcw size={20} aria-hidden="true" />;
    case "intellectual-property":
      return <Scale size={20} aria-hidden="true" />;
    case "licenses":
      return <FileCheck2 size={20} aria-hidden="true" />;
    case "accessibility":
      return <Accessibility size={20} aria-hidden="true" />;
    default:
      return <Scale size={20} aria-hidden="true" />;
  }
}

function useLegalHeadMeta(title: string, description: string, path: string) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title.includes("IDEA") ? title : `${title} | IDEA`;

    const metaDesc = document.querySelector('meta[name="description"]');
    const prevDesc = metaDesc?.getAttribute("content") ?? null;
    if (metaDesc) metaDesc.setAttribute("content", description);

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    const createdCanonical = !canonical;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    const prevHref = canonical.getAttribute("href");
    canonical.href = getLegalCanonicalUrl(path, window.location.origin);

    return () => {
      document.title = prevTitle;
      if (metaDesc && prevDesc !== null) metaDesc.setAttribute("content", prevDesc);
      if (canonical) {
        if (createdCanonical) canonical.remove();
        else if (prevHref) canonical.href = prevHref;
      }
    };
  }, [title, description, path]);
}

export function LegalHubPage() {
  const { locale } = useI18n();
  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  useLegalHeadMeta(
    LEGAL_HUB_META.title[locale],
    LEGAL_HUB_META.summary[locale],
    LEGAL_HUB_META.path
  );

  return (
    <div className="idea-legal-page">
      <div className="idea-legal-container">
        <nav className="idea-legal-breadcrumb" aria-label={tr("مسار التنقل", "Breadcrumb", "Fil d'Ariane")}>
          <Link to="/">{tr("الرئيسية", "Home", "Accueil")}</Link>
          <span aria-hidden="true">/</span>
          <span>{LEGAL_HUB_META.shortLabel[locale]}</span>
        </nav>

        <header className="idea-legal-hero">
          <div className="idea-legal-kicker">
            <span className="idea-legal-kicker-dot" aria-hidden="true" />
            <span>{tr("الشؤون القانونية والشفافية", "LEGAL & COMPLIANCE", "LÉGAL & CONFORMITÉ")}</span>
          </div>
          <h1>{LEGAL_HUB_META.title[locale]}</h1>
          <p className="idea-legal-hero-summary">{LEGAL_HUB_META.summary[locale]}</p>
          <div className="idea-legal-meta-chips">
            <span className="idea-legal-meta-chip">
              <ShieldCheck size={14} aria-hidden="true" />
              {tr("آخر تحديث: ", "Last updated: ", "Dernière mise à jour : ")}
              {LEGAL_EFFECTIVE_DATE}
            </span>
            <span className="idea-legal-meta-chip">
              {tr("نطاق التطبيق: idea-dh.com", "Applies to: idea-dh.com", "Applicable sur : idea-dh.com")}
            </span>
          </div>
        </header>

        <section
          className="idea-legal-hub-grid"
          aria-label={tr("الوثائق القانونية والتراخيص", "Legal documents & licenses", "Documents légaux et licences")}
        >
          {LEGAL_DOCUMENTS.map((doc) => (
            <Link key={doc.slug} to={doc.path} className="idea-legal-hub-card">
              <div>
                <div className="idea-legal-hub-card-top">
                  <DocIcon slug={doc.slug} />
                  <span className="idea-legal-hub-badge">{doc.badge[locale]}</span>
                </div>
                <h2>{doc.shortLabel[locale]}</h2>
                <p>{doc.summary[locale]}</p>
              </div>
              <span className="idea-legal-hub-card-cta">
                {tr("اقرأ الوثيقة الكاملة", "Read full policy", "Lire le document")}
                <ArrowUpRight size={15} aria-hidden="true" />
              </span>
            </Link>
          ))}
        </section>

        <LegalContactBox />
      </div>
    </div>
  );
}

export function LegalDocumentPage({ slug }: { slug: Exclude<LegalSlug, "legal"> }) {
  const { locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  const doc: LegalDocument = getLegalDocumentBySlug(slug) ?? LEGAL_DOCUMENTS[0];

  useLegalHeadMeta(doc.title[locale], doc.summary[locale], doc.path);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
  }, [slug]);

  const copyCanonical = async () => {
    try {
      await navigator.clipboard.writeText(getLegalCanonicalUrl(doc.path, window.location.origin));
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable in restricted contexts
    }
  };

  return (
    <div className="idea-legal-page">
      <div className="idea-legal-container">
        <nav className="idea-legal-breadcrumb" aria-label={tr("مسار التنقل", "Breadcrumb", "Fil d'Ariane")}>
          <Link to="/">{tr("الرئيسية", "Home", "Accueil")}</Link>
          <span aria-hidden="true">/</span>
          <Link to="/legal">{LEGAL_HUB_META.shortLabel[locale]}</Link>
          <span aria-hidden="true">/</span>
          <span>{doc.shortLabel[locale]}</span>
        </nav>

        <header className="idea-legal-hero">
          <div className="idea-legal-kicker">
            <span className="idea-legal-kicker-dot" aria-hidden="true" />
            <span>{doc.badge[locale]}</span>
          </div>
          <h1>{doc.title[locale]}</h1>
          <p className="idea-legal-hero-summary">{doc.summary[locale]}</p>

          <div className="idea-legal-meta-row">
            <div className="idea-legal-meta-chips">
              <span className="idea-legal-meta-chip">
                <DocIcon slug={doc.slug} />
                {tr("تاريخ السريان: ", "Effective: ", "En vigueur : ")}
                {doc.effectiveDate}
              </span>
            </div>
            <div className="idea-legal-actions">
              <button
                type="button"
                className="idea-legal-action-btn"
                onClick={() => void copyCanonical()}
              >
                {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
                {copied
                  ? tr("تم النسخ", "Copied", "Copié")
                  : tr("نسخ الرابط", "Copy link", "Copier le lien")}
              </button>
              <button
                type="button"
                className="idea-legal-action-btn"
                onClick={() => window.print()}
              >
                <Printer size={14} aria-hidden="true" />
                {tr("طباعة", "Print", "Imprimer")}
              </button>
            </div>
          </div>
        </header>

        <div className="idea-legal-layout">
          <aside className="idea-legal-sidebar">
            <nav
              className="idea-legal-nav-box"
              aria-label={tr("الوثائق القانونية", "Legal policies", "Documents légaux")}
            >
              <p className="idea-legal-nav-title">
                {tr("المركز القانوني والتراخيص", "Legal & Licenses", "Légal & Licences")}
              </p>
              <div className="idea-legal-nav-list">
                <Link to="/legal" className="idea-legal-nav-link">
                  <span>{LEGAL_HUB_META.shortLabel[locale]}</span>
                </Link>
                {LEGAL_DOCUMENTS.map((item) => (
                  <Link
                    key={item.slug}
                    to={item.path}
                    className={`idea-legal-nav-link${item.slug === doc.slug ? " is-active" : ""}`}
                    aria-current={item.slug === doc.slug ? "page" : undefined}
                  >
                    <span>{item.shortLabel[locale]}</span>
                  </Link>
                ))}
              </div>
            </nav>

            <nav
              className="idea-legal-nav-box"
              aria-label={tr("محتويات هذه الصفحة", "On this page", "Sur cette page")}
            >
              <p className="idea-legal-nav-title">
                {tr("محتويات الصفحة", "On this page", "Sommaire")}
              </p>
              <div className="idea-legal-nav-list">
                {doc.sections.map((sec) => (
                  <a key={sec.id} href={`#${sec.id}`} className="idea-legal-nav-link">
                    <span>{sec.heading[locale]}</span>
                  </a>
                ))}
              </div>
            </nav>
          </aside>

          <article className="idea-legal-article">
            {doc.sections.map((section) => (
              <section key={section.id} id={section.id} className="idea-legal-section">
                <h2>{section.heading[locale]}</h2>
                {section.paragraphs.map((p, idx) => (
                  <p key={idx}>{p[locale]}</p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="idea-legal-bullets">
                    {section.bullets.map((b, idx) => (
                      <li key={idx}>{b[locale]}</li>
                    ))}
                  </ul>
                )}

                {doc.slug === "licenses" && section.id === "oss-attributions" && (
                  <div className="idea-licenses-table-wrap">
                    <table className="idea-licenses-table">
                      <thead>
                        <tr>
                          <th>{tr("المكتبة / المكون", "Package", "Bibliothèque")}</th>
                          <th>{tr("الترخيص", "License", "Licence")}</th>
                          <th>{tr("الدور داخل المنصة", "Usage", "Utilisation")}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {OPEN_SOURCE_LICENSES.map((entry) => (
                          <tr key={entry.name}>
                            <td>
                              <a href={entry.url} target="_blank" rel="noopener noreferrer">
                                {entry.name}
                              </a>
                            </td>
                            <td>
                              <span className="idea-license-pill">{entry.license}</span>
                            </td>
                            <td>{entry.purpose[locale]}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            ))}

            <LegalContactBox />
          </article>
        </div>
      </div>
    </div>
  );
}

function LegalContactBox() {
  const { locale } = useI18n();
  const tr = (ar: string, en: string, fr = en) =>
    locale === "ar" ? ar : locale === "fr" ? fr : en;

  return (
    <div className="idea-legal-contact-card">
      <div>
        <h3>{tr("الاستفسارات القانونية وحقوق البيانات", "Legal & Data Protection Inquiries", "Questions légales et données")}</h3>
        <p>
          {tr(
            "لطلبات حذف الحساب، أو إشعارات الملكية الفكرية، أو أي استفسار قانوني بخصوص منصة IDEA، تواصل مباشرة مع الفريق المختص.",
            "For data deletion requests, intellectual property notices, supplier verification inquiries, or compliance questions, reach our legal team directly.",
            "Pour toute demande de suppression de compte, notification de propriété intellectuelle ou question juridique, contactez directement notre équipe."
          )}
        </p>
      </div>
      <div className="idea-legal-contact-links">
        <a href={`mailto:${LEGAL_CONTACT_EMAIL}`}>
          <Mail size={15} aria-hidden="true" />
          {LEGAL_CONTACT_EMAIL}
        </a>
        <a href={`mailto:${PRIVACY_CONTACT_EMAIL}`}>
          <ShieldCheck size={15} aria-hidden="true" />
          {PRIVACY_CONTACT_EMAIL}
        </a>
        <Link to="/contact" className="is-primary">
          {tr("صفحة التواصل", "Contact page", "Page contact")}
          <ArrowUpRight size={15} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}
