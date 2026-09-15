type IdeaLogoProps = {
  compact?: boolean;
};

/** The supplied IDEA Business Administration logo, always shown in full. */
export function IdeaLogo({ compact = false }: IdeaLogoProps) {
  return (
    <span
      className={`idea-official-logo ${compact ? "idea-official-logo--compact" : ""}`}
      aria-label="IDEA Business Administration"
      role="img"
    >
      <img src="https://i.ibb.co/4wBqQKbz/idea-new-logo.png" alt="IDEA Business Administration" />
    </span>
  );
}
