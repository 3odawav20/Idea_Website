import "./MaterialOrb.css";

type MaterialOrbProps = {
  src: string;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
};

export function MaterialOrb({
  src,
  alt,
  className = "",
  loading = "lazy",
}: MaterialOrbProps) {
  return (
    <span
      className={["idea-surface-orb", className].filter(Boolean).join(" ")}
      aria-hidden={alt ? undefined : true}
    >
      <img src={src} alt={alt} loading={loading} decoding="async" />
    </span>
  );
}
