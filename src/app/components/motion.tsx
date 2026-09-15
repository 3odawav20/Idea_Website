import { motion, useReducedMotion, type Variants } from "motion/react";
import type { ReactNode, CSSProperties } from "react";

/**
 * Premium, restrained motion primitives for IDEA.
 * All timings are subtle and fast; every effect degrades gracefully
 * when the visitor prefers reduced motion. Styling stays token-driven —
 * these helpers never introduce colors or fonts of their own.
 */

const EASE = [0.22, 1, 0.36, 1] as const;

/** Fade + rise as the element scrolls into view. */
export function Reveal({
  children,
  delay = 0,
  y = 18,
  as = "div",
  style,
  className,
  once = true,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  as?: "div" | "section" | "li" | "span" | "article" | "header";
  style?: CSSProperties;
  className?: string;
  once?: boolean;
}) {
  const reduce = useReducedMotion();
  const MotionTag = motion[as] as typeof motion.div;
  return (
    <MotionTag
      className={className}
      style={style}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.2 }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </MotionTag>
  );
}

/** Wrap a list; children using <StaggerItem> animate in sequence. */
export function Stagger({
  children,
  step = 0.07,
  style,
  className,
}: {
  children: ReactNode;
  step?: number;
  style?: CSSProperties;
  className?: string;
}) {
  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: step } },
  };
  return (
    <motion.div
      className={className}
      style={style}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.15 }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  const reduce = useReducedMotion();
  const item: Variants = {
    hidden: reduce ? { opacity: 0 } : { opacity: 0, y: 16 },
    show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } },
  };
  return (
    <motion.div className={className} style={style} variants={item}>
      {children}
    </motion.div>
  );
}

/** Heading where each word rises into place — used sparingly on hero titles. */
export function AnimatedWords({ text, style, className }: { text: string; style?: CSSProperties; className?: string }) {
  const reduce = useReducedMotion();
  const words = text.split(" ");
  if (reduce) return <span className={className} style={style}>{text}</span>;
  return (
    <motion.span
      className={className}
      style={{ display: "inline-block", ...style }}
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >
      {words.map((w, i) => (
        <motion.span
          key={`${w}-${i}`}
          style={{ display: "inline-block", whiteSpace: "pre" }}
          variants={{ hidden: { opacity: 0, y: "0.5em" }, show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: EASE } } }}
        >
          {w}{i < words.length - 1 ? " " : ""}
        </motion.span>
      ))}
    </motion.span>
  );
}

/** Gold gradient sheen that sweeps across text on view — luxury accent. */
export function ShimmerText({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  const reduce = useReducedMotion();
  const base: CSSProperties = {
    backgroundImage:
      "linear-gradient(100deg, var(--idea-gold-deep) 0%, var(--idea-gold-bright) 45%, var(--idea-gold-sheen) 50%, var(--idea-gold-bright) 55%, var(--idea-gold-deep) 100%)",
    backgroundSize: "220% 100%",
    WebkitBackgroundClip: "text",
    backgroundClip: "text",
    color: "transparent",
    WebkitTextFillColor: "transparent",
    ...style,
  };
  if (reduce) return <span className={className} style={{ ...base, backgroundPosition: "0% 0" }}>{children}</span>;
  return (
    <motion.span
      className={className}
      style={base}
      initial={{ backgroundPosition: "140% 0" }}
      whileInView={{ backgroundPosition: "-40% 0" }}
      viewport={{ once: true }}
      transition={{ duration: 1.4, ease: EASE }}
    >
      {children}
    </motion.span>
  );
}

/** Interactive lift used on cards; disabled under reduced motion. */
export function Lift({ children, style, className, to }: { children: ReactNode; style?: CSSProperties; className?: string; to?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={className}
      style={style}
      whileHover={reduce ? undefined : { y: to ?? -6 }}
      transition={{ type: "spring", stiffness: 320, damping: 24 }}
    >
      {children}
    </motion.div>
  );
}
