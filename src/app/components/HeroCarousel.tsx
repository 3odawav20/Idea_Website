import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Button, Container } from "./ui";
import imgLivingRoom from "../../imports/Modern_luxury_living_room_ambiance.png";
import imgMarbleGold from "../../imports/Luxurious_modern_interiors_with_marble_and_gold.png";

interface Slide {
  id: string;
  headline: { en: string; ar: string; fr: string };
  text: { en: string; ar: string; fr: string };
  image: string;
  buttons: { label: { en: string; ar: string; fr: string }; to: string; variant: "gold" | "outline" }[];
}

const SLIDES: Slide[] = [
  { id: "premium-bathroom", image: imgLivingRoom, headline: { en: "Define Your Space With Perfection", ar: "اصنع مساحتك بإتقان", fr: "Définissez votre espace avec perfection" }, text: { en: "Discover premium ceramics, porcelain and complete bathroom solutions created for exceptional interiors.", ar: "اكتشف السيراميك والبورسلين وحلول الحمامات المتكاملة المصممة للديكورات الاستثنائية.", fr: "Découvrez céramiques, porcelaines et solutions complètes de salle de bain pour des intérieurs exceptionnels." }, buttons: [{ label: { en: "Explore Collections", ar: "استكشف المجموعات", fr: "Explorer les collections" }, to: "/collections", variant: "gold" }, { label: { en: "Visualize Your Room", ar: "تصور غرفتك", fr: "Visualisez votre pièce" }, to: "/ai-room-visualizer", variant: "outline" }] },
  { id: "ai-visualizer", image: imgLivingRoom, headline: { en: "See It Inside Your Space Before You Buy", ar: "شاهدها في مساحتك قبل الشراء", fr: "Visualisez-le chez vous avant d'acheter" }, text: { en: "Upload your bathroom, kitchen or living room, select a real IDEA product and experience the finished result before installation.", ar: "ارفع صورة حمامك أو مطبخك أو غرفتك، اختر منتج IDEA حقيقي، وشاهد النتيجة النهائية قبل التركيب.", fr: "Téléchargez votre salle de bain, cuisine ou salon, choisissez un produit IDEA et découvrez le résultat final avant l'installation." }, buttons: [{ label: { en: "Start AI Visualization", ar: "ابدأ المحاكاة", fr: "Démarrer la visualisation" }, to: "/room-designer/new", variant: "gold" }, { label: { en: "Browse Porcelain", ar: "تصفح البورسلين", fr: "Voir la porcelaine" }, to: "/collections/porcelain", variant: "outline" }] },
  { id: "supplier-offers", image: imgMarbleGold, headline: { en: "One Request. Multiple Qualified Offers.", ar: "طلب واحد. عروض متعددة مؤهلة.", fr: "Une demande. Plusieurs offres qualifiées." }, text: { en: "Select the product and required quantity, then receive private offers from verified matching suppliers.", ar: "اختر المنتج والكمية المطلوبة، ثم احصل على عروض خاصة من موردين معتمدين.", fr: "Sélectionnez le produit et la quantité, puis recevez des offres privées de fournisseurs vérifiés." }, buttons: [{ label: { en: "Request Best Price", ar: "اطلب أفضل سعر", fr: "Demander le meilleur prix" }, to: "/request-quote/new", variant: "gold" }, { label: { en: "How It Works", ar: "كيف يعمل", fr: "Comment ça marche" }, to: "/how-it-works", variant: "outline" }] },
  { id: "complete-collections", image: imgLivingRoom, headline: { en: "Every Surface. Every Detail. One Destination.", ar: "كل سطح. كل تفصيلة. وجهة واحدة.", fr: "Chaque surface. Chaque détail. Une destination." }, text: { en: "Explore ceramic, porcelain, faucets, bathroom sets, units, bathtubs, shower systems and accessories in one curated marketplace.", ar: "استكشف السيراميك والبورسلين والخلاطات وأطقم الحمام والوحدات والأحواض وأنظمة الدش والإكسسوارات في سوق واحد منسق.", fr: "Explorez céramique, porcelaine, robinetterie, ensembles, meubles, baignoires, douches et accessoires dans une seule marketplace." }, buttons: [{ label: { en: "Browse All Products", ar: "تصفح كل المنتجات", fr: "Voir tous les produits" }, to: "/products", variant: "gold" }, { label: { en: "Bathroom Collections", ar: "مجموعات الحمام", fr: "Collections salle de bain" }, to: "/collections/sanitary-ware", variant: "outline" }] },
];

const INTERVAL = 6000;
const FIRST_TRANSITION_DELAY = INTERVAL;

export function HeroCarousel() {
  const { locale } = useI18n();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);

  const next = useCallback(() => setIndex((current) => (current + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length), []);
  const go = useCallback((nextIndex: number) => setIndex((nextIndex + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    // Fetch every background before it can be selected, preventing a dark
    // empty frame during the cross-fade on slower connections.
    SLIDES.forEach((slide) => {
      const image = new Image();
      image.src = slide.image;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    // Start quickly in the live preview, then continue at the regular cinematic pace.
    const firstTransition = window.setTimeout(next, FIRST_TRANSITION_DELAY);
    const timer = window.setInterval(next, INTERVAL);
    return () => {
      window.clearTimeout(firstTransition);
      window.clearInterval(timer);
    };
  }, [next, paused]);

  return (
    <section
      className="idea-hero-carousel"
      aria-roledescription="carousel"
      aria-label="IDEA highlights"
      tabIndex={0}
      onKeyDown={(event) => { if (event.key === "ArrowRight") next(); if (event.key === "ArrowLeft") prev(); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false); }}
      onTouchStart={(event) => { touchX.current = event.touches[0]?.clientX ?? null; }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (Math.abs(distance) > 50) (distance < 0 ? next : prev)();
        touchX.current = null;
      }}
      style={{ position: "relative", height: "min(88vh, 780px)", overflow: "hidden", outline: "none", background: "var(--idea-bg)" }}
    >
      {SLIDES.map((slide, slideIndex) => (
        <div
          key={slide.id}
          aria-hidden={slideIndex !== index}
          aria-roledescription="slide"
          role="group"
          style={{
            position: "absolute",
            inset: 0,
            opacity: slideIndex === index ? 1 : 0,
            pointerEvents: slideIndex === index ? "auto" : "none",
            transition: "opacity 1s ease",
          }}
        >
          <img
            className="idea-vivid-image"
            src={slide.image}
            alt=""
            aria-hidden="true"
            loading="eager"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: slideIndex === index ? "scale(1.06)" : "scale(1)",
              transition: "transform 7s ease",
            }}
          />
          <div style={{ position: "absolute", inset: 0, background: "var(--idea-hero-overlay)" }} />
          <Container className="idea-hero-content" style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", paddingBlockStart: "var(--idea-space-8)", paddingBlockEnd: "var(--idea-space-8)" }}>
            <div style={{ maxWidth: 640 }}>
              <div className="idea-eyebrow" style={{ marginBottom: "var(--idea-space-4)", color: "var(--idea-gold-bright)" }}>IDEA · Business Administration</div>
              <h1 className="idea-hero-title" style={{ fontSize: "clamp(36px, 4.4vw, 64px)", margin: 0, color: "#fff" }}>{slide.headline[locale]}</h1>
              <p style={{ color: "var(--idea-hero-copy)", fontSize: "var(--idea-text-lg)", lineHeight: 1.6, margin: "var(--idea-space-5) 0 var(--idea-space-6)" }}>{slide.text[locale]}</p>
              <div style={{ display: "flex", gap: "var(--idea-space-4)", flexWrap: "wrap" }}>
                {slide.buttons.map((button) => <Button key={button.to} variant={button.variant} size="lg" onClick={() => nav(button.to)}>{button.label[locale]}</Button>)}
              </div>
            </div>
          </Container>
        </div>
      ))}

      <button className="idea-hero-arrow" aria-label="Previous slide" onClick={prev} style={arrowStyle("start")}><ChevronLeft size={22} /></button>
      <button className="idea-hero-arrow" aria-label="Next slide" onClick={next} style={arrowStyle("end")}><ChevronRight size={22} /></button>
      <div style={{ position: "absolute", bottom: "var(--idea-space-9)", insetInline: 0, display: "flex", justifyContent: "center", gap: "var(--idea-space-3)" }}>
        {SLIDES.map((item, itemIndex) => <button key={item.id} aria-label={`Go to slide ${itemIndex + 1}`} aria-current={itemIndex === index} onClick={() => go(itemIndex)} style={{ width: itemIndex === index ? "var(--idea-space-7)" : "var(--idea-space-3)", height: "var(--idea-space-1)", borderRadius: "var(--idea-radius-full)", border: "none", cursor: "pointer", transition: "all .3s", background: itemIndex === index ? "var(--idea-gold)" : "var(--idea-hero-control)" }} />)}
      </div>
    </section>
  );
}

function arrowStyle(side: "start" | "end"): React.CSSProperties {
  return { position: "absolute", top: "50%", transform: "translateY(-50%)", insetInlineStart: side === "start" ? "var(--idea-space-5)" : undefined, insetInlineEnd: side === "end" ? "var(--idea-space-5)" : undefined, width: "var(--idea-space-7)", height: "var(--idea-space-7)", borderRadius: "var(--idea-radius-full)", display: "grid", placeItems: "center", cursor: "pointer", background: "var(--idea-hero-control-bg)", border: "var(--idea-hairline)", color: "var(--idea-gold-bright)", backdropFilter: "blur(6px)" };
}
