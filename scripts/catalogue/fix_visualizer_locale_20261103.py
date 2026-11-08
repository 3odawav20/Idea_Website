from pathlib import Path
root=Path(__file__).resolve().parents[2]
tsx=root/"src/app/pages/AiVisualizerStudio.tsx"
s=tsx.read_text(encoding="utf-8")
def change(before,after):
 global s
 assert s.count(before)==1,(before[:100],s.count(before))
 s=s.replace(before,after,1)
change('  const selectedId = searchParams.get("product");','''  // Supplier catalogue text is sometimes only populated in one language.
  // Never display arbitrary Arabic text in English UI (or vice versa).
  const containsArabic = (value: string) => /[\\u0600-\\u06FF]/u.test(value);
  const containsLatin = (value: string) => /[A-Za-z]/.test(value);
  const localizedValue = (value: string | null | undefined, fallbackAr: string, fallbackEn: string): string => {
    const original = String(value || "").trim();
    if (!original) return tr(fallbackAr, fallbackEn);
    if (ar) return containsArabic(original) || !containsLatin(original) ? original : fallbackAr;
    return containsArabic(original) ? fallbackEn : original;
  };
  const localizedName = (product: Product): string => {
    const direct = String(product.name[locale] || "").trim();
    const english = String(product.name.en || "").trim();
    const arabic = String(product.name.ar || "").trim();
    const code = product.code || ideaInternalCode(product);
    if (ar) return containsArabic(direct) ? direct : containsArabic(arabic) ? arabic : "خامة " + code;
    return direct && !containsArabic(direct) ? direct : english && !containsArabic(english) ? english : "Material " + code;
  };
  const selectedId = searchParams.get("product");''')
change('  const productName = selectedProduct?.name[locale] || tr("اختر خامة", "Select a material");',
'''  const productName = selectedProduct ? localizedName(selectedProduct) : tr("اختر خامة", "Select a material");''')
change('<span><b>IDEA</b><small>IMMUTABLE SCENE ENGINE</small></span>',
       '<span><b>IDEA</b><small>{tr("محرك حماية المشهد", "IMMUTABLE SCENE ENGINE")}</small></span>')
change('<b>PIXEL-SAFE COMPOSITING</b><small>ORIGINAL FRAME · VERIFIED MASK · IDEA WATERMARK</small>',
       '<b>{tr("تركيب آمن للصورة", "PIXEL-SAFE COMPOSITING")}</b><small>{tr("الصورة الأصلية · قناع معتمد · علامة IDEA", "ORIGINAL FRAME · VERIFIED MASK · IDEA WATERMARK")}</small>')
change('<span className="idea-studio-kicker"><Sparkles size={14} /> IDEA MATERIAL INTELLIGENCE / 2030</span>',
       '<span className="idea-studio-kicker"><Sparkles size={14} /> {tr("IDEA / استوديو الخامات 2030", "IDEA MATERIAL INTELLIGENCE / 2030")}</span>')
change('<small>JPG · PNG · WEBP · 12 MB</small>',
       '<small dir="ltr">JPG · PNG · WEBP · 12 MB</small>')
change('<span className="idea-studio-kicker">IDEA / MATERIAL ATLAS 2030</span>',
       '<span className="idea-studio-kicker">{tr("IDEA / مكتبة الخامات 2030", "IDEA / MATERIAL ATLAS 2030")}</span>')
change('<strong>{product.name[locale] || product.name.en}</strong>',
       '<strong>{localizedName(product)}</strong>')
change('<h3>{productName}</h3>', '<h3>{productName}</h3>')
change('<p>{selectedProduct.manufacturer || selectedProduct.brand}</p>',
       '<p>{localizedValue(selectedProduct.manufacturer || selectedProduct.brand, "الشركة المصنعة غير مترجمة", "Manufacturer name not localized")}</p>')
change('<dd>{selectedProduct.finish || "—"}</dd>',
       '<dd>{localizedValue(selectedProduct.finish, "التشطيب غير محدد", "Finish not specified")}</dd>')
change('''<small>{product.manufacturer ? productMaker(product, locale).value : product.brand + (locale === "ar" ? " · المصنع قيد التوثيق" : " · maker unverified")}</small>''',
'''<small>{localizedValue(product.manufacturer ? productMaker(product, locale).value : product.brand, "الشركة غير مترجمة", "Maker name not localized")}{product.manufacturer ? "" : tr(" · المصنع غير مؤكد", " · maker unverified")}</small>''')
change('''{product.finish ? " · " + product.finish : ""}''',
       '''{product.finish ? " · " + localizedValue(product.finish, "تشطيب غير محدد", "Finish not specified") : ""}''')
change('''{item.options.map((value) => <option value={value} key={value}>{value}</option>)}''',
       '''{item.options.map((value) => <option value={value} key={value}>{localizedValue(value, "بيانات المصدر غير مترجمة", "Source value not localized")}</option>)}''')
change('''{error && <div className="idea-studio-error" role="alert"><CircleAlert size={17} /><span>{error}</span>''',
       '''{error && <div className="idea-studio-error" role="alert"><CircleAlert size={17} /><span>{localizedValue(error, "تعذر إتمام الطلب. يُرجى المحاولة مرة أخرى.", "The request could not be completed. Please try again.")}</span>''')
change('<main className="idea-studio" dir={ar ? "rtl" : "ltr"}>',
       '<main className="idea-studio" lang={locale} dir={ar ? "rtl" : "ltr"}>')
tsx.write_text(s,encoding="utf-8")
css=root/"src/app/pages/AiVisualizerStudio.css"
text=css.read_text(encoding="utf-8")
tag="/* Visualizer locale typography and overflow safety — 2026-11-03 */"
assert tag not in text
text += """

"""+tag+"""
.idea-studio,
.idea-studio * { min-width: 0; }
.idea-studio h1, .idea-studio h2, .idea-studio h3,
.idea-studio label, .idea-studio p, .idea-studio button,
.idea-studio .idea-studio-rail-head, .idea-studio .idea-atlas-card-body,
.idea-studio .idea-studio-commandbar {
  overflow-wrap: anywhere;
  word-break: normal;
}
.idea-studio .idea-studio-rail-head h2,
.idea-studio .idea-studio-material h3 { line-height: 1.4; }
.idea-studio .idea-studio-control-block .idea-studio-choice button {
  white-space: normal; padding: 8px 5px;
  line-height: 1.35; min-height: 42px;
}
.idea-studio .idea-atlas-card-body strong,
.idea-studio .idea-atlas-card-body small {
  text-overflow: initial; white-space: normal; overflow-wrap: anywhere;
}
.idea-studio .idea-atlas-card-body strong { line-height: 1.4; }
.idea-studio[lang="ar"], .idea-studio[lang="ar"] button,
.idea-studio[lang="ar"] input, .idea-studio[lang="ar"] select {
  font-family: var(--idea-font-arabic), system-ui, sans-serif;
  letter-spacing: normal;
}
.idea-studio[lang="ar"] .idea-studio-kicker,
.idea-studio[lang="ar"] .idea-studio-rail-head small,
.idea-studio[lang="ar"] .idea-atlas-overline {
  letter-spacing: 0;
  text-transform: none;
  line-height: 1.7;
}
.idea-studio[lang="en"], .idea-studio[lang="en"] button,
.idea-studio[lang="en"] input, .idea-studio[lang="en"] select,
.idea-studio[lang="fr"], .idea-studio[lang="fr"] button {
  font-family: var(--idea-font-body), system-ui, sans-serif;
}
.idea-studio .idea-studio-swatch-image img { display: block; }
.idea-studio .idea-atlas-facet select,
.idea-studio .idea-studio-control-block select { width: 100%; max-width: 100%; }
@media(max-width: 980px) {
  .idea-studio .idea-studio-commandbar { flex-wrap: wrap; row-gap: 10px; }
  .idea-studio .idea-studio-command-status { flex-wrap: wrap; }
  .idea-studio .idea-studio-library .idea-atlas-facets > * { min-width: 0; }
}
@media(max-width: 680px) {
  .idea-studio .idea-studio-workspace { width: 100%; }
  .idea-studio .idea-studio-library { max-width: calc(100% - 16px); }
  .idea-studio .idea-atlas-card-details,
  .idea-studio .idea-atlas-card-bottom,
  .idea-studio .idea-studio-consent { line-height: 1.5; }
}
"""
css.write_text(text,encoding="utf-8")
print("LOCALIZED_STUDIO",tsx.stat().st_size,"CSS",css.stat().st_size)
