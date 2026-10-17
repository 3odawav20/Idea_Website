import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { Building2, Phone } from "lucide-react";
import { accountRequest } from "../backend/accountsApi";
import { Container, Section, Button } from "../components/ui";
import { Panel } from "../components/dash";
import { useMembershipText } from "./Membership";
import { useStore } from "../store/store";
import { ShoppingCart } from "lucide-react";
import { TryMaterialLink } from '../components/TryMaterialLink';

export function CompanyShowcase() {
  const {addToQuote,quote}=useStore();
  const text = useMembershipText(), { companyId } = useParams();
  const [companies, setCompanies] = useState<any[]>([]), [products, setProducts] = useState<any[]>([]), [state, setState] = useState<'loading'|'ready'|'error'>('loading');
  useEffect(() => {
    let active = true; setState('loading');
    const load = async () => {
      const response=await fetch(import.meta.env.BASE_URL+'api/accounts.php?action=showrooms'+(companyId?'&company='+encodeURIComponent(companyId):''));
      if(!response.ok)throw new Error('Unavailable');const {companies:data,products:listings}=await response.json();
      if(active){setCompanies(data||[]);setProducts(listings);setState('ready');}
    };
    void load().catch(()=>{if(active)setState('error');});return()=>{active=false;};
  },[companyId]);
  return <Section><Container>
    <div style={{marginBottom:32}}><div className="idea-eyebrow">{text('IDEA SUPPLIERS','شركات IDEA')}</div><h1 className="idea-display" style={{fontSize:'var(--idea-text-2xl)'}}>{text('Company showrooms','متاجر الشركات')}</h1><p>{text('Discover verified suppliers and their published products.','اكتشف الشركات المعتمدة ومنتجاتها المنشورة.')}</p></div>
    {state==='loading'&&<p role="status">{text('Loading showrooms…','جارٍ تحميل المتاجر…')}</p>}
    {state==='error'&&<Panel><p role="alert">{text('Showrooms are currently unavailable. Please try again later.','المتاجر غير متاحة حاليًا. حاول لاحقًا.')}</p></Panel>}
    {state==='ready'&&!companies.length&&<Panel><p>{text('Company showrooms will appear here after verification.','متاجر الشركات هتظهر هنا بعد اعتمادها.')}</p><Link to="/register/business">{text('Register your company','سجّل شركتك')}</Link></Panel>}
    {companies.map(company=><div key={company.id} style={{marginBottom:40}}>
      <Panel style={{marginBottom:20}}><Building2 size={28} color="var(--idea-gold)"/><h2 style={{fontSize:'var(--idea-text-xl)',margin:'12px 0'}}><Link to={`/suppliers/${company.id}`}>{company.public_name}</Link></h2>{company.description&&<p>{company.description}</p>}{company.phone&&<a href={`tel:${company.phone.replace(/[^+0-9]/g,'')}`} style={{display:'inline-flex',gap:8,alignItems:'center'}}><Phone size={16}/><bdi>{company.phone}</bdi></a>}</Panel>
      <div className="idea-access-grid">{products.filter(item=>item.company_id===company.id).map(item=><Panel key={item.id}>
        {/^(https?:\/\/|\/)/.test(item.specifications?.image||'')&&<img src={item.specifications.image} alt="" style={{width:'100%',aspectRatio:'4/3',objectFit:'contain',background:'var(--idea-surface-2)',borderRadius:8}}/>}
        <h3 style={{fontSize:'var(--idea-text-lg)',margin:'16px 0 8px'}}>{item.title}</h3><p>{item.specifications?.brand}</p><p>{item.specifications?.dimensions}</p>{item.specifications?.description&&<p style={{color:'var(--idea-text-muted)',lineHeight:1.8}}>{item.specifications.description}</p>}
        <Button onClick={()=>{
          let cache:any={};try{cache=JSON.parse(localStorage.getItem('idea.supplierProducts')||'{}');}catch{}
          cache[item.id]=item;localStorage.setItem('idea.supplierProducts',JSON.stringify(cache));addToQuote('supplier:'+item.id,'sqm');
        }}><ShoppingCart size={16}/>{quote.some(row=>row.productId==='supplier:'+item.id)?text('Added to quote cart','أُضيف لسلة الأسعار'):text('Add to quote cart','أضف لسلة الأسعار')}</Button>
        <Link to="/request-quote/new" style={{display:'inline-block',marginTop:12}}>{text('Open quotation cart','فتح سلة طلبات الأسعار')}</Link>
        {['ceramic','porcelain','marble','granite'].includes(item.specifications?.material) && item.specifications?.image && <TryMaterialLink supplierId={item.id} />}
      </Panel>)}</div>
    </div>)}
  </Container></Section>;
}
