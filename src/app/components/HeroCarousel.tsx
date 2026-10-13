import { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import { Button, Container } from "./ui";
import imgLivingRoom from "../../imports/idea-hero-luxe-living-4k.webp";
import imgLivingRoom2k from "../../imports/idea-hero-luxe-living-2k.webp";
import imgSpaBath from "../../imports/idea-hero-spa-bath-4k.webp";
import imgSpaBath2k from "../../imports/idea-hero-spa-bath-2k.webp";

interface Slide {
  id: string;
  headline: { en: string; ar: string; fr: string };
  text: { en: string; ar: string; fr: string };
  image: string;
  mobileImage: string;
  position?: string;
  motion: "left" | "right";
  buttons: { label: { en: string; ar: string; fr: string }; to: string; variant: "gold" | "outline" }[];
}

const SLIDES: Slide[] = [
  {
    id:"signature-porcelain-bath",
    image:imgSpaBath,mobileImage:imgSpaBath2k,
    position:"center 47%",motion:"left",
    headline:{en:"The Art of Exceptional Surfaces",ar:"فنّ الأسطح الاستثنائية",fr:"L’art des matières exceptionnelles"},
    text:{en:"Architectural porcelain and ceramic collections, selected for extraordinary spaces.",ar:"مجموعات بورسلين وسيراميك راقية تمنح المساحات هوية استثنائية.",fr:"Des porcelaines et céramiques raffinées pour des espaces singuliers."},
    buttons:[
      {label:{en:"Discover Porcelain",ar:"اكتشف البورسلين",fr:"Explorer la porcelaine"},to:"/collections/porcelain",variant:"gold"},
      {label:{en:"Shop Ceramics",ar:"تصفح السيراميك",fr:"Voir les céramiques"},to:"/collections/ceramics",variant:"outline"},
    ]
  },
  {
    id:"ceramic-bathroom-architecture",
    image:"https://images.unsplash.com/photo-1663811397133-2d1f5addd9d5?w=3200&q=87&fit=crop",
    mobileImage:"https://images.unsplash.com/photo-1663811397133-2d1f5addd9d5?w=1600&q=82&fit=crop",
    position:"center 49%",motion:"right",
    headline:{en:"Bathrooms Beyond Ordinary",ar:"حمّامات تتجاوز المعتاد",fr:"Des salles de bain d’exception"},
    text:{en:"Rich ceramic textures and timeless bathroom compositions. A refined vision in every detail.",ar:"ملمس سيراميك غني وتكوينات حمّامات خالدة بتفاصيل محسوبة بعناية.",fr:"Des textures céramiques riches et des compositions intemporelles."},
    buttons:[
      {label:{en:"Ceramic Collection",ar:"مجموعة السيراميك",fr:"Collection céramique"},to:"/collections/ceramics",variant:"gold"},
      {label:{en:"Explore Basins",ar:"استكشف الأحواض",fr:"Explorer les vasques"},to:"/collections/basins",variant:"outline"}
    ]
  },
  {
    id:"natural-marble-interiors",
    image:"https://images.unsplash.com/photo-1744025098626-66c0b9cb1ba8?w=3200&q=87&fit=crop",
    mobileImage:"https://images.unsplash.com/photo-1744025098626-66c0b9cb1ba8?w=1600&q=82&fit=crop",
    position:"center 50%",motion:"left",
    headline:{en:"A Statement in Marble",ar:"فخامة الرخام الطبيعي",fr:"L’élégance du marbre"},
    text:{en:"An elegant material library for signature bathrooms and architectural spaces.",ar:"تشكيلات رخام أنيقة للحمّامات والمساحات المعمارية المميزة.",fr:"Des matériaux raffinés pour les intérieurs les plus remarquables."},
    buttons:[
      {label:{en:"Explore Marble",ar:"تصفح الرخام",fr:"Voir le marbre"},to:"/collections/marble",variant:"gold"},
      {label:{en:"Browse Tiles",ar:"تصفح البلاط",fr:"Voir les carreaux"},to:"/collections/tiles",variant:"outline"}
    ]
  },
  {
    id:"designer-bath-collection",
    image:"https://images.unsplash.com/photo-1663811396038-7a21d4eef49e?w=3200&q=87&fit=crop",
    mobileImage:"https://images.unsplash.com/photo-1663811396038-7a21d4eef49e?w=1600&q=82&fit=crop",
    position:"center 50%",motion:"right",
    headline:{en:"Design Begins With Detail",ar:"التصميم يبدأ من التفاصيل",fr:"Tout commence dans le détail"},
    text:{en:"Discover statement washbasins, sculptural bathtubs and coordinated premium surfaces.",ar:"أحواض فاخرة وبانيوهات بتصميمات مميزة وخامات متناسقة.",fr:"Vasques, baignoires et surfaces aux finitions soignées."},
    buttons:[
      {label:{en:"Explore Bathtubs",ar:"اكتشف البانيوهات",fr:"Découvrir les baignoires"},to:"/collections/bathtubs",variant:"gold"},
      {label:{en:"Browse Market",ar:"ادخل الماركت",fr:"Explorer le marché"},to:"/products",variant:"outline"}
    ]
  }
];

const INTERVAL = 9500;

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

  const fallbackImages = [imgLivingRoom, imgSpaBath];

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
              className={active
                ? `idea-vivid-image idea-hero-image idea-hero-image--active idea-hero-image--${slide.motion}`
                : `idea-vivid-image idea-hero-image idea-hero-image--${slide.motion}`}
              src={failedSlides.includes(slideIndex) ? fallbackImages[(slideIndex + 1) % fallbackImages.length] : slide.image}
              srcSet={failedSlides.includes(slideIndex) ? undefined : `${slide.mobileImage} 1920w, ${slide.image} 3840w`}
              sizes="100vw"
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
            <div className="idea-hero-grain" aria-hidden="true" />
            <div className="idea-hero-letterbox" aria-hidden="true" />
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
                  IDEA / SIGNATURE SURFACES
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
