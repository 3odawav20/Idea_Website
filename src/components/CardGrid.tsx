import { Link } from "react-router";
import { ArrowRight } from "lucide-react";

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
  return (
    <section className={`w-full bg-[#0A0A0A] rounded-2xl py-16 px-6 md:px-10 ${className}`.trim()}>
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
                <div className="w-full aspect-[16/10] overflow-hidden bg-neutral-900">
                  <img
                    src={card.image}
                    alt={card.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-col flex-1 justify-between p-6">
                  <div>
                    <h3 className="text-base md:text-lg font-medium text-neutral-100 leading-snug mb-3">
                      {card.title}
                    </h3>
                    {card.description && (
                      <p className="text-sm text-neutral-400 leading-relaxed mb-6">
                        {card.description}
                      </p>
                    )}
                    {!card.description && <div className="mb-3" />}
                  </div>

                  <span className="inline-flex items-center gap-2 text-sm font-medium text-neutral-300 group-hover:text-white transition-colors">
                    <span>{card.ctaText}</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
                  </span>
                </div>
              </>
            );

            const cardClasses =
              "group flex flex-col overflow-hidden rounded-xl bg-neutral-900/70 border border-white/10 transition-all duration-300 hover:border-white/25 hover:-translate-y-1 no-underline";

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
