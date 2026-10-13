import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight, ArrowRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Container } from "./ui";
import imgLivingRoom from "../../imports/Modern_luxury_living_room_ambiance.png";
import imgMarbleGold from "../../imports/Luxurious_modern_interiors_with_marble_and_gold.png";
import imgTriptych from "../../imports/Luxurious_modern_interior_triptych_design.png";

// Unsplash images from the catalog palette — no new URLs needed
const BATH_IMG = "https://images.unsplash.com/photo-1663811396038-7a21d4eef49e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1400";

interface Slide {
  id: string;
  image: string;
  imgPosition?: string;
  thumbLabel: { en: string; ar: string; fr: string };
  eyebrow: { en: string; ar: string; fr: string };
  headline: { en: string; ar: string; fr: string };
  text: { en: string; ar: string; fr: string };
  cta: { label: { en: string; ar: string; fr: string }; to: string };
  ctaSecondary?: { label: { en: string; ar: string; fr: string }; to: string };
}

const SLIDES: Slide[] = [
  {
    id: "living",
    image: imgLivingRoom,
    imgPosition: "center 40%",
    thumbLabel: { en: "Living Room", ar: "غرفة المعيشة", fr: "Salon" },
    eyebrow: { en: "Ceramic & Porcelain", ar: "سيراميك وبورسلين", fr: "Céramique & Porcelaine" },
    headline: { en: "Define Your Space\nWith Perfection", ar: "اصنع مساحتك\nبإتقان", fr: "Définissez votre espace\navec perfection" },
    text: { en: "Premium ceramics, porcelain slabs and complete bathroom solutions crafted for exceptional interiors.", ar: "سيراميك وبلاطات بورسلين وحلول حمامات متكاملة مصممة للديكورات الاستثنائية.", fr: "Céramiques premium, dalles de porcelaine et solutions de salle de bain complètes." },
    cta: { label: { en: "Shop Now", ar: "تسوق الآن", fr: "Acheter maintenant" }, to: "/collections" },
    ctaSecondary: { label: { en: "View Catalogue", ar: "عرض الكتالوج", fr: "Voir le catalogue" }, to: "/products" },
  },
  {
    id: "bathroom-dark",
    image: imgTriptych,
    imgPosition: "50% 30%",
    thumbLabel: { en: "Bathroom", ar: "الحمام", fr: "Salle de bain" },
    eyebrow: { en: "Bathroom Collections", ar: "مجموعات الحمامات", fr: "Collections Salle de bain" },
    headline: { en: "Luxury Surfaces\nFor Every Bathroom", ar: "أسطح فاخرة\nلكل حمام", fr: "Surfaces de luxe\npour chaque salle de bain" },
    text: { en: "From wall-to-floor porcelain to complete sanitary suites — discover surfaces that transform your bathroom.", ar: "من البورسلين الجداري والأرضي إلى الأطقم الصحية الكاملة — اكتشف أسطح تحول حمامك.", fr: "Du carrelage mural au sol aux suites sanitaires complètes — des surfaces qui transforment votre salle de bain." },
    cta: { label: { en: "Explore Bathrooms", ar: "استكشف الحمامات", fr: "Explorer les salles de bain" }, to: "/collections/sanitary-ware" },
    ctaSecondary: { label: { en: "Get Best Price", ar: "أفضل سعر", fr: "Meilleur prix" }, to: "/request-quote/new" },
  },
  {
    id: "marble-bath",
    image: BATH_IMG,
    imgPosition: "center 25%",
    thumbLabel: { en: "Porcelain", ar: "البورسلين", fr: "Porcelaine" },
    eyebrow: { en: "Porcelain Slabs", ar: "بلاطات البورسلين", fr: "Dalles de Porcelaine" },
    headline: { en: "Large Format Slabs\nFor Bold Interiors", ar: "بلاطات كبيرة الحجم\nلديكور جريء", fr: "Grandes dalles format\npour des intérieurs audacieux" },
    text: { en: "Full-body porcelain slabs in marble, stone and colour effects. Sizes up to 120×240 cm.", ar: "بلاطات بورسلين كاملة بتأثيرات الرخام والحجر والألوان. مقاسات تصل إلى 120×240 سم.", fr: "Dalles de porcelaine pleine masse aux effets marbre, pierre et couleur. Tailles jusqu'à 120×240 cm." },
    cta: { label: { en: "Browse Porcelain", ar: "تصفح البورسلين", fr: "Voir la Porcelaine" }, to: "/collections/porcelain" },
    ctaSecondary: { label: { en: "Try Visualizer", ar: "جرب المرئي", fr: "Essayer le visualiseur" }, to: "/room-designer/new" },
  },
  {
    id: "marketplace",
    image: imgMarbleGold,
    imgPosition: "center 35%",
    thumbLabel: { en: "Best Price", ar: "أفضل سعر", fr: "Meilleur Prix" },
    eyebrow: { en: "IDEA Marketplace", ar: "ماركت IDEA", fr: "Marketplace IDEA" },
    headline: { en: "One Request.\nMultiple Qualified Offers.", ar: "طلب واحد.\nعروض متعددة مؤهلة.", fr: "Une demande.\nPlusieurs offres qualifiées." },
    text: { en: "Select any product and quantity, then receive private competitive offers from verified suppliers within 24 hours.", ar: "اختر أي منتج والكمية، واحصل على عروض تنافسية خاصة من موردين معتمدين خلال 24 ساعة.", fr: "Choisissez votre produit et quantité, recevez des offres concurrentielles privées de fournisseurs vérifiés en 24h." },
    cta: { label: { en: "Request Best Price", ar: "اطلب أفضل سعر", fr: "Demander le meilleur prix" }, to: "/request-quote/new" },
    ctaSecondary: { label: { en: "How It Works", ar: "كيف يعمل", fr: "Comment ça marche" }, to: "/how-it-works" },
  },
];

const INTERVAL = 6000;

export function HeroCarousel() {
  const { locale } = useI18n();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [animKey, setAnimKey] = useState(0);
  const touchX = useRef<number | null>(null);
  const progressRef = useRef<HTMLDivElement[]>([]);

  const go = useCallback((next: number) => {
    setIndex((next + SLIDES.length) % SLIDES.length);
    setAnimKey((k) => k + 1);
  }, []);

  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  useEffect(() => {
    SLIDES.forEach((s) => { const img = new Image(); img.src = s.image; });
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(next, INTERVAL);
    return () => window.clearInterval(timer);
  }, [next, paused]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="IDEA highlights"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === "ArrowRight") next(); if (e.key === "ArrowLeft") prev(); }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => { touchX.current = e.touches[0]?.clientX ?? null; }}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const d = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (Math.abs(d) > 50) (d < 0 ? next : prev)();
        touchX.current = null;
      }}
      style={{ position: "relative", height: "min(90svh, 840px)", overflow: "hidden", outline: "none", background: "#0a0a0a" }}
    >
      {/* Slides */}
      {SLIDES.map((slide, si) => {
        const isActive = si === index;
        return (
          <div
            key={slide.id}
            aria-hidden={!isActive}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              pointerEvents: isActive ? "auto" : "none",
              transition: "opacity 1.1s cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Ken Burns image */}
            <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
              <img
                src={slide.image}
                alt=""
                aria-hidden
                loading="eager"
                className={isActive ? `idea-kb-active-${si % 4}` : ""}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  objectPosition: slide.imgPosition || "center center",
                  transformOrigin: "center center",
                }}
              />
            </div>

            {/* Overlay */}
            <div style={{
              position: "absolute",
              inset: 0,
              background: "linear-gradient(110deg, rgba(8,6,4,0.88) 0%, rgba(8,6,4,0.56) 48%, rgba(8,6,4,0.18) 100%)",
            }} />

            {/* Content */}
            <Container
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingBlockEnd: "160px",
              }}
            >
              {isActive && (
                <div key={animKey} style={{ maxWidth: 620 }}>
                  {/* Eyebrow */}
                  <div
                    className="idea-hero-anim-1"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                      marginBottom: "var(--idea-space-4)",
                      fontFamily: "var(--idea-font-display)",
                      fontSize: "var(--idea-text-xs)",
                      letterSpacing: "var(--idea-tracking-wide)",
                      color: "var(--idea-gold-bright)",
                      textTransform: "uppercase",
                    }}
                  >
                    <span style={{ width: 28, height: 1, background: "var(--idea-gold-bright)", display: "inline-block" }} />
                    {slide.eyebrow[locale]}
                  </div>

                  {/* Headline */}
                  <h1
                    className="idea-hero-anim-2"
                    style={{
                      fontFamily: "var(--idea-font-display)",
                      fontSize: "clamp(38px, 5.2vw, 76px)",
                      fontWeight: 500,
                      color: "white",
                      margin: "0 0 var(--idea-space-5)",
                      lineHeight: 1.1,
                      letterSpacing: "0.01em",
                      whiteSpace: "pre-line",
                    }}
                  >
                    {slide.headline[locale]}
                  </h1>

                  {/* Body */}
                  <p
                    className="idea-hero-anim-3"
                    style={{
                      color: "rgba(255,255,255,0.72)",
                      fontSize: "var(--idea-text-lg)",
                      lineHeight: 1.65,
                      margin: "0 0 var(--idea-space-6)",
                      maxWidth: 520,
                    }}
                  >
                    {slide.text[locale]}
                  </p>

                  {/* CTAs */}
                  <div className="idea-hero-anim-4" style={{ display: "flex", gap: "var(--idea-space-3)", flexWrap: "wrap", alignItems: "center" }}>
                    <button
                      onClick={() => nav(slide.cta.to)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "14px 28px",
                        background: "var(--idea-gold)",
                        color: "white",
                        border: "none",
                        borderRadius: "var(--idea-radius-sm)",
                        cursor: "pointer",
                        fontFamily: "var(--idea-font-display)",
                        fontSize: "var(--idea-text-base)",
                        letterSpacing: "0.08em",
                        fontWeight: 500,
                        transition: "background 0.2s, transform 0.18s",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--idea-gold-deep)"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "var(--idea-gold)"; }}
                    >
                      {slide.cta.label[locale]}
                      <ArrowRight size={17} />
                    </button>
                    {slide.ctaSecondary && (
                      <button
                        onClick={() => nav(slide.ctaSecondary!.to)}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 8,
                          padding: "13px 24px",
                          background: "transparent",
                          color: "rgba(255,255,255,0.88)",
                          border: "1px solid rgba(255,255,255,0.35)",
                          borderRadius: "var(--idea-radius-sm)",
                          cursor: "pointer",
                          fontFamily: "var(--idea-font-display)",
                          fontSize: "var(--idea-text-base)",
                          letterSpacing: "0.08em",
                          transition: "border-color 0.2s, color 0.2s",
                        }}
                        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "var(--idea-gold)"; el.style.color = "var(--idea-gold-bright)"; }}
                        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.35)"; el.style.color = "rgba(255,255,255,0.88)"; }}
                      >
                        {slide.ctaSecondary.label[locale]}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </Container>
          </div>
        );
      })}

      {/* Prev / Next arrows */}
      <button
        aria-label="Previous slide"
        onClick={prev}
        style={arrowStyle("start")}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
      >
        <ChevronLeft size={22} />
      </button>
      <button
        aria-label="Next slide"
        onClick={next}
        style={arrowStyle("end")}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.2)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
      >
        <ChevronRight size={22} />
      </button>

      {/* ── Thumbnail strip ─────────────────────────────────────────────── */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        background: "linear-gradient(0deg, rgba(6,4,2,0.97) 0%, rgba(6,4,2,0.82) 70%, transparent 100%)",
        padding: "40px 0 0",
      }}>
        <div style={{
          display: "flex",
          gap: 3,
          paddingInline: "clamp(16px, 4vw, 48px)",
          paddingBottom: 0,
          overflowX: "auto",
          scrollbarWidth: "none",
        }} className="idea-thumb-strip">
          {SLIDES.map((slide, si) => {
            const isActive = si === index;
            return (
              <button
                key={slide.id}
                onClick={() => go(si)}
                aria-label={`Go to slide: ${slide.thumbLabel[locale]}`}
                aria-current={isActive}
                style={{
                  flex: "1 1 0",
                  minWidth: 120,
                  maxWidth: 240,
                  position: "relative",
                  overflow: "hidden",
                  borderRadius: "var(--idea-radius-sm) var(--idea-radius-sm) 0 0",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  background: "transparent",
                  outline: "none",
                  transition: "flex 0.4s ease",
                }}
                className={isActive ? "idea-thumb-active" : "idea-thumb"}
              >
                {/* Thumbnail image */}
                <div style={{ position: "relative", height: 88, overflow: "hidden" }}>
                  <img
                    src={slide.image}
                    alt=""
                    aria-hidden
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      objectPosition: slide.imgPosition || "center center",
                      filter: isActive ? "none" : "brightness(0.45) saturate(0.6)",
                      transition: "filter 0.4s ease",
                      display: "block",
                    }}
                  />
                  {/* Dark overlay */}
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    background: isActive
                      ? "linear-gradient(0deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.12) 60%, transparent 100%)"
                      : "rgba(0,0,0,0.45)",
                    transition: "background 0.4s ease",
                  }} />
                  {/* Gold top border for active */}
                  {isActive && (
                    <div style={{
                      position: "absolute",
                      top: 0, left: 0, right: 0,
                      height: 3,
                      background: "var(--idea-gold)",
                    }} />
                  )}
                  {/* Label */}
                  <div style={{
                    position: "absolute",
                    bottom: 8,
                    left: 10,
                    fontFamily: "var(--idea-font-display)",
                    fontSize: "var(--idea-text-xs)",
                    letterSpacing: "0.1em",
                    color: isActive ? "white" : "rgba(255,255,255,0.5)",
                    textTransform: "uppercase",
                    fontWeight: 500,
                    transition: "color 0.4s ease",
                    lineHeight: 1,
                  }}>
                    {slide.thumbLabel[locale]}
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: 3, background: "rgba(255,255,255,0.08)" }}>
                  {isActive && !paused && (
                    <div
                      key={`${si}-${animKey}`}
                      style={{
                        height: "100%",
                        background: "var(--idea-gold)",
                        animation: `idea-progress ${INTERVAL}ms linear forwards`,
                      }}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Slide counter */}
      <div style={{
        position: "absolute",
        top: "var(--idea-space-5)",
        insetInlineEnd: "var(--idea-space-5)",
        fontFamily: "var(--idea-font-display)",
        fontSize: "var(--idea-text-sm)",
        color: "rgba(255,255,255,0.45)",
        letterSpacing: "0.12em",
        userSelect: "none",
      }}>
        <span style={{ color: "var(--idea-gold-bright)", fontSize: "var(--idea-text-lg)" }}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {" / "}
        {String(SLIDES.length).padStart(2, "0")}
      </div>

      <style>{`
        .idea-thumb-strip::-webkit-scrollbar { display: none; }

        /* Ken Burns animations — 4 variants, alternating pan direction */
        @keyframes kb-0 {
          from { transform: scale(1.0) translate(0, 0); }
          to   { transform: scale(1.09) translate(-1.5%, 1%); }
        }
        @keyframes kb-1 {
          from { transform: scale(1.04) translate(1.5%, 0); }
          to   { transform: scale(1.1) translate(-0.5%, 1.5%); }
        }
        @keyframes kb-2 {
          from { transform: scale(1.03) translate(-1%, 1%); }
          to   { transform: scale(1.1) translate(1%, -0.5%); }
        }
        @keyframes kb-3 {
          from { transform: scale(1.05) translate(0.5%, -1%); }
          to   { transform: scale(1.09) translate(-1%, 0.5%); }
        }
        .idea-kb-active-0 { animation: kb-0 ${INTERVAL + 400}ms ease-in-out forwards; }
        .idea-kb-active-1 { animation: kb-1 ${INTERVAL + 400}ms ease-in-out forwards; }
        .idea-kb-active-2 { animation: kb-2 ${INTERVAL + 400}ms ease-in-out forwards; }
        .idea-kb-active-3 { animation: kb-3 ${INTERVAL + 400}ms ease-in-out forwards; }

        /* Slide content reveal */
        @keyframes hero-fade-up {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .idea-hero-anim-1 { animation: hero-fade-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.08s both; }
        .idea-hero-anim-2 { animation: hero-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
        .idea-hero-anim-3 { animation: hero-fade-up 0.72s cubic-bezier(0.22,1,0.36,1) 0.38s both; }
        .idea-hero-anim-4 { animation: hero-fade-up 0.65s cubic-bezier(0.22,1,0.36,1) 0.52s both; }

        /* Thumbnail strip progress */
        @keyframes idea-progress {
          from { width: 0%; }
          to   { width: 100%; }
        }

        /* Thumbnail hover */
        .idea-thumb:hover img { filter: brightness(0.65) saturate(0.8) !important; }
        .idea-thumb-active { flex: 1.4 1 0 !important; }
      `}</style>
    </section>
  );
}

function arrowStyle(side: "start" | "end"): React.CSSProperties {
  return {
    position: "absolute",
    top: "calc(50% - 60px)",
    transform: "translateY(-50%)",
    insetInlineStart: side === "start" ? "var(--idea-space-5)" : undefined,
    insetInlineEnd: side === "end" ? "var(--idea-space-5)" : undefined,
    width: 48,
    height: 48,
    borderRadius: "var(--idea-radius-full)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,0.1)",
    border: "1px solid rgba(255,255,255,0.18)",
    color: "white",
    backdropFilter: "blur(8px)",
    transition: "background 0.2s",
    zIndex: 10,
  };
}
