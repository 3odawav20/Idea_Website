// Every collection cover opens an IDEA-owned collection route.
// There are no outbound supplier redirects or external live-data dependencies.
export function useCollectionDestinations() {
  return {
    ceramics: "/collections/ceramics",
    porcelain: "/collections/porcelain",
    tiles: "/collections/tiles",
    marble: "/collections/marble",
  } as const;
}
