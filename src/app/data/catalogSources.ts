const SOURCE_PROVIDER_NAMES: Record<string, string> = {
  "source-04": "El Sewify",
  "source-06": "Alwan Ceramic & Porcelain",
  "source-08": "AbaElMozahem",
  "source-12": "Rondy Ceramics",
  "source-13": "Mazloum Home",
  "source-20": "Art Ceramic",
  "source-22": "Elrwad Group",
  "source-25": "Tarek Elsallab",
  "source-36": "Rowad El Sabteya",
};

export function sourceProviderName(sourceId?: string) {
  if (!sourceId) return undefined;
  return SOURCE_PROVIDER_NAMES[sourceId];
}

export function productSourceLabel(source?: { sourceId?: string; provider?: string }) {
  const mapped = sourceProviderName(source?.sourceId);
  if (mapped) return mapped;
  const provider = (source?.provider || "").trim();
  return provider && provider !== "IDEA catalog source" ? provider : undefined;
}
