import { AlertTriangle, FileText, LockKeyhole } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import "./LegalPages.css";

type LegalKind = "terms" | "privacy";
type PolicySection = { title: string; body: string };

type LegalCopy = {
  eyebrow: string;
  termsTitle: string;
  privacyTitle: string;
  termsIntro: string;
  privacyIntro: string;
  draft: string;
  warning: string;
  completionTitle: string;
  completionItems: string[];
  terms: PolicySection[];
  privacy: PolicySection[];
  notAdvice: string;
};

const copy: Record<"en" | "ar" | "fr", LegalCopy> = {
  en: {
    eyebrow: "IDEA · LEGAL INFORMATION",
    termsTitle: "Terms of use",
    privacyTitle: "Privacy policy",
    termsIntro: "A working draft describing how the IDEA catalogue, quote requests and planning tools are intended to work.",
    privacyIntro: "A working draft of the information notice for customer and company accounts, quote requests and planning tools.",
    draft: "DRAFT — OWNER AND LEGAL REVIEW REQUIRED",
    warning: "This is not a final legal notice and must not be treated as confirmation of legal compliance. The operator identity, contact details, operational policies and data-processing providers have not yet been confirmed. Complete and review this page before public launch, accepting orders or collecting additional personal information.",
    completionTitle: "Required before publication",
    completionItems: [
      "Registered legal entity name, commercial registration and tax numbers, registered address, and an official customer-support contact.",
      "Approved delivery, cancellation, return, refund, warranty, complaints, payment, tax and fee terms.",
      "Privacy contact, retention periods, user-request process, cookie and analytics inventory, hosting and payment processors, AI processor and any international transfers.",
      "Review by qualified Egyptian counsel against the business model and the current applicable consumer-protection and data-protection requirements.",
    ],
    terms: [
      { title: "1. What IDEA provides", body: "IDEA provides a product-discovery catalogue, design inspiration, room-planning tools and a way to request quotations. A catalogue listing or quote request is not, by itself, a confirmed order, stock reservation or promise of delivery." },
      { title: "2. Quotations and seller details", body: "Public catalogue prices and supplier identities are not displayed. Before a customer accepts an offer or pays, the offer must identify the contracting seller and disclose the complete price, applicable taxes and fees, product specification, confirmed availability, delivery terms, warranty and applicable cancellation or return terms. A quote request alone does not form a purchase contract." },
      { title: "3. Product information", body: "Product names, images, dimensions and specifications may come from suppliers or cited sources. Fields marked unverified are not manufacturer certification. Colours can vary between screens and physical batches. Confirm the exact product, quantity, intended use, installation requirements and availability with the named seller before ordering." },
      { title: "4. Payments and fulfilment", body: "Only payment methods actually presented and confirmed for a particular offer may be used. Delivery dates, stock, fees and warranties must be confirmed in that offer. The final payment and fulfilment process is still subject to owner confirmation and legal review." },
      { title: "5. Returns, complaints and statutory rights", body: "Nothing in this draft is intended to limit a consumer right that cannot lawfully be waived. The operator’s final return, refund, cancellation, warranty and complaint procedures must be published and reviewed before taking orders or payment." },
      { title: "6. Room-planning and AI tools", body: "Room visualizations are illustrative planning aids. They are not a survey, installation plan, engineering specification, quantity guarantee or assurance that a product is suitable for a particular surface. Verify measurements and technical suitability with the supplier and installer." },
      { title: "7. Accounts and acceptable use", body: "Keep account credentials private and provide accurate information when requesting a quote or applying for company verification. Do not upload information that is not required for the requested service. The final rules for account suspension, dispute handling and service availability require owner and legal approval." },
    ],
    privacy: [
      { title: "1. Who is responsible for your information", body: "IDEA is the public brand shown on this website. The registered legal entity responsible for processing, its registered address and its privacy contact have not yet been supplied. Those details must be completed here before this notice is published as final." },
      { title: "2. Information that may be submitted", body: "Depending on the feature you choose, the site may receive account and contact details, quote and order messages, company registration or tax documents submitted for verification, and room or product images selected for planning tools. Provide only information needed for the feature you are using." },
      { title: "3. Why information is used", body: "The intended uses include creating and securing accounts, reviewing company applications, routing a quote request to a relevant supplier, supporting an order or enquiry, and responding to service or security issues. The final legal bases and retention schedule must be confirmed by the responsible entity." },
      { title: "4. Who may receive information", body: "Access should be limited to authorized IDEA staff and, when you submit a quote request, the supplier needed to respond. Hosting, payment, authentication, analytics and AI processors must be identified in the final notice. Their locations, contracts and any international transfers have not yet been verified for this draft." },
      { title: "5. Room images and AI processing", body: "AI image generation is not enabled until its backend and processor are verified. Do not upload personal or sensitive images for AI processing while the feature is unavailable. Before enabling it, IDEA must state which provider receives an image, the processing purpose, retention period and how a user can request deletion." },
      { title: "6. Storage, cookies and your requests", body: "The exact list of browser storage, cookies, analytics and retention periods still needs an implementation review. A privacy contact and process for access, correction, deletion or other requests must be provided by the responsible entity before this draft becomes final." },
      { title: "7. Security", body: "Company documents and account information require restricted access, secure transmission and a documented retention and deletion process. Do not submit credentials, payment-card details or unrelated identity documents through a preview or general enquiry form." },
    ],
    notAdvice: "This draft is a product and engineering starting point, not legal advice. It is intentionally marked as incomplete rather than inventing company details or processor practices.",
  },
  ar: {
    eyebrow: "IDEA · المعلومات القانونية",
    termsTitle: "شروط الاستخدام",
    privacyTitle: "سياسة الخصوصية",
    termsIntro: "مسودة عمل توضّح طريقة عمل كتالوج IDEA وطلبات عروض الأسعار وأدوات تخطيط المساحات.",
    privacyIntro: "مسودة أولية لإشعار الخصوصية الخاص بحسابات العملاء والشركات وطلبات الأسعار وأدوات التخطيط.",
    draft: "مسودة — يلزم اعتماد المالك ومراجعة قانونية",
    warning: "دي مش صياغة قانونية نهائية ومش تأكيد على اكتمال الالتزام القانوني. اسم الجهة المشغلة وبيانات التواصل والسياسات التشغيلية ومقدمو معالجة البيانات لسه ما اتأكدوش. لازم استكمال ومراجعة الصفحة قبل الإطلاق العام أو قبول الطلبات أو جمع بيانات شخصية إضافية.",
    completionTitle: "مطلوب قبل النشر",
    completionItems: [
      "الاسم القانوني المسجل، ورقما السجل التجاري والبطاقة الضريبية، والعنوان المسجل ووسيلة رسمية للتواصل مع العملاء.",
      "اعتماد شروط التوصيل والإلغاء والاستبدال والاسترجاع والضمان والشكاوى والدفع والضرائب والرسوم.",
      "وسيلة التواصل الخاصة بالخصوصية، ومدد الاحتفاظ، وطريقة استقبال طلبات المستخدم، وجرد ملفات الارتباط والتحليلات ومقدمي الاستضافة والدفع والذكاء الاصطناعي وأي نقل دولي للبيانات.",
      "مراجعة محامٍ مصري مؤهل وفق نموذج العمل ومتطلبات حماية المستهلك والبيانات السارية وقت النشر.",
    ],
    terms: [
      { title: "١. خدمات IDEA", body: "تقدم IDEA كتالوجًا لاكتشاف المنتجات وإلهامًا للتصميم وأدوات لتخطيط المساحات وإمكانية طلب عروض أسعار. ظهور منتج في الكتالوج أو إرسال طلب سعر لا يعني وحده تأكيد الطلب أو حجز المخزون أو ضمان التوصيل." },
      { title: "٢. عروض الأسعار وبيانات البائع", body: "لا تُعرض أسعار الكتالوج أو هويات الموردين للعامة. قبل قبول العميل للعرض أو الدفع، يجب أن يوضح العرض البائع المتعاقد والسعر الكامل والضرائب والرسوم ومواصفات المنتج والتوفر المؤكد وشروط التوصيل والضمان والإلغاء أو الاسترجاع المطبقة. طلب السعر وحده لا ينشئ عقد شراء." },
      { title: "٣. بيانات المنتجات", body: "قد تأتي أسماء المنتجات وصورها وأبعادها ومواصفاتها من الموردين أو المصادر المشار إليها. الحقول المعلّمة بأنها غير موثقة ليست شهادة من المصنع. قد تختلف الألوان بين الشاشات والدفعات الفعلية. أكّد المنتج والكمية والاستخدام المقصود ومتطلبات التركيب والتوفر مع البائع المحدد قبل الطلب." },
      { title: "٤. الدفع والتنفيذ", body: "استخدم فقط وسيلة الدفع المعروضة والمؤكدة للعرض المحدد. يجب تأكيد مواعيد التوصيل والمخزون والرسوم والضمان ضمن العرض. مسار الدفع والتنفيذ النهائي ما زال محتاج تأكيد المالك ومراجعة قانونية." },
      { title: "٥. الاسترجاع والشكاوى والحقوق القانونية", body: "لا يُقصد من هذه المسودة الانتقاص من أي حق للمستهلك لا يجوز التنازل عنه قانونًا. يجب نشر ومراجعة إجراءات الإرجاع والاسترداد والإلغاء والضمان والشكاوى النهائية قبل قبول أي طلب أو دفعة." },
      { title: "٦. التخطيط ومعاينة الذكاء الاصطناعي", body: "معاينة الغرفة أداة إرشادية للتخطيط فقط، وليست رفعًا هندسيًا أو مخطط تركيب أو مواصفة فنية أو ضمانًا للكمية أو لصلاحية المنتج لسطح محدد. راجع المقاسات والملاءمة الفنية مع المورد والفني." },
      { title: "٧. الحسابات والاستخدام المقبول", body: "حافظ على سرية بيانات الدخول وقدّم معلومات صحيحة عند طلب عرض سعر أو التقدم للتحقق من شركة. لا ترفع بيانات غير مطلوبة للخدمة التي تستخدمها. قواعد إيقاف الحساب وتسوية النزاعات وتوفر الخدمة ما زالت تحتاج اعتماد المالك والمراجعة القانونية." },
    ],
    privacy: [
      { title: "١. الجهة المسؤولة عن البيانات", body: "IDEA هو الاسم التجاري الظاهر على الموقع. لم يتم تزويدنا بعد باسم الجهة القانونية المسجلة المسؤولة عن المعالجة أو عنوانها المسجل أو وسيلة التواصل الخاصة بالخصوصية. يجب استكمال هذه البيانات قبل نشر الإشعار بصيغته النهائية." },
      { title: "٢. البيانات التي قد يرسلها المستخدم", body: "بحسب الميزة المختارة، قد يستقبل الموقع بيانات الحساب والتواصل ورسائل عروض الأسعار والطلبات ومستندات تسجيل الشركة أو الضرائب المقدمة للتحقق وصور الغرف أو المنتجات المختارة لأدوات التخطيط. أرسل فقط البيانات اللازمة للميزة التي تستخدمها." },
      { title: "٣. أغراض الاستخدام", body: "تشمل الأغراض المقصودة إنشاء الحسابات وتأمينها ومراجعة طلبات الشركات وتوجيه طلب السعر إلى المورد المناسب ودعم الطلب أو الاستفسار ومعالجة مشكلات الخدمة أو الأمان. الأساس القانوني النهائي ومدد الاحتفاظ يجب أن تحددهما الجهة المسؤولة." },
      { title: "٤. الجهات التي قد تتلقى البيانات", body: "يجب أن يقتصر الوصول على موظفي IDEA المخولين، والمورد اللازم للرد عند إرسال المستخدم طلب عرض سعر. يجب تحديد مقدمي الاستضافة والدفع والمصادقة والتحليلات والذكاء الاصطناعي في الإشعار النهائي. مواقعهم وعقودهم وأي نقل دولي للبيانات لم يتم التحقق منها لهذه المسودة." },
      { title: "٥. صور الغرف ومعالجة الذكاء الاصطناعي", body: "توليد الصور بالذكاء الاصطناعي غير مفعّل إلى أن يتم التحقق من الباكايند ومقدم الخدمة. لا ترفع صورًا شخصية أو حساسة لمعالجة الذكاء الاصطناعي ما دامت الميزة غير متاحة. قبل تفعيلها يجب توضيح الجهة التي تستقبل الصورة والغرض ومدة الاحتفاظ وطريقة طلب الحذف." },
      { title: "٦. التخزين وملفات الارتباط وطلبات المستخدم", body: "ما زال يلزم مراجعة التنفيذ لتحديد قائمة تخزين المتصفح وملفات الارتباط والتحليلات ومدد الاحتفاظ بدقة. يجب توفير وسيلة تواصل للخصوصية وآلية لطلبات الوصول أو التصحيح أو الحذف أو غيرها قبل اعتماد المسودة." },
      { title: "٧. الأمان", body: "تتطلب مستندات الشركات وبيانات الحسابات صلاحيات وصول محدودة ونقلًا آمنًا وسياسة موثقة للاحتفاظ والحذف. لا ترسل كلمات مرور أو بيانات بطاقات الدفع أو مستندات هوية غير مطلوبة عبر معاينة الموقع أو نموذج استفسار عام." },
    ],
    notAdvice: "هذه المسودة نقطة بداية للمنتج والهندسة وليست استشارة قانونية. تم توضيح النواقص بدلًا من اختلاق بيانات الشركة أو ممارسات مقدمي الخدمة.",
  },
  fr: {
    eyebrow: "IDEA · INFORMATIONS JURIDIQUES",
    termsTitle: "Conditions d’utilisation",
    privacyTitle: "Politique de confidentialité",
    termsIntro: "Projet décrivant le fonctionnement prévu du catalogue IDEA, des demandes de devis et des outils de conception.",
    privacyIntro: "Projet de notice pour les comptes clients et professionnels, les demandes de devis et les outils de conception.",
    draft: "PROJET — VALIDATION DU RESPONSABLE ET REVUE JURIDIQUE REQUISES",
    warning: "Ce texte n’est pas une notice juridique définitive et ne confirme pas la conformité. L’identité de l’exploitant, ses coordonnées, les règles opérationnelles et les prestataires de traitement n’ont pas encore été confirmés. Complétez et faites examiner cette page avant son lancement public, l’acceptation de commandes ou la collecte de données personnelles supplémentaires.",
    completionTitle: "À compléter avant publication",
    completionItems: [
      "Dénomination légale, numéros d’immatriculation et fiscaux, adresse enregistrée et contact officiel du service client.",
      "Conditions approuvées de livraison, annulation, retour, remboursement, garantie, réclamation, paiement, taxes et frais.",
      "Contact confidentialité, durées de conservation, procédure de demandes, inventaire des cookies et analyses, hébergeurs, prestataires de paiement et d’IA, et éventuels transferts internationaux.",
      "Revue par un conseil égyptien qualifié selon le modèle commercial et les exigences applicables au moment de la publication.",
    ],
    terms: [
      { title: "1. Services IDEA", body: "IDEA propose un catalogue de découverte, de l’inspiration, des outils de conception de pièces et la possibilité de demander un devis. Une fiche catalogue ou une demande de devis ne constitue pas, à elle seule, une commande confirmée, une réservation de stock ou une garantie de livraison." },
      { title: "2. Devis et identité du vendeur", body: "Les prix publics et l’identité des fournisseurs ne sont pas affichés. Avant l’acceptation d’une offre ou un paiement, l’offre doit identifier le vendeur contractuel et préciser le prix total, taxes et frais, les caractéristiques, la disponibilité confirmée, la livraison, la garantie et les conditions d’annulation ou de retour applicables. Une demande de devis ne crée pas à elle seule un contrat d’achat." },
      { title: "3. Informations produits", body: "Les noms, images, dimensions et caractéristiques peuvent provenir des fournisseurs ou de sources citées. Les champs indiqués comme non vérifiés ne constituent pas une certification du fabricant. Les couleurs peuvent varier selon l’écran et les lots. Confirmez le produit exact, la quantité, l’usage, la pose et la disponibilité auprès du vendeur avant toute commande." },
      { title: "4. Paiements et exécution", body: "Seuls les moyens de paiement réellement présentés et confirmés pour une offre peuvent être utilisés. Les délais, stocks, frais et garanties doivent être confirmés dans cette offre. Le processus final de paiement et d’exécution reste soumis à validation du responsable et à une revue juridique." },
      { title: "5. Retours, réclamations et droits légaux", body: "Ce projet ne vise pas à limiter un droit du consommateur qui ne peut légalement être exclu. Les procédures finales de retour, remboursement, annulation, garantie et réclamation doivent être publiées et examinées avant toute commande ou paiement." },
      { title: "6. Outils de conception et IA", body: "Les visualisations sont des aides illustratives à la conception. Elles ne constituent ni relevé, ni plan de pose, ni spécification technique, ni garantie de quantité ou d’adéquation. Vérifiez les dimensions et la compatibilité auprès du fournisseur et de l’installateur." },
      { title: "7. Comptes et usage acceptable", body: "Protégez vos identifiants et fournissez des informations exactes lors d’une demande de devis ou d’une vérification professionnelle. Ne téléversez que les informations nécessaires au service choisi. Les règles de suspension, de résolution des litiges et de disponibilité exigent encore validation." },
    ],
    privacy: [
      { title: "1. Responsable du traitement", body: "IDEA est la marque publique affichée sur ce site. La dénomination légale du responsable, son adresse et son contact confidentialité n’ont pas encore été fournis. Ces informations doivent être ajoutées avant la publication définitive de cette notice." },
      { title: "2. Informations susceptibles d’être fournies", body: "Selon la fonction choisie, le site peut recevoir des coordonnées de compte, des messages de devis ou de commande, des documents d’immatriculation ou fiscaux transmis pour vérification, et des images de pièce ou de produit sélectionnées pour les outils de conception. Ne fournissez que les informations nécessaires." },
      { title: "3. Utilisations", body: "Les usages prévus comprennent la création et la sécurisation du compte, l’examen des demandes professionnelles, l’acheminement d’un devis au fournisseur concerné, l’assistance liée à une demande et la sécurité du service. La base juridique et les durées de conservation doivent être confirmées par le responsable." },
      { title: "4. Destinataires", body: "L’accès devrait être limité au personnel IDEA autorisé et au fournisseur nécessaire pour répondre à une demande de devis. Les hébergeurs et prestataires de paiement, d’authentification, d’analyse et d’IA doivent être nommés dans la notice finale. Leur localisation, leurs contrats et les éventuels transferts internationaux ne sont pas vérifiés dans ce projet." },
      { title: "5. Images et traitement par IA", body: "La génération d’images par IA n’est pas activée tant que son backend et son prestataire ne sont pas vérifiés. Ne téléversez pas d’images personnelles ou sensibles pour ce traitement tant que la fonction est indisponible. Avant activation, IDEA doit préciser le destinataire, la finalité, la durée de conservation et la procédure de suppression." },
      { title: "6. Stockage, cookies et demandes", body: "Un audit de l’implémentation est encore nécessaire pour établir la liste exacte du stockage navigateur, des cookies, des outils d’analyse et des durées de conservation. Un contact confidentialité et une procédure d’accès, de rectification, de suppression ou autre doivent être indiqués avant validation." },
      { title: "7. Sécurité", body: "Les documents d’entreprise et les informations de compte exigent un accès restreint, un transfert sécurisé et une procédure documentée de conservation et de suppression. N’envoyez pas de mots de passe, de données de carte bancaire ni de pièces d’identité non requises via une prévisualisation ou un formulaire général." },
    ],
    notAdvice: "Ce projet est un point de départ produit et technique, pas un conseil juridique. Les informations manquantes sont indiquées plutôt que remplacées par des données inventées.",
  },
};

export function LegalPage({ kind }: { kind: LegalKind }) {
  const { locale } = useI18n();
  const content = copy[locale];
  const isTerms = kind === "terms";
  const sections = isTerms ? content.terms : content.privacy;

  return (
    <section className="idea-legal-page" dir={locale === "ar" ? "rtl" : "ltr"} aria-labelledby="idea-legal-title">
      <header className="idea-legal-hero">
        <div className="idea-legal-eyebrow"><FileText size={15} aria-hidden="true" /> {content.eyebrow}</div>
        <h1 id="idea-legal-title">{isTerms ? content.termsTitle : content.privacyTitle}</h1>
        <p>{isTerms ? content.termsIntro : content.privacyIntro}</p>
        <div className="idea-legal-draft" role="note">
          <AlertTriangle size={18} aria-hidden="true" />
          <div><strong>{content.draft}</strong><span>{content.warning}</span></div>
        </div>
      </header>

      <div className="idea-legal-layout">
        <aside className="idea-legal-checklist" aria-labelledby="idea-legal-checklist-title">
          <LockKeyhole size={21} aria-hidden="true" />
          <h2 id="idea-legal-checklist-title">{content.completionTitle}</h2>
          <ul>{content.completionItems.map(item => <li key={item}>{item}</li>)}</ul>
        </aside>

        <article className="idea-legal-document">
          {sections.map((section, index) => (
            <section key={section.title} aria-labelledby={`legal-${kind}-section-${index}`}>
              <h2 id={`legal-${kind}-section-${index}`}>{section.title}</h2>
              <p>{section.body}</p>
            </section>
          ))}
          <p className="idea-legal-disclaimer">{content.notAdvice}</p>
        </article>
      </div>
    </section>
  );
}
