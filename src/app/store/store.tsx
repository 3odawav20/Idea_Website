import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../data/types";
import { ART_CERAMIC_PRODUCTS } from "../data/artceramicImport";
import { fetchAbaElMozahemProducts } from "../data/abaElMozahemImport";
import { loadMazloumProducts } from "../data/mazloumImport";
import { useBackend } from "../backend/db";
import { requireSupabase } from "../backend/supabaseClient";

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
  const [products, setProducts] = useState<Product[]>(() => ART_CERAMIC_PRODUCTS.filter((product) => product.approved));
  useEffect(() => {
    fetchAbaElMozahemProducts()
      .then((incoming) => setProducts((current) => [...current, ...incoming.filter((product) => product.approved && !current.some((existing) => existing.id === product.id))]))
      .catch(() => { /* Source remains staged in registry; keep verified local catalogue available. */ });

    const controller = new AbortController();
    void loadMazloumProducts((incoming) => {
      setProducts((current) => {
        const next = new Map(current.map((product) => [product.id, product]));
        for (const product of incoming) {
          if (product.approved) next.set(product.id, product);
        }
        return [...next.values()];
      });
    }, controller.signal).catch(() => {
      /* Keep the verified local catalogue available when the remote source is temporarily unavailable. */
    });

    return () => controller.abort();
  }, []);
  const { session } = useBackend();
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    if (!session) { setFavorites([]); return; }
    void requireSupabase().from("favorites").select("catalog_product_id").eq("profile_id", session.id)
      .then(({ data, error }) => { if (error) console.error("IDEA favorites load failed", error); else setFavorites((data || []).map((row) => row.catalog_product_id)); });
  }, [session?.id]);
  const [quote, setQuote] = usePersisted<QuoteItem[]>("idea.quote", []);
  const [compare, setCompare] = usePersisted<string[]>("idea.compare", []);

  const value = useMemo<StoreCtx>(
    () => ({
      products,
      favorites,
      quote,
      compare,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite: (id) => {
        if (!session) throw new Error("Sign in to save favorites.");
        const wasFavorite = favorites.includes(id);
        setFavorites((current) => wasFavorite ? current.filter((value) => value !== id) : [...current, id]);
        const query = requireSupabase().from("favorites");
        void (wasFavorite ? query.delete().eq("profile_id", session.id).eq("catalog_product_id", id) : query.insert({ profile_id: session.id, catalog_product_id: id }))
          .then(({ error }) => { if (error) { console.error("IDEA favorite update failed", error); void requireSupabase().from("favorites").select("catalog_product_id").eq("profile_id", session.id).then(({ data }) => setFavorites((data || []).map((row) => row.catalog_product_id))); } });
      },
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
    [products, favorites, quote, compare, session, setQuote, setCompare]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
