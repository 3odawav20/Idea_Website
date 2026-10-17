import { useUiText as useLocaleText } from "../i18n/useUiText";
import { useState } from "react";

type IdeaLogoProps = {
  compact?: boolean;
};

/** The supplied cream-and-orange IDEA logo, preserved without alteration. */
export function IdeaLogo({ compact = false }: IdeaLogoProps) {
  const uiText = useLocaleText();

  const [failed, setFailed] = useState(false);

  return (
    <span
      className={`idea-official-logo ${compact ? "idea-official-logo--compact" : ""}`}
      aria-label={uiText("IDEA")}
      role="img"
    >
      {uiText(failed ? (
        <span className="idea-official-logo-fallback" aria-hidden="true">
          <strong>{uiText("IDEA")}</strong>
        </span>
      ) : (
        <img
          src="/images/brand/idea-logo-cream.png"
          alt={uiText("IDEA")}
          width={2048}
          height={699}
          onError={() => setFailed(true)}
        />
      ))}
    </span>
  );
}
