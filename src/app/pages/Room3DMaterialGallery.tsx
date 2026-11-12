import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Search, X } from "lucide-react";
import type { Product, ProductSize, Locale } from "../data/types";
import surfaceMaterials from "../data/surfaceMaterials.json";
import { localMaterialFace } from "../data/localMaterialFace";
import "./Room3DMaterialGallery.css";

export type MaterialSurface = "floor" | "back" | "left" | "right";
type Category = "all" | "ceramics" | "porcelain" | "tiles" | "marble";
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
const categories:Category[]=["all","ceramics","porcelain","tiles","marble"];
const materialCopy={
  en:{title:"Original tile and slab materials",count:"verified materials",all:"All",ceramics:"Ceramic",porcelain:"Porcelain",tiles:"Tiles",marble:"Marble",search:"Search material, brand or model",apply:"Apply to surface",clear:"Clear selected surface",none:"No source-backed tile faces with verified dimensions for this selection.",more:"Load more materials",selected:"Applied",size:"Original size",scale:"Only available, source-backed materials are shown. Sizes are physical repeats, not manufacturer stock guarantees.",floor:"Floor",back:"Back wall",left:"Left wall",right:"Right wall",surface:"Selected surface",navigation:"Scroll vertically, use Shift + mouse wheel for horizontal movement, or use the arrows.",leftArrow:"Scroll left",rightArrow:"Scroll right",upArrow:"Scroll up",downArrow:"Scroll down",allCount:"Matching materials"},
  ar:{title:"صور البلاطات والخامات الأصلية",count:"خامة بمقاسات موثقة",all:"الكل",ceramics:"سيراميك",porcelain:"بورسلين",tiles:"بلاط",marble:"رخام",search:"ابحث عن خامة أو شركة أو موديل",apply:"ركّب على السطح",clear:"إزالة خامة السطح",none:"مفيش صور خامات بأبعاد موثقة مطابقة للاختيار ده.",more:"تحميل خامات أكتر",selected:"مركّبة",size:"المقاس الأصلي",scale:"المعروض خامات حقيقية مسجّلة بالمصدر فقط. التكرار بالمقاس الفعلي لا يعني تأكيد المخزون.",floor:"الأرضية",back:"الحيطة الخلفية",left:"الحيطة اليسار",right:"الحيطة اليمين",surface:"السطح المختار",navigation:"حرّك بالماوس فوق وتحت، وShift مع عجلة الماوس يمين وشمال، أو استخدم الأسهم.",leftArrow:"حرّك شمال",rightArrow:"حرّك يمين",upArrow:"اطلع فوق",downArrow:"انزل تحت",allCount:"الخامات المطابقة"},
  fr:{title:"Matériaux réels : carreaux et dalles",count:"matériaux vérifiés",all:"Tous",ceramics:"Céramique",porcelain:"Grès cérame",tiles:"Carrelage",marble:"Marbre",search:"Chercher matériau, marque ou modèle",apply:"Appliquer",clear:"Effacer la surface",none:"Aucun matériau de source vérifiée pour cette sélection.",more:"Charger plus de matériaux",selected:"Appliqué",size:"Format d'origine",scale:"Seules les références disponibles et vérifiables sont affichées. Les formats ne prouvent pas la disponibilité en stock.",floor:"Sol",back:"Mur arrière",left:"Mur gauche",right:"Mur droit",surface:"Surface choisie",navigation:"Défilez verticalement ; Maj + molette pour l'horizontale, ou utilisez les flèches.",leftArrow:"Vers la gauche",rightArrow:"Vers la droite",upArrow:"Vers le haut",downArrow:"Vers le bas",allCount:"Matériaux correspondants"}
} as const;
function matchesCategory(product:Product,category:Category):boolean {
  if(category==="all")return true;
  if(category==="tiles")return product.collection==="ceramics"||product.collection==="porcelain";
  return product.collection===category;
}
export function Room3DMaterialGallery({products,locale,surface,activeProductId,activeSizeId,onApply,onClear}:{
  products:Product[];locale:Locale;surface:MaterialSurface;activeProductId:string;activeSizeId:string;
  onApply:(product:Product,sizeId:string)=>void;onClear:()=>void;
}){
  const t=materialCopy[locale];
  const [category,setCategory]=useState<Category>("all");
  const [query,setQuery]=useState("");
  const [limit,setLimit]=useState(48);
  const [sizeOptions,setSizeOptions]=useState<Record<string,string>>({});
  const scroller=useRef<HTMLDivElement>(null);
  const sentinel=useRef<HTMLDivElement>(null);
  const drag=useRef<{x:number;y:number;left:number;top:number}|null>(null);
  const filtered=useMemo(()=>{
    const term=query.trim().toLocaleLowerCase();
    return products.filter(p=>matchesCategory(p,category)&&(!term||
      [p.name.en,p.name.ar,p.name.fr,p.brand,p.model,p.code].some(v=>String(v??"").toLocaleLowerCase().includes(term))));
  },[products,category,query]);
  const counts=useMemo(()=>Object.fromEntries(categories.map(key=>[key,products.filter(p=>matchesCategory(p,key)).length])) as Record<Category,number>,[products]);
  const shown=filtered.slice(0,limit);
  const more=()=>setLimit(prev=>Math.min(filtered.length,prev+48));
  const chooseCategory=(value:Category)=>{
    setCategory(value);
    setLimit(48);
    if(scroller.current){scroller.current.scrollTop=0;scroller.current.scrollLeft=0;}
  };
  useEffect(()=>{
    const root=scroller.current,target=sentinel.current;
    if(!root||!target||shown.length>=filtered.length||typeof IntersectionObserver==="undefined")return;
    const observer=new IntersectionObserver(entries=>{
      if(entries.some(entry=>entry.isIntersecting))setLimit(prev=>Math.min(filtered.length,prev+48));
    },{root,rootMargin:"80px",threshold:.01});
    observer.observe(target);
    return ()=>observer.disconnect();
  },[shown.length,filtered.length]);

  useEffect(()=>{
    const root=scroller.current;
    if(!root)return;
    const onWheel=(ev:WheelEvent)=>{
      if(!ev.shiftKey)return;
      ev.preventDefault();
      root.scrollLeft+=ev.deltaY+ev.deltaX;
    };
    root.addEventListener("wheel",onWheel,{passive:false});
    return ()=>root.removeEventListener("wheel",onWheel);
  },[]);

  const scroll=(x:number,y:number)=>scroller.current?.scrollBy({left:x,top:y,behavior:"smooth"});
  return <aside className="idea-room3d-side idea-room3d-material-catalog" aria-label={t.title}>
    <h2>{t.title}<small>{products.length} {t.count}</small></h2>
    <p className="idea-room3d-material-caption">{t.surface}: <strong>{t[surface]}</strong></p>
    <div className="idea-room3d-material-tabs" role="group" aria-label={t.title}>
      {categories.map(cat=><button key={cat} type="button" className={category===cat?"active":""} aria-pressed={category===cat}
        onClick={()=>chooseCategory(cat)}>{t[cat]} <small>{counts[cat]}</small></button>)}
    </div>
    <label className="idea-room3d-material-search"><Search size={16}/>
      <input type="search" placeholder={t.search} value={query} aria-label={t.search}
        onChange={e=>{setQuery(e.target.value);setLimit(48);if(scroller.current){scroller.current.scrollTop=0;scroller.current.scrollLeft=0;}}}/>
    </label>
    {activeProductId&&<button type="button" className="idea-room3d-material-clear" onClick={onClear}><X size={14}/>{t.clear}</button>}
    <div className="idea-room3d-scrollbar-tools">
      <small>{t.allCount}: {filtered.length} · {t.navigation}</small>
      <div>
        <button type="button" aria-label={t.leftArrow} onClick={()=>scroll(-440,0)}><ArrowLeft size={17}/></button>
        <button type="button" aria-label={t.rightArrow} onClick={()=>scroll(440,0)}><ArrowRight size={17}/></button>
        <button type="button" aria-label={t.upArrow} onClick={()=>scroll(0,-440)}><ArrowUp size={17}/></button>
        <button type="button" aria-label={t.downArrow} onClick={()=>scroll(0,440)}><ArrowDown size={17}/></button>
      </div>
    </div>
    <div className="idea-room3d-material-viewport" ref={scroller} tabIndex={0} aria-label={t.title}
      onPointerDown={event=>{
        if(event.pointerType!=="mouse"||event.button!==0||(event.target as Element).closest("button,input,select,a"))return;
        drag.current={x:event.clientX,y:event.clientY,left:event.currentTarget.scrollLeft,top:event.currentTarget.scrollTop};
        event.currentTarget.setPointerCapture(event.pointerId);
      }}
      onPointerMove={event=>{
        if(!drag.current)return;
        event.currentTarget.scrollLeft=drag.current.left-(event.clientX-drag.current.x);
        event.currentTarget.scrollTop=drag.current.top-(event.clientY-drag.current.y);
      }}
      onPointerUp={event=>{drag.current=null;if(event.currentTarget.hasPointerCapture(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);}}
      onPointerCancel={()=>{drag.current=null;}}>
      <div className="idea-room3d-material-grid">
        {shown.map(product=>{
          const sizes=verifiedSizes(product),image=materialFace(product);
          const chosen=sizeOptions[product.id]&&sizes.some(s=>s.id===sizeOptions[product.id])?sizeOptions[product.id]:sizes[0].id;
          const selectedSize=sizes.find(size=>size.id===chosen)!;
          const previewWidth=Math.min(140,180*selectedSize.widthMm!/selectedSize.heightMm!);
          const previewHeight=previewWidth*selectedSize.heightMm!/selectedSize.widthMm!;
          const isActive=activeProductId===product.id&&activeSizeId===chosen;
          return <article className={"idea-room3d-material-card"+(isActive?" is-selected":"")} key={product.id}>
            <div className="idea-room3d-material-face">
              <img src={image!} alt={product.name[locale]} loading="lazy" style={{width:previewWidth,height:previewHeight}}/>
            </div>
            <strong title={product.name[locale]}>{product.name[locale]}</strong>
            <small>{product.manufacturer||product.brand}</small>
            <label>{t.size}<select value={chosen} aria-label={product.name[locale]+" - "+t.size}
              onChange={e=>setSizeOptions(prev=>({...prev,[product.id]:e.target.value}))}>
              {sizes.map(size=><option value={size.id} key={size.id}>{size.widthMm} × {size.heightMm} mm</option>)}
            </select></label>
            <button type="button" aria-pressed={isActive} onClick={()=>onApply(product,chosen)}>{isActive?t.selected:t.apply}</button>
          </article>;
        })}
      </div>
      <div className="idea-room3d-material-load" ref={sentinel}>
        {filtered.length>limit&&<button type="button" className="idea-room3d-material-more" onClick={more}>{t.more} ({filtered.length-limit})</button>}
      </div>
    </div>
    {!filtered.length&&<p className="idea-room3d-empty">{t.none}</p>}
    <p className="idea-room3d-disclaimer">{t.scale}</p>
  </aside>;
}
