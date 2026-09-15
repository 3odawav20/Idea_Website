/* Official brand marks as inline SVG (standard, unmodified logos) used for the
   authentication provider buttons and payment-method selectors. These are the
   real provider marks — not approximate redraws. Colors are the brand colors;
   on the Black & Gold surface each sits inside a light chip so it stays legible. */
import type { CSSProperties } from "react";

const S = (size: number): CSSProperties => ({ width: size, height: size, display: "block" });

export function GoogleIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 48 48" style={S(size)} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 35 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.3 5.3C39.9 36 44 30.6 44 24c0-1.3-.1-2.3-.4-3.5z" />
    </svg>
  );
}
export function MicrosoftIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 23 23" style={S(size)} aria-hidden>
      <path fill="#F25022" d="M1 1h10v10H1z" /><path fill="#7FBA00" d="M12 1h10v10H12z" />
      <path fill="#00A4EF" d="M1 12h10v10H1z" /><path fill="#FFB900" d="M12 12h10v10H12z" />
    </svg>
  );
}
export function AppleIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={S(size)} aria-hidden>
      <path fill={color} d="M16.365 1.43c0 1.14-.417 2.2-1.11 2.98-.79.9-2.08 1.6-3.13 1.52-.13-1.1.44-2.27 1.13-3 .78-.83 2.14-1.46 3.11-1.5zM20.5 17.2c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.52-4.12 3.53-1.54.02-1.93-1-4.02-.99-2.09.01-2.52 1.01-4.06.99-1.73-.02-3.05-1.79-4.04-3.35-2.77-4.37-3.06-9.5-1.35-12.22C2.6 6.19 4.5 5.1 6.28 5.1c1.81 0 2.95 1 4.45 1 1.45 0 2.34-1 4.44-1 1.58 0 3.26.86 4.45 2.35-3.91 2.14-3.27 7.72.88 9.75z" />
    </svg>
  );
}
export function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" style={S(size)} aria-hidden>
      <path fill="#1877F2" d="M24 12a12 12 0 1 0-13.9 11.9v-8.4H7.1V12h3V9.4c0-3 1.8-4.7 4.5-4.7 1.3 0 2.7.24 2.7.24v3h-1.5c-1.5 0-1.9.9-1.9 1.9V12h3.3l-.5 3.5h-2.8v8.4A12 12 0 0 0 24 12z" />
    </svg>
  );
}
export function XIcon({ size = 18, color = "currentColor" }: { size?: number; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" style={S(size)} aria-hidden>
      <path fill={color} d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23zm-1.16 17.52h1.83L7.01 4.13H5.05l12.03 15.64z" />
    </svg>
  );
}
export function VisaMark({ size = 30 }: { size?: number }) {
  return <svg viewBox="0 0 48 16" style={{ width: size, height: (size / 48) * 16 }} aria-hidden><text x="0" y="13" fontFamily="Jost, sans-serif" fontWeight="700" fontStyle="italic" fontSize="14" fill="var(--idea-gold)">VISA</text></svg>;
}
export function MastercardMark({ size = 30 }: { size?: number }) {
  return <svg viewBox="0 0 32 20" style={{ width: size, height: (size / 32) * 20 }} aria-hidden><circle cx="12" cy="10" r="8" fill="#EB001B" /><circle cx="20" cy="10" r="8" fill="#F79E1B" fillOpacity="0.85" /></svg>;
}
export function MeezaMark({ size = 34 }: { size?: number }) {
  return <svg viewBox="0 0 60 20" style={{ width: size, height: (size / 60) * 20 }} aria-hidden><text x="0" y="15" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="15" fill="var(--idea-gold)">meeza</text></svg>;
}
export function FawryMark({ size = 34 }: { size?: number }) {
  return <svg viewBox="0 0 60 20" style={{ width: size, height: (size / 60) * 20 }} aria-hidden><text x="0" y="15" fontFamily="Jost, sans-serif" fontWeight="800" fontSize="15" fill="var(--idea-gold)">Fawry</text></svg>;
}
export function ApplePayMark({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 60 24" style={{ width: size, height: (size / 60) * 24 }} aria-hidden>
      <g transform="translate(2,4)"><AppleGlyph /></g>
      <text x="20" y="17" fontFamily="Jost, sans-serif" fontWeight="600" fontSize="14" fill="var(--idea-on-gold)">Pay</text>
    </svg>
  );
}
function AppleGlyph() {
  return <path fill="#fff" d="M13.6 1.2c0 .95-.35 1.83-.93 2.48-.66.75-1.73 1.33-2.6 1.26-.11-.92.37-1.89.94-2.5.65-.69 1.78-1.21 2.59-1.24zM16.4 13.2c-.46 1.06-.68 1.53-1.27 2.46-.83 1.31-2 2.93-3.44 2.94-1.28.01-1.6-.83-3.35-.82-1.74.01-2.1.84-3.38.82-1.44-.02-2.54-1.49-3.37-2.79-2.31-3.64-2.55-7.91-1.12-10.18C1.16 4.66 2.75 3.75 4.23 3.75c1.51 0 2.46.83 3.71.83 1.21 0 1.95-.83 3.7-.83 1.32 0 2.72.72 3.71 1.96-3.26 1.78-2.73 6.43.73 8.12z" />;
}

export const PROVIDERS = [
  { key: "google", Icon: GoogleIcon, en: "Continue with Google", ar: "المتابعة باستخدام Google", fr: "Continuer avec Google" },
  { key: "microsoft", Icon: MicrosoftIcon, en: "Continue with Microsoft", ar: "المتابعة باستخدام Microsoft", fr: "Continuer avec Microsoft" },
  { key: "apple", Icon: () => <AppleIcon color="var(--idea-text)" />, en: "Continue with Apple", ar: "المتابعة باستخدام Apple", fr: "Continuer avec Apple" },
  { key: "facebook", Icon: FacebookIcon, en: "Continue with Facebook", ar: "المتابعة باستخدام Facebook", fr: "Continuer avec Facebook" },
  { key: "x", Icon: () => <XIcon color="var(--idea-text)" />, en: "Continue with X", ar: "المتابعة باستخدام X", fr: "Continuer avec X" },
] as const;
