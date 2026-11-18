import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../data/types";
import { ART_CERAMIC_PRODUCTS } from "../data/artceramicImport";
import { fetchAbaElMozahemProducts } from "../data/abaElMozahemImport";
import { useBackend } from "../backend/db";
import { apiFetch } from "../backend/apiClient";
import { applyAdminOverride, normalizeAdminOverride, type AdminOverride } from "../data/catalogueOverrides";

export interface QuoteItem {
  productId: string;
  quantity: number;
  unit: "sqm" | "pieces";
}

interface StoreCtx {
  products: Product[];
  adminProducts: Product[];
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
  const [rawProducts, setRawProducts] = useState<Product[]>(() => ART_CERAMIC_PRODUCTS);
  const [overrides, setOverrides] = useState<Map<string, AdminOverride>>(new Map());

  useEffect(() => {
    fetchAbaElMozahemProducts()
      .then((incoming) =>
        setRawProducts((current) => [
          ...current,
          ...incoming.filter((product) => !current.some((existing) => existing.id === product.id)),
        ])
      )
      .catch(() => {
        /* Imports stay staged */
      });
  }, []);

  useEffect(() => {
    let active = true;
    const fetchOverrides = async () => {
      try {
        const data = await apiFetch<any[]>("/api/catalogue/overrides");
        if (!active || !Array.isArray(data)) return;
        setOverrides(new Map(data.map((row) => [row.product_id, normalizeAdminOverride(row)])));
      } catch {
        // Public site continues seamlessly with static approved catalogue
      }
    };
    void fetchOverrides();
    window.addEventListener("idea:catalogue-updated", fetchOverrides);
    return () => {
      active = false;
      window.removeEventListener("idea:catalogue-updated", fetchOverrides);
    };
  }, []);

  const adminProducts = useMemo(
    () =>
      rawProducts.map((product) => {
        const correction = overrides.get(product.id);
        return correction ? applyAdminOverride(product, correction) : product;
      }),
    [rawProducts, overrides]
  );

  const products = useMemo(
    () =>
      adminProducts.filter(
        (product) => product.approved && overrides.get(product.id)?.visible !== false
      ),
    [adminProducts, overrides]
  );

  const { session } = useBackend();
  const [favorites, setFavorites] = useState<string[]>([]);

  useEffect(() => {
    if (!session) {
      setFavorites([]);
      return;
    }
    void apiFetch<string[]>("/api/favorites", { authRequired: true })
      .then((data) => {
        if (Array.isArray(data)) setFavorites(data);
      })
      .catch((error) => console.error("IDEA favorites load failed:", error));
  }, [session?.id]);

  const [quote, setQuote] = usePersisted<QuoteItem[]>("idea.quote", []);
  const [compare, setCompare] = usePersisted<string[]>("idea.compare", []);

  const value = useMemo<StoreCtx>(
    () => ({
      products,
      adminProducts,
      favorites,
      quote,
      compare,
      isFavorite: (id) => favorites.includes(id),
      toggleFavorite: (id) => {
        if (!session) throw new Error("Sign in to save favorites.");
        const wasFavorite = favorites.includes(id);
        setFavorites((current) =>
          wasFavorite ? current.filter((value) => value !== id) : [...current, id]
        );
        const req = wasFavorite
          ? apiFetch(`/api/favorites/${encodeURIComponent(id)}`, {
              method: "DELETE",
              authRequired: true,
            })
          : apiFetch("/api/favorites", {
              method: "POST",
              body: { productId: id },
              authRequired: true,
            });
        void req.catch(() => {
          void apiFetch<string[]>("/api/favorites", { authRequired: true })
            .then((data) => setFavorites(Array.isArray(data) ? data : []))
            .catch(() => {});
        });
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
        setQuote((q) =>
          q.map((i) => (i.productId === id ? { ...i, quantity: Math.max(1, qty) } : i))
        ),
      removeFromQuote: (id) => setQuote((q) => q.filter((i) => i.productId !== id)),
      clearQuote: () => setQuote([]),
    }),
    [products, adminProducts, favorites, quote, compare, session, setQuote, setCompare]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useStore must be used within StoreProvider");
  return c;
}
