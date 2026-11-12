"""Produce complete EN marketplace controls from reviewed Arabic templates.
Source of truth: Arabic original; English is a separately built, static locale.
Do not machine-translate user-supplied product identity fields.
"""
from pathlib import Path
import re
root=Path(__file__).resolve().parents[2]/"server/cpanel/marketplace"
html=(root/"index.html").read_text("utf-8")
js=(root/"marketplace.js").read_text("utf-8")
html_labels=[
"IDEA | Company and Product Center",
"Skip to content",
"Companies and accounts",
"Loading companies...",
"Control panel",
"Overview",
"Products and brands",
"Search by code",
"Monthly sales",
"Company managers",
"Announcement bar",
"Advertising packages",
"IDEA AI Image Studio",
"Ceramic catalogue",
"Company Management",
"Each company, its products and private prices — separate permissions and real data",
"Arabic",
"Website",
"Checking your account session...",
"Registered companies",
"Selected company products",
"Approved products",
"Confirmed paid orders",
"Selected company",
"Choose a company from the list",
"Suspending a company hides its products. Reinstatement requires document review.",
"Suspend company",
"Quick actions",
"Company and product information is stored in MySQL. No fabricated sales are displayed.",
"Add product",
"Search by product code",
"Advertising requests",
"Products by company and brand",
"Tile dimensions in centimetres are also saved in millimetres. Prices are private to administrators and the company.",
"+ New product",
"Add or edit tile",
"Product code / SKU",
"Product name",
"Brand",
"Manufacturer",
"Material",
"Ceramic",
"Porcelain",
"Marble",
"Granite",
"Tile",
"Finish",
"Actual width (cm)",
"Actual length (cm)",
"Colour",
"Private price (EGP)",
"URL of tile photo hosted on IDEA",
"Description",
"A new product remains a draft until an IDEA administrator approves the photos, dimensions and details. Unknown sizes are not accepted.",
"Save draft",
"Cancel",
"Search by tile code, company or brand",
"Verified company catalogue results with suggestions based on size, material and finish.",
"Search",
"Similar products",
"Confirmed monthly sales",
"Month",
"Only orders with confirmed captured payments count; unpaid orders and quotations are excluded.",
"Company managers and permissions",
"Only a company owner or platform administrator can appoint or revoke an existing manager. Nobody can grant themselves platform administrator rights.",
"Registered account email",
"Permission",
"Activate company manager",
"Revoke permission",
"Save",
"Sticky announcement bar",
"Messages appear at the top of the site in the visitor's selected language, and only IDEA administrators can edit them.",
"Arabic message",
"Internal site link",
"Status",
"Draft",
"Publish on website",
"Archive",
"Save message",
"IDEA advertising and packages",
"Administrators control IDEA rates. Google and Meta campaigns require separate variable budgets and approval.",
"Company advertising request",
"Before producing or uploading a hero video, contact the team to confirm dimensions and quality. Required: MP4 H.264, 1920×1080, 16:9, 6–20 seconds, maximum 40 MB. Uploads require review.",
"Package",
"Media type",
"Image",
"Video",
"Advertisement title",
"Details or contact request",
"Submit request to administrators",
"Campaign requests",
"IDEA © 2026 · Account and company data is protected by access controls ·",
"Back to website",
]
html_labels.insert(2,"Company management")
html_labels.insert(15,"IDEA / Company Intelligence")
html_labels.insert(html_labels.index("Arabic")+1,"English")
# Strip the Arabic-route redirect from the English variant to avoid reload loops.
html=html.replace('''<script>
try { if(localStorage.getItem("idea-language")==="en")location.replace("/marketplace/en.html"+location.hash); }catch(_){}
</script>
''','')
matches=list(re.finditer(r">([^<>]+)<",html))
arabic_matches=[m for m in matches if re.search(r"[\u0600-\u06FF]",m.group(1))]
assert len(arabic_matches)==len(html_labels),f"expected {len(html_labels)} actual {len(arabic_matches)}"
for match,translated in reversed(list(zip(arabic_matches,html_labels))):
 old=match.group(1);html=html[:match.start(1)]+old[:len(old)-len(old.lstrip())]+translated+old[len(old.rstrip()):]+html[match.end(1):]
attrs={
'أقسام التحكم':'Control sections',
'اللغة':'Language',
'الوضع الفاتح والداكن':'Switch light and dark modes',
'مطفي / لامع':'Matte / Glossy',
'مثال: CER-60120-01':'Example: CER-60120-01',
'اختياري':'Optional',
'كود المنتج / البراند / الشركة المصنعة':'Product code / Brand / Manufacturer',
}
for ar,en in attrs.items():html=html.replace(ar,en)
html=html.replace('<html lang="ar" dir="rtl">','<html lang="en" dir="ltr">')
html=html.replace('<script src="./marketplace.js" defer></script>','<script src="./marketplace.en.js" defer></script>')
# The static English route is explicitly requested when saved locale is EN.
html=html.replace('</head>',"""<script>
try { if(localStorage.getItem("idea-language")==="ar")location.replace("/marketplace/"+location.hash); }catch(_){}
</script>
</head>""",1)
(root/"en.html").write_text(html,encoding="utf-8")
assert not re.search(r"[\u0600-\u06FF]",html),"English HTML still contains Arabic text"
source_ar=(root/"index.html").read_text("utf-8")
if 'location.replace("/marketplace/en.html"' not in source_ar:
 (root/"index.html").write_text(source_ar.replace('</head>',"""<script>
try { if(localStorage.getItem("idea-language")==="en")location.replace("/marketplace/en.html"+location.hash); }catch(_){}
</script>
</head>""",1),encoding="utf-8")
js_pairs=[
('الشريط العلوي','Top line'),('المجموعات الجديدة','New Collections'),('فيديو الهيرو','Hero video'),
('ج.م','EGP'),('موثقة','Verified'),('قيد التوثيق','Under verification'),('موقوفة','Suspended'),
('معتمد','Approved'),('قيد المراجعة','Under review'),('مسودة','Draft'),('منشور','Published'),('مرفوض','Rejected'),('يحتاج تعديل','Revision needed'),
('المعلومات المحمية','Protected information'),
('دخول الأدمن أو صاحب الشركة يتطلب حسابًا موثقًا على IDEA. الزائر يمكنه البحث في المنتجات المعتمدة فقط، من غير الاطلاع على الأسعار الخاصة.','Admin and company access requires a verified IDEA account. Visitors may search approved products but cannot view private prices.'),
('تسجيل الدخول','Sign in'),('إنشاء حساب','Create account'),('يرجى تسجيل الدخول','Please sign in'),
('لا توجد شركات متاحة لهذا الحساب','No companies are available for this account'),
('منتجات','products'),('يلزم تسجيل الدخول','Sign-in required'),('مرحبًا، ','Welcome, '),('الحساب: ','Account: '),
('صلاحيات الشركة: ','Company role: '),('لا توجد','None'),('لا توجد شركة مختارة','No company selected'),
('الحالة: ','Status: '),('المدير المسجل: ','Registered owner: '),('منتجات مسجلة: ','Registered products: '),
('إعادة تفعيل الشركة بعد مراجعة مستنداتها','Reinstate company after document review'),('إيقاف الشركة','Suspend company'),
('تعديل','Edit'),('إلغاء الاعتماد','Revoke approval'),('اعتماد المنتج','Approve product'),
('إيقاف','Disable'),('تفعيل','Enable'),('بدون براند','No brand'),('شركة غير محددة','Unknown manufacturer'),
('المقاس: ','Size: '),('غير مسجل','Not registered'),('السعر غير مدخل','Price not entered'),
('معتمد ومنشور','Approved and published'),('معتمد لكن متوقف','Approved, inactive'),('بانتظار مراجعة الأدمن','Awaiting admin review'),
('اختَر شركة لإدارة المنتجات. الحساب العام يستطيع البحث في المنتجات المنشورة فقط.','Select a company to manage products. Visitors can search approved public products only.'),
('لا توجد منتجات لهذه الشركة حتى الآن. أضف المنتج بكوده وبراندِه ومقاسه الحقيقي.','No products for this company yet. Add products with a verified code, brand and actual size.'),
('غير مصنف','Unclassified'),('صاحب الشركة أو أدمن المنصة فقط يدير الأعضاء.','Only the company owner or platform administrator can manage staff.'),
('نشط','Active'),('موقوف','Inactive'),('لا يوجد مديرون مفوضون حاليًا.','No delegated managers.'),
('لا توجد شركة متاحة للتقرير.','No company is available for reporting.'),
('لم يُحمّل التقرير.','Report unavailable.'),
('لا توجد مبيعات مدفوعة ومؤكدة لهذا الشهر. طلبات عرض السعر والمشتريات غير المدفوعة لا تُحسب مبيعات.','No confirmed paid sales for this month. Quotations and unpaid orders are excluded.'),
('الشركة','Company'),('طلبات مدفوعة','Paid orders'),('إجمالي مدفوع','Paid total'),
('تسوية المرتجعات وتوزيعها بين الشركات تحتاج دفتر محاسبي موثق قبل اعتماد صافي نهائي.','Refund reconciliation requires a verified ledger before reporting final net sales.'),
('الأدمن وحده يستطيع تعديل شريط الإعلانات.','Only administrators can edit the announcement bar.'),
('لم تُنشر أي إعلانات بعد.','No published announcements.'),
('لم ينشر الأدمن أسعار الباقات بعد. لن نظهر أسعارًا لم يعتمدها.','No approved advertising rates have been published.'),
('منشورة','Published'),('مسودة خاصة بالأدمن','Private admin draft'),
('يومًا','days'),('السعر بالجنيه','Price (EGP)'),('الأيام','Days'),('نشر','Publish'),('حفظ الباقة','Save package'),
('لا توجد باقة منشورة','No published package'),('سجّل الدخول لإرسال إعلان.','Sign in to request advertising.'),
('موافقة على الطلب','Approve request'),('طلب تعديل','Request changes'),
('لا توجد طلبات دعاية مسجلة.','No advertising requests yet.'),
('لوحة إدارة الشركات','Company Management'),('المنتجات والبراندات','Products and Brands'),('البحث عن منتج','Product Search'),
('المبيعات الشهرية','Monthly Sales'),('المديرون والصلاحيات','Managers and Permissions'),
('شريط الأخبار والإعلانات','News and Announcements'),('باقات الدعاية','Advertising Packages'),
('تعذر تحميل أحد الأقسام. تأكد من صلاحيات الحساب واتصال MySQL.','One section could not load. Check account permissions and MySQL connection.'),
('فشل اتصال MySQL/الجلسة: ','MySQL/session error: '),
('جارٍ البحث...','Searching...'),('لم أجد منتجًا معتمدًا بهذا الكود أو البراند.','No approved product matches that code or brand.'),
('لا توجد منتجات مشابهة ببيانات موثقة حتى الآن.','No similar products with verified metadata yet.'),
('تعديل المنتج وإرساله للمراجعة','Edit product and send for review'),('منتج جديد','New product'),('اختر الشركة أولًا','Select a company first'),
('أدخل المقاس الحقيقي للسيراميك','Enter the actual tile dimensions'),(' سم',' cm'),
('تم حفظ المنتج كمسودة. يحتاج اعتماد أدمن IDEA قبل الظهور العام.','Product saved as a draft. Administrator approval is required before public display.'),
('تم تعديل صلاحية مدير الشركة.','Company manager permissions updated.'),
('تم حفظ الرسالة.','Announcement saved.'),
('وصل الطلب للإدارة للمراجعة؛ لا يتم نشره تلقائيًا.','Request sent for administrator review. It will not publish automatically.'),
('تأكيد مراجعة مستندات الشركة وصلاحية إعادة تفعيلها؟ المنتجات القديمة ستبقى متوقفة حتى اعتمادها.','Confirm that company documents have been reviewed? Existing products remain disabled pending approval.'),
('تأكيد إيقاف الشركة وجميع منتجاتها؟','Suspend this company and disable its products?'),
('تمت إعادة تفعيل الشركة بعد المراجعة.','Company reinstated after review.'),
('تم إيقاف الشركة ومنتجاتها.','Company and its products have been suspended.'),
('اعتماد','Approve'),('إلغاء اعتماد','Revoke approval'),(' المنتج ',' product '),
('تم تعديل اعتماد المنتج.','Product approval updated.'),('تم تحديث حالة ظهور المنتج.','Product visibility updated.'),
('تم حفظ سعر الباقة والتحكم في نشرها.','Package rate and visibility saved.'),
('تتم مراجعة المحتوى والمواصفات قبل النشر.','Creative and specifications are reviewed before publication.'),
('تم تحديث حالة الطلب. النشر يحتاج خطوة إدارية منفصلة.','Request status updated. Publication requires a separate admin action.'),
('تم اختيار لغة الواجهة؛ الشريط العلوي يعرض الرسائل باللغة المختارة.','Interface language changed. Announcements follow the selected language.'),
]
# Longest-first replacement avoids shorter labels corrupting longer phrases.
for ar,en in sorted(js_pairs,key=lambda x:len(x[0]),reverse=True):
 js=js.replace(ar,en)
# Locale-aware database-backed description fields.
js=js.replace("p.title_ar","p.title_en").replace("p.description_ar","p.description_en")
js=js.replace("esc(t.text_ar)","esc(t.text_en)")
js=js.replace("new Intl.NumberFormat(\"ar-EG\"","new Intl.NumberFormat(\"en-EG\"")
js=js.replace('؟','?')
js=js.replace('const userLang=()=>localStorage.getItem("idea-language")==="en"?"en":"ar";',
              'const userLang=()=>localStorage.getItem("idea-language")==="ar"?"ar":"en";')
js=js.replace('document.documentElement.dir=e.target.value==="en"?"ltr":"rtl";notice(',
              'document.documentElement.dir=e.target.value==="en"?"ltr":"rtl";location.replace(e.target.value==="ar"?"/marketplace/"+location.hash:"/marketplace/en.html"+location.hash);notice(')
# Avoid bilingual ticker and bilingual rate cards on English pages.
js=js.replace("'<small>'+esc(t.text_en)+'</small>'","''")
left=set(re.findall(r'[\u0600-\u06FF]+',js))
assert not left,f"Untranslated Arabic JS tokens: {sorted(left)[:30]}"
(root/"marketplace.en.js").write_text(js,encoding="utf-8")
print("MARKETPLACE_ENGLISH_GENERATED",len(html),len(js),"static_labels",len(html_labels),"translations",len(js_pairs))
