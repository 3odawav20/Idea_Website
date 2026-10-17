import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { Inbox, Send, RefreshCw } from 'lucide-react';
import { accountRequest } from '../backend/accountsApi';
import { useBackend } from '../backend/db';
import { Panel, Field, inputStyle } from '../components/dash';
import { Button } from '../components/ui';
import { useMembershipText } from './Membership';

export function QuoteMailbox({ sent = false }: { sent?: boolean }) {
  const text=useMembershipText(),{session}=useBackend(),{pathname}=useLocation(),business=session?.role==='business';
  const [box,setBox]=useState<{requests:any[];quotes:any[];messages?:any[]}>({requests:[],quotes:[]}),[tab,setTab]=useState(sent?'sent':'inbox'),[selected,setSelected]=useState<any>(null),[state,setState]=useState<'loading'|'ready'|'error'>('loading');
  const [offer,setOffer]=useState({unit_price:'',quantity:'',shipping:'0',tax_percent:'0',delivery_days:'3',validity_days:'7',notes:''}),[sending,setSending]=useState(false),[notice,setNotice]=useState(false);
  const load=async()=>{try{setBox(await accountRequest('mailbox'));setState('ready');}catch{setState('error');}};
  useEffect(()=>{setTab(sent?'sent':'inbox');setSelected(null);void load();},[pathname,sent]);
  const money=(value:any)=>new Intl.NumberFormat('en-EG',{maximumFractionDigits:2}).format(Number(value));
  const unit=(value:string)=>({sqm:text('m²','م²'),pieces:text('pieces','قطعة'),ton:text('tonnes','طن'),kg:text('kg','كجم')}[value]||value);
  const isRequest=business?tab==='inbox':tab==='sent';const rows=isRequest?box.requests:box.quotes;
  const open=async(item:any)=>{setSelected(item);setOffer({unit_price:'',quantity:String(item.quantity),shipping:'0',tax_percent:'0',delivery_days:'3',validity_days:'7',notes:''});setNotice(false);if(tab==='inbox'){await accountRequest('read-message',{id:item.id}).catch(()=>{});void load();}};
  return <>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap',marginBottom:24}}><h1 className="idea-display" style={{fontSize:'var(--idea-text-xl)',margin:0}}>{text('Inbox & sent','الوارد والصادر')}</h1><Button size="sm" variant="ghost" onClick={()=>void load()}><RefreshCw size={16}/>{text('Refresh','تحديث')}</Button></div>
    <div style={{display:'flex',gap:10,marginBottom:24,flexWrap:'wrap'}}><Button variant={tab==='inbox'?'gold':'ghost'} onClick={()=>{setTab('inbox');setSelected(null);}}><Inbox size={17}/>{business?text('Incoming price requests','طلبات الأسعار الواردة'):text('Incoming quotations','عروض الأسعار الواردة')}</Button><Button variant={tab==='sent'?'gold':'ghost'} onClick={()=>{setTab('sent');setSelected(null);}}><Send size={17}/>{business?text('Sent quotations','بيانات الأسعار المرسلة'):text('Sent requests','طلباتي الصادرة')}</Button></div>
    {state==='loading'&&<p role="status">{text('Loading messages…','جارٍ تحميل الرسائل…')}</p>}
    {state==='error'&&<p role="alert">{text('Could not load messages. Please try again.','تعذّر تحميل الرسائل. حاول مرة أخرى.')}</p>}
    {state==='ready'&&!rows.length&&<Panel><p>{text('No messages here yet.','لا توجد رسائل هنا حتى الآن.')}</p>{!business&&<Link to="/products">{text('Browse products and request a price','تصفح المنتجات واطلب السعر')}</Link>}</Panel>}
    <div style={{display:'grid',gap:12}}>{rows.map(item=><button key={item.id} onClick={()=>void open(item)} style={{padding:20,border:'var(--idea-hairline)',borderRadius:12,background:selected?.id===item.id?'var(--idea-gold-soft)':'var(--idea-surface)',color:'var(--idea-text)',textAlign:'start',cursor:'pointer'}}>
      <strong>{item.product_title}</strong><div style={{display:'flex',justifyContent:'space-between',gap:10,flexWrap:'wrap',marginTop:8,fontSize:'var(--idea-text-sm)'}}><span>{money(item.quantity)} {unit(item.unit)}{!isRequest&&` · ${item.company_name||text('Your company','شركتك')}`}</span><span>{isRequest?!business?`${text('Suppliers notified','الشركات المستلمة')}: ${item.recipient_count}`:text('Quotation requested','مطلوب بيان سعر'):`${text('Total','الإجمالي')}: ${money(item.total)} ${text('EGP','ج.م')}`}</span></div>
    </button>)}</div>
    {selected&&<Panel style={{marginTop:24}}><h2 style={{fontSize:'var(--idea-text-lg)',marginBottom:16}}>{selected.product_title}</h2>
      {isRequest?<><p>{text('Requested quantity','الكمية المطلوبة')}: {money(selected.quantity)} {unit(selected.unit)}</p><p>{text('Delivery area','منطقة التوصيل')}: {selected.governorate}</p><p>{text('Destination','عنوان التوصيل')}: {selected.destination||'—'}</p><p>{text('Required date','الموعد المطلوب')}: {selected.delivery_date||'—'}</p><p style={{whiteSpace:'pre-wrap'}}>{selected.notes}</p>
        {!business&&Number(selected.recipient_count)===0&&<p role="status">{text('No verified supplier is currently listing this exact product. Your request is saved; newly published matching listings can receive it while it remains open.','لا يوجد حاليًا مورد معتمد يعرض نفس المنتج. طلبك محفوظ، ويمكن إرساله للمنتجات المطابقة التي تُنشر خلال مدة الطلب.')}</p>}
      </>:<><p>{text('Company','الشركة')}: {selected.company_name||text('Your company','شركتك')}</p><p>{text('Unit price','سعر الوحدة')}: {money(selected.unit_price)} {text('EGP','ج.م')} / {unit(selected.unit)}</p><p>{text('Shipping','الشحن')}: {money(selected.shipping)} {text('EGP','ج.م')}</p><p>{text('Tax','الضريبة')}: {selected.tax_percent}%</p><p>{text('Delivery within','التسليم خلال')}: {selected.delivery_days} {text('days','يوم')}</p><p>{text('Offer validity','صلاحية العرض')}: {selected.validity_days} {text('days','يوم')}</p><strong>{text('Total','الإجمالي')}: {money(selected.total)} {text('EGP','ج.م')}</strong><p style={{whiteSpace:'pre-wrap'}}>{selected.notes}</p></>}
      {business&&isRequest&&<form onSubmit={async event=>{event.preventDefault();setSending(true);setNotice(false);try{await accountRequest('price-quote',{request_id:selected.id,...Object.fromEntries(Object.entries(offer).map(([key,value])=>[key,key==='notes'?value:Number(value)]))});setNotice(true);await load();}catch{setState('error');}finally{setSending(false);}}}>
        <h3 style={{margin:'24px 0 16px'}}>{text('Send a price quotation','إرسال بيان سعر')}</h3><div className="idea-signup-fields">{([['unit_price','Unit price (EGP)','سعر الوحدة (ج.م)'],['quantity','Offered quantity','الكمية المعروضة'],['shipping','Shipping (EGP)','الشحن (ج.م)'],['tax_percent','Tax (%)','الضريبة (%)'],['delivery_days','Delivery days','عدد أيام التسليم'],['validity_days','Offer validity (days)','صلاحية العرض (بالأيام)']] as const).map(([key,en,ar])=><Field key={key} label={text(en,ar)}><input aria-label={text(en,ar)} type="number" required style={inputStyle} min={key==='quantity'?0.001:key==='validity_days'?1:0} step={key==='quantity'?0.001:key.includes('days')?1:0.01} max={key==='quantity'?Number(selected.quantity):key==='tax_percent'?100:key==='validity_days'?90:key==='delivery_days'?365:10000000} value={offer[key]} onChange={e=>setOffer(old=>({...old,[key]:e.target.value}))}/></Field>)}</div>
        <Field label={text('Quotation notes','ملاحظات بيان السعر')}><textarea style={inputStyle} value={offer.notes} onChange={e=>setOffer({...offer,notes:e.target.value})} maxLength={4000}/></Field><Button type="submit" disabled={sending}>{sending?text('Sending…','جارٍ الإرسال…'):text('Send quotation to customer','إرسال بيان السعر للعميل')}</Button>{notice&&<p role="status">{text('Your price quotation was sent to the customer.','تم إرسال بيان السعر إلى العميل.')}</p>}
      </form>}
    </Panel>}
    {!!box.messages?.length&&<Panel style={{marginTop:24}}><h2>{text('IDEA support replies','ردود إدارة IDEA')}</h2>{box.messages.map(message=><p key={message.id} style={{whiteSpace:'pre-wrap',borderBottom:'var(--idea-hairline)',paddingBottom:12}}>{message.body}</p>)}</Panel>}
  </>;
}
