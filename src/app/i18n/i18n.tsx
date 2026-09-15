import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Locale } from "../data/types";

type Dict = Record<string, { en: string; ar: string; fr: string }>;

// UI strings only — product data is localized on the Product objects themselves.
const T: Dict = {
  tagline: { en: "When you have an idea… We are the IDEA.", ar: "عندما تكون لديك فكرة… نحن IDEA.", fr: "Quand vous avez une idée… Nous sommes IDEA." },
  "nav.collections": { en: "Collections", ar: "المجموعات", fr: "Collections" },
  "nav.products": { en: "All Products", ar: "كل المنتجات", fr: "Tous les produits" },
  "nav.visualizer": { en: "AI Visualizer", ar: "المحاكي الذكي", fr: "Visualiseur IA" },
  "nav.how": { en: "How It Works", ar: "كيف يعمل", fr: "Comment ça marche" },
  "nav.admin": { en: "Admin", ar: "الإدارة", fr: "Admin" },
  "action.explore": { en: "Explore Collections", ar: "استكشف المجموعات", fr: "Explorer les collections" },
  "action.visualize": { en: "Visualize Your Room", ar: "تصور غرفتك", fr: "Visualisez votre pièce" },
  "action.startAi": { en: "Start AI Visualization", ar: "ابدأ المحاكاة", fr: "Démarrer la visualisation" },
  "action.browsePorcelain": { en: "Browse Porcelain", ar: "تصفح البورسلين", fr: "Voir la porcelaine" },
  "action.requestPrice": { en: "Request Best Price", ar: "اطلب أفضل سعر", fr: "Demander le meilleur prix" },
  "action.howItWorks": { en: "How It Works", ar: "كيف يعمل", fr: "Comment ça marche" },
  "action.browseAll": { en: "Browse All Products", ar: "تصفح كل المنتجات", fr: "Voir tous les produits" },
  "action.bathroomCollections": { en: "Bathroom Collections", ar: "مجموعات الحمام", fr: "Collections salle de bain" },
  "action.viewDetails": { en: "View Details", ar: "عرض التفاصيل", fr: "Voir les détails" },
  "action.addQuote": { en: "Add to Quote", ar: "أضف للعرض", fr: "Ajouter au devis" },
  "action.favorite": { en: "Favorite", ar: "المفضلة", fr: "Favori" },
  "action.compare": { en: "Compare", ar: "قارن", fr: "Comparer" },
  "action.addVisualizer": { en: "Add to AI Visualizer", ar: "أضف للمحاكي", fr: "Ajouter au visualiseur" },
  "search.placeholder": { en: "Search products, models, brands…", ar: "ابحث عن منتجات، موديلات، ماركات…", fr: "Rechercher produits, modèles, marques…" },
  "home.shopByCategory": { en: "Shop by Category", ar: "تسوق حسب الفئة", fr: "Acheter par catégorie" },
  "home.ceramicPorcelain": { en: "Ceramic & Porcelain", ar: "سيراميك وبورسلين", fr: "Céramique et porcelaine" },
  "home.sanitary": { en: "Sanitary Ware", ar: "الأدوات الصحية", fr: "Sanitaires" },
  "home.featured": { en: "Featured Surfaces", ar: "أسطح مميزة", fr: "Surfaces en vedette" },
  "home.bestPrice": { en: "Best Price Within 24 Hours", ar: "أفضل سعر خلال 24 ساعة", fr: "Meilleur prix sous 24 heures" },
  "home.bestPriceBody": { en: "Select the product and required quantity, then receive private offers from verified matching suppliers.", ar: "اختر المنتج والكمية المطلوبة، ثم احصل على عروض خاصة من موردين معتمدين.", fr: "Sélectionnez le produit et la quantité, puis recevez des offres privées de fournisseurs vérifiés." },
  "filters.title": { en: "Filters", ar: "الفلاتر", fr: "Filtres" },
  "filters.clear": { en: "Clear all", ar: "مسح الكل", fr: "Tout effacer" },
  "filters.type": { en: "Type", ar: "النوع", fr: "Type" },
  "filters.brand": { en: "Brand", ar: "الماركة", fr: "Marque" },
  "filters.origin": { en: "Origin", ar: "بلد المنشأ", fr: "Origine" },
  "filters.finish": { en: "Finish", ar: "التشطيب", fr: "Finition" },
  "filters.texture": { en: "Texture", ar: "الملمس", fr: "Texture" },
  "filters.size": { en: "Size", ar: "المقاس", fr: "Taille" },
  "label.brand": { en: "Brand", ar: "الماركة", fr: "Marque" },
  "label.model": { en: "Model", ar: "الموديل", fr: "Modèle" },
  "label.code": { en: "Code", ar: "الكود", fr: "Code" },
  "label.origin": { en: "Origin", ar: "المنشأ", fr: "Origine" },
  "label.finish": { en: "Finish", ar: "التشطيب", fr: "Finition" },
  "label.texture": { en: "Texture", ar: "الملمس", fr: "Texture" },
  "label.type": { en: "Type", ar: "النوع", fr: "Type" },
  "label.sizes": { en: "Available Sizes", ar: "المقاسات المتاحة", fr: "Tailles disponibles" },
  "label.usage": { en: "Usage", ar: "الاستخدام", fr: "Utilisation" },
  "label.results": { en: "products", ar: "منتج", fr: "produits" },
  "quote.title": { en: "Request Best Price", ar: "طلب أفضل سعر", fr: "Demander le meilleur prix" },
  "quote.empty": { en: "Your quote request is empty.", ar: "طلب العرض فارغ.", fr: "Votre demande de devis est vide." },
  "quote.qty": { en: "Quantity", ar: "الكمية", fr: "Quantité" },
  "quote.sqm": { en: "m²", ar: "م²", fr: "m²" },
  "quote.pieces": { en: "pcs", ar: "قطعة", fr: "pcs" },
  "quote.submit": { en: "Submit Request", ar: "إرسال الطلب", fr: "Envoyer la demande" },
  "quote.note24": { en: "You will receive private supplier offers within 24 hours.", ar: "ستتلقى عروض موردين خاصة خلال 24 ساعة.", fr: "Vous recevrez des offres privées sous 24 heures." },
  "quote.submitted": { en: "Request submitted. Offers are expected within 24 hours.", ar: "تم إرسال الطلب. العروض متوقعة خلال 24 ساعة.", fr: "Demande envoyée. Offres attendues sous 24 heures." },
  "fav.title": { en: "Favorites", ar: "المفضلة", fr: "Favoris" },
  "fav.empty": { en: "You have no favorites yet.", ar: "لا توجد مفضلة بعد.", fr: "Aucun favori pour le moment." },
  "price.hidden": { en: "Price on request", ar: "السعر عند الطلب", fr: "Prix sur demande" },
  "empty.products": { en: "No products match the current criteria.", ar: "لا توجد منتجات مطابقة للمعايير الحالية.", fr: "Aucun produit ne correspond aux critères." },

  /* nav additions */
  "nav.roomDesigner": { en: "Room Designer", ar: "مصمم الغرف", fr: "Concepteur de pièce" },
  "nav.subscriptions": { en: "Subscriptions", ar: "الاشتراكات", fr: "Abonnements" },
  "nav.signIn": { en: "Sign in", ar: "تسجيل الدخول", fr: "Connexion" },
  "nav.account": { en: "Account", ar: "حسابي", fr: "Compte" },
  "nav.business": { en: "Business", ar: "الأعمال", fr: "Entreprise" },

  /* auth */
  "auth.signIn": { en: "Sign in to IDEA", ar: "تسجيل الدخول إلى IDEA", fr: "Connexion à IDEA" },
  "auth.createAccount": { en: "Create your account", ar: "أنشئ حسابك", fr: "Créer un compte" },
  "auth.forBusiness": { en: "For Business & Suppliers", ar: "للشركات والموردين", fr: "Entreprises & fournisseurs" },
  "auth.or": { en: "or", ar: "أو", fr: "ou" },
  "auth.email": { en: "Email", ar: "البريد الإلكتروني", fr: "E-mail" },
  "auth.phone": { en: "Phone", ar: "رقم الهاتف", fr: "Téléphone" },
  "auth.continue": { en: "Continue", ar: "متابعة", fr: "Continuer" },
  "auth.sendOtp": { en: "Send verification code", ar: "إرسال رمز التحقق", fr: "Envoyer le code" },
  "auth.otp": { en: "Verification code", ar: "رمز التحقق", fr: "Code de vérification" },
  "auth.otpDev": { en: "Development mode: enter any 4–6 digits.", ar: "وضع التطوير: أدخل أي 4–6 أرقام.", fr: "Mode développement : entrez 4 à 6 chiffres." },
  "auth.verify": { en: "Verify & continue", ar: "تحقق ومتابعة", fr: "Vérifier et continuer" },
  "auth.secure": { en: "Secure sign-in. We never store your password.", ar: "دخول آمن. لا نخزن كلمة المرور أبداً.", fr: "Connexion sécurisée. Aucun mot de passe stocké." },
  "auth.noAccount": { en: "New to IDEA?", ar: "جديد على IDEA؟", fr: "Nouveau sur IDEA ?" },
  "auth.haveAccount": { en: "Already have an account?", ar: "لديك حساب بالفعل؟", fr: "Vous avez déjà un compte ?" },

  /* role */
  "role.question": { en: "How will you use IDEA?", ar: "كيف ستستخدم IDEA؟", fr: "Comment utiliserez-vous IDEA ?" },
  "role.customer": { en: "Customer", ar: "عميل", fr: "Client" },
  "role.business": { en: "Business or Supplier", ar: "شركة أو مورد", fr: "Entreprise ou fournisseur" },
  "role.designer": { en: "Interior Designer", ar: "مهندس أو مصمم داخلي", fr: "Architecte d'intérieur" },
  "role.contractor": { en: "Contracting Company", ar: "شركة مقاولات", fr: "Entreprise de construction" },
  "role.customerDesc": { en: "Browse, request private prices, design rooms and order.", ar: "تصفح واطلب أسعاراً خاصة وصمم الغرف واطلب.", fr: "Parcourez, demandez des prix privés, concevez et commandez." },
  "role.businessDesc": { en: "Supply products and submit private offers (verification required).", ar: "قدّم المنتجات وأرسل عروضاً خاصة (يتطلب التحقق).", fr: "Fournissez des produits et soumettez des offres (vérification requise)." },
  "role.designerDesc": { en: "Pro room designer, client sharing and moodboards.", ar: "مصمم غرف احترافي ومشاركة العملاء.", fr: "Concepteur pro, partage client et moodboards." },
  "role.contractorDesc": { en: "Bulk projects, phased delivery and tenders.", ar: "مشاريع كبيرة وتسليم مرحلي ومناقصات.", fr: "Projets en gros, livraison échelonnée et appels d'offres." },
  "role.verifyNote": { en: "Selecting a business role does not immediately grant supplier permissions. Verification is mandatory.", ar: "اختيار دور الشركة لا يمنح صلاحيات المورد فوراً. التحقق إلزامي.", fr: "Le rôle entreprise n'accorde pas immédiatement les droits fournisseur. Vérification obligatoire." },

  /* account / business / common */
  "acct.title": { en: "My Account", ar: "حسابي", fr: "Mon compte" },
  "acct.profile": { en: "Profile", ar: "الملف الشخصي", fr: "Profil" },
  "acct.inbox": { en: "Inbox", ar: "الرسائل", fr: "Boîte de réception" },
  "acct.favorites": { en: "Favorites", ar: "المفضلة", fr: "Favoris" },
  "acct.compare": { en: "Compare", ar: "المقارنة", fr: "Comparer" },
  "acct.requests": { en: "Requests", ar: "الطلبات", fr: "Demandes" },
  "acct.offers": { en: "Offers", ar: "العروض", fr: "Offres" },
  "acct.orders": { en: "Orders", ar: "الطلبيات", fr: "Commandes" },
  "acct.invoices": { en: "Invoices", ar: "الفواتير", fr: "Factures" },
  "acct.roomProjects": { en: "Room Projects", ar: "مشاريع الغرف", fr: "Projets de pièce" },
  "acct.subscription": { en: "Subscription", ar: "الاشتراك", fr: "Abonnement" },
  "acct.notifications": { en: "Notifications", ar: "الإشعارات", fr: "Notifications" },
  "acct.settings": { en: "Settings", ar: "الإعدادات", fr: "Paramètres" },
  "biz.title": { en: "Business Center", ar: "مركز الأعمال", fr: "Espace entreprise" },
  "biz.onboarding": { en: "Onboarding", ar: "التسجيل", fr: "Intégration" },
  "biz.verification": { en: "Verification", ar: "التحقق", fr: "Vérification" },
  "biz.products": { en: "My Products", ar: "منتجاتي", fr: "Mes produits" },
  "biz.reports": { en: "Reports", ar: "التقارير", fr: "Rapports" },
  "biz.team": { en: "Team", ar: "الفريق", fr: "Équipe" },
  "admin.center": { en: "Admin", ar: "الإدارة", fr: "Admin" },
  "admin.payments": { en: "Payment Settings", ar: "إعدادات الدفع", fr: "Paramètres de paiement" },

  /* rfq extended */
  "rfq.deliveryGov": { en: "Delivery governorate", ar: "محافظة التوصيل", fr: "Gouvernorat de livraison" },
  "rfq.destination": { en: "Detailed destination", ar: "العنوان التفصيلي", fr: "Destination détaillée" },
  "rfq.date": { en: "Required delivery date", ar: "تاريخ التسليم المطلوب", fr: "Date de livraison" },
  "rfq.projectType": { en: "Project type", ar: "نوع المشروع", fr: "Type de projet" },
  "rfq.phased": { en: "Phased delivery", ar: "تسليم مرحلي", fr: "Livraison échelonnée" },
  "rfq.notes": { en: "Notes (optional)", ar: "ملاحظات (اختياري)", fr: "Notes (facultatif)" },
  "rfq.window": { en: "Get Best Price Within 24 Hours", ar: "احصل على أفضل سعر خلال 24 ساعة", fr: "Meilleur prix sous 24 heures" },
  "rfq.compareOffers": { en: "Compare Offers", ar: "قارن العروض", fr: "Comparer les offres" },
  "rfq.acceptOffer": { en: "Accept Offer", ar: "قبول العرض", fr: "Accepter l'offre" },

  /* room designer */
  "room.title": { en: "Room Designer", ar: "مصمم الغرف", fr: "Concepteur de pièce" },
  "room.photoGuide": { en: "Photo Guide", ar: "دليل التصوير", fr: "Guide photo" },
  "room.upload": { en: "Upload a room photo", ar: "ارفع صورة الغرفة", fr: "Importer une photo" },
  "room.measured": { en: "Create a measured room", ar: "أنشئ غرفة بالمقاسات", fr: "Créer une pièce mesurée" },
  "room.aiNote": { en: "AI visualization only. Moving fixtures may require plumbing, electrical, waterproofing, structural and professional engineering review.", ar: "هذه معاينة بالذكاء الاصطناعي فقط، وقد يتطلب نقل الأدوات مراجعة هندسية وأعمال سباكة وكهرباء وعزل وتنفيذ متخصص.", fr: "Visualisation IA uniquement. Le déplacement d'équipements peut nécessiter une revue d'ingénierie professionnelle." },

  /* payments */
  "pay.card": { en: "Credit or Debit Card", ar: "بطاقة ائتمان أو خصم مباشر", fr: "Carte de crédit ou débit" },
  "pay.fawry": { en: "Fawry Pay", ar: "الدفع عبر فوري", fr: "Fawry Pay" },
  "pay.wallet": { en: "Mobile Wallet", ar: "محفظة إلكترونية", fr: "Portefeuille mobile" },
  "pay.applepay": { en: "Apple Pay", ar: "Apple Pay", fr: "Apple Pay" },
  "pay.bank": { en: "Bank / Instant Transfer", ar: "تحويل بنكي / فوري", fr: "Virement bancaire" },
  "common.egp": { en: "EGP", ar: "ج.م", fr: "EGP" },
  "common.save": { en: "Save", ar: "حفظ", fr: "Enregistrer" },
  "common.monthly": { en: "Monthly", ar: "شهري", fr: "Mensuel" },
  "common.annual": { en: "Annual", ar: "سنوي", fr: "Annuel" },
};

interface I18nCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>("en");
  const dir = locale === "ar" ? "rtl" : "ltr";

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = locale;
  }, [dir, locale]);

  const t = (key: string) => T[key]?.[locale] ?? key;
  return <Ctx.Provider value={{ locale, setLocale, t, dir }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
