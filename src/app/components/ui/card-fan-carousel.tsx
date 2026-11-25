import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { motion, useInView, useReducedMotion } from "motion/react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export interface DestinationCard {
  id: string;
  imgUrl: string;
  label: string;
  linkUrl: string;
  ariaLabel?: string;
}

const POSITIONS = [
  { rot: -21, scale: .7756, x: -30, y: 7.3, z: 1 },
  { rot: -14, scale: .8498, x: -22, y: 4, z: 2 },
  { rot: -7, scale: .9346, x: -11, y: 1.3, z: 3 },
  { rot: 0, scale: 1, x: 0, y: 0, z: 10 },
  { rot: 7, scale: .9346, x: 11, y: 1.3, z: 3 },
  { rot: 14, scale: .8498, x: 22, y: 4, z: 2 },
  { rot: 21, scale: .7756, x: 30, y: 7.3, z: 1 },
];
const wrap = (n: number, size: number) => ((n % size) + size) % size;

export function DestinationFan({ cards, locale }: { cards: DestinationCard[]; locale: "en" | "ar" | "fr" }) {
  const stage = useRef<HTMLDivElement>(null);
  const visible = useInView(stage, { once: true, amount: .2 });
  const reduced = useReducedMotion();
  const [width, setWidth] = useState(1000);
  const [center, setCenter] = useState(Math.min(3, Math.floor(cards.length / 2)));
  const [active, setActive] = useState<number | null>(null);
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const measure = () => setWidth(el.clientWidth);
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  if (!cards.length) return null;
  const count = Math.min(7, cards.length);
  const half = Math.floor(count / 2);
  const cardWidth = Math.min(290, Math.max(100, width * (width < 550 ? .44 : .28)));
  const spread = Math.min(1, Math.max(.1, (width / 2 - cardWidth * .53 - 12) / 608));
  const rise = Math.min(1, width / 850);
  const stageHeight = cardWidth * 1.34 + 116 * rise + 64;
  const step = (delta: number) => { setActive(null); setCenter(c => wrap(c + delta, cards.length)); };
  const labels = { en: ["Previous destination", "Next destination"], ar: ["المساحة السابقة", "المساحة التالية"], fr: ["Espace précédent", "Espace suivant"] }[locale];
  return (
    <div className="w-full min-w-0" dir="ltr">
      <div ref={stage} className="relative w-full" style={{ height: stageHeight, overflow: "clip", isolation: "isolate" }} onPointerLeave={() => setActive(null)}>
        {Array.from({ length: count }, (_, slot) => {
          const i = wrap(center + slot - half, cards.length);
          const card = cards[i];
          const p = POSITIONS[slot + 3 - half];
          const distance = active === null ? 0 : Math.abs(slot - active);
          const selected = active === slot;
          const push = active !== null && !selected ? Math.sign(slot - active) * 8 * (1 - Math.abs(slot - half) / Math.max(half, 1)) * (1 + .2 * Math.max(0, 3 - distance)) : 0;
          const x = (p.x + push) * 16 * spread;
          const y = (p.y - (selected ? 2.5 : 0)) * 16 * rise;
          const rotate = p.rot + (active !== null && !selected ? Math.sign(slot - active) * 3 / (distance + 1) : 0);
          return (
            <motion.div key={card.id} initial={reduced ? false : { x: 0, y: 100 * rise, scale: .5, opacity: 0 }}
              animate={visible || reduced ? { x, y, rotate, scale: p.scale * (selected ? 1.08 : 1), opacity: 1 } : { opacity: 0 }}
              transition={reduced ? { duration: 0 } : { type: "spring", stiffness: 135, damping: 17, mass: .8 }}
              style={{ position: "absolute", width: cardWidth, left: (width - cardWidth) / 2, top: 44, zIndex: selected ? 20 : p.z, transformOrigin: "center center" }}
              onPointerEnter={e => { if (e.pointerType === "mouse") setActive(slot); }}>
              <Link to={card.linkUrl} aria-label={card.ariaLabel ?? card.label} onFocus={() => setActive(slot)} onBlur={() => setActive(null)}
                className="block overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{ aspectRatio: "3 / 4", position: "relative", border: "1px solid var(--idea-border)", boxShadow: "0 12px 28px rgba(0,0,0,.32)", background: "var(--idea-surface)", color: "#fff" }}>
                <img src={card.imgUrl} alt="" loading="lazy" width={600} height={450} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                <span dir={locale === "ar" ? "rtl" : "ltr"} style={{ position: "absolute", insetInline: 0, bottom: 0, padding: "26px 10px 12px", background: "linear-gradient(transparent, rgba(0,0,0,.87))", color: "#fff", textAlign: "center", fontSize: "clamp(12px, 1.4vw, 18px)", lineHeight: 1.3, fontWeight: 600 }}>{card.label}</span>
              </Link>
            </motion.div>
          );
        })}
      </div>
      {cards.length > 1 && <div className="flex items-center justify-center gap-4 mt-2">
        <button type="button" aria-label={labels[0]} onClick={() => step(-1)} className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2" style={{ border: "1px solid var(--idea-border)", color: "var(--idea-text)", background: "var(--idea-surface)" }}><ChevronLeft size={21}/></button>
        <div className="flex items-center gap-2">
          {cards.map((card, i) => <button key={card.id} type="button" aria-label={card.label} aria-current={i === center ? "true" : undefined} onClick={() => { setActive(null); setCenter(i); }} className="flex h-7 w-5 items-center justify-center focus-visible:outline focus-visible:outline-2"><span className="block rounded-full" style={{ width: i === center ? 10 : 6, height: i === center ? 10 : 6, background: i === center ? "var(--idea-gold, #ff6800)" : "var(--idea-text-muted)", opacity: i === center ? 1 : .6 }}/></button>)}
        </div>
        <button type="button" aria-label={labels[1]} onClick={() => step(1)} className="flex h-11 w-11 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2" style={{ border: "1px solid var(--idea-border)", color: "var(--idea-text)", background: "var(--idea-surface)" }}><ChevronRight size={21}/></button>
      </div>}
    </div>
  );
}
