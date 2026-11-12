import { useMemo, useState } from "react";
import { Search, X } from "lucide-react";
import type { Product, ProductSize, Locale } from "../data/types";
import surfaceMaterials from "../data/surfaceMaterials.json";
import { localMaterialFace } from "../data/localMaterialFace";
import "./Room3DMaterialGallery.css";

export type MaterialSurface = "floor" | "back" | "left" | "right";
type Category = "all" | "ceramics" | "porcelain" | "marble";
const localFaces = new Map((surfaceMaterials as {id:string;image:string}[]).map(item=>[item.id,item.image]));
const sizeOk = (size:ProductSize) => Number.isFinite(size.widthMm) && Number.isFinite(size.heightMm) && (size.widthMm ?? 0)>0 && (size.heightMm ?? 0)>0;
export const verifiedSizes = (product:Product) => product.sizes.filter(sizeOk);

/** Use actual tile-face images only; never a lifestyle, showroom or room photograph. */
export function materialFace(product:Product):string|null {
  const cached = localMaterialFace(product.id);
  if (cached) return cached;
  const local=localFaces.get(product.id);
  if(local){
    const base=window.location.pathname.startsWith("/idea-next/")?"/idea-next":import.meta.env.BASE_URL.replace(/\/$/,"");
    return base+local;
  }
  const face=product.source?.original?.tiles?.find(src => /^https:\/\//.test(src)||src.startsWith("/"));
  return face??null;
}
const categories:Category[]=["all","ceramics","porcelain","marble"];
const copy={
  en:{title:"Original tile and slab materials",count:"materials with verified sizes",all:"All",ceramics:"Ceramic",porcelain:"Porcelain",marble:"Marble",search:"Search material, brand or model",apply:"Apply to surface",clear:"Clear selected surface",none:"No source-backed tile face with verified dimensions in this category.",more:"Show more materials",selected:"Applied",size:"Original size",scale:"Tiles repeat at their listed real dimensions; no lifestyle photos.",floor:"Floor",back:"Back wall",left:"Left wall",right:"Right wall",surface:"Selected surface"},
  ar:{title:"صور البلاطات والخامات الأصلية",count:"خامة بمقاسات موثقة",all:"الكل",ceramics:"سيراميك",porcelain:"بورسلين",marble:"رخام",search:"ابحث عن خامة أو شركة أو موديل",apply:"ركّب على السطح",clear:"إزالة خامة السطح",none:"مفيش صورة وجه بلاطة ومقاس موثق للقسم ده حاليًا.",more:"عرض خامات أكثر",selected:"مركّبة",size:"المقاس الأصلي",scale:"تكرار البلاطات بمقاسها الحقيقي من المصدر، من غير صور غرف أو ديكور.",floor:"الأرضية",back:"الحيطة الخلفية",left:"الحيطة اليسار",right:"الحيطة اليمين",surface:"السطح المختار"},
  fr:{title:"Matériaux réels : carreaux et dalles",count:"matériaux aux dimensions vérifiées",all:"Tous",ceramics:"Céramique",porcelain:"Grès cérame",marble:"Marbre",search:"Chercher matériau, marque ou modèle",apply:"Appliquer",clear:"Effacer la surface",none:"Aucune image de carreau avec dimensions vérifiées dans cette catégorie.",more:"Afficher davantage",selected:"Appliqué",size:"Format d'origine",scale:"Répétition selon les dimensions réelles du produit, sans photos de pièces.",floor:"Sol",back:"Mur arrière",left:"Mur gauche",right:"Mur droit",surface:"Surface choisie"}
} as const;

export function Room3DMaterialGallery({products,locale,surface,activeProductId,activeSizeId,onApply,onClear}:{
  products:Product[];locale:Locale;surface:MaterialSurface;activeProductId:string;activeSizeId:string;
  onApply:(product:Product,sizeId:string)=>void;onClear:()=>void;
}){
  const t=copy[locale], [category,setCategory]=useState<Category>("all"), [query,setQuery]=useState(""),[limit,setLimit]=useState(36);
  const [sizeOptions,setSizeOptions]=useState<Record<string,string>>({});
  const filtered=useMemo(()=>{
    const term=query.trim().toLocaleLowerCase();
    return products.filter(p=>(category==="all"||p.collection===category)&&(!term||
      [p.name.en,p.name.ar,p.name.fr,p.brand,p.model,p.code].some(value=>String(value??"").toLocaleLowerCase().includes(term))));
  },[products,category,query]);
  const shown=filtered.slice(0,limit);
  return <aside className="idea-room3d-side idea-room3d-material-catalog" aria-label={t.title}>
    <h2>{t.title}<small>{products.length} {t.count}</small></h2>
    <p className="idea-room3d-material-caption">{t.surface}: <strong>{t[surface]}</strong></p>
    <div className="idea-room3d-material-tabs" role="group" aria-label={t.title}>
      {categories.map(cat=><button key={cat} type="button" className={category===cat?"active":""} aria-pressed={category===cat}
        onClick={()=>{setCategory(cat);setLimit(36);}}>{t[cat]}</button>)}
    </div>
    <label className="idea-room3d-material-search"><Search size={16}/>
      <input type="search" placeholder={t.search} value={query} aria-label={t.search}
        onChange={e=>{setQuery(e.target.value);setLimit(36);}}/>
    </label>
    {activeProductId&&<button type="button" className="idea-room3d-material-clear" onClick={onClear}><X size={14}/>{t.clear}</button>}
    <div className="idea-room3d-material-grid">
      {shown.map(product=>{
        const sizes=verifiedSizes(product),image=materialFace(product);
        const chosen=sizeOptions[product.id] && sizes.some(s=>s.id===sizeOptions[product.id])?sizeOptions[product.id]:sizes[0].id;
        const selectedSize=sizes.find(size=>size.id===chosen)!;
        const isActive=activeProductId===product.id&&activeSizeId===chosen;
        return <article className={"idea-room3d-material-card"+(isActive?" is-selected":"")} key={product.id}>
          <div className="idea-room3d-material-face" style={{aspectRatio:String(selectedSize.widthMm)+"/"+String(selectedSize.heightMm)}}>
            <img src={image!} alt={product.name[locale]} loading="lazy"/>
          </div>
          <strong title={product.name[locale]}>{product.name[locale]}</strong>
          <small>{product.manufacturer||product.brand}</small>
          <label>{t.size}<select value={chosen} aria-label={product.name[locale]+" - "+t.size}
            onChange={e=>setSizeOptions(old=>({...old,[product.id]:e.target.value}))}>
            {sizes.map(size=><option value={size.id} key={size.id}>{size.widthMm} × {size.heightMm} mm</option>)}
          </select></label>
          <button type="button" aria-pressed={isActive} onClick={()=>onApply(product,chosen)}>
            {isActive?t.selected:t.apply}
          </button>
        </article>;
      })}
    </div>
    {!filtered.length&&<p className="idea-room3d-empty">{t.none}</p>}
    {filtered.length>limit&&<button type="button" className="idea-room3d-material-more" onClick={()=>setLimit(value=>value+36)}>{t.more} ({filtered.length-limit})</button>}
    <p className="idea-room3d-disclaimer">{t.scale}</p>
  </aside>;
}
