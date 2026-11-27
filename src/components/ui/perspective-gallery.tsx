"use client";

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type GalleryItem = {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  href: string;
  ctaText: string;
};

type PerspectiveGalleryProps = {
  title: string;
  description?: string;
  items: GalleryItem[];
  className?: string;
  dir?: "ltr" | "rtl";
  previousLabel?: string;
  nextLabel?: string;
};

export function PerspectiveGallery({
  title,
  description,
  items,
  className,
  dir = "ltr",
  previousLabel = "Previous",
  nextLabel = "Next",
}: PerspectiveGalleryProps) {
  const [selection, setSelection] = useState(Math.floor(items.length / 2));
  const [stageWidth, setStageWidth] = useState(0);
  const stage = useRef<HTMLDivElement>(null);
  const last = Math.max(0, items.length - 1);
  const active = Math.min(Math.max(selection, 0), last);
  const current = items[active];
  const direction = dir === "rtl" ? -1 : 1;
  const clamp = (n: number) => Math.max(0, Math.min(last, n));

  useEffect(() => {
    const element = stage.current;
    if (!element) return;
    const measure = () => setStageWidth(element.clientWidth);
    measure();
    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", measure);
      return () => window.removeEventListener("resize", measure);
    }
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [items.length]);

  if (!current) return null;

  const w = Math.min(280, (stageWidth || 800) * 0.46);
  const PreviousIcon = dir === "rtl" ? ChevronRight : ChevronLeft;
  const NextIcon = dir === "rtl" ? ChevronLeft : ChevronRight;

  return (
    <section
      dir={dir}
      aria-roledescription="carousel"
      aria-label={title}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        e.preventDefault();
        setSelection(clamp(active + (e.key === "ArrowRight" ? direction : -direction)));
      }}
      className={cn(
        "relative flex w-full flex-col items-center justify-center overflow-hidden rounded-2xl border border-border bg-background px-3 py-12 text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset sm:px-6 sm:py-16",
        className,
      )}
    >
      <h2 className="max-w-2xl text-balance text-center text-3xl font-semibold leading-tight tracking-tight sm:text-5xl text-[#fd6401]">{title}</h2>
      {description && <p className="mt-4 text-center text-sm text-muted-foreground">{description}</p>}
      <div
        ref={stage}
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse" || items.length < 2) return;
          const r = e.currentTarget.getBoundingClientRect();
          if (!r.width) return;
          const ratio = (e.clientX - r.left) / r.width;
          setSelection(clamp(Math.round((dir === "rtl" ? 1 - ratio : ratio) * last)));
        }}
        className="relative mt-10 h-[clamp(235px,40vw,320px)] w-full max-w-5xl [perspective:1400px] [transform-style:preserve-3d]"
      >
        {items.map((it, i) => {
          const d = (i - active) * direction;
          const a = Math.min(Math.abs(d), 3);
          return (
            <div
              key={it.id}
              className="absolute left-1/2 top-0 h-full w-[min(280px,58%)] transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none [transform-style:preserve-3d]"
              style={{
                transform: "translateX(-50%) translate3d(" + (d * w * 0.74) + "px,0," + (-a * 110) + "px) rotateY(" + (Math.max(-1, Math.min(1, -d)) * Math.min(a, 1.4) * 38) + "deg) scale(" + (1 - a * 0.04) + ")",
                opacity: 1 - Math.min(a / 3.4, 0.85),
                zIndex: 100 - Math.round(a * 10),
              }}
            >
              <button
                type="button"
                aria-label={it.title}
                aria-current={i === active}
                onClick={() => setSelection(i)}
                className="group relative block size-full overflow-hidden rounded-3xl border border-white/20 bg-card text-start shadow-2xl shadow-black/25 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
              >
                <img src={it.image} alt="" loading="lazy" decoding="async" draggable={false} className="absolute inset-0 size-full object-cover" />
                <span aria-hidden="true" className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/15 to-transparent" />
                <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/65 to-transparent px-4 pb-5 pt-16 text-white sm:px-5">
                  <span className="block text-base font-semibold leading-snug tracking-tight sm:text-lg">{it.title}</span>
                  <span className="mt-2 block text-xs text-white/85">{it.ctaText}</span>
                </span>
              </button>
            </div>
          );
        })}
      </div>

      <div className="mt-9 flex items-center gap-4">
        <button type="button" aria-label={previousLabel} onClick={() => setSelection(clamp(active - 1))} disabled={active === 0} className="grid size-11 place-items-center rounded-full border border-border bg-background outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30">
          <PreviousIcon size={18} aria-hidden="true" />
        </button>
        <p className="w-16 text-center text-sm tabular-nums text-muted-foreground" aria-live="polite" dir="ltr">{active + 1} / {items.length}</p>
        <button type="button" aria-label={nextLabel} onClick={() => setSelection(clamp(active + 1))} disabled={active === last} className="grid size-11 place-items-center rounded-full border border-border bg-background outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-30">
          <NextIcon size={18} aria-hidden="true" />
        </button>
      </div>
      <div className="mt-5 flex min-h-32 w-full max-w-xl flex-col items-center justify-start gap-3 text-center">
        <h3 className="text-lg font-semibold text-foreground">{current.title}</h3>
        <p className="text-sm leading-relaxed text-muted-foreground">{current.subtitle}</p>
        <Link to={current.href} className="idea-home-text-link">
          {current.ctaText} <ArrowRight size={16} aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
