import { Link } from "react-router";
import { ArrowRight } from "lucide-react";
import { useTheme } from "../app/theme/theme";

export interface CardGridItem {
  id: string;
  title: string;
  description?: string;
  ctaText: string;
  image: string;
  href: string;
}

export interface CardGridProps {
  heading?: string;
  cards?: CardGridItem[];
  className?: string;
}

const DEFAULT_CARDS: CardGridItem[] = [
  {
    id: "projects",
    title: "Explore curated architectural surface concepts and spatial inspirations for modern interiors.",
    ctaText: "View projects",
    image: "/images/featured/porcelain.webp",
    href: "/projects",
  },
  {
    id: "downloads",
    title: "Download the complete IDEA product index with verified technical specifications and dimensions.",
    ctaText: "Browse downloads",
    image: "/images/featured/marble.webp",
    href: "/downloads",
  },
  {
    id: "contact",
    title: "Connect with our surface specialists for private project quotations and showroom enquiries.",
    ctaText: "Contact & appointments",
    image: "/images/featured/ceramics.webp",
    href: "/contact",
  },
];

export function CardGrid({
  heading = "Explore the world of IDEA",
  cards = DEFAULT_CARDS,
  className = "",
}: CardGridProps) {
  const { mode } = useTheme();
  const isDark = mode === "dark";

  return (
    <section
      className={`w-full rounded-2xl py-16 px-6 md:px-10 transition-colors duration-300 ${
        isDark
          ? "bg-[#0A0A0A] border border-white/10"
          : "border border-[#DDD5C7]"
      } ${className}`.trim()}
      style={
        isDark
          ? undefined
          : {
              background:
                "radial-gradient(circle at 12% 18%, rgba(250, 247, 240, 0.92) 0%, transparent 45%), radial-gradient(circle at 86% 82%, rgba(212, 208, 200, 0.65) 0%, transparent 48%), linear-gradient(128deg, #DEDCD7 0%, #EFE8DA 36%, #F6F1E5 68%, #E6E2DA 100%)",
            }
      }
    >
      <div className="max-w-6xl mx-auto">
        {heading && (
          <h2 className="text-2xl md:text-3xl font-bold text-[#fd6401] mb-8 text-start">
            {heading}
          </h2>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {cards.map((card) => {
            const cardInner = (
              <>
                <div
                  className={`w-full aspect-[16/10] overflow-hidden ${
                    isDark ? "bg-neutral-900" : "bg-[#E7E1D5]"
                  }`}
                >
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col flex-1 justify-between p-6">
                  <div>
                    <h3
                      className={`text-base md:text-lg font-medium leading-snug mb-3 ${
                        isDark ? "text-neutral-100" : "text-[#1E1B18]"
                      }`}
                    >
                      {card.title}
                    </h3>
                    {card.description && (
                      <p
                        className={`text-sm leading-relaxed mb-6 ${
                          isDark ? "text-neutral-400" : "text-[#5C554B]"
                        }`}
                      >
                        {card.description}
                      </p>
                    )}
                    {!card.description && <div className="mb-3" />}
                  </div>

                  <span
                    className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
                      isDark
                        ? "text-neutral-300 group-hover:text-white"
                        : "text-[#3A3229] group-hover:text-[#fd6401]"
                    }`}
                  >
                    <span>{card.ctaText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </>
            );

            const cardClasses = isDark
              ? "group flex flex-col overflow-hidden rounded-xl bg-neutral-900/70 border border-white/10 transition-all duration-300 hover:border-white/25 hover:-translate-y-1 no-underline"
              : "group flex flex-col overflow-hidden rounded-xl bg-[#F9F6EE]/88 backdrop-blur-sm border border-[#D8CFC0] shadow-[0_10px_28px_rgba(44,36,24,0.08)] transition-all duration-300 hover:border-[#fd6401]/45 hover:bg-[#FCFBF7] hover:shadow-[0_16px_34px_rgba(44,36,24,0.13)] hover:-translate-y-1 no-underline";

            if (card.href.startsWith("/")) {
              return (
                <Link key={card.id} to={card.href} className={cardClasses}>
                  {cardInner}
                </Link>
              );
            }

            return (
              <a
                key={card.id}
                href={card.href}
                target={card.href.startsWith("http") ? "_blank" : undefined}
                rel={card.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className={cardClasses}
              >
                {cardInner}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}

export default CardGrid;
