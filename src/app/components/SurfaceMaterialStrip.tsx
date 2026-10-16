import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";
import { useI18n } from "../i18n/i18n";
import "./FeaturedCollectionStrip.css";
import materials from "../data/surfaceMaterials.json";
import "./SurfaceMaterialStrip.css";

const COPY = {
  en: { title: "Find Your Surface Style", sub: "Explore real tile images from our catalogue. Drag left or right.", previous: "Previous collection", next: "Next collection", pause: "Pause slideshow", play: "Play slideshow" },
  ar: { title: "اختار خامتك ولونك", sub: "صور بلاطات فعلية من الكتالوج. اسحب بالماوس يمين وشمال.", previous: "المجموعة السابقة", next: "المجموعة التالية", pause: "إيقاف الحركة", play: "تشغيل الحركة" },
  fr: { title: "Trouvez votre style de surface", sub: "Explorez les carreaux du catalogue. Faites glisser à gauche ou à droite.", previous: "Collection précédente", next: "Collection suivante", pause: "Arrêter le diaporama", play: "Lancer le diaporama" },
};

export function SurfaceMaterialStrip() {
  const { locale } = useI18n();
  const copy = COPY[locale];

  const rail = useRef<HTMLDivElement>(null);
  const direction = useRef(1);
  const drag = useRef<{ x: number; scroll: number; moved: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [interacting, setInteracting] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });
  const reduced = useRef(false);
  useEffect(() => {
    const query = matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => { reduced.current = query.matches; setPlaying(!query.matches); };
    update(); query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);
  useEffect(() => {
    const el = rail.current;
    if (!el) return;
    const update = () => setEdges({ start: el.scrollLeft < 2, end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 2 });
    update(); el.addEventListener("scroll", update, { passive: true });
    const observer = new ResizeObserver(update); observer.observe(el);
    return () => { el.removeEventListener("scroll", update); observer.disconnect(); };
  }, []);
  const move = (step: number) => {
    const el = rail.current;
    if (!el) return;
    el.scrollBy({ left: step * (el.clientWidth + Number.parseFloat(getComputedStyle(el).columnGap || "0")), behavior: reduced.current ? "instant" : "smooth" });
  };
  useEffect(() => {
    if (!playing || interacting) return;
    const timer = window.setInterval(() => {
      if (document.hidden || reduced.current) return;
      const el = rail.current;
      if (!el || el.scrollWidth <= el.clientWidth) return;
      if (el.scrollLeft + el.clientWidth >= el.scrollWidth - 2) direction.current = -1;
      if (el.scrollLeft <= 2) direction.current = 1;
      move(direction.current);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [playing, interacting]);
  return (
    <section className="idea-featured idea-materials" aria-label={copy.title} aria-roledescription="carousel"
      onMouseEnter={() => setInteracting(true)} onMouseLeave={() => setInteracting(false)}
      onFocusCapture={() => setInteracting(true)}
      onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) setInteracting(false); }}>
      <header className="idea-featured-heading">
        <h2>{copy.title}</h2><p>{copy.sub}</p>
        <button className="idea-featured-play" onClick={() => setPlaying(!playing)} aria-label={playing ? copy.pause : copy.play}>
          {playing ? <Pause size={16} /> : <Play size={16} />}
        </button>
      </header>
      <div className="idea-featured-stage">
        <div ref={rail} className="idea-featured-rail" dir="ltr" tabIndex={0} aria-label={copy.title}
          onPointerDown={(e) => {
            setPlaying(false); suppressClick.current = false;
            if (e.pointerType !== "mouse" || e.button !== 0) return;
            drag.current = { x: e.clientX, scroll: e.currentTarget.scrollLeft, moved: false };
          }}
          onPointerMove={(e) => {
            const state = drag.current;
            if (!state) return;
            const delta = e.clientX - state.x;
            if (Math.abs(delta) > 6 && !state.moved) {
              state.moved = true; e.currentTarget.setPointerCapture(e.pointerId);
              e.currentTarget.classList.add("is-dragging");
            }
            if (state.moved) { e.preventDefault(); e.currentTarget.scrollLeft = state.scroll - delta; suppressClick.current = true; }
          }}
          onPointerUp={(e) => { drag.current = null; e.currentTarget.classList.remove("is-dragging"); }}
          onPointerCancel={(e) => { drag.current = null; e.currentTarget.classList.remove("is-dragging"); }}
          onPointerLeave={() => { if (drag.current && !drag.current.moved) drag.current = null; }}
          onClickCapture={(e) => { if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; } }}
          onKeyDown={(e) => { if (e.key === "ArrowLeft" || e.key === "ArrowRight") { e.preventDefault(); setPlaying(false); move(e.key === "ArrowLeft" ? -1 : 1); } }}>
          {materials.map((look) => (
            <Link key={look.id} className="idea-featured-card" to={`/product/${look.slug}`} draggable={false} dir={locale === "ar" ? "rtl" : "ltr"}>
              <img src={look.image} alt={look.name} loading="lazy" width={look.width} height={look.height} draggable={false} />
              <span className="idea-featured-label">{look.name}<small>{look.finish === "Glossy" ? ({ en: "Glossy", ar: "لامع", fr: "Brillant" })[locale] : ({ en: "Matte", ar: "مط", fr: "Mat" })[locale]}</small></span>
            </Link>
          ))}
        </div>
        <button className="idea-featured-arrow idea-featured-prev" aria-label={copy.previous} disabled={edges.start} onClick={() => { setPlaying(false); move(-1); }}><ChevronLeft /></button>
        <button className="idea-featured-arrow idea-featured-next" aria-label={copy.next} disabled={edges.end} onClick={() => { setPlaying(false); move(1); }}><ChevronRight /></button>
      </div>
    </section>
  );
}
