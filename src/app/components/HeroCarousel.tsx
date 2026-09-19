import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Button, Container } from "./ui";
import imgLivingRoom from "../../imports/Modern_luxury_living_room_ambiance.png";
import imgMarbleGold from "../../imports/Luxurious_modern_interiors_with_marble_and_gold.png";
import imgTriptych from "../../imports/Luxurious_modern_interior_triptych_design.png";

interface Slide {
  id: string;
  headline: { en: string; ar: string; fr: string };
  text: { en: string; ar: string; fr: string };
  image: string;
  position?: string;
  buttons: { label: { en: string; ar: string; fr: string }; to: string; variant: "gold" | "outline" }[];
}

const SLIDES: Slide[] = [
  {
    id: "signature-interiors",
    image: imgLivingRoom,
    position: "center center",
    headline: {
      en: "Exceptional Materials. Exceptional Interiors.",
      ar: "خامات استثنائية لمساحات استثنائية",
      fr: "Des matériaux d’exception pour des intérieurs d’exception",
    },
    text: {
      en: "Curated ceramic, porcelain, marble and bathroom collections for refined residential and commercial spaces.",
      ar: "تشكيلة منتقاة من السيراميك والبورسلين والرخام وحلول الحمامات للمساحات السكنية والتجارية الراقية.",
      fr: "Une sélection raffinée de céramique, porcelaine, marbre et solutions de salle de bain.",
    },
    buttons: [
      { label: { en: "Explore Collections", ar: "استكشف المجموعات", fr: "Explorer les collections" }, to: "/collections", variant: "gold" },
      { label: { en: "Browse Products", ar: "تصفح المنتجات", fr: "Voir les produits" }, to: "/products", variant: "outline" },
    ],
  },
  {
    id: "marble-architecture",
    image: imgMarbleGold,
    position: "center 45%",
    headline: {
      en: "Luxury Is In The Detail",
      ar: "الفخامة تبدأ من التفاصيل",
      fr: "Le luxe se révèle dans les détails",
    },
    text: {
      en: "Discover statement surfaces, refined finishes and architectural bathroom pieces selected for premium projects.",
      ar: "اكتشف الأسطح المميزة والتشطيبات الراقية وقطع الحمامات المعمارية المختارة للمشروعات المتميزة.",
      fr: "Découvrez des surfaces signature, des finitions raffinées et des pièces de salle de bain architecturales.",
    },
    buttons: [
      { label: { en: "Explore Porcelain", ar: "استكشف البورسلين", fr: "Explorer la porcelaine" }, to: "/collections/porcelain", variant: "gold" },
      { label: { en: "Marble & Stone", ar: "الرخام والحجر", fr: "Marbre & pierre" }, to: "/collections/marble", variant: "outline" },
    ],
  },
  {
    id: "complete-project",
    image: imgTriptych,
    position: "center center",
    headline: {
      en: "One Destination For The Complete Project",
      ar: "وجهة واحدة لكل تفاصيل مشروعك",
      fr: "Une destination pour l’ensemble du projet",
    },
    text: {
      en: "From surfaces and sanitary ware to faucets, bathtubs, showers, lighting and furniture — composed as one premium marketplace.",
      ar: "من الأسطح والأدوات الصحية إلى الخلاطات والبانيوهات والدش والإضاءة والأثاث — في متجر واحد متكامل وراقي.",
      fr: "Des surfaces et sanitaires aux robinets, baignoires, douches, luminaires et meubles — dans une marketplace premium.",
    },
    buttons: [
      { label: { en: "Shop The Marketplace", ar: "تصفح المتجر", fr: "Explorer la marketplace" }, to: "/products", variant: "gold" },
      { label: { en: "Visualize Your Room", ar: "صمّم مساحتك", fr: "Visualiser votre pièce" }, to: "/room-designer/new", variant: "outline" },
    ],
  },
];

const INTERVAL = 7200;

export function HeroCarousel() {
  const { locale } = useI18n();
  const nav = useNavigate();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [failedSlides, setFailedSlides] = useState<number[]>([]);
  const touchX = useRef<number | null>(null);

  const next = useCallback(() => setIndex((current) => (current + 1) % SLIDES.length), []);
  const prev = useCallback(() => setIndex((current) => (current - 1 + SLIDES.length) % SLIDES.length), []);
  const go = useCallback((nextIndex: number) => setIndex((nextIndex + SLIDES.length) % SLIDES.length), []);

  useEffect(() => {
    SLIDES.forEach((slide) => {
      const image = new Image();
      image.decoding = "async";
      image.src = slide.image;
    });
  }, []);

  useEffect(() => {
    if (paused) return;
    const timer = window.setInterval(next, INTERVAL);
    return () => window.clearInterval(timer);
  }, [next, paused]);

  const fallbackImages = [imgLivingRoom, imgMarbleGold, imgTriptych];

  return (
    <section
      className="idea-hero-carousel"
      aria-roledescription="carousel"
      aria-label="IDEA highlights"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") next();
        if (event.key === "ArrowLeft") prev();
      }}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setPaused(false);
      }}
      onTouchStart={(event) => {
        touchX.current = event.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (touchX.current === null) return;
        const distance = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
        if (Math.abs(distance) > 50) (distance < 0 ? next : prev)();
        touchX.current = null;
      }}
      style={{
        position: "relative",
        height: "min(90svh, 840px)",
        overflow: "hidden",
        outline: "none",
        background: "#0b0b0b",
        isolation: "isolate",
      }}
    >
      {SLIDES.map((slide, slideIndex) => {
        const active = slideIndex === index;
        return (
          <div
            key={slide.id}
            aria-hidden={!active}
            aria-roledescription="slide"
            role="group"
            className={active ? "idea-hero-slide idea-hero-slide--active" : "idea-hero-slide"}
            style={{
              position: "absolute",
              inset: 0,
              opacity: active ? 1 : 0,
              pointerEvents: active ? "auto" : "none",
              zIndex: active ? 2 : 1,
            }}
          >
            <img
              className={active ? "idea-vivid-image idea-hero-image idea-hero-image--active" : "idea-vivid-image idea-hero-image"}
              src={failedSlides.includes(slideIndex) ? fallbackImages[(slideIndex + 1) % fallbackImages.length] : slide.image}
              alt=""
              aria-hidden="true"
              loading={slideIndex === 0 ? "eager" : "lazy"}
              fetchPriority={slideIndex === 0 ? "high" : "auto"}
              onError={() =>
                setFailedSlides((current) =>
                  current.includes(slideIndex) ? current : [...current, slideIndex]
                )
              }
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                objectPosition: slide.position || "center",
              }}
            />
            <div className="idea-hero-depth" aria-hidden="true" />
            <div className="idea-hero-film" aria-hidden="true" />
            <div className="idea-hero-overlay" aria-hidden="true" />

            <Container
              className="idea-hero-content"
              style={{
                position: "absolute",
                inset: 0,
                zIndex: 4,
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                paddingBlockStart: "var(--idea-space-8)",
                paddingBlockEnd: "var(--idea-space-8)",
              }}
            >
              <div className={active ? "idea-hero-copy idea-hero-copy--active" : "idea-hero-copy"} style={{ maxWidth: 700 }}>
                <div className="idea-eyebrow idea-hero-reveal idea-hero-reveal--one" style={{ marginBottom: "var(--idea-space-4)", color: "#ff8a32" }}>
                  IDEA · BUSINESS ADMINISTRATION
                </div>
                <h1
                  className="idea-hero-title idea-hero-reveal idea-hero-reveal--two"
                  style={{
                    fontSize: "clamp(42px, 5vw, 76px)",
                    margin: 0,
                    color: "#fff",
                    textShadow: "0 8px 28px rgba(0,0,0,.38)",
                    maxWidth: 760,
                  }}
                >
                  {slide.headline[locale]}
                </h1>
                <p
                  className="idea-hero-reveal idea-hero-reveal--three"
                  style={{
                    color: "rgba(255,255,255,.88)",
                    fontSize: "clamp(17px,1.4vw,21px)",
                    lineHeight: 1.62,
                    margin: "var(--idea-space-5) 0 var(--idea-space-6)",
                    maxWidth: 620,
                    textShadow: "0 4px 18px rgba(0,0,0,.34)",
                  }}
                >
                  {slide.text[locale]}
                </p>
                <div className="idea-hero-reveal idea-hero-reveal--four idea-hero-actions" style={{ display: "flex", gap: "var(--idea-space-4)", flexWrap: "wrap" }}>
                  {slide.buttons.map((button) => (
                    <Button key={button.to} variant={button.variant} size="lg" onClick={() => nav(button.to)}>
                      {button.label[locale]}
                    </Button>
                  ))}
                </div>
              </div>
            </Container>
          </div>
        );
      })}

      <button className="idea-hero-arrow" aria-label="Previous slide" onClick={prev} style={arrowStyle("start")}>
        <ChevronLeft size={22} />
      </button>
      <button className="idea-hero-arrow" aria-label="Next slide" onClick={next} style={arrowStyle("end")}>
        <ChevronRight size={22} />
      </button>

      <div className="idea-hero-pagination" style={{ position: "absolute", zIndex: 8, bottom: "var(--idea-space-7)", insetInline: 0, display: "flex", justifyContent: "center", gap: 10 }}>
        {SLIDES.map((item, itemIndex) => (
          <button
            key={item.id}
            aria-label={`Go to slide ${itemIndex + 1}`}
            aria-current={itemIndex === index}
            onClick={() => go(itemIndex)}
            className={itemIndex === index ? "idea-hero-dot idea-hero-dot--active" : "idea-hero-dot"}
          >
            <span />
          </button>
        ))}
      </div>
    </section>
  );
}

function arrowStyle(side: "start" | "end"): React.CSSProperties {
  return {
    position: "absolute",
    zIndex: 8,
    top: "50%",
    transform: "translateY(-50%)",
    insetInlineStart: side === "start" ? "var(--idea-space-5)" : undefined,
    insetInlineEnd: side === "end" ? "var(--idea-space-5)" : undefined,
    width: 52,
    height: 52,
    borderRadius: "var(--idea-radius-full)",
    display: "grid",
    placeItems: "center",
    cursor: "pointer",
    background: "rgba(255,255,255,.12)",
    border: "1px solid rgba(255,255,255,.26)",
    color: "#fff",
    backdropFilter: "blur(12px)",
    boxShadow: "0 12px 36px rgba(0,0,0,.18)",
  };
}
