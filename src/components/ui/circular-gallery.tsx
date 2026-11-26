import React, { useState, useEffect, useRef, HTMLAttributes } from "react";
import { Link } from "react-router";

// A simple utility for conditional class names
const cn = (...classes: (string | undefined | null | false)[]) => {
  return classes.filter(Boolean).join(" ");
};

// Define the type for a single gallery item
export interface GalleryItem {
  common: string;
  binomial: string;
  href?: string;
  photo: {
    url: string;
    text: string;
    pos?: string;
    by: string;
  };
}

// Define the props for the CircularGallery component
export interface CircularGalleryProps extends HTMLAttributes<HTMLDivElement> {
  items: GalleryItem[];
  /** Controls how far the items are from the center. */
  radius?: number;
  /** Controls the speed of auto-rotation when not scrolling. */
  autoRotateSpeed?: number;
}

const CircularGallery = React.forwardRef<HTMLDivElement, CircularGalleryProps>(
  ({ items, className, radius = 520, autoRotateSpeed = 0.035, ...props }, ref) => {
    const [rotation, setRotation] = useState(0);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isHovered, setIsHovered] = useState(false);
    const [effectiveRadius, setEffectiveRadius] = useState(radius);
    const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const lastScrollYRef = useRef<number>(typeof window !== "undefined" ? window.scrollY : 0);

    // Responsive radius so the 3D cylinder fits cleanly on mobile, tablet, and desktop
    useEffect(() => {
      const updateRadius = () => {
        const w = window.innerWidth;
        if (w < 480) setEffectiveRadius(Math.min(radius, 250));
        else if (w < 768) setEffectiveRadius(Math.min(radius, 330));
        else if (w < 1024) setEffectiveRadius(Math.min(radius, 420));
        else setEffectiveRadius(radius);
      };
      updateRadius();
      window.addEventListener("resize", updateRadius);
      return () => window.removeEventListener("resize", updateRadius);
    }, [radius]);

    // Effect to handle smooth scroll-assisted rotation without jumping
    useEffect(() => {
      const handleScroll = () => {
        setIsScrolling(true);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }

        const currentY = window.scrollY;
        const deltaY = currentY - lastScrollYRef.current;
        lastScrollYRef.current = currentY;
        setRotation((prev) => prev + deltaY * 0.08);

        scrollTimeoutRef.current = setTimeout(() => {
          setIsScrolling(false);
        }, 150);
      };

      window.addEventListener("scroll", handleScroll, { passive: true });
      return () => {
        window.removeEventListener("scroll", handleScroll);
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
      };
    }, []);

    // Effect for auto-rotation when not scrolling or hovered
    useEffect(() => {
      const autoRotate = () => {
        if (!isScrolling && !isHovered) {
          setRotation((prev) => prev + autoRotateSpeed);
        }
        animationFrameRef.current = requestAnimationFrame(autoRotate);
      };

      animationFrameRef.current = requestAnimationFrame(autoRotate);

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }, [isScrolling, isHovered, autoRotateSpeed]);

    if (!items.length) return null;
    const anglePerItem = 360 / items.length;

    return (
      <div
        ref={ref}
        role="region"
        dir="ltr"
        aria-label="Circular 3D Gallery"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={cn("relative w-full h-full flex items-center justify-center select-none", className)}
        style={{ perspective: "2000px" }}
        {...props}
      >
        <div
          className="relative w-full h-full"
          style={{
            transform: `rotateY(${rotation}deg)`,
            transformStyle: "preserve-3d",
          }}
        >
          {items.map((item, i) => {
            const itemAngle = i * anglePerItem;
            const totalRotation = rotation % 360;
            const relativeAngle = (itemAngle + totalRotation + 360) % 360;
            const normalizedAngle = Math.abs(
              relativeAngle > 180 ? 360 - relativeAngle : relativeAngle
            );
            const opacity = Math.max(0.3, 1 - normalizedAngle / 180);

            const cardContent = (
              <div className="relative w-full h-full rounded-xl shadow-2xl overflow-hidden group border border-white/15 bg-neutral-900/75 backdrop-blur-lg transition-transform duration-300 hover:scale-[1.03]">
                <img
                  src={item.photo.url}
                  alt={item.photo.text}
                  loading="lazy"
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  style={{ objectPosition: item.photo.pos || "center" }}
                />
                <div
                  dir="auto"
                  className="absolute bottom-0 left-0 w-full p-5 bg-gradient-to-t from-black/90 via-black/55 to-transparent text-white"
                >
                  <h3 className="text-lg md:text-xl font-bold leading-snug text-white">
                    {item.common}
                  </h3>
                  <em className="block text-xs md:text-sm not-italic text-white/80 mt-1 line-clamp-2">
                    {item.binomial}
                  </em>
                  <p className="text-[11px] font-semibold uppercase tracking-wider mt-2.5 text-[#ff8a32]">
                    {item.photo.by}
                  </p>
                </div>
              </div>
            );

            return (
              <div
                key={`${item.common}-${i}`}
                role="group"
                aria-label={item.common}
                className="absolute w-[230px] h-[310px] -ml-[115px] -mt-[155px] sm:w-[270px] sm:h-[360px] sm:-ml-[135px] sm:-mt-[180px] md:w-[300px] md:h-[400px] md:-ml-[150px] md:-mt-[200px]"
                style={{
                  transform: `rotateY(${itemAngle}deg) translateZ(${effectiveRadius}px)`,
                  left: "50%",
                  top: "50%",
                  opacity,
                  transition: "opacity 0.3s linear",
                }}
              >
                {item.href ? (
                  <Link
                    to={item.href}
                    className="block w-full h-full no-underline text-inherit"
                    aria-label={item.common}
                  >
                    {cardContent}
                  </Link>
                ) : (
                  cardContent
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);

CircularGallery.displayName = "CircularGallery";

export { CircularGallery };
export default CircularGallery;
