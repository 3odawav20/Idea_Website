import "./MaterialOrb.css";

interface MaterialOrbProps {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}

/** A source-faithful material face with transparent surroundings and restrained spherical lighting. */
export function MaterialOrb({ src, alt, className = "", loading = "lazy" }: MaterialOrbProps) {
  return (
    <span className={`idea-material-orb ${className}`.trim()}>
      <img src={src} alt={alt} loading={loading} decoding="async" draggable={false} />
      <span className="idea-material-orb-light" aria-hidden="true" />
    </span>
  );
}
