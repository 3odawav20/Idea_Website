export type LegalLocale = "ar" | "en" | "fr";

export type LegalSlug =
  | "legal"
  | "privacy"
  | "terms"
  | "cookies"
  | "refund-policy"
  | "intellectual-property"
  | "licenses"
  | "accessibility";

export interface LocalizedText {
  ar: string;
  en: string;
  fr: string;
}

export interface LegalSection {
  id: string;
  heading: LocalizedText;
  paragraphs: LocalizedText[];
  bullets?: LocalizedText[];
}

export interface LegalDocument {
  slug: LegalSlug;
  path: `/${LegalSlug}`;
  shortLabel: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
  badge: LocalizedText;
  effectiveDate: string;
  sections: LegalSection[];
}

export interface OpenSourceLicenseEntry {
  name: string;
  license: "MIT" | "Apache-2.0" | "ISC";
  purpose: LocalizedText;
  url: string;
}

export const LEGAL_EFFECTIVE_DATE = "2026-11-23";
export const LEGAL_SITE_ORIGIN = "https://idea-dh.com";
export const LEGAL_CONTACT_EMAIL = "legal@idea-dh.com";
export const PRIVACY_CONTACT_EMAIL = "privacy@idea-dh.com";

export const OPEN_SOURCE_LICENSES: readonly OpenSourceLicenseEntry[] = [
  {
    name: "React & React DOM",
    license: "MIT",
    purpose: {
      ar: "بناء واجهات المستخدم التفاعلية",
      en: "Interactive user interface rendering",
      fr: "Rendu d'interface utilisateur interactive",
    },
    url: "https://react.dev/",
  },
  {
    name: "React Router",
    license: "MIT",
    purpose: {
      ar: "التنقل والروابط النظيفة بين الصفحات",
      en: "Client-side routing and clean URLs",
      fr: "Routage client et URLs propres",
    },
    url: "https://reactrouter.com/",
  },
  {
    name: "Three.js",
    license: "MIT",
    purpose: {
      ar: "محرك استوديو تصميم الغرف ثلاثي الأبعاد بدون إنترنت",
      en: "Offline 3D Room Studio WebGL engine",
      fr: "Moteur WebGL du studio 3D hors ligne",
    },
    url: "https://threejs.org/",
  },
  {
    name: "Lucide React",
    license: "ISC",
    purpose: {
      ar: "مجموعة الأيقونات المتجهة النظيفة",
      en: "Crisp vector interface iconography",
      fr: "Iconographie vectorielle d'interface",
    },
    url: "https://lucide.dev/",
  },
  {
    name: "Tailwind CSS",
    license: "MIT",
    purpose: {
      ar: "نظام التصميم المتجاوب والأدوات البصرية",
      en: "Utility-first responsive styling system",
      fr: "Système de styles utilitaires réactifs",
    },
    url: "https://tailwindcss.com/",
  },
  {
    name: "Motion",
    license: "MIT",
    purpose: {
      ar: "الحركات السلسة المتوافقة مع تقليل الحركة",
      en: "Accessible motion & transition primitives",
      fr: "Transitions et animations accessibles",
    },
    url: "https://motion.dev/",
  },
  {
    name: "Recharts",
    license: "MIT",
    purpose: {
      ar: "الرسوم البيانية لتقارير الموردين والإدارة",
      en: "Supplier & operations analytics charts",
      fr: "Graphiques analytiques fournisseurs et gestion",
    },
    url: "https://recharts.org/",
  },
  {
    name: "Vite",
    license: "MIT",
    purpose: {
      ar: "بناء وحزم تطبيق الويب الإنتاجي",
      en: "Production web bundling and build toolchain",
      fr: "Compilateur et chaîne de build web",
    },
    url: "https://vite.dev/",
  },
] as const;

export const LEGAL_DOCUMENTS: readonly LegalDocument[] = [
  {
    slug: "privacy",
    path: "/privacy",
    shortLabel: {
      ar: "سياسة الخصوصية",
      en: "Privacy Policy",
      fr: "Politique de confidentialité",
    },
    title: {
      ar: "سياسة الخصوصية وحماية البيانات",
      en: "Privacy Policy & Data Protection",
      fr: "Politique de confidentialité et protection des données",
    },
    summary: {
      ar: "كيف تجمع منصة IDEA بياناتك الشخصية وبيانات طلبات عروض الأسعار وصور الغرف، وكيف نحميها وحقوقك الكاملة في الاطلاع عليها أو حذفها.",
      en: "How IDEA collects, uses, protects, and deletes account records, quotation requests, room visualizer photos, and supplier onboarding files.",
      fr: "Comment IDEA collecte, protège et supprime vos données de compte, demandes de devis, photos de pièces et dossiers partenaires.",
    },
    badge: {
      ar: "قانون حماية البيانات 151 لسنة 2020",
      en: "Egypt PDPL 151/2020 & GDPR Aligned",
      fr: "Conforme PDPL 151/2020 & RGPD",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "scope",
        heading: {
          ar: "1. نطاق السياسة ومسؤول البيانات",
          en: "1. Scope & Data Controller",
          fr: "1. Portée et responsable du traitement",
        },
        paragraphs: [
          {
            ar: "تنطبق سياسة الخصوصية هذه على جميع خدمات منصة IDEA عبر النطاق idea-dh.com بما يشمل كتالوج السيراميك والبورسلين والرخام والأدوات الصحية، وطلبات عروض الأسعار الخاصة (RFQ)، واستوديو 3D، ومُعاين الغرف بالذكاء الاصطناعي، وحسابات العملاء والشركات والموردين.",
            en: "This Privacy Policy governs all IDEA services available at idea-dh.com, including the ceramics, porcelain, marble, and sanitary ware catalogue, private Request for Quote (RFQ) workflows, the Offline 3D Room Studio, the AI Room Visualizer, and Customer or Business Partner accounts.",
            fr: "La présente politique s'applique à l'ensemble des services IDEA sur idea-dh.com, incluant le catalogue, les demandes de devis privées (RFQ), le Studio 3D, le Visualiseur IA et les comptes clients et entreprises.",
          },
          {
            ar: "تُعالج البيانات وفقًا لأحكام قانون حماية البيانات الشخصية المصري رقم 151 لسنة 2020 ومبادئ الخصوصية الدولية (GDPR) للزوار خارج جمهورية مصر العربية.",
            en: "Personal data is processed in accordance with Egypt's Personal Data Protection Law No. 151 of 2020 and core international privacy principles (GDPR) where applicable.",
            fr: "Les données personnelles sont traitées conformément à la loi égyptienne n° 151/2020 sur la protection des données et aux principes internationaux du RGPD.",
          },
        ],
      },
      {
        id: "data-collected",
        heading: {
          ar: "2. البيانات التي نجمعها",
          en: "2. Data We Collect",
          fr: "2. Données collectées",
        },
        paragraphs: [
          {
            ar: "نقتصر في جمع البيانات على الحد الأدنى اللازم لتشغيل الحسابات وتقديم عروض الأسعار بدقة:",
            en: "We collect only the minimum information required to operate accounts, verify suppliers, and fulfill quotation requests:",
            fr: "Nous collectons uniquement les données strictement nécessaires au fonctionnement des comptes et au traitement des devis :",
          },
        ],
        bullets: [
          {
            ar: "بيانات الحساب: الاسم، البريد الإلكتروني، رقم الهاتف، ومُعرّف مزوّد تسجيل الدخول (مثل Google أو WhatsApp OTP عند تفعيله).",
            en: "Account details: full name, email address, phone number, and verified sign-in provider identifier (such as Google or WhatsApp OTP when enabled).",
            fr: "Informations de compte : nom, e-mail, téléphone et identifiant de connexion vérifié.",
          },
          {
            ar: "بيانات طلبات عروض الأسعار (RFQ): المنتجات المختارة، الكميات، المحافظة وموقع التسليم، ومواعيد التنفيذ المفضلة.",
            en: "Quotation (RFQ) records: selected catalogue items, required quantities, governorate, delivery window, and project notes.",
            fr: "Demandes de devis : produits sélectionnés, quantités, gouvernorat, délai et notes de projet.",
          },
          {
            ar: "بيانات التحقق للشركات (B2B): اسم الشركة، نوع النشاط، رقم السجل التجاري أو الترخيص، والمستندات الداعمة المرفوعة طوعيًا لأغراض التوثيق فقط.",
            en: "Business verification (B2B): company name, commercial registration / license number, and supporting documents uploaded strictly for supplier verification.",
            fr: "Vérification professionnelle (B2B) : raison sociale, registre du commerce et justificatifs transmis pour vérification.",
          },
          {
            ar: "صور الغرف في مُعاين الغرف: تُستخدم الصورة التي ترفعها فقط لتوليد معاينة السطح المطلوب ولا تُنشر علنًا ولا تُباع لأي طرف ثالث.",
            en: "Room Visualizer images: photos you upload are used solely to render your requested material preview and are never published publicly or sold to third parties.",
            fr: "Images du visualiseur : les photos importées servent uniquement à générer votre aperçu et ne sont jamais publiées ni vendues.",
          },
        ],
      },
      {
        id: "sharing-security",
        heading: {
          ar: "3. مشاركة البيانات والأمان",
          en: "3. Data Sharing & Security",
          fr: "3. Partage et sécurité des données",
        },
        paragraphs: [
          {
            ar: "لا تبيع IDEA بياناتك الشخصية أبدًا. تُشارك تفاصيل طلب عرض السعر فقط مع الموردين المعتمدين المطابقين لطلبك لتقديم عروض أسعار خاصة، مع إخفاء أي بيانات لا تلزم للتسعير. كما تُحفظ الجلسات عبر ملفات ارتباط محمية (HttpOnly / SameSite) وتُشفّر كلمات المرور خادميًا ولا تُخزن بصيغة نصية أبدًا.",
            en: "IDEA never sells personal data. RFQ specifications are shared solely with verified matching suppliers to return private offers. Sessions rely on hardened HttpOnly/SameSite cookies with CSRF protection, and passwords are stored strictly as one-way cryptographic hashes.",
            fr: "IDEA ne vend jamais vos données personnelles. Les détails d'un devis ne sont transmis qu'aux fournisseurs vérifiés concernés. Les sessions utilisent des cookies sécurisés HttpOnly/SameSite avec protection CSRF.",
          },
        ],
      },
      {
        id: "user-rights",
        heading: {
          ar: "4. حقوقك وحذف الحساب والبيانات",
          en: "4. Your Rights & Account Deletion",
          fr: "4. Vos droits et suppression de compte",
        },
        paragraphs: [
          {
            ar: "يحق لك في أي وقت طلب نسخة من بياناتك، أو تصحيحها، أو سحب موافقتك، أو طلب الحذف الكامل لحسابك وبياناتك المرتبطة بتسجيل الدخول الاجتماعي (بما في ذلك Google أو Facebook أو Apple أو Microsoft) عبر مراسلتنا على البريد القانوني أدناه أو عبر صفحة التواصل، ونلتزم بالرد والتنفيذ خلال مدة لا تتجاوز 14 يوم عمل (باستثناء السجلات المالية المطلوبة قانونًا).",
            en: "You may request access, correction, export, or permanent deletion of your IDEA account and any linked social sign-in data (including Google, Facebook, Apple, or Microsoft) at any time by emailing our privacy team or submitting a request via the Contact page. Verified deletion requests are completed within 14 business days, subject only to statutory accounting retention.",
            fr: "Vous pouvez demander à tout moment l'accès, la rectification ou la suppression complète de votre compte et des données liées aux connexions sociales en contactant notre équipe confidentialité (traitement sous 14 jours ouvrés).",
          },
        ],
      },
    ],
  },
  {
    slug: "terms",
    path: "/terms",
    shortLabel: {
      ar: "شروط الاستخدام",
      en: "Terms of Use",
      fr: "Conditions d'utilisation",
    },
    title: {
      ar: "شروط وأحكام استخدام منصة IDEA",
      en: "Terms of Use & Platform Agreement",
      fr: "Conditions générales d'utilisation",
    },
    summary: {
      ar: "القواعد المنظمة لاستخدام منصة IDEA، وإنشاء حسابات العملاء والشركات، وطلبات عروض الأسعار الخاصة، وحدود المسؤولية والقانون الواجب التطبيق.",
      en: "Rules governing access to IDEA, customer and verified B2B supplier accounts, private quotation requests, acceptable use, and governing law.",
      fr: "Règles régissant l'accès à IDEA, les comptes clients et fournisseurs B2B, les demandes de devis privées et la loi applicable.",
    },
    badge: {
      ar: "اتفاقية المستخدم والمنصة",
      en: "User & Marketplace Agreement",
      fr: "Contrat utilisateur et plateforme",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "acceptance",
        heading: {
          ar: "1. قبول الشروط وطبيعة المنصة",
          en: "1. Acceptance & Platform Role",
          fr: "1. Acceptation et rôle de la plateforme",
        },
        paragraphs: [
          {
            ar: "باستخدامك موقع IDEA أو إنشائك حسابًا أو إرسالك طلب عرض سعر، فإنك توافق على الالتزام بهذه الشروط. تعمل IDEA كمنصة تقنية لعرض كتالوج خامات التشطيب والسيراميك والبورسلين والرخام والأدوات الصحية، وربط العملاء والمحترفين بشبكة موردين وشركات معتمدة عبر عروض أسعار خاصة.",
            en: "By accessing IDEA, creating an account, or submitting a quotation request, you agree to these Terms of Use. IDEA operates as a curated architectural surfaces catalogue and private quotation marketplace connecting buyers and trade professionals with verified suppliers.",
            fr: "En utilisant IDEA, en créant un compte ou en soumettant un devis, vous acceptez les présentes conditions. IDEA agit comme catalogue architectural et plateforme de mise en relation par devis privés avec des fournisseurs vérifiés.",
          },
        ],
      },
      {
        id: "accounts",
        heading: {
          ar: "2. الحسابات والأدوار والصلاحيات",
          en: "2. Accounts, Roles & Verification",
          fr: "2. Comptes, rôles et vérification",
        },
        paragraphs: [
          {
            ar: "تُنشأ جميع الحسابات الجديدة افتراضيًا كحسابات عملاء (مشتري). أما حسابات الشركات والموردين فتخضع للتحقق اليدوي من المستندات التجارية وتفعيل الصلاحيات من قِبل إدارة المنصة حصريًا. يلتزم المستخدم بالحفاظ على سرية بيانات الدخول وعدم محاولة انتحال صفة شركة أو مورد غير معتمد.",
            en: "All newly registered accounts start with standard customer privileges. Supplier and business partner status is granted exclusively after administrative verification of submitted commercial documents. Users are responsible for safeguarding credentials and maintaining accurate account information.",
            fr: "Tout nouveau compte dispose par défaut d'un profil client. L'accès fournisseur/entreprise est accordé uniquement après vérification administrative des documents commerciaux.",
          },
        ],
      },
      {
        id: "rfq-pricing",
        heading: {
          ar: "3. عروض الأسعار الخاصة وتوافر المنتجات",
          en: "3. Private Quotations & Availability",
          fr: "3. Devis privés et disponibilité",
        },
        paragraphs: [
          {
            ar: "الأسعار وتوافر المخزون والفرز (الأول/الثاني) ومواعيد التوريد تُؤكد حصريًا في عروض الأسعار الصادرة من الموردين المعتمدين داخل المنصة خلال مدة صلاحية كل عرض. إدراج منتج في الكتالوج لا يُعد التزامًا بالتوافر الفوري قبل تأكيد المورد.",
            en: "Pricing, stock availability, grade/caliber confirmation, and lead times are confirmed exclusively through supplier-issued private quotations within each offer's stated validity period. Catalogue listings represent product references and do not guarantee immediate stock prior to supplier confirmation.",
            fr: "Les prix, disponibilités et délais sont confirmés exclusivement via les devis privés émis par les fournisseurs vérifiés pendant leur durée de validité.",
          },
        ],
      },
      {
        id: "acceptable-use",
        heading: {
          ar: "4. الاستخدام المقبول وحماية المنصة",
          en: "4. Acceptable Use",
          fr: "4. Utilisation acceptable",
        },
        paragraphs: [
          {
            ar: "يُحظر استخراج بيانات الكتالوج أو صور المنتجات آليًا (Scraping)، أو إرسال طلبات عروض أسعار وهمية، أو إساءة استخدام أدوات المعاينة بالذكاء الاصطناعي، أو محاولة الوصول غير المصرح به إلى لوحات التحكم أو واجهات البرمجة.",
            en: "Automated scraping of catalogue imagery or references, submitting fraudulent RFQs, abusing visualization tools, or attempting unauthorized access to administrative or API endpoints is strictly prohibited and may result in immediate account suspension.",
            fr: "L'extraction automatisée du catalogue, l'envoi de faux devis, l'abus des outils de visualisation ou toute tentative d'accès non autorisé sont strictement interdits.",
          },
        ],
      },
      {
        id: "governing-law",
        heading: {
          ar: "5. القانون الواجب التطبيق وحل النزاعات",
          en: "5. Governing Law & Disputes",
          fr: "5. Droit applicable et litiges",
        },
        paragraphs: [
          {
            ar: "تخضع هذه الشروط وتُفسّر وفقًا لقوانين جمهورية مصر العربية، بما في ذلك قانون التجارة الإلكترونية وحماية المستهلك رقم 181 لسنة 2018 وقانون التوقيع الإلكتروني رقم 15 لسنة 2004. وتختص المحاكم المصرية المختصة بالفصل في أي نزاع يتعذر حله وديًا.",
            en: "These Terms are governed by and construed in accordance with the laws of the Arab Republic of Egypt, including Consumer Protection Law No. 181 of 2018 and E-Signature Law No. 15 of 2004. Any dispute not resolved amicably shall be submitted to the competent Egyptian courts.",
            fr: "Les présentes conditions sont régies par le droit de la République arabe d'Égypte. Tout litige non résolu à l'amiable relève des tribunaux égyptiens compétents.",
          },
        ],
      },
    ],
  },
  {
    slug: "cookies",
    path: "/cookies",
    shortLabel: {
      ar: "ملفات تعريف الارتباط",
      en: "Cookie Policy",
      fr: "Politique de cookies",
    },
    title: {
      ar: "سياسة ملفات تعريف الارتباط والتخزين المحلي",
      en: "Cookie & Local Storage Policy",
      fr: "Politique relative aux cookies et au stockage local",
    },
    summary: {
      ar: "توضيح شفاف لملفات الارتباط الأساسية للأمان والجلسات وتفضيلات اللغة والمظهر، وكيفية التحكم بها دون أي تتبع إعلاني خفي.",
      en: "Transparent overview of essential session/security cookies, language & theme storage, and how you can control browser storage at any time.",
      fr: "Présentation transparente des cookies essentiels de session/sécurité, préférences de langue/thème et gestion du consentement.",
    },
    badge: {
      ar: "الشفافية الرقمية",
      en: "Browser Storage & Consent",
      fr: "Stockage et consentement",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "essential",
        heading: {
          ar: "1. ملفات الارتباط الأساسية والأمنية (ضرورية دائمًا)",
          en: "1. Strictly Necessary & Security Cookies",
          fr: "1. Cookies strictement nécessaires et de sécurité",
        },
        paragraphs: [
          {
            ar: "تستخدم منصة IDEA ملفات ارتباط تقنية ضرورية لتأمين جلسة تسجيل الدخول، ومنع هجمات التزوير (CSRF)، وحفظ حالة طلب عرض السعر أثناء التصفح. لا يمكن تعطيل هذه الملفات إذا كنت ترغب في تسجيل الدخول بأمان.",
            en: "IDEA uses strictly necessary first-party cookies to maintain authenticated sessions, enforce Cross-Site Request Forgery (CSRF) tokens, and preserve active quote drafts.",
            fr: "IDEA utilise des cookies internes strictement nécessaires pour sécuriser la session, assurer la protection CSRF et conserver les brouillons de devis.",
          },
        ],
      },
      {
        id: "preferences",
        heading: {
          ar: "2. تفضيلات الواجهة في التخزين المحلي",
          en: "2. Interface Preferences (Local Storage)",
          fr: "2. Préférences d'interface (Stockage local)",
        },
        paragraphs: [
          {
            ar: "نحفظ داخل متصفحك فقط تفضيلاتك المعلنة مثل اللغة المختارة (العربية / الإنجليزية / الفرنسية)، والوضع الفاتح أو الداكن، وقائمة المفضلات والمقارنة، وخيار موافقتك على ملفات الارتباط.",
            en: "Your browser stores only explicit usability preferences locally: selected language (Arabic/English/French), light or dark appearance, saved favorites/comparisons, and your cookie consent choice.",
            fr: "Votre navigateur enregistre localement vos préférences explicites : langue, thème clair/sombre, favoris et choix de consentement.",
          },
        ],
      },
      {
        id: "no-ad-trackers",
        heading: {
          ar: "3. عدم وجود متتبعات إعلانية خفية",
          en: "3. No Unauthorized Third-Party Ad Trackers",
          fr: "3. Aucun traceur publicitaire tiers non autorisé",
        },
        paragraphs: [
          {
            ar: "لا تقوم IDEA بتحميل شبكات تتبع إعلانية تبيع ملف سلوكك عبر المواقع الأخرى. ويمكنك مسح التخزين المحلي أو تعديل إعدادات ملفات الارتباط في أي وقت من إعدادات متصفحك.",
            en: "IDEA does not load third-party cross-site advertising trackers. You may clear cookies or local storage from your browser settings at any time.",
            fr: "IDEA ne charge aucun traceur publicitaire tiers inter-sites. Vous pouvez effacer les cookies à tout moment depuis votre navigateur.",
          },
        ],
      },
    ],
  },
  {
    slug: "refund-policy",
    path: "/refund-policy",
    shortLabel: {
      ar: "الطلبات والاسترجاع",
      en: "Orders & Returns Policy",
      fr: "Commandes et retours",
    },
    title: {
      ar: "سياسة عروض الأسعار والطلبات والتوصيل والاسترجاع",
      en: "RFQ, Orders, Delivery & Returns Policy",
      fr: "Politique de devis, commandes, livraison et retours",
    },
    summary: {
      ar: "قواعد فحص السيراميك والبورسلين والرخام عند الاستلام (الفرز والتون والمقاس قبل التركيب)، وشروط الإلغاء والاسترجاع والاستبدال وفقًا لقانون حماية المستهلك.",
      en: "Delivery inspection rules for ceramics, porcelain, and marble (shade/caliber check before installation), cancellation windows, and return rights.",
      fr: "Règles de contrôle à la livraison (nuance et calibre avant pose), délais d'annulation et conditions de retour.",
    },
    badge: {
      ar: "قانون حماية المستهلك 181/2018",
      en: "Consumer Protection Law 181/2018",
      fr: "Protection du consommateur 181/2018",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "rfq-to-order",
        heading: {
          ar: "1. من طلب عرض السعر إلى تأكيد الطلب",
          en: "1. From Private Quote to Confirmed Order",
          fr: "1. Du devis privé à la commande confirmée",
        },
        paragraphs: [
          {
            ar: "لا يُعد إرسال طلب عرض سعر (RFQ) التزامًا ماليًا ملزمًا. يصبح الطلب فعّالًا فقط عند قبول العميل لعرض سعر محدد صادر من مورد معتمد ومراجعة تفاصيل الكمية والشحن والضريبة والجدول الزمني.",
            en: "Submitting a quotation request (RFQ) carries zero financial obligation. An order is initiated only when you explicitly accept a supplier's written offer detailing unit price, shipping, applicable VAT, and delivery schedule.",
            fr: "L'envoi d'une demande de devis n'entraîne aucune obligation financière. Une commande n'est créée qu'après acceptation explicite d'une offre fournisseur détaillée.",
          },
        ],
      },
      {
        id: "tile-inspection",
        heading: {
          ar: "2. الفحص الفني للسيراميك والبورسلين والرخام قبل التركيب",
          en: "2. Shade, Caliber & Pre-Installation Inspection",
          fr: "2. Contrôle de nuance et de calibre avant pose",
        },
        paragraphs: [
          {
            ar: "نظرًا لطبيعة خامات السيراميك والبورسلين والرخام الطبيعي، يجب فحص الكراتين عند الاستلام والتأكد من تطابق كود الموديل والفرز والتون (Shade) والمقاس (Caliber) وسلامة البلاط قبل البدء في التركيب. لا يُقبل إرجاع الخامات بعد تركيبها أو قطعها أو فتح عبواتها الأصلية بما يغير حالتها، ما لم يثبت وجود عيب صناعة خفي.",
            en: "Because ceramic, porcelain, and natural marble batches vary by kiln run, cartons must be inspected upon delivery for model code, grade, shade/tone, caliber, and transport damage prior to installation. Installed, cut, or altered materials cannot be returned unless a verified manufacturing defect is documented.",
            fr: "En raison des variations naturelles de cuisson, les cartons doivent être vérifiés à la livraison (référence, nuance, calibre, état) avant toute pose. Les matériaux déjà posés ou découpés ne sont pas repris sauf défaut avéré.",
          },
        ],
      },
      {
        id: "returns-rights",
        heading: {
          ar: "3. الاستبدال والاسترجاع والإلغاء",
          en: "3. Cancellations, Exchanges & Refunds",
          fr: "3. Annulations, échanges et remboursements",
        },
        paragraphs: [
          {
            ar: "مع عدم الإخلال بأحكام قانون حماية المستهلك المصري رقم 181 لسنة 2018، يحق للعميل الاسترجاع أو الاستبدال خلال 14 يومًا من الاستلام للمنتجات غير المستخدمة وفي عبواتها الأصلية السليمة، وخلال 30 يومًا في حال وجود عيب صناعة أو عدم مطابقة للمواصفات المؤكدة في عرض السعر (وتُستثنى الطلبيات المصنّعة أو المقطوعة خصيصًا حسب الطلب). وتُوضّح شروط الشحن والرد المالي في كل عرض سعر قبل التأكيد.",
            en: "In accordance with Egyptian Consumer Protection Law No. 181 of 2018, unused items in intact original factory packaging are eligible for return/exchange within 14 days of delivery, and within 30 days in the event of a manufacturing defect or non-conformity with the accepted quotation (custom-cut or special-order slabs excluded). Refund timelines and transport terms are stated clearly inside each offer prior to payment.",
            fr: "Conformément à la loi de protection du consommateur n° 181/2018, les articles non utilisés dans leur emballage d'origine peuvent être retournés sous 14 jours (30 jours en cas de défaut avéré ou non-conformité, hors découpes sur mesure).",
          },
        ],
      },
    ],
  },
  {
    slug: "intellectual-property",
    path: "/intellectual-property",
    shortLabel: {
      ar: "الملكية الفكرية وإخلاء المسؤولية",
      en: "IP & Catalogue Disclaimer",
      fr: "Propriété intellectuelle",
    },
    title: {
      ar: "الملكية الفكرية والعلامات التجارية وإخلاء المسؤولية الفنية",
      en: "Intellectual Property, Trademarks & Technical Disclaimers",
      fr: "Propriété intellectuelle, marques et avertissements techniques",
    },
    summary: {
      ar: "حقوق العلامة التجارية لـ IDEA، وحفظ حقوق الشركات والمصانع المالكة للعلامات المعروضة في الكتالوج، وإخلاء المسؤولية عن دقة الألوان في المعاينة الرقمية والذكاء الاصطناعي.",
      en: "IDEA brand ownership, third-party manufacturer trademark attribution, and digital color/scale disclaimers for 3D and AI previews.",
      fr: "Droits de marque IDEA, attribution des fabricants tiers et avertissements relatifs aux aperçus 3D et IA.",
    },
    badge: {
      ar: "حقوق العلامات والكتالوج",
      en: "Trademarks & Visual Accuracy",
      fr: "Marques et fidélité visuelle",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "idea-ip",
        heading: {
          ar: "1. حقوق الملكية الفكرية لمنصة IDEA",
          en: "1. IDEA Brand & Platform Ownership",
          fr: "1. Propriété de la marque et de la plateforme IDEA",
        },
        paragraphs: [
          {
            ar: "شعار IDEA وتصميم الواجهة وهيكلة قواعد البيانات والبرمجيات الخاصة بالمنصة ونصوصها محمية بموجب قوانين حقوق المؤلف والملكية الفكرية، ولا يجوز نسخها أو إعادة نشرها تجاريًا دون إذن كتابي مسبق.",
            en: "The IDEA logo, interface design, software architecture, internal reference structure, and original editorial copy are protected by copyright and intellectual property laws and may not be reproduced commercially without prior written consent.",
            fr: "Le logo IDEA, l'interface, l'architecture logicielle et les contenus éditoriaux originaux sont protégés par le droit de la propriété intellectuelle.",
          },
        ],
      },
      {
        id: "third-party-brands",
        heading: {
          ar: "2. العلامات التجارية للمصانع والموردين",
          en: "2. Third-Party Manufacturer & Brand Attribution",
          fr: "2. Marques des fabricants et fournisseurs tiers",
        },
        paragraphs: [
          {
            ar: "جميع أسماء العلامات التجارية والمصانع والموديلات المعروضة في الكتالوج (بما في ذلك على سبيل المثال Art Ceramic وأي مصانع أو موردين معتمدين) هي ملك لأصحابها الشرعيين وتُعرض لأغراض التعريف المرجعي والمقارنة وطلبات عروض الأسعار فقط. وتوضح بطاقة كل منتج بشفافية ما إذا كانت بيانات المُصنّع موثّقة أم مرجعية. لأي طلب تصحيح أو إزالة حقوق ملكية، يُرجى مراسلة البريد القانوني وسنستجيب فورًا.",
            en: "All manufacturer names, brand marks, and product lines referenced in the catalogue (including Art Ceramic and any participating suppliers) remain the exclusive property of their respective owners and are displayed strictly for product identification and quotation routing. Each product card transparently indicates verification status. Rights holders may contact our legal desk for immediate attribution updates or takedown requests.",
            fr: "Tous les noms de fabricants et marques référencés dans le catalogue demeurent la propriété exclusive de leurs détenteurs respectifs et sont affichés uniquement à des fins d'identification produit. Les titulaires de droits peuvent nous contacter pour toute mise à jour immédiate.",
          },
        ],
      },
      {
        id: "visualizer-disclaimer",
        heading: {
          ar: "3. إخلاء المسؤولية عن المعاينة الرقمية والذكاء الاصطناعي (3D / AI)",
          en: "3. 3D Studio & AI Room Visualizer Disclaimer",
          fr: "3. Avertissement Studio 3D et Visualiseur IA",
        },
        paragraphs: [
          {
            ar: "المعاينات المُنتَجة عبر استوديو 3D أو مُعاين الغرف بالذكاء الاصطناعي وكذلك حسابات المساحات التقديرية هي أدوات إرشادية وتصوّرية فقط. قد تختلف درجات الألوان واللمعان والعروق وتوزيع الإضاءة عن العينة الفعلية بسبب اختلاف شاشات العرض وظروف التصوير. ننصح دائمًا بمعاينة العينة الفعلية ومراجعة القياسات الهندسية مع مهندس أو فني متخصص قبل الشراء أو التوريد.",
            en: "Previews generated by the 3D Room Studio or AI Room Visualizer, as well as estimated area/quantity calculations, are illustrative planning aids only. Screen calibration, room lighting, and natural kiln or marble veining can cause real tiles to differ from digital renders. Always inspect physical samples and confirm exact measurements with a qualified installer before ordering.",
            fr: "Les aperçus 3D/IA et estimations de surface sont fournis à titre purement indicatif. Les réglages d'écran et l'éclairage réel pouvant modifier le rendu des couleurs, vérifiez toujours un échantillon physique et vos mesures avant commande.",
          },
        ],
      },
    ],
  },
  {
    slug: "licenses",
    path: "/licenses",
    shortLabel: {
      ar: "التراخيص والبرمجيات",
      en: "Licenses & Attributions",
      fr: "Licences et attributions",
    },
    title: {
      ar: "التراخيص القانونية وتراخيص البرمجيات مفتوحة المصدر",
      en: "Legal Notices & Open-Source Software Licenses",
      fr: "Mentions légales et licences open source",
    },
    summary: {
      ar: "سجل شفاف لبيانات الترخيص التجاري للكيان المشغّل لمنصة IDEA، وقائمة تراخيص البرمجيات مفتوحة المصدر المستخدمة في بناء التطبيق.",
      en: "Transparent corporate compliance notice for IDEA alongside full MIT/ISC attributions for the open-source libraries powering the web platform.",
      fr: "Notice de conformité de l'éditeur IDEA et attributions complètes des bibliothèques open source utilisées.",
    },
    badge: {
      ar: "تراخيص MIT / ISC والامتثال",
      en: "MIT / ISC & Compliance Registry",
      fr: "Registre MIT / ISC & Conformité",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "entity-notice",
        heading: {
          ar: "1. بيانات الكيان المشغّل والإفصاح التجاري",
          en: "1. Operator Disclosure & Commercial Registration",
          fr: "1. Éditeur et immatriculation commerciale",
        },
        paragraphs: [
          {
            ar: "تعمل منصة IDEA (idea-dh.com) كمنصة تجارة إلكترونية وعروض أسعار لمواد التشطيب والسيراميك والبورسلين والرخام والأدوات الصحية في جمهورية مصر العربية. يتم إدراج رقم السجل التجاري والبطاقة الضريبية ومقر الإدارة القانونية المعتمد فور اعتماد النسخة النهائية من المستشار القانوني للمنشأة، دون استخدام أي أرقام تراخيص غير رسمية.",
            en: "IDEA (idea-dh.com) operates as an architectural surfaces catalogue and quotation marketplace in the Arab Republic of Egypt. Verified Commercial Registration (CR), Tax Registration ID, and registered headquarters details are published here directly upon official legal registration filing without placeholder or fabricated numbers.",
            fr: "IDEA (idea-dh.com) opère en tant que catalogue architectural et plateforme de devis en République arabe d'Égypte. Les numéros officiels de registre du commerce et d'identification fiscale sont publiés ici dès leur validation légale définitive.",
          },
        ],
      },
      {
        id: "oss-attributions",
        heading: {
          ar: "2. تراخيص البرمجيات مفتوحة المصدر (Open-Source Licenses)",
          en: "2. Open-Source Software Attributions",
          fr: "2. Attributions des logiciels open source",
        },
        paragraphs: [
          {
            ar: "تعتمد واجهة منصة IDEA على مكتبات برمجية مفتوحة المصدر مرخصة رسميًا بموجب تراخيص MIT وISC، ونُقر بكامل حقوق مطوريها وفقًا لشروط كل ترخيص كما هو موضح في الجدول أدناه:",
            en: "The IDEA web application builds upon audited open-source software distributed under permissive MIT and ISC licenses. Full credit and license notices are listed below:",
            fr: "L'application web IDEA s'appuie sur des bibliothèques open source sous licences MIT et ISC, listées ci-dessous :",
          },
        ],
      },
    ],
  },
  {
    slug: "accessibility",
    path: "/accessibility",
    shortLabel: {
      ar: "إمكانية الوصول",
      en: "Accessibility Statement",
      fr: "Accessibilité",
    },
    title: {
      ar: "بيان إمكانية الوصول الرقمي",
      en: "Digital Accessibility Statement",
      fr: "Déclaration d'accessibilité numérique",
    },
    summary: {
      ar: "التزامنا بمعايير WCAG 2.1 AA، ودعم لوحة المفاتيح وقارئات الشاشة، والاتجاهين العربي RTL والإنجليزي LTR، وخيار تقليل الحركة.",
      en: "Our commitment to WCAG 2.1 AA standards, keyboard navigation, screen-reader landmarks, RTL/LTR clarity, and reduced-motion preferences.",
      fr: "Notre engagement WCAG 2.1 AA : navigation clavier, lecteurs d'écran, RTL/LTR et réduction des animations.",
    },
    badge: {
      ar: "معيار WCAG 2.1 AA",
      en: "WCAG 2.1 AA Commitment",
      fr: "Engagement WCAG 2.1 AA",
    },
    effectiveDate: LEGAL_EFFECTIVE_DATE,
    sections: [
      {
        id: "standards",
        heading: {
          ar: "1. التزامنا بإمكانية الوصول",
          en: "1. Our Commitment",
          fr: "1. Notre engagement",
        },
        paragraphs: [
          {
            ar: "تسعى منصة IDEA لجعل تصفح الكتالوج وطلبات عروض الأسعار متاحًا لجميع المستخدمين، بما يشمل مستخدمي لوحة المفاتيح وقارئات الشاشة، بالاعتماد على إرشادات إمكانية الوصول لمحتوى الويب (WCAG 2.1 المستوى AA).",
            en: "IDEA is committed to ensuring digital accessibility for people of all abilities, guided by the Web Content Accessibility Guidelines (WCAG) 2.1 Level AA.",
            fr: "IDEA s'engage à rendre sa plateforme accessible à tous, en s'appuyant sur les directives WCAG 2.1 niveau AA.",
          },
        ],
        bullets: [
          {
            ar: "دعم كامل لاتجاه القراءة من اليمين لليسار (Arabic RTL) ومن اليسار لليمين (EN/FR LTR).",
            en: "Full Arabic RTL and English/French LTR semantic document direction.",
            fr: "Prise en charge complète des directions RTL (arabe) et LTR (français/anglais).",
          },
          {
            ar: "مؤشرات تركيز واضحة للتنقل بلوحة المفاتيح، ووسوم ARIA دلالية في القوائم والتبويبات والنماذج.",
            en: "Visible focus-visible rings for keyboard navigation and semantic ARIA roles on dialogs, tabs, and forms.",
            fr: "Indicateurs de focus clavier visibles et attributs ARIA sémantiques sur les dialogues et formulaires.",
          },
          {
            ar: "احترام إعداد تقليل الحركة في النظام (prefers-reduced-motion) والوضع الفاتح والداكن عالي التباين.",
            en: "Automatic respect for system prefers-reduced-motion settings and legible light/dark theme contrast.",
            fr: "Respect automatique de prefers-reduced-motion et contraste lisible en thèmes clair et sombre.",
          },
        ],
      },
      {
        id: "feedback",
        heading: {
          ar: "2. الإبلاغ عن أي عائق في الوصول",
          en: "2. Accessibility Feedback",
          fr: "2. Signaler un problème d'accessibilité",
        },
        paragraphs: [
          {
            ar: "إذا واجهت أي صعوبة في الوصول إلى أي صفحة أو ميزة على المنصة، يُرجى التواصل معنا عبر صفحة التواصل أو البريد الإلكتروني الموضح في هذه الصفحة وسنعمل على معالجته سريعًا.",
            en: "If you encounter any accessibility barrier anywhere on IDEA, please contact us via the Contact page or legal email listed on this page and we will respond promptly.",
            fr: "Si vous rencontrez une difficulté d'accès sur IDEA, contactez-nous via la page Contact ou notre adresse e-mail afin que nous puissions intervenir rapidement.",
          },
        ],
      },
    ],
  },
];

export const LEGAL_HUB_META: {
  slug: "legal";
  path: "/legal";
  shortLabel: LocalizedText;
  title: LocalizedText;
  summary: LocalizedText;
} = {
  slug: "legal",
  path: "/legal",
  shortLabel: {
    ar: "المركز القانوني",
    en: "Legal Center",
    fr: "Centre légal",
  },
  title: {
    ar: "المركز القانوني والتراخيص والامتثال — IDEA",
    en: "Legal, Licenses & Compliance Center — IDEA",
    fr: "Centre légal, licences et conformité — IDEA",
  },
  summary: {
    ar: "كل السياسات القانونية، وحماية البيانات، وشروط الاستخدام، وسياسة عروض الأسعار والاسترجاع، وحقوق الملكية الفكرية، وتراخيص البرمجيات في مكان واحد منظم وواضح.",
    en: "All IDEA legal policies, data protection rights, marketplace terms, orders & returns rules, intellectual property notices, and open-source software licenses in one clean hub.",
    fr: "Toutes les politiques légales, protection des données, conditions d'utilisation, retours, propriété intellectuelle et licences open source d'IDEA réunies en un seul espace.",
  },
};

export function getLegalDocumentBySlug(slug: string): LegalDocument | undefined {
  return LEGAL_DOCUMENTS.find((doc) => doc.slug === slug);
}

export function getLegalCanonicalUrl(path: string, origin = LEGAL_SITE_ORIGIN): string {
  const cleanOrigin = origin.replace(/\/+$/, "");
  const cleanPath = path.startsWith("/") ? path : `/${path}`;
  return `${cleanOrigin}${cleanPath}`;
}

export function getAllLegalSitelinks(): Array<{
  path: string;
  label: LocalizedText;
  summary: LocalizedText;
}> {
  return [
    {
      path: LEGAL_HUB_META.path,
      label: LEGAL_HUB_META.shortLabel,
      summary: LEGAL_HUB_META.summary,
    },
    ...LEGAL_DOCUMENTS.map((doc) => ({
      path: doc.path,
      label: doc.shortLabel,
      summary: doc.summary,
    })),
  ];
}
