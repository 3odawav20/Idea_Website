import { Link } from "react-router";
import { ArrowUpRight, CheckCircle2, ClipboardList, Clock3, Layers3, LayoutGrid, MoveUpRight, Sparkles } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import "./ContactPage.css";

/**
 * Editorial contact landing page. Appointment calendar, phone and email are
 * intentionally NOT fabricated. All calls to action use existing real routes.
 */
export function ContactPage() {
  const { locale } = useI18n();
  const tr = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  const steps = [
    { num: "01", Icon: LayoutGrid, title: tr("Explore", "استكشف", "Explorer"), body: tr("Discover surfaces, formats and collections that fit your vision.", "اختار الخامات والمقاسات والمجموعات المناسبة لفكرتك.", "Découvrez les surfaces, formats et collections adaptés à votre projet.") },
    { num: "02", Icon: Layers3, title: tr("Choose", "اختار", "Choisir"), body: tr("Select a product and review its details before requesting an offer.", "اختار المنتج وراجع تفاصيله قبل طلب عرض السعر.", "Choisissez un produit et consultez ses détails avant une demande.") },
    { num: "03", Icon: ClipboardList, title: tr("Request", "اطلب", "Demander"), body: tr("Use the existing secure request flow to ask for a private quote.", "استخدم نظام الطلبات الموجود لإرسال طلب عرض سعر خاص.", "Utilisez le parcours existant pour demander un devis privé.") },
  ];

  return (
    <div className="idea-contact-page">
      <section className="idea-contact-hero" aria-labelledby="idea-contact-title">
        <div className="idea-contact-hero-image" aria-hidden="true" />
        <div className="idea-contact-hero-content">
          <Link className="idea-contact-back" to="/">{tr("Home", "الرئيسية", "Accueil")} <span aria-hidden="true">/</span> {tr("Contact & appointments", "التواصل والمواعيد", "Contact & rendez-vous")}</Link>
          <div className="idea-contact-kicker"><span className="idea-contact-kicker-line" /> IDEA · {tr("CONNECT & CREATE", "تواصل وابدع", "CONNECTER & CRÉER")}</div>
          <h1 id="idea-contact-title">
            {tr("Great spaces", "كل مساحة عظيمة", "Les beaux espaces")}
            <span>{tr("begin with", "بتبدأ", "commencent par")}</span>
            <em>{tr("an idea.", "بفكرة.", "une idée.")}</em>
          </h1>
          <p>{tr(
            "From the first inspiration to the right surface, explore the collection and take the next step towards bringing your space to life.",
            "من أول الإلهام لحد اختيار الخامة المناسبة، اكتشف مجموعاتنا وخد أول خطوة عشان تحوّل فكرتك لمساحة حقيقية.",
            "De la première inspiration à la surface idéale, découvrez nos collections et donnez vie à votre espace."
          )}</p>
          <div className="idea-contact-hero-actions">
            <Link className="idea-contact-primary" to="/products">{tr("Explore the collection", "استكشف المنتجات", "Explorer les collections")} <ArrowUpRight size={18} aria-hidden="true" /></Link>
            <Link className="idea-contact-secondary" to="/request-quote/new">{tr("Request a quote", "اطلب عرض سعر", "Demander un devis")} <MoveUpRight size={18} aria-hidden="true" /></Link>
          </div>
        </div>
        <div className="idea-contact-hero-index" aria-hidden="true">IDEA / 01—03</div>
      </section>

      <div className="idea-contact-shell">
        <section className="idea-contact-intro" aria-labelledby="idea-contact-process">
          <div>
            <span className="idea-contact-overline">{tr("YOUR PROJECT, SIMPLIFIED", "مشروعك بخطوات بسيطة", "VOTRE PROJET, SIMPLIFIÉ")}</span>
            <h2 id="idea-contact-process">{tr("From inspiration", "من الفكرة", "De l'inspiration")}<br /><span>{tr("to the right choice.", "للاختيار المناسب.", "au bon choix.")}</span></h2>
          </div>
          <p>{tr(
            "You don't need to have every detail figured out. Start by exploring our materials, compare what you love and send a private quote request when you're ready.",
            "مش لازم تكون محدد كل التفاصيل من البداية. تصفح الخامات، قارن اختياراتك، وابعت طلب عرض سعر خاص لما تكون جاهز.",
            "Inutile de tout décider d'avance. Explorez nos matériaux, comparez vos préférences et demandez un devis privé lorsque vous êtes prêt."
          )}</p>
        </section>

        <div className="idea-contact-steps">
          {steps.map(({ num, Icon, title, body }) => (
            <article className="idea-contact-step" key={num}>
              <div className="idea-contact-step-top"><span>{num} / 03</span><Icon size={23} strokeWidth={1.5} aria-hidden="true" /></div>
              <h3>{title}</h3><p>{body}</p>
              <div className="idea-contact-step-line" />
            </article>
          ))}
        </div>

        <section className="idea-contact-pathways" aria-label={tr("Explore planning tools", "اكتشف أدوات التصميم", "Découvrez les outils de conception")}>
          <Link className="idea-contact-path idea-contact-path-photo" to="/room-designer/3d">
            <span className="idea-contact-path-top"><span><CheckCircle2 size={14} aria-hidden="true" /> {tr("DESIGN TOOLS", "أدوات التصميم", "OUTILS DE CONCEPTION")}</span><ArrowUpRight size={23} aria-hidden="true" /></span>
            <div><span className="idea-contact-path-kicker">{tr("VISUALISE YOUR SPACE", "تخيل مساحتك", "VISUALISEZ VOTRE ESPACE")}</span><h2>{tr("Design in 3D.", "صمّم بتقنية 3D.", "Concevez en 3D.")}</h2><p>{tr("Plan, explore and refine your room in the 3D Studio.", "خطط لغرفتك وجرّب أفكار مختلفة داخل استوديو 3D.", "Planifiez et affinez votre pièce dans le studio 3D.")}</p></div>
          </Link>
          <Link className="idea-contact-path idea-contact-path-ai" to="/ai-room-visualizer">
            <span className="idea-contact-path-top"><span><Sparkles size={16} aria-hidden="true" /> {tr("CREATIVE STUDIO", "الاستوديو الإبداعي", "STUDIO CRÉATIF")}</span><ArrowUpRight size={23} aria-hidden="true" /></span>
            <div><span className="idea-contact-path-kicker">IDEA · AI</span><h2>{tr("See new possibilities.", "شوف أفكار جديدة.", "Découvrez de nouvelles idées.")}</h2><p>{tr("Explore visual directions with our AI Visualizer.", "جرّب اتجاهات تصميم مختلفة باستخدام المحاكي الذكي.", "Explorez des styles avec notre visualiseur IA.")}</p></div>
          </Link>
        </section>

        <section className="idea-contact-appointment" aria-labelledby="idea-contact-appointment-title">
          <div className="idea-contact-appointment-icon"><Clock3 size={26} strokeWidth={1.6} aria-hidden="true" /></div>
          <div>
            <span className="idea-contact-overline">{tr("APPOINTMENTS", "المواعيد", "RENDEZ-VOUS")}</span>
            <h2 id="idea-contact-appointment-title">{tr("We're preparing more ways to connect.", "بنجهز طرق تواصل أكتر.", "D'autres moyens de contact arrivent.")}</h2>
            <p>{tr(
              "Direct appointment booking is not available yet. Public contact details have not been provided. For product enquiries, choose a product and use the existing quote-request flow.",
              "حجز المواعيد المباشر لسه مش متاح، وبيانات التواصل العامة لسه ما اتضافتش. للاستفسار عن منتج، اختاره واستخدم نظام طلب عرض السعر الموجود.",
              "La réservation directe n'est pas encore disponible et les coordonnées publiques ne sont pas renseignées. Pour un produit, passez par la demande de devis existante."
            )}</p>
          </div>
          <Link to="/request-quote/new" className="idea-contact-appointment-link">{tr("Request a quote", "اطلب عرض سعر", "Demander un devis")} <ArrowUpRight size={18} aria-hidden="true" /></Link>
        </section>
      </div>
    </div>
  );
}
