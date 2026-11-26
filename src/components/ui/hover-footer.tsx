import { useId, useRef, useState, type MouseEvent } from "react";
import { motion, useReducedMotion } from "motion/react";
import { cn } from "@/lib/utils";

type TextHoverEffectProps = {
  text: string;
  duration?: number;
  className?: string;
};

export function TextHoverEffect({ text, duration, className }: TextHoverEffectProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hovered, setHovered] = useState(false);
  const [maskPosition, setMaskPosition] = useState({ cx: "50%", cy: "50%" });
  const reduceMotion = useReducedMotion();
  const uid = useId().replace(/:/g, "");
  const gradientId = `idea-text-gradient-${uid}`;
  const revealId = `idea-reveal-${uid}`;
  const maskId = `idea-text-mask-${uid}`;

  const handleMove = (event: MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    setMaskPosition({
      cx: `${((event.clientX - rect.left) / rect.width) * 100}%`,
      cy: `${((event.clientY - rect.top) / rect.height) * 100}%`,
    });
  };

  return (
    <svg
      ref={svgRef}
      width="100%"
      height="100%"
      viewBox="0 0 300 100"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onMouseMove={handleMove}
      className={cn("idea-hover-wordmark", className)}
    >
      <defs>
        <linearGradient id={gradientId} gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="300" y2="0">
          {hovered && (
            <>
              <stop offset="0%" stopColor="var(--idea-hover-stop-1)" />
              <stop offset="35%" stopColor="var(--idea-hover-stop-2)" />
              <stop offset="65%" stopColor="var(--idea-hover-stop-3)" />
              <stop offset="100%" stopColor="var(--idea-hover-stop-4)" />
            </>
          )}
        </linearGradient>
        <motion.radialGradient
          id={revealId}
          gradientUnits="userSpaceOnUse"
          r="20%"
          initial={{ cx: "50%", cy: "50%" }}
          animate={maskPosition}
          transition={{ duration: reduceMotion ? 0 : (duration ?? 0), ease: "easeOut" }}
        >
          <stop offset="0%" stopColor="white" />
          <stop offset="100%" stopColor="black" />
        </motion.radialGradient>
        <mask id={maskId}>
          <rect x="0" y="0" width="100%" height="100%" fill={`url(#${revealId})`} />
        </mask>
      </defs>

      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="idea-hover-wordmark-ghost"
        style={{ opacity: hovered ? 0.7 : 0 }}
      >
        {text}
      </text>
      <motion.text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        strokeWidth="0.3"
        className="idea-hover-wordmark-outline"
        initial={reduceMotion ? false : { strokeDashoffset: 1000, strokeDasharray: 1000 }}
        animate={{ strokeDashoffset: 0, strokeDasharray: 1000 }}
        transition={{ duration: 4, ease: "easeInOut" }}
      >
        {text}
      </motion.text>
      <text
        x="50%"
        y="50%"
        textAnchor="middle"
        dominantBaseline="middle"
        stroke={`url(#${gradientId})`}
        strokeWidth="0.3"
        mask={`url(#${maskId})`}
        className="idea-hover-wordmark-reveal"
      >
        {text}
      </text>
    </svg>
  );
}

export function FooterBackgroundGradient() {
  return <div className="idea-footer-bg-gradient" aria-hidden="true" />;
}
