import type { CSSProperties, ReactNode } from "react";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { computeGlareState, INITIAL_GLARE_STATE } from "@/lib/glare-math";

type GlareCSSProperties = CSSProperties & Record<`--${string}`, string>;

export interface GlareCardProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
  radius?: string;
  translucent?: boolean;
  "data-testid"?: string;
}

export const GlareCard = ({
  children,
  className,
  containerClassName,
  radius = "48px",
  translucent = false,
  "data-testid": dataTestId,
}: GlareCardProps) => {
  const isPointerInside = useRef(false);
  const enterTimer = useRef<number | null>(null);
  const refElement = useRef<HTMLDivElement>(null);
  const state = useRef({
    glare: { ...INITIAL_GLARE_STATE.glare },
    background: { ...INITIAL_GLARE_STATE.background },
    rotate: { ...INITIAL_GLARE_STATE.rotate },
  });

  useEffect(() => {
    return () => {
      if (enterTimer.current !== null) {
        window.clearTimeout(enterTimer.current);
      }
    };
  }, []);

  const containerStyle: GlareCSSProperties = {
    "--m-x": "50%",
    "--m-y": "50%",
    "--r-x": "0deg",
    "--r-y": "0deg",
    "--bg-x": "50%",
    "--bg-y": "50%",
    "--duration": "300ms",
    "--delay": "0s",
    "--foil-size": "100%",
    "--opacity": "0",
    "--radius": radius,
    "--easing": "ease",
    "--transition": "var(--duration) var(--easing)",
  };

  const backgroundStyle: GlareCSSProperties = {
    "--step": "5%",
    "--foil-svg": `url("data:image/svg+xml,%3Csvg width='26' height='26' viewBox='0 0 26 26' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M2.99994 3.419C2.99994 3.419 21.6142 7.43646 22.7921 12.153C23.97 16.8695 3.41838 23.0306 3.41838 23.0306' stroke='white' stroke-width='5' stroke-miterlimit='3.86874' stroke-linecap='round' style='mix-blend-mode:darken'/%3E%3C/svg%3E")`,
    "--pattern": "var(--foil-svg) center/100% no-repeat",
    "--rainbow":
      "repeating-linear-gradient( 0deg,rgb(255,119,115) calc(var(--step) * 1),rgba(255,237,95,1) calc(var(--step) * 2),rgba(168,255,95,1) calc(var(--step) * 3),rgba(131,255,247,1) calc(var(--step) * 4),rgba(120,148,255,1) calc(var(--step) * 5),rgb(216,117,255) calc(var(--step) * 6),rgb(255,119,115) calc(var(--step) * 7) ) 0% var(--bg-y)/200% 700% no-repeat",
    "--diagonal":
      "repeating-linear-gradient( 128deg,#0e152e 0%,hsl(180,10%,60%) 3.8%,hsl(180,10%,60%) 4.5%,hsl(180,10%,60%) 5.2%,#0e152e 10%,#0e152e 12% ) var(--bg-x) var(--bg-y)/300% no-repeat",
    "--shade":
      "radial-gradient( farthest-corner circle at var(--m-x) var(--m-y),rgba(255,255,255,0.1) 12%,rgba(255,255,255,0.15) 20%,rgba(255,255,255,0.25) 120% ) var(--bg-x) var(--bg-y)/300% no-repeat",
    backgroundBlendMode: "hue, hue, hue, overlay",
  };

  const updateStyles = () => {
    if (refElement.current) {
      const { background, rotate, glare } = state.current;
      refElement.current.style.setProperty("--m-x", `${glare.x}%`);
      refElement.current.style.setProperty("--m-y", `${glare.y}%`);
      refElement.current.style.setProperty("--r-x", `${rotate.x}deg`);
      refElement.current.style.setProperty("--r-y", `${rotate.y}deg`);
      refElement.current.style.setProperty("--bg-x", `${background.x}%`);
      refElement.current.style.setProperty("--bg-y", `${background.y}%`);
    }
  };

  return (
    <div
      style={containerStyle}
      data-testid={dataTestId ?? "glare-card"}
      className={cn(
        "relative isolate [contain:layout_style] [perspective:600px] transition-transform duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] will-change-transform w-[320px] max-w-full [aspect-ratio:17/21]",
        containerClassName,
      )}
      ref={refElement}
      onPointerMove={(event) => {
        const rect = event.currentTarget.getBoundingClientRect();
        state.current = computeGlareState(
          event.clientX,
          event.clientY,
          rect,
          translucent ? 0.25 : 0.4,
        );
        updateStyles();
      }}
      onPointerEnter={() => {
        isPointerInside.current = true;
        if (enterTimer.current !== null) {
          window.clearTimeout(enterTimer.current);
        }
        if (refElement.current) {
          enterTimer.current = window.setTimeout(() => {
            if (isPointerInside.current) {
              refElement.current?.style.setProperty("--duration", "0s");
            }
          }, 300);
        }
      }}
      onPointerLeave={() => {
        isPointerInside.current = false;
        if (enterTimer.current !== null) {
          window.clearTimeout(enterTimer.current);
          enterTimer.current = null;
        }
        if (refElement.current) {
          refElement.current.style.removeProperty("--duration");
          refElement.current.style.setProperty("--r-x", "0deg");
          refElement.current.style.setProperty("--r-y", "0deg");
        }
      }}
    >
      <div
        className={cn(
          "h-full grid will-change-transform origin-center transition-transform duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] [transform:rotateY(var(--r-x))_rotateX(var(--r-y))] rounded-[var(--radius)] border overflow-hidden hover:[--duration:200ms] hover:[--easing:linear] hover:filter-none",
          translucent
            ? "idea-glare-glass-shell relative isolate border-white/15 hover:border-white/30 hover:[--opacity:0.9] focus-within:[--opacity:0.9] shadow-[0_16px_40px_rgba(0,0,0,0.42),inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-2xl backdrop-saturate-150"
            : "border-slate-800 hover:[--opacity:0.6] focus-within:[--opacity:0.6]",
        )}
      >
        {translucent ? (
          <>
            {/* Smoked translucent dark-glass base + static glass sheen */}
            <div
              aria-hidden="true"
              data-glare-layer="glass-base"
              className="idea-glare-glass-base pointer-events-none w-full h-full [grid-area:1/1] z-0 [clip-path:inset(0_0_0_0_round_var(--radius))]"
            />
            {/* Interactive natural daylight spotlight strictly on the glass card surface */}
            <div
              aria-hidden="true"
              data-glare-layer="surface-glare"
              className="pointer-events-none w-full h-full grid [grid-area:1/1] z-[1] [clip-path:inset(0_0_1px_0_round_var(--radius))] opacity-[var(--opacity)] transition-opacity duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] will-change-[background] [background:radial-gradient(farthest-corner_circle_at_var(--m-x)_var(--m-y),_rgba(255,253,248,0.34)_0%,_rgba(255,250,242,0.16)_24%,_rgba(255,255,255,0.04)_52%,_transparent_80%)]"
            />
            {/* Interactive angled sunlight/studio-light glass streak strictly behind card content */}
            <div
              aria-hidden="true"
              data-glare-layer="surface-sheen"
              className="pointer-events-none w-full h-full grid [grid-area:1/1] z-[2] opacity-[var(--opacity)] will-change-[background-position] transition-opacity duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] [clip-path:inset(0_0_1px_0_round_var(--radius))] [background:linear-gradient(122deg,_transparent_24%,_rgba(255,252,246,0.05)_38%,_rgba(255,255,255,0.24)_49%,_rgba(255,248,236,0.06)_58%,_transparent_74%)] [background-size:240%_240%] [background-position:var(--bg-x)_var(--bg-y)]"
            />
            {/* Foreground content (material sphere, typography, controls) completely untouched by card glare */}
            <div
              data-glare-content="above"
              className="relative z-[10] isolate w-full h-full grid [grid-area:1/1] [clip-path:inset(0_0_0_0_round_var(--radius))]"
            >
              <div className={cn("relative h-full w-full bg-transparent", className)}>
                {children}
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="w-full h-full grid [grid-area:1/1] mix-blend-soft-light [clip-path:inset(0_0_0_0_round_var(--radius))]">
              <div className={cn("relative h-full w-full bg-slate-950", className)}>
                {children}
              </div>
            </div>
            <div className="pointer-events-none w-full h-full grid [grid-area:1/1] mix-blend-soft-light [clip-path:inset(0_0_1px_0_round_var(--radius))] opacity-[var(--opacity)] transition-opacity duration-[var(--duration)] ease-[var(--easing)] delay-[var(--delay)] will-change-[background] [background:radial-gradient(farthest-corner_circle_at_var(--m-x)_var(--m-y),_rgba(255,255,255,0.8)_10%,_rgba(255,255,255,0.65)_20%,_rgba(255,255,255,0)_90%)]" />
            <div
              className="pointer-events-none w-full h-full grid [grid-area:1/1] mix-blend-color-dodge opacity-[var(--opacity)] will-change-[background] transition-opacity [clip-path:inset(0_0_1px_0_round_var(--radius))] [background:var(--pattern),_var(--rainbow),_var(--diagonal),_var(--shade)] relative after:content-[''] after:[grid-area:inherit] after:[background-repeat:inherit] after:[background-attachment:inherit] after:[background-origin:inherit] after:[background-clip:inherit] after:[background:inherit] after:mix-blend-exclusion after:[background-size:var(--foil-size),_200%_400%,_800%,_200%] after:[background-position:center,_0%_var(--bg-y),_calc(var(--bg-x)*_-1)_calc(var(--bg-y)*_-1),_var(--bg-x)_var(--bg-y)] after:[background-blend-mode:soft-light,_hue,_hard-light]"
              style={backgroundStyle}
            />
          </>
        )}
      </div>
    </div>
  );
};
