import {platformUrl} from '../backend/platformApi';
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useStore } from "../store/store";
import { generationAccess, accountEndpoint } from "../backend/accountsApi";
import { useBackend } from "../backend/db";
import CeramicStudio from "../ceramic-studio/CeramicStudio.jsx";
import "../ceramic-studio/studio.css";
import { isSurfaceProduct } from '../components/TryMaterialLink';
import { useI18n } from '../i18n/i18n';

export function CeramicVisualizer() {
  const { products, addToQuote } = useStore();
  const { session } = useBackend();
  const restricted = Boolean(session && session.role !== "customer");
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { locale } = useI18n();
  const requestedProduct = params.get("product");
  const supplierId = params.get('supplier');
  const [supplier, setSupplier] = useState<any>(null);
  const [supplierError, setSupplierError] = useState(false);
  useEffect(() => {
    setSupplier(null);setSupplierError(false);
    if (!supplierId) return;
    const controller = new AbortController();
    void fetch(`${accountEndpoint}?action=supplier-product&id=${encodeURIComponent(supplierId)}`, { signal: controller.signal, cache: 'no-store' })
      .then(async response => { if (!response.ok) throw Error(); const item = await response.json();
        if (!['ceramic','porcelain','marble','granite'].includes(item.specifications?.material) || !item.specifications?.image) throw Error();
        if (!controller.signal.aborted) setSupplier(item);
      }).catch(() => { if (!controller.signal.aborted) setSupplierError(true); });
    return () => controller.abort();
  }, [supplierId]);
  const options = useMemo(
    () =>
      products
        .filter(
          (p) =>
            isSurfaceProduct(p) &&
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
  const supplierMaterial = supplier ? { id: `supplier:${supplier.id}`, name: supplier.title, kind: 'كتالوج IDEA',
    category: ({ceramic:'سيراميك',porcelain:'بورسلين',marble:'رخام',granite:'حجر طبيعي'} as Record<string,string>)[supplier.specifications.material],
    tileSize: supplier.specifications.dimensions, tone: supplier.specifications.brand, src: supplier.specifications.image, product: true } : null;
  const materials = useMemo(() => supplierMaterial ? [supplierMaterial,...options] : options, [supplier,options]);

  const authenticate = generationAccess;

  if (supplierId && (!supplier || supplier.id !== supplierId)) return <div role={supplierError ? 'alert' : 'status'} style={{padding:48,textAlign:'center'}}>
    {supplierError ? (locale==='ar'?'الخامة غير متاحة للتجربة حاليًا. ارجع لمتجر الشركة واختار منتجًا منشورًا له صورة.':'This material is unavailable. Choose a published product with a photo from the company showroom.') : (locale==='ar'?'جارٍ تجهيز الخامة اللي اخترتها…':'Preparing your selected material…')}
  </div>;

  return (
    <CeramicStudio
      key={params.get("revision") || supplierId || requestedProduct || "studio"}
      initialRoom={params.get("revision") ? platformUrl("ai-image",params.get("revision")!) : null}
      materialOptions={materials}
      initialMaterialId={supplierMaterial?.id || requestedProduct}
      authenticate={authenticate}
      generationDisabled={restricted}
      savedPreview={import.meta.env.DEV && params.get("preview") === "amazon-room" ? `${import.meta.env.BASE_URL}ceramic-studio/private-previews/amazon-room.json` : null}
      onRequestQuote={(id: string) => {
        if (supplier && id === `supplier:${supplier.id}`) {
          let cache:Record<string,any>={};try{cache=JSON.parse(localStorage.getItem('idea.supplierProducts')||'{}');}catch{}
          cache[supplier.id]=supplier;localStorage.setItem('idea.supplierProducts',JSON.stringify(cache));
        }
        addToQuote(id, "sqm");
        navigate("/request-quote/new");
      }}
    />
  );
}
