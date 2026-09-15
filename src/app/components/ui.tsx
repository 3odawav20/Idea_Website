import type { ButtonHTMLAttributes, CSSProperties, ReactNode } from "react";

// ── Shared inline-style helpers bound to IDEA CSS tokens ──────────────────

export function Container({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <div className={["idea-container", className].filter(Boolean).join(" ")} style={{ width: "100%", maxWidth: 1320, margin: "0 auto", padding: "0 var(--idea-space-5)", ...style }}>
      {children}
    </div>
  );
}

export function Section({ children, style, alt }: { children: ReactNode; style?: CSSProperties; alt?: boolean }) {
  return (
    <section style={{ padding: "var(--idea-space-9) 0", background: alt ? "var(--idea-bg-2)" : "transparent", ...style }}>
      {children}
    </section>
  );
}

export function Eyebrow({ children }: { children: ReactNode }) {
  return <div className="idea-eyebrow">{children}</div>;
}

export function SectionHeader({ eyebrow, title, sub }: { eyebrow?: string; title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: "var(--idea-space-7)", maxWidth: 720 }}>
      {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
      <h2 className="idea-display" style={{ fontSize: "var(--idea-text-2xl)", margin: "var(--idea-space-3) 0 0", color: "var(--idea-text)" }}>
        {title}
      </h2>
      {sub && <p style={{ color: "var(--idea-text-muted)", marginTop: "var(--idea-space-3)", fontSize: "var(--idea-text-base)", lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

type Variant = "gold" | "outline" | "ghost";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: "sm" | "md" | "lg";
  children: ReactNode;
}

export function Button({ variant = "gold", size = "md", style, children, ...rest }: BtnProps) {
  const pad = size === "lg" ? "16px 32px" : size === "sm" ? "8px 16px" : "12px 24px";
  const font = size === "lg" ? "var(--idea-text-base)" : "var(--idea-text-sm)";
  const base: CSSProperties = {
    display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "var(--idea-space-2)",
    padding: pad, fontFamily: "var(--idea-font-body)", fontSize: font, fontWeight: 500,
    letterSpacing: "0.04em", textTransform: "uppercase", borderRadius: "var(--idea-radius-full)",
    cursor: "pointer", transition: "all .25s ease", border: "1px solid transparent", whiteSpace: "nowrap",
  };
  const variants: Record<Variant, CSSProperties> = {
    gold: { background: "linear-gradient(135deg, var(--idea-gold-bright), var(--idea-gold))", color: "var(--idea-on-gold)", boxShadow: "var(--idea-shadow-gold)" },
    outline: { background: "transparent", color: "var(--idea-gold)", borderColor: "var(--idea-gold)" },
    ghost: { background: "var(--idea-surface-2)", color: "var(--idea-text)", borderColor: "var(--idea-border-neutral)" },
  };
  return (
    <button {...rest} style={{ ...base, ...variants[variant], ...style }}>
      {children}
    </button>
  );
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "6px 14px", borderRadius: "var(--idea-radius-full)", cursor: "pointer",
        fontSize: "var(--idea-text-sm)", fontFamily: "var(--idea-font-body)", transition: "all .2s ease",
        border: `1px solid ${active ? "var(--idea-gold)" : "var(--idea-border-neutral)"}`,
        background: active ? "var(--idea-gold-soft)" : "transparent",
        color: active ? "var(--idea-gold-bright)" : "var(--idea-text-muted)",
      }}
    >
      {children}
    </button>
  );
}

export function Tag({ children }: { children: ReactNode }) {
  return (
    <span style={{
      fontSize: "var(--idea-text-xs)", color: "var(--idea-text-muted)", padding: "3px 10px",
      border: "var(--idea-hairline)", borderRadius: "var(--idea-radius-sm)", letterSpacing: "0.04em",
    }}>
      {children}
    </span>
  );
}
