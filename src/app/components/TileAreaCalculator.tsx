import { useMemo, useState } from "react";
import type { Product } from "../data/types";
import { tilesForArea } from "../data/productIdentity";

/** Estimate only: box packing and factory dimensions must be confirmed. */
export function TileAreaCalculator({
  product,
  onAdd,
}: {
  product: Product;
  onAdd: (squareMetres: number) => void;
}) {
  const [area, setArea] = useState("10");
  const [unit, setUnit] = useState<"sqm" | "sqft">("sqm");
  const [waste, setWaste] = useState("10");
  const [sizeIndex, setSizeIndex] = useState("0");
  const sizes = product.sizes.filter(
    (size) => Number.isFinite(size.widthMm) && Number.isFinite(size.heightMm) &&
      (size.widthMm || 0) > 0 && (size.heightMm || 0) > 0,
  );
  const size = sizes[Number(sizeIndex)] || sizes[0];
  const sqm = Number(area) * (unit === "sqft" ? 0.09290304 : 1);
  const result = useMemo(
    () => size ? tilesForArea(sqm, size.widthMm!, size.heightMm!, Number(waste)) : null,
    [sqm, size, waste],
  );

  return (
    <section aria-label="Tile coverage calculator" style={{
      padding: "18px", marginBlock: "18px", border: "1px solid var(--idea-border-neutral)",
      background: "var(--idea-surface)", borderRadius: "var(--idea-radius-md)",
    }}>
      <h3 style={{ marginBottom: 12 }}>حاسبة البلاط · Tile Calculator</h3>
      <p style={{fontSize:12,color:"var(--idea-text-muted)",marginBottom:12}}>
        حساب تقديري من مقاس المصدر فقط؛ عدد البلاطات في الكرتونة وسعرها يتطلبان توثيق المصنع.
      </p>
      <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"end"}}>
        <label>المساحة
          <input aria-label="Required area" type="number" min="0.001" step="0.001"
            value={area} onChange={(e) => setArea(e.target.value)}
            style={{display:"block",width:112,padding:9}} />
        </label>
        <label>الوحدة
          <select aria-label="Area unit" value={unit} onChange={(e) => setUnit(e.target.value as "sqm"|"sqft")}
            style={{display:"block",padding:10}}>
            <option value="sqm">متر مربع m²</option>
            <option value="sqft">قدم مربع ft²</option>
          </select>
        </label>
        <label>هالك %
          <select aria-label="Waste percent" value={waste} onChange={(e) => setWaste(e.target.value)}
            style={{display:"block",padding:10}}>
            <option value="0">0%</option><option value="5">5%</option>
            <option value="10">10%</option><option value="15">15%</option>
          </select>
        </label>
        {sizes.length > 0 && <label>مقاس البلاطة (من المصدر)
          <select aria-label="Tile size" value={sizeIndex} onChange={e=>setSizeIndex(e.target.value)}
            style={{display:"block",padding:10,maxWidth:220}}>
            {sizes.map((s,i)=><option key={s.id} value={i}>{s.originalSourceValue || s.label}</option>)}
          </select>
        </label>}
      </div>
      {result ? <>
        <p role="status" style={{marginBlock:"16px 8px"}}>
          المساحة شاملة الهالك: <b>{result.requestedSqm.toFixed(2)} م²</b> ·
          عدد البلاطات التقديري: <b>{result.tiles}</b>
        </p>
        <button type="button" onClick={() => onAdd(sqm)} style={{
          padding:"11px 18px",borderRadius:"var(--idea-radius-full)",
          border:"1px solid var(--idea-gold)",color:"var(--idea-gold-bright)",
          background:"var(--idea-gold-soft)",cursor:"pointer",
        }}>إضافة المساحة لطلب عرض السعر</button>
      </> : <p role="status" style={{marginBlock:16}}>
        المقاس أو المساحة غير صالحين للحساب. يُرجى توثيق أبعاد المصنع أولًا.
      </p>}
    </section>
  );
}