import cache from "./materialFaceCache.json";

/** Recovered source tile faces, served locally without replacing catalogue provenance. */
export function localMaterialFace(id: string): string | null {
  const path = (cache as Record<string, string>)[id];
  if (!path) return null;
  const base = window.location.pathname.startsWith("/idea-next/")
    ? "/idea-next" : import.meta.env.BASE_URL.replace(/\/$/, "");
  return base + path;
}
