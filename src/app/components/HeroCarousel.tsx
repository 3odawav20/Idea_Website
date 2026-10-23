import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import "./HeroCarousel.css";
import { useCollectionDestinations } from "./useCollectionDestinations";

const SLIDES = [
  { id: "porcelain", href: "/collections/porcelain", title: { en: "Beautiful surfaces. Extraordinary spaces.", ar: "أسطح جميلة. مساحات استثنائية.", fr: "De belles surfaces. Des espaces exceptionnels." }, cta: { en: "Discover porcelain", ar: "اكتشف البورسلين", fr: "Découvrir la porcelaine" } },
  { id: "ceramics", href: "/collections/ceramics", title: { en: "A little colour. A whole new feeling.", ar: "لمسة لون. إحساس جديد بالكامل.", fr: "Un peu de couleur. Une nouvelle émotion." }, cta: { en: "Discover ceramics", ar: "اكتشف السيراميك", fr: "Découvrir la céramique" } },
];
export function HeroCarousel() {
  const uiText = useLocaleText();

  const { locale } = useI18n();
  const destinations = useCollectionDestinations();
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const touch = useRef<number | null>(null);
  const go = useCallback((step: number) => setIndex((i) => (i + step + SLIDES.length) % SLIDES.length), []);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setPlaying(!query.matches);
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    if (!playing || interacting) return;
    const timer = window.setInterval(() => { if (!document.hidden) go(1); }, 6500);
    return () => window.clearInterval(timer);
  }, [playing, interacting, go]);
  const label = (en: string, ar: string, fr: string) => ({ en, ar, fr })[locale];
  return <section className="idea-editorial-hero" aria-roledescription="carousel" aria-label={uiText(label("IDEA highlights", "مختارات IDEA", "Sélection IDEA"))}
    onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
    onFocusCapture={() => setInteracting(true)} onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}
    onTouchStart={(e) => { setPlaying(false); touch.current = e.touches[0]?.clientX ?? null; }}
    onTouchEnd={(e) => { if (touch.current !== null) { const delta = e.changedTouches[0].clientX - touch.current; if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1); touch.current = null; } }}>
    {uiText(SLIDES.map((slide, i) => <div key={slide.id} className={`idea-editorial-hero-slide${i === index ? " is-active" : ""}`} aria-hidden={i !== index}>
      <img src={`/images/featured/${slide.id}.webp`} alt={uiText("")} width={1600} height={900} loading={i === 0 ? "eager" : "lazy"} fetchPriority={i === 0 ? "high" : "auto"} />
      {uiText(i === index && <div className="idea-editorial-hero-copy"><p>{uiText("IDEA")}</p><h1>{uiText(slide.title[locale])}</h1><Link to={destinations[slide.id as keyof typeof destinations]}>{uiText(slide.cta[locale])}</Link></div>)}
    </div>))}
    <button className="idea-editorial-hero-arrow is-left" aria-label={uiText(label("Previous slide", "الصورة السابقة", "Image précédente"))} onClick={() => { setPlaying(false); go(-1); }}><ChevronLeft /></button>
    <button className="idea-editorial-hero-arrow is-right" aria-label={uiText(label("Next slide", "الصورة التالية", "Image suivante"))} onClick={() => { setPlaying(false); go(1); }}><ChevronRight /></button>
    <div className="idea-editorial-hero-controls">{uiText(SLIDES.map((slide, i) => <button key={slide.id} className={i === index ? "is-active" : ""} aria-label={uiText(slide.cta[locale])} aria-pressed={i === index} onClick={() => { setPlaying(false); setIndex(i); }} />))}
      <button className="idea-editorial-hero-play" aria-label={uiText(playing ? label("Pause slideshow", "إيقاف الحركة", "Arrêter le diaporama") : label("Play slideshow", "تشغيل الحركة", "Lancer le diaporama"))} onClick={() => setPlaying((p) => !p)}>{uiText(playing ? <Pause size={14} /> : <Play size={14} />)}</button>
    </div>
  </section>;
}
