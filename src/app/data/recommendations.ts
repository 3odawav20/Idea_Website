import type { Product } from "./types";

/** Explainable metadata similarity; not visual AI or unverified price matching. */
export function similarProducts(target:Product, catalog:Product[], limit=4):Product[]{
  const sizeId=(s:Product["sizes"][number])=>s.widthMm&&s.heightMm
    ? String(s.widthMm)+"x"+String(s.heightMm) : s.label.toLocaleLowerCase();
  const score=(p:Product)=>{
    if(p.collection!==target.collection)return -1;
    let points=0;
    if(target.family&&p.family===target.family)points+=12;
    if(p.brand&&p.brand.toLowerCase()===target.brand.toLowerCase())points+=5;
    if(p.texture&&target.texture&&p.texture.toLowerCase()===target.texture.toLowerCase())points+=5;
    if(p.finish&&target.finish&&p.finish.toLowerCase()===target.finish.toLowerCase())points+=4;
    if(p.application&&target.application&&p.application.toLowerCase()===target.application.toLowerCase())points+=2;
    const dims=new Set(target.sizes.map(sizeId));
    if(p.sizes.some(s=>dims.has(sizeId(s))))points+=6;
    const colors=new Set((target.colors||[]).map(c=>c.toLowerCase()));
    points+=(p.colors||[]).filter(c=>colors.has(c.toLowerCase())).length*2;
    return points;
  };
  return catalog.filter(p=>p.id!==target.id&&p.approved&&p.status!=="sample")
    .map(p=>({p,rank:score(p)})).filter(row=>row.rank>=0)
    .sort((a,b)=>b.rank-a.rank||a.p.name.en.localeCompare(b.p.name.en))
    .slice(0,Math.max(0,limit)).map(row=>row.p);
}
