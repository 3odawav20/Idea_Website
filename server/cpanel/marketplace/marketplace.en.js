(() => {
"use strict";
const API="/api/marketplace.php";
const $=id=>document.getElementById(id);
const state={user:null,csrf:"",companies:[],selected:null,products:[],staff:[],sales:null,packages:[],announcements:[],ads:[],page:"overview",search:[]};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const egp=x=>Number.isFinite(Number(x))?new Intl.NumberFormat("en-EG",{maximumFractionDigits:2}).format(Number(x)/100)+" EGP":"—";
const cm=x=>Number.isFinite(Number(x))?new Intl.NumberFormat("en-EG",{maximumFractionDigits:1}).format(Number(x)/10):"—";
const status=x=>({verified:"Verified",submitted:"Under verification",suspended:"Suspended",approved:"Approved",pending:"Under review",draft:"Draft",published:"Published",rejected:"Rejected",needs_revision:"Revision needed"}[x]||x||"—");
const myRole=()=>state.selected?.my_role||"";
const companyId=()=>state.selected?.id||"";
const isAdmin=()=>state.user?.role==="admin";
const canCompany=()=>Boolean(companyId())&&Boolean(myRole());
const canStaff=()=>["admin","owner"].includes(myRole());
const userLang=()=>localStorage.getItem("idea-language")==="ar"?"ar":"en";
function notice(message,failed=false){const n=$("alert");n.textContent=message;n.className="alert"+(failed?" error":"");n.hidden=false;clearTimeout(notice.timer);notice.timer=setTimeout(()=>{n.hidden=true},6500);}
async function request(action,params={},data=null){
 const method=data===null?"GET":"POST";
 const url=API+"?action="+encodeURIComponent(action)+(method==="GET"&&Object.keys(params).length?"&"+new URLSearchParams(params):"");
 const response=await fetch(url,{method,credentials:"same-origin",headers:data===null?{}:{"Content-Type":"application/json","X-CSRF-Token":state.csrf},body:data===null?undefined:JSON.stringify(data),cache:"no-store"});
 const json=await response.json().catch(()=>({error:"INVALID_SERVER_RESPONSE"}));
 if(!response.ok)throw new Error(json.error||"HTTP_"+response.status);
 return json;
}
function authMessage(){
 const box=$("identity");
 box.innerHTML='<h2>Protected information</h2><p class="warning">Admin and company access requires a verified IDEA account. Visitors may search approved products but cannot view private prices.</p><div class="quick"><a href="/login" class="back">Sign in</a><a href="/register" class="back">Create account</a></div>';
}
function renderRail(){
 const el=$("company-list");
 if(!state.user){el.innerHTML='<p class="dim">Please sign in</p>';return;}
 if(!state.companies.length){el.innerHTML='<p class="dim">No companies are available for this account</p>';return;}
 el.innerHTML=state.companies.map(c=>'<button type="button" class="company '+(companyId()===c.id?"active":"")+'" data-company="'+esc(c.id)+'"><span class="avatar">'+esc(c.public_name.slice(0,1))+'</span><span class="copy"><strong>'+esc(c.public_name)+'</strong><small>'+esc(status(c.status))+" · "+esc(c.products)+" products</small></span></button>").join("");
}
function renderOverview(){
 $("count-companies").textContent=String(state.companies.length);
 $("count-products").textContent=String(state.products.length);
 $("count-approved").textContent=String(state.products.filter(p=>p.approved_for_storefront).length);
 $("count-sales").textContent=state.sales?String(state.sales.rows.reduce((a,b)=>a+Number(b.orders_count||0),0)):"—";
 if(!state.user){authMessage();$("company-detail").textContent="Sign-in required";return;}
 $("identity").innerHTML="<h2>Welcome, "+esc(state.user.name)+"</h2><p class='dim'>Account: "+esc(state.user.role)+" · Company role: "+esc(myRole()||"None")+"</p>";
 if(!state.selected){$("company-detail").textContent="No company selected";return;}
 const c=state.selected;
 $("company-detail").innerHTML="<strong>"+esc(c.public_name)+"</strong><p>"+esc(c.legal_name)+"</p><p>Status: "+esc(status(c.status))+"</p><p>Registered owner: "+esc(c.owner_name)+"</p><small class='dim'>Registered products: "+esc(c.products)+"</small>";
 $("admin-suspend").hidden=!isAdmin();
  $("suspend-company").textContent=c.status==="suspended"?"Reinstate company after document review":"Suspend company";
}
const imgTag=p=>/^\/uploads\/company-products\/[a-f0-9]{32}\/[a-f0-9]{32}\.(png|jpg|webp)$/i.test(p.image_url||"")?'<img alt="'+esc(p.title)+'" loading="lazy" src="'+esc(p.image_url)+'">':"<span>▦</span>";
function card(p,privateView){
 const approved=Boolean(p.approved_for_storefront);
 const tools=privateView?'<div class="actions">'+
 '<button type="button" class="tiny secondary" data-edit="'+esc(p.id)+'">Edit</button>'+
 (isAdmin()?'<button type="button" class="tiny" data-approve="'+esc(p.id)+'">'+(approved?"Revoke approval":"Approve product")+'</button>':'')+
 '<button type="button" class="tiny secondary" data-active="'+esc(p.id)+'">'+(p.active?"Disable":"Enable")+'</button></div>':"";
 return '<article class="product-card"><div class="product-media">'+imgTag(p)+'</div>'+
 '<span class="sku">'+esc(p.sku)+'</span><h3>'+esc(p.title)+'</h3>'+
 '<p>'+esc(p.brand||"No brand")+" · "+esc(p.manufacturer||"Unknown manufacturer")+'</p>'+
 '<p>'+esc(p.company_name||"")+'</p>'+
 '<p>Size: '+esc(p.size_label||"Not registered")+' · '+esc(p.finish||"")+'</p>'+
 (privateView?'<div class="price">'+(p.private_price_cents===null?"Price not entered":egp(p.private_price_cents))+'</div>':"")+
 '<span class="tag '+(approved&&p.active?"ok":"")+'">'+esc(approved?(p.active?"Approved and published":"Approved, inactive"):"Awaiting admin review")+'</span>'+
 tools+'</article>';
}
function renderProducts(){
 const container=$("product-list");
 if(!canCompany()){container.innerHTML='<div class="panel dim">Select a company to manage products. Visitors can search approved public products only.</div>';return;}
 if(!state.products.length){container.innerHTML='<div class="panel dim">No products for this company yet. Add products with a verified code, brand and actual size.</div>';return;}
 const brands=[...new Set(state.products.map(p=>p.brand||"Unclassified"))];
 container.innerHTML=brands.map(b=>'<div style="grid-column:1/-1"><h3>'+esc(b)+'</h3></div>'+state.products.filter(p=>(p.brand||"Unclassified")===b).map(p=>card(p,true)).join("")).join("");
}
function renderStaff(){
 const container=$("staff-list");
 $("staff-form").hidden=!canStaff();
 if(!canStaff()){container.innerHTML='<p class="dim">Only the company owner or platform administrator can manage staff.</p>';return;}
 container.innerHTML=state.staff.length?state.staff.map(s=>'<div class="list-row"><div class="info"><strong>'+esc(s.name)+'</strong><small>'+esc(s.email)+' · '+esc(s.role)+'</small></div><span class="tag '+(s.active?"ok":"")+'">'+(s.active?"Active":"Inactive")+'</span></div>').join(""):'<p class="dim">No delegated managers.</p>';
}
function renderSales(){
 const el=$("sales-report");
 if(!canCompany()){el.innerHTML='<p class="dim">No company is available for reporting.</p>';return;}
 if(!state.sales){el.innerHTML='<p class="dim">Report unavailable.</p>';return;}
 if(!state.sales.rows.length){el.innerHTML='<p class="dim">No confirmed paid sales for this month. Quotations and unpaid orders are excluded.</p>';return;}
 el.innerHTML='<table><thead><tr><th>Company</th><th>Paid orders</th><th>Paid total</th></tr></thead><tbody>'+state.sales.rows.map(r=>'<tr><td>'+esc(r.public_name)+'</td><td>'+esc(r.orders_count)+'</td><td>'+egp(r.gross_cents)+'</td></tr>').join("")+'</tbody></table><p class="warning">Refund reconciliation requires a verified ledger before reporting final net sales.</p>';
}
function renderTicker(){
 if(!isAdmin()){$("ticker-form").hidden=true;$("ticker-list").innerHTML='<p class="dim">Only administrators can edit the announcement bar.</p>';return;}
 $("ticker-form").hidden=false;
 $("ticker-list").innerHTML=state.announcements.length?state.announcements.map(t=>'<div class="list-row"><div class="info"><strong>'+esc(t.text_en)+'</strong><small>'+esc(t.text_en)+'</small></div><span class="tag">'+esc(status(t.state))+'</span></div>').join(""):'<p class="dim">No published announcements.</p>';
}
function renderPackages(){
 const els=$("package-grid");
 const names={"topline":"Top line","new-collections":"New Collections","home-hero-video":"Hero video"};
 if(!state.packages.length){els.innerHTML='<div class="panel dim">No approved advertising rates have been published.</div>';return;}
 els.innerHTML=state.packages.map(p=>'<div class="package"><div class="package-visual">'+esc(names[p.id]||p.placement)+'</div><div class="package-body"><h3>'+esc(p.title_en)+'</h3><p>'+esc(p.description_en)+'</p><span class="tag '+(p.is_published?"ok":"")+'">'+(p.is_published?"Published":"Private admin draft")+'</span><p class="value">'+egp(p.price_cents)+'</p><p>'+esc(p.duration_days)+' days · '+esc(p.specs)+'</p>'+
 (isAdmin()?'<form class="rate-edit" data-rate="'+esc(p.id)+'"><label>Price (EGP)<input type="number" name="price" min="0" step=".01" value="'+esc((Number(p.price_cents)/100).toFixed(2))+'" required></label><label>Days<input type="number" name="days" min="1" max="365" value="'+esc(p.duration_days)+'" required></label><label><input type="checkbox" name="published" '+(p.is_published?"checked":"")+'> Publish</label><button type="submit">Save package</button></form>':"")+
 '</div></div>').join("");
 const select=$("ad-package");
 const available=state.packages.filter(p=>p.is_published);
 select.innerHTML=available.length?available.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.title_en)+'</option>').join(""):'<option value="">No published package</option>';
 $("ad-form").hidden=!canCompany()||!available.length;
}
function renderAds(){
 const el=$("ad-requests");
 if(!state.user){el.innerHTML='<p class="dim">Sign in to request advertising.</p>';return;}
 el.innerHTML=state.ads.length?state.ads.map(a=>'<div class="list-row"><div class="info"><strong>'+esc(a.title)+'</strong><small>'+esc(a.public_name)+' · '+esc(a.package_id)+' · '+esc(status(a.state))+'</small></div>'+(isAdmin()?'<div class="actions"><button type="button" class="tiny" data-ad-review="'+esc(a.id)+'" data-ad-state="approved">Approve request</button><button type="button" class="tiny danger" data-ad-review="'+esc(a.id)+'" data-ad-state="needs_revision">Request changes</button></div>':"")+'</div>').join(""):'<p class="dim">No advertising requests yet.</p>';
}
function renderAll(){renderRail();renderOverview();renderProducts();renderStaff();renderSales();renderTicker();renderPackages();renderAds();}
function page(name){
 const titles={overview:"Company Management",products:"Products and Brands",search:"Product Search",sales:"Monthly Sales",staff:"Managers and Permissions",ticker:"News and Announcements",ads:"Advertising Packages"};
 if(!titles[name])name="overview";
 state.page=name;for(const el of document.querySelectorAll(".page"))el.hidden=el.id!=="page-"+name;
 for(const btn of document.querySelectorAll(".sections [data-page]"))btn.classList.toggle("selected",btn.dataset.page===name);
 $("page-title").textContent=titles[name];location.hash=name;window.scrollTo({top:0,behavior:"instant"});
}
async function loadCompany(){
 state.products=[];state.staff=[];state.sales=null;state.ads=[];
 if(!state.selected){renderAll();return;}
 const id=companyId(),month=$("sales-month").value;
 const actions=[request("products",{company_id:id}),request("sales",{company_id:id,month}),request("ad-requests",{company_id:id})];
 if(canStaff())actions.push(request("staff",{company_id:id}));
 const results=await Promise.allSettled(actions);
 if(results[0].status==="fulfilled")state.products=results[0].value.products||[];
 if(results[1].status==="fulfilled")state.sales=results[1].value;
 if(results[2].status==="fulfilled")state.ads=results[2].value.requests||[];
 if(results[3]?.status==="fulfilled")state.staff=results[3].value.staff||[];
 if(results.some(r=>r.status==="rejected"))notice("One section could not load. Check account permissions and MySQL connection.",true);
 renderAll();
}
async function bootstrap(){
 try{
  const d=await request("bootstrap");
  state.user=d.user;state.csrf=d.csrf;
  state.companies=d.companies||[];state.selected=state.companies[0]||null;
  state.packages=d.packages||[];state.announcements=d.announcements||[];
  if(state.user?.role==="admin"){
   const ads=await request("ad-requests").catch(()=>({requests:[]}));
   state.ads=ads.requests||[];
  }
  await loadCompany();
 }catch(e){
  if(e.message==="AUTH_REQUIRED"){
   state.user=null;state.companies=[];state.selected=null;state.packages=[];state.announcements=[];
   renderAll();authMessage();page("search");
  }else notice("MySQL/session error: "+e.message,true);
 }
}
async function searchProducts(){
 const q=$("search-input").value.trim();
 if(!q)return;
 $("search-results").textContent="Searching...";
 try{
  const d=await request("search",{q});
  $("search-results").innerHTML=d.products.length?d.products.map(p=>card(p,Boolean(state.user&&("private_price_cents" in p)))).join(""):'<p class="dim">No approved product matches that code or brand.</p>';
  $("similar-results").innerHTML=d.similar.length?d.similar.map(p=>card(p,false)).join(""):'<p class="dim">No similar products with verified metadata yet.</p>';
 }catch(e){notice(e.message,true)}
}
function fillProduct(p){
 const form=$("product-form");form.hidden=false;$("product-form-title").textContent=p?"Edit product and send for review":"New product";
 const fields=["id","sku","title","brand","manufacturer","category","finish","color","image_url","description"];
 for(const field of fields)if(form.elements.namedItem(field))form.elements.namedItem(field).value=p?.[field]??"";
 form.elements.width_cm.value=p?.width_mm?Number(p.width_mm)/10:"";
 form.elements.height_cm.value=p?.height_mm?Number(p.height_mm)/10:"";
 form.elements.price_egp.value=p?.private_price_cents===null?"":p?.private_price_cents!==undefined?Number(p.private_price_cents)/100:"";
 form.scrollIntoView({behavior:"smooth",block:"start"});
}
async function submitProduct(e){
 e.preventDefault();if(!canCompany())return notice("Select a company first",true);
 const f=new FormData(e.currentTarget),w=Number(f.get("width_cm")),h=Number(f.get("height_cm"));
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<5||h<5)return notice("Enter the actual tile dimensions",true);
 const rawPrice=String(f.get("price_egp")).trim();
 const data={company_id:companyId(),id:f.get("id"),sku:f.get("sku"),title:f.get("title"),brand:f.get("brand"),manufacturer:f.get("manufacturer"),category:f.get("category"),finish:f.get("finish"),color:f.get("color"),width_mm:Math.round(w*10),height_mm:Math.round(h*10),size_label:w+"×"+h+" cm",description:f.get("description"),image_url:f.get("image_url"),price_cents:rawPrice===""?null:Math.round(Number(rawPrice)*100)};
 try{await request("product-save",{},data);notice("Product saved as a draft. Administrator approval is required before public display.");$("product-form").hidden=true;await loadCompany()}catch(x){notice(x.message,true)}
}
async function saveStaff(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{await request("staff-save",{}, {company_id:companyId(),email:f.get("email"),active:f.get("active")==="true"});notice("Company manager permissions updated.");await loadCompany()}catch(x){notice(x.message,true)}
}
async function saveTicker(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{await request("ticker-save",{},Object.fromEntries(f));notice("Announcement saved.");const b=await request("bootstrap");state.announcements=b.announcements||[];renderTicker();e.currentTarget.reset()}catch(x){notice(x.message,true)}
}
async function saveAd(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{await request("ad-request",{}, {...Object.fromEntries(f),company_id:companyId()});notice("Request sent for administrator review. It will not publish automatically.");e.currentTarget.reset();await loadCompany()}catch(x){notice(x.message,true)}
}
document.querySelector(".sections").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)page(b.dataset.page)});
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.go)));
$("company-list").addEventListener("click",async e=>{const b=e.target.closest("[data-company]");if(!b)return;state.selected=state.companies.find(c=>c.id===b.dataset.company)||null;await loadCompany()});
$("product-add").addEventListener("click",()=>canCompany()?fillProduct(null):notice("Select a company first",true));
$("product-cancel").addEventListener("click",()=>{$("product-form").hidden=true});
$("product-form").addEventListener("submit",submitProduct);
$("staff-form").addEventListener("submit",saveStaff);
$("ticker-form").addEventListener("submit",saveTicker);
$("ad-form").addEventListener("submit",saveAd);
$("search-form").addEventListener("submit",e=>{e.preventDefault();searchProducts()});
$("sales-month").addEventListener("change",loadCompany);
$("suspend-company").addEventListener("click",async()=>{
 if(!isAdmin()||!companyId())return;
 const activate=state.selected.status==="suspended";
 const question=activate
  ?"Confirm that company documents have been reviewed? Existing products remain disabled pending approval."
  :"Suspend this company and disable its products?";
 if(!confirm(question))return;
 try{
  const newStatus=activate?"verified":"suspended";
  await request("company-status",{}, {company_id:companyId(),status:newStatus,reviewed:activate});
  notice(activate?"Company reinstated after review.":"Company and its products have been suspended.");
  await bootstrap();
 }catch(e){notice(e.message,true)}
});
$("product-list").addEventListener("click",productClick);
async function productClick(e){
 const el=e.target.closest("button");if(!el)return;
 const id=el.dataset.edit||el.dataset.approve||el.dataset.active;
 const product=state.products.find(p=>p.id===id);
 if(!product)return;
 if(el.dataset.edit){fillProduct(product);return;}
 if(el.dataset.approve){
  const yes=!product.approved_for_storefront;
  if(!confirm((yes?"Approve":"Revoke approval")+" product "+product.title+"?"))return;
  try{await request("product-approval",{}, {company_id:companyId(),id,approved:yes,notes:""});notice("Product approval updated.");await loadCompany()}catch(err){notice(err.message,true)}
 }
 if(el.dataset.active){
  try{await request("product-active",{}, {company_id:companyId(),id,active:!product.active});notice("Product visibility updated.");await loadCompany()}catch(err){notice(err.message,true)}
 }
}
$("package-grid").addEventListener("submit",async e=>{
 const form=e.target.closest("form[data-rate]");if(!form)return;e.preventDefault();
 const f=new FormData(form);
 try{await request("package-save",{}, {id:form.dataset.rate,price_cents:Math.round(Number(f.get("price"))*100),duration_days:Number(f.get("days")),is_published:f.get("published")==="on"});const b=await request("bootstrap");state.packages=b.packages||[];renderPackages();notice("Package rate and visibility saved.")}catch(err){notice(err.message,true)}
});
$("ad-requests").addEventListener("click",async e=>{
 const b=e.target.closest("[data-ad-review]");if(!b)return;
 try{await request("ad-review",{}, {id:b.dataset.adReview,state:b.dataset.adState,notes:"Creative and specifications are reviewed before publication."});notice("Request status updated. Publication requires a separate admin action.");await loadCompany()}catch(err){notice(err.message,true)}
});
$("lang").value=userLang();
$("lang").addEventListener("change",e=>{localStorage.setItem("idea-language",e.target.value);document.documentElement.lang=e.target.value;document.documentElement.dir=e.target.value==="en"?"ltr":"rtl";location.replace(e.target.value==="en"?"/marketplace/en.html"+location.hash:"/marketplace/"+location.hash);notice("Interface language changed. Announcements follow the selected language.")});
document.documentElement.lang=userLang();document.documentElement.dir=userLang()==="ar"?"rtl":"ltr";
$("theme").addEventListener("click",()=>{const light=document.documentElement.dataset.mode!=="light";document.documentElement.dataset.mode=light?"light":"dark";localStorage.setItem("idea-display",light?"light":"dark")});
document.documentElement.dataset.mode=localStorage.getItem("idea-display")==="light"?"light":"dark";
$("sales-month").value=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit"}).slice(0,7);
page(location.hash.slice(1)||"overview");bootstrap();
})();