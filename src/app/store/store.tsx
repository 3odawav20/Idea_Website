import {platformRequest} from '../backend/platformApi';
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Product } from "../data/types";
import { ART_CERAMIC_PRODUCTS } from "../data/artceramicImport";
import { fetchAbaElMozahemProducts } from "../data/abaElMozahemImport";
import { useBackend } from "../backend/db";
import { accountRequest } from "../backend/accountsApi";
import { supabase } from "../backend/supabaseClient";
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
  // Products imported from the source export. Unconfirmed fields stay empty.
  const [rawProducts, setRawProducts] = useState<Product[]>(() => ART_CERAMIC_PRODUCTS);
  const [overrides, setOverrides] = useState<Map<string, AdminOverride>>(new Map());
  useEffect(() => {
    fetchAbaElMozahemProducts()
      .then((incoming) => setRawProducts((current) => [...current, ...incoming.filter((product) => !current.some((existing) => existing.id === product.id))]))
      .catch(() => { /* Imports stay staged; no public approval is implied. */ });
  }, []);
  useEffect(() => {
    if (import.meta.env.VITE_ENABLE_LEGACY_SUPABASE !== 'true' || !supabase) return;
    let active = true;
    const fetchOverrides = async () => {
      const { data, error } = await supabase.from("catalogue_admin_overrides")
        .select("product_id,visible,name_en,brand,collection,image_url,source_proof_url,updated_at");
      if (!active) return;
      if (error) {
        // The dashboard reports missing schema; the public site keeps its static,
        // approved catalogue instead of failing or inventing data.
        console.warn("IDEA admin overrides unavailable:", error.message);
        return;
      }
      setOverrides(new Map((data || []).map(row => [row.product_id, normalizeAdminOverride(row)])));
    };
    void fetchOverrides();
    window.addEventListener("idea:catalogue-updated", fetchOverrides);
    return () => {
      active = false;
      window.removeEventListener("idea:catalogue-updated", fetchOverrides);
    };
  }, []);
  const adminProducts = useMemo(() => rawProducts.map(product => {
    const correction = overrides.get(product.id);
    return correction ? applyAdminOverride(product, correction) : product;
  }), [rawProducts, overrides]);
  // Static approval cannot be granted through a cosmetic admin override.
  const products = useMemo(() => adminProducts.filter(product =>
    product.approved && overrides.get(product.id)?.visible !== false
  ), [adminProducts, overrides]);
  const { session } = useBackend();
  const [favorites, setFavorites] = useState<string[]>([]);
  useEffect(() => {
    if (!session) { setFavorites([]); return; }
    void accountRequest('favorites').then(data=>setFavorites(data.favorites||[])).catch(()=>setFavorites([]));
  }, [session?.id]);
  const [quote, setQuote] = usePersisted<QuoteItem[]>("idea.quote", []);
  const [compare, setCompare] = useState<string[]>([]);
  useEffect(()=>{let active=true;setCompare([]);if(session)void platformRequest('comparisons').then(r=>{if(active)setCompare(r.products);}).catch(()=>{});return()=>{active=false;};},[session?.id]);

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
        setFavorites((current) => wasFavorite ? current.filter((value) => value !== id) : [...current, id]);
        void accountRequest('favorite',{product_id:id,active:!wasFavorite}).catch(()=>setFavorites(current=>wasFavorite?[...new Set([...current,id])]:current.filter(value=>value!==id)));
      },
      toggleCompare: (id) => {if(!session)return;const before=compare;const active=!compare.includes(id);if(active&&compare.length>=4)return;setCompare(active?[...compare,id]:compare.filter(x=>x!==id));void platformRequest('comparison-save',{product_id:id,active}).catch(()=>setCompare(before));},
      addToQuote: (id, unit) =>
        setQuote((q) =>
          q.some((i) => i.productId === id)
            ? q
            : [...q, { productId: id, quantity: unit === "sqm" ? 10 : 1, unit }]
        ),
      updateQuoteQty: (id, qty) =>
        setQuote((q) => q.map((i) => (i.productId === id ? { ...i, quantity: Number.isFinite(qty)?Math.min(1000000,Math.max(0.001,qty)):1 } : i))),
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
