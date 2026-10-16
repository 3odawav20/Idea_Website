import { useStore } from "../store/store";

// Unclassified inventory is never silently relabelled as another material.
// Until a category has products, its cover opens the existing inspiration showroom.
export function useCollectionDestinations() {
  const { products } = useStore();
  const hasMarble = products.some((p) => p.texture?.toLowerCase() === "marble" || p.type?.toLowerCase() === "marble");
  return {
    marble: hasMarble ? "/products?material=marble" : "/tile-showroom/marble",
    ceramics: products.some((p) => p.collection === "ceramics") ? "/collections/ceramics" : "/surface-styles",
    porcelain: products.some((p) => p.collection === "porcelain") ? "/collections/porcelain" : "/tile-showroom/marble",
    tiles: "/products?material=tiles",
  };
}
