import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../data/types";
import { ART_CERAMIC_PRODUCTS } from "../data/artceramicImport";
import { fetchAbaElMozahemProducts } from "../data/abaElMozahemImport";

export interface QuoteItem {
  productId: string;
  quantity: number;
  unit: "sqm" | "pieces";
}

interface StoreCtx {
  products: Product[];
  favorites: string[];
  quote: QuoteItem[];
  compare: string[];
  toggleFavorite: (id: string) => void;
  isFavorite: (id: string) => boolean;
  addToQuote: (id: string, unit: "sqm" | "pieces") => void;
  updateQuoteQty: (id: string, qty: number) => void;
  removeFromQuote: (id: string) => void;
  clearQuote: () => void;
  toggleCompare: (id: string) => void;
}

const Ctx = createContext<StoreCtx | null>(null);

function usePersisted<T>(key: string, initial: T): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [val, setVal] = useState<T>(() => {
    try {
      const raw = localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {
      /* ignore */
    }
  }, [key, val]);
  return [val, setVal];
}

export function StoreProvider({ children }: { children: ReactNode }) {
  // Products imported from the source export. Unconfirmed fields stay empty.
  const [products, setProducts] = useState<Product[]>(() => ART_CERAMIC_PRODUCTS);
  useEffect(() => {
    fetchAbaElMozahemProducts()
      .then((incoming) => setProducts((current) => [...current, ...incoming.filter((product) => !current.some((existing) => existing.id === product.id))]))
      .catch(() => { /* Source remains staged in registry; keep verified local catalogue available. */ });
  }, []);
  const [favorites, setFavorites] = usePersisted<string[]>("idea.favorites", []);
  const [quote, setQuote] = usePersisted<QuoteItem[]>("idea.quote", []);
  const [compare, setCompare] = usePersisted<string[]>("idea.compare", []);

  const value = useMemo<StoreCtx>(
    () => ({
      products,
      favorites,
      quote,
      compare,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite: (id) =>
        setFavorites((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id])),
      toggleCompare: (id) =>
        setCompare((c) => (c.includes(id) ? c.filter((x) => x !== id) : [...c, id].slice(-4))),
      addToQuote: (id, unit) =>
        setQuote((q) =>
          q.some((i) => i.productId === id)
            ? q
            : [...q, { productId: id, quantity: unit === "sqm" ? 10 : 1, unit }]
        ),
      updateQuoteQty: (id, qty) =>
        setQuote((q) => q.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, qty) } : i))),
      removeFromQuote: (id) => setQuote((q) => q.filter((i) => i.productId !== id)),
      clearQuote: () => setQuote([]),
    }),
    [products, favorites, quote, compare, setFavorites, setQuote, setCompare]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
