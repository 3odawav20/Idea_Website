import { useState } from "react";

type IdeaLogoProps = {
  compact?: boolean;
};

/** The supplied IDEA Business Administration logo, always shown in full. */
export function IdeaLogo({ compact = false }: IdeaLogoProps) {
  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`idea-official-logo ${compact ? "idea-official-logo--compact" : ""}`}
      aria-label="IDEA Business Administration"
      role="img"
    >
      {failed ? (
        <span className="idea-official-logo-fallback" aria-hidden="true">
          <strong>IDEA</strong>
          <span>Business Administration</span>
        </span>
      ) : (
        <img
          src="https://i.ibb.co/4wBqQKbz/idea-new-logo.png"
          alt="IDEA Business Administration"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}
