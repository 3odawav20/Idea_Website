from pathlib import Path
root=Path(__file__).resolve().parents[2]
p=root/'src/app/i18n/i18n.tsx'
s=p.read_text('utf-8')
old='''  const [locale, setLocale] = useState<Locale>("en");
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);'''
new='''  const [locale, setLocale] = useState<Locale>(() => {
    if (typeof window === "undefined") return "en";
    try {
      const stored = window.localStorage.getItem("idea-language");
      return stored === "ar" || stored === "fr" || stored === "en" ? stored : "en";
    } catch { return "en"; }
  });
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
    try { window.localStorage.setItem("idea-language", locale); } catch { /* Storage may be disabled. */ }
  }, [dir, locale]);'''
assert s.count(old)==1,'Expected i18n state block'
p.write_text(s.replace(old,new),encoding='utf-8')
p=root/'src/styles/globals.css'
s=p.read_text('utf-8')
extra='''
/* Locale-locked typography and layout: never use Latin heading tracking in RTL. */
:root { font-synthesis: none; }
html[lang="ar"] body,
html[lang="ar"] input,
html[lang="ar"] select,
html[lang="ar"] textarea,
html[lang="ar"] button {
  font-family: var(--idea-font-arabic), system-ui, sans-serif;
  letter-spacing: normal;
}
html[lang="en"] body,
html[lang="en"] input,
html[lang="en"] select,
html[lang="en"] textarea,
html[lang="en"] button,
html[lang="fr"] body {
  font-family: var(--idea-font-body), system-ui, sans-serif;
}
html[lang="ar"] h1, html[lang="ar"] h2, html[lang="ar"] h3,
html[lang="ar"] h4, html[lang="ar"] .idea-display,
html[lang="ar"] [class*="eyebrow"],
html[lang="ar"] [class*="kicker"] {
  font-family: var(--idea-font-arabic), system-ui, sans-serif;
  letter-spacing: 0 !important;
  line-height: 1.45;
  text-transform: none;
}
html[lang="en"] h1, html[lang="en"] h2, html[lang="en"] h3,
html[lang="fr"] h1, html[lang="fr"] h2, html[lang="fr"] h3 {
  overflow-wrap: break-word;
  hyphens: auto;
}
html[lang] button, html[lang] a, html[lang] label,
html[lang] .idea-home-story-copy, html[lang] .idea-home-centered-title,
html[lang] .idea-home-quote, html[lang] .idea-admin-ticker {
  min-width: 0;
  max-width: 100%;
  overflow-wrap: break-word;
}
html[lang] input, html[lang] select, html[lang] textarea { max-width: 100%; }
html[lang="ar"] input[type="email"], html[lang="ar"] input[type="url"],
html[lang="ar"] input[type="tel"], html[lang="ar"] input[type="number"] {
  direction: ltr;
  text-align: start;
}
@media (max-width: 600px) {
  html[lang] h1 { font-size: clamp(1.8rem, 7vw, 2.65rem); }
  html[lang] h2 { font-size: clamp(1.45rem, 5vw, 2.1rem); }
  html[lang] p, html[lang] label { line-height: 1.65; }
  html[lang] .idea-home-section { width: min(100% - 32px, 1280px); }
}
'''
marker='/* IDEA LOCALE TYPOGRAPHY 20261103 */'
assert marker not in s
p.write_text(s+'\n'+marker+'\n'+extra,encoding='utf-8')
print('PERSISTENT_LOCALE_AND_TYPOGRAPHY_PATCHED')
