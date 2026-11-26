"use client";

/**
 * Cue Foundations · Collapsing Cards Accordion
 * ────────────────────────────────────────────
 * A five-image horizontal accordion where hovering a card expands it with smooth flex transitions while others collapse to vertical wordmarks.
 *
 * Original Cue ID: cue115
 * Category: Gallery & Images
 * ────────────────────────────────────────────
 */

import { useState } from "react";
import { Link } from "react-router";
import { ArrowUpRight } from "lucide-react";

export type CollapsingCardItem = {
  idx: number;
  wordmark: string;
  title: string;
  subtitle?: string;
  img: string;
  href?: string;
};

export interface CollapsingCardsProps {
  cards?: CollapsingCardItem[];
  ctaLabel?: string;
}

const DEFAULT_CARDS: CollapsingCardItem[] = [
  {
    idx: 1,
    wordmark: "Finish",
    title: "Finding your finish — matte & glossy in natural light",
    img: "/images/featured/ceramics.webp",
    href: "/journal/choose-a-finish",
  },
  {
    idx: 2,
    wordmark: "Format",
    title: "A considered approach to size — proportions & layout",
    img: "/images/featured/porcelain.webp",
    href: "/journal/plan-your-format",
  },
  {
    idx: 3,
    wordmark: "Palette",
    title: "Build a balanced palette — surfaces & tonal harmony",
    img: "/images/featured/tiles.webp",
    href: "/journal/build-your-palette",
  },
  {
    idx: 4,
    wordmark: "Marble",
    title: "Marble & light — expressive veining across open spaces",
    img: "/images/featured/marble.webp",
    href: "/glossary",
  },
  {
    idx: 5,
    wordmark: "Stone",
    title: "Tactile stone — architectural calm from indoor to outdoor",
    img: "/images/featured/stone.webp",
    href: "/journal",
  },
];

export function CollapsingCards({ cards = DEFAULT_CARDS, ctaLabel = "View" }: CollapsingCardsProps) {
  const [activeIdx, setActiveIdx] = useState(cards[0]?.idx ?? 1);
  const totalStr = String(cards.length).padStart(2, "0");

  return (
    <>
      <style>{CSS}</style>
      <div className="cc-cards" role="region" aria-label="Design notes and guides">
        {cards.map((c) => {
          const isActive = activeIdx === c.idx;
          const linkTarget = c.href || "/journal";
          return (
            <div
              key={c.idx}
              className={`cc-card ${isActive ? "active" : ""}`}
              onMouseEnter={() => setActiveIdx(c.idx)}
              onClick={() => setActiveIdx(c.idx)}
              onFocus={() => setActiveIdx(c.idx)}
              tabIndex={0}
              role="button"
              aria-expanded={isActive}
              aria-label={c.title}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setActiveIdx(c.idx);
                }
              }}
            >
              <div className="cc-img" style={{ backgroundImage: `url('${c.img}')` }} />
              <div className="cc-v-title" dir="auto">{c.wordmark}</div>
              <div className="cc-content">
                <div className="cc-idx" dir="ltr">
                  {String(c.idx).padStart(2, "0")} / {totalStr}
                </div>
                <div className="cc-meta">
                  <div className="cc-title-wrap">
                    <div className="cc-title" dir="auto">{c.title}</div>
                    {c.subtitle && (
                      <p className="cc-subtitle" dir="auto">
                        {c.subtitle}
                      </p>
                    )}
                  </div>
                  {linkTarget.startsWith("/") ? (
                    <Link
                      to={linkTarget}
                      className="cc-cta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{ctaLabel}</span>
                      <ArrowUpRight size={14} strokeWidth={2.2} />
                    </Link>
                  ) : (
                    <a
                      href={linkTarget}
                      className="cc-cta"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <span>{ctaLabel}</span>
                      <ArrowUpRight size={14} strokeWidth={2.2} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

export default CollapsingCards;

const CSS = `
/* Card row — scoped to the Design notes & guides section */
.cc-cards {
  display: flex;
  gap: 12px;
  width: 100%;
  max-width: 1280px;
  height: clamp(380px, 52vh, 500px);
  margin: 0 auto;
  box-sizing: border-box;
}

.cc-card {
  position: relative;
  flex: 0.7;
  min-width: 78px;
  border-radius: 16px;
  overflow: hidden;
  cursor: pointer;
  transition: flex 0.75s cubic-bezier(0.2, 1, 0.3, 1), border-color 0.3s ease, box-shadow 0.3s ease;
  will-change: flex;
  background: #141416;
  border: 1px solid rgba(255, 255, 255, 0.12);
  box-shadow: 0 18px 40px rgba(0, 0, 0, 0.28);
  outline: none;
}
.cc-card.active {
  flex: 2.8;
  border-color: rgba(253, 100, 1, 0.55);
  box-shadow: 0 22px 48px rgba(0, 0, 0, 0.38), 0 0 24px rgba(253, 100, 1, 0.14);
}
.cc-card:focus-visible {
  outline: 2px solid #fd6401;
  outline-offset: 3px;
}

.cc-img {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  transform: scale(1.04);
  transition: transform 0.9s cubic-bezier(0.2, 1, 0.3, 1),
              filter    0.75s cubic-bezier(0.2, 1, 0.3, 1);
  filter: grayscale(30%) brightness(0.72);
}
.cc-card.active .cc-img {
  transform: scale(1);
  filter: grayscale(0%) brightness(0.92);
}

.cc-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(to top,
    rgba(0,0,0,0.82) 0%,
    rgba(0,0,0,0.36) 38%,
    rgba(0,0,0,0.12) 65%,
    rgba(0,0,0,0.44) 100%);
  pointer-events: none;
}

.cc-content {
  position: relative;
  z-index: 2;
  height: 100%;
  padding: 22px 24px;
  display: flex;
  flex-direction: column;
  color: #fff;
  box-sizing: border-box;
}
.cc-idx {
  font-size: 11px;
  letter-spacing: 0.14em;
  color: #fd6401;
  font-weight: 700;
  font-variant-numeric: tabular-nums;
}
.cc-meta {
  margin-top: auto;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
}
.cc-title-wrap {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
  max-width: 540px;
}
.cc-title {
  font-size: clamp(18px, 1.8vw, 24px);
  font-weight: 600;
  line-height: 1.25;
  letter-spacing: -0.015em;
  color: #ffffff;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease 0.15s,
              transform 0.5s cubic-bezier(0.2, 1, 0.3, 1) 0.15s;
}
.cc-subtitle {
  margin: 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.78);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease 0.18s,
              transform 0.5s cubic-bezier(0.2, 1, 0.3, 1) 0.18s;
}
.cc-card.active .cc-title,
.cc-card.active .cc-subtitle {
  opacity: 1;
  transform: translateY(0);
}

.cc-v-title {
  position: absolute;
  inset-inline-start: 22px;
  bottom: 22px;
  writing-mode: vertical-rl;
  transform: rotate(180deg);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.88);
  transition: opacity 0.3s ease;
  z-index: 2;
  white-space: nowrap;
}
[dir="rtl"] .cc-v-title {
  letter-spacing: 0;
}
.cc-card.active .cc-v-title {
  opacity: 0;
  pointer-events: none;
}

.cc-cta {
  flex-shrink: 0;
  font-size: 11.5px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #ffffff;
  background: rgba(253, 100, 1, 0.88);
  border: 1px solid rgba(255, 184, 134, 0.45);
  padding: 8px 14px;
  border-radius: 999px;
  font-weight: 600;
  text-decoration: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  opacity: 0;
  transform: translateY(6px);
  transition: opacity 0.35s ease 0.2s,
              transform 0.5s cubic-bezier(0.2, 1, 0.3, 1) 0.2s,
              background-color 0.2s ease;
  white-space: nowrap;
}
[dir="rtl"] .cc-cta {
  letter-spacing: 0;
}
.cc-cta:hover {
  background: #fd6401;
}
.cc-card.active .cc-cta {
  opacity: 1;
  transform: translateY(0);
}

@media (max-width: 900px) {
  .cc-title { font-size: 18px; }
  .cc-subtitle { display: none; }
}
@media (max-width: 640px) {
  .cc-cards {
    flex-direction: column;
    gap: 8px;
    height: 520px;
  }
  .cc-card {
    flex: 0.85;
    min-height: 54px;
    min-width: 0;
  }
  .cc-card.active {
    flex: 3.2;
  }
  .cc-v-title {
    writing-mode: horizontal-tb;
    transform: none;
    inset-inline-start: 16px;
    bottom: 14px;
  }
  .cc-content {
    padding: 14px 16px;
  }
}
@media (prefers-reduced-motion: reduce) {
  .cc-card, .cc-img, .cc-title, .cc-subtitle, .cc-cta, .cc-v-title {
    transition-duration: 0.15s !important;
  }
}
`;
