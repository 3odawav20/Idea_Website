import { useMemo } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useStore } from "../store/store";
import { generationAccess } from "../backend/accountsApi";
import { useBackend } from "../backend/db";
import CeramicStudio from "../ceramic-studio/CeramicStudio.jsx";
import "../ceramic-studio/studio.css";

export function CeramicVisualizer() {
  const { products, addToQuote } = useStore();
  const { session } = useBackend();
  const restricted = Boolean(session && session.role !== "customer");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const requestedProduct = params.get("product");
  const options = useMemo(
    () =>
      products
        .filter(
          (p) =>
            (p.collection === "ceramics" || p.collection === "porcelain") &&
            p.image,
        )
        .map((p) => ({
          id: p.id,
          name: p.name.ar || p.name.en,
          kind: /marble/i.test(p.texture || p.source?.originalSurface || "")
            ? "رخامي"
            : /stone/i.test(p.texture || "")
              ? "حجر طبيعي"
              : /matte|matt/i.test(p.finish || p.source?.originalSurface || "")
                ? "مطفي"
                : "كتالوج IDEA",
          category:
            p.type?.toLowerCase() === "marble"
              ? "رخام"
              : p.collection === "porcelain"
                ? "بورسلين"
                : "سيراميك",
          tileSize:
            p.sizes?.[0]?.widthMm && p.sizes?.[0]?.heightMm
              ? `${p.sizes[0].widthMm / 10} × ${p.sizes[0].heightMm / 10}`
              : undefined,
          tone: p.brand,
          // Prefer the actual tile swatch over a staged room photograph.
          src: p.source?.original?.tiles?.[0] || p.image,
          product: true,
        })),
    [products],
  );

  const authenticate = generationAccess;

  return (
    <CeramicStudio
      key={requestedProduct || "studio"}
      materialOptions={options}
      initialMaterialId={requestedProduct}
      authenticate={authenticate}
      generationDisabled={restricted}
      savedPreview={import.meta.env.DEV && params.get("preview") === "amazon-room" ? `${import.meta.env.BASE_URL}ceramic-studio/private-previews/amazon-room.json` : null}
      onRequestQuote={(id: string) => {
        addToQuote(id, "sqm");
        navigate("/request-quote/new");
      }}
    />
  );
}
