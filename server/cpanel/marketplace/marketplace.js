(() => {
"use strict";
const API="/api/marketplace.php";
const $=id=>document.getElementById(id);
const state={user:null,csrf:"",companies:[],selected:null,products:[],staff:[],sales:null,packages:[],announcements:[],ads:[],page:"overview",search:[]};
const esc=x=>String(x??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const egp=x=>Number.isFinite(Number(x))?new Intl.NumberFormat("ar-EG",{maximumFractionDigits:2}).format(Number(x)/100)+" ج.م":"—";
const cm=x=>Number.isFinite(Number(x))?new Intl.NumberFormat("ar-EG",{maximumFractionDigits:1}).format(Number(x)/10):"—";
const status=x=>({verified:"موثقة",submitted:"قيد التوثيق",suspended:"موقوفة",approved:"معتمد",pending:"قيد المراجعة",draft:"مسودة",published:"منشور",rejected:"مرفوض",needs_revision:"يحتاج تعديل"}[x]||x||"—");
const myRole=()=>state.selected?.my_role||"";
const companyId=()=>state.selected?.id||"";
const isAdmin=()=>state.user?.role==="admin";
const canCompany=()=>Boolean(companyId())&&Boolean(myRole());
const canStaff=()=>["admin","owner"].includes(myRole());
const userLang=()=>localStorage.getItem("idea-language")==="en"?"en":"ar";
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
 box.innerHTML='<h2>المعلومات المحمية</h2><p class="warning">دخول الأدمن أو صاحب الشركة يتطلب حسابًا موثقًا على IDEA. الزائر يمكنه البحث في المنتجات المعتمدة فقط، من غير الاطلاع على الأسعار الخاصة.</p><div class="quick"><a href="/login" class="back">تسجيل الدخول</a><a href="/register" class="back">إنشاء حساب</a></div>';
}
function renderRail(){
 const el=$("company-list");
 if(!state.user){el.innerHTML='<p class="dim">يرجى تسجيل الدخول</p>';return;}
 if(!state.companies.length){el.innerHTML='<p class="dim">لا توجد شركات متاحة لهذا الحساب</p>';return;}
 el.innerHTML=state.companies.map(c=>'<button type="button" class="company '+(companyId()===c.id?"active":"")+'" data-company="'+esc(c.id)+'"><span class="avatar">'+esc(c.public_name.slice(0,1))+'</span><span class="copy"><strong>'+esc(c.public_name)+'</strong><small>'+esc(status(c.status))+" · "+esc(c.products)+" منتجات</small></span></button>").join("");
}
function renderOverview(){
 $("count-companies").textContent=String(state.companies.length);
 $("count-products").textContent=String(state.products.length);
 $("count-approved").textContent=String(state.products.filter(p=>p.approved_for_storefront).length);
 $("count-sales").textContent=state.sales?String(state.sales.rows.reduce((a,b)=>a+Number(b.orders_count||0),0)):"—";
 if(!state.user){authMessage();$("company-detail").textContent="يلزم تسجيل الدخول";return;}
 $("identity").innerHTML="<h2>مرحبًا، "+esc(state.user.name)+"</h2><p class='dim'>الحساب: "+esc(state.user.role)+" · صلاحيات الشركة: "+esc(myRole()||"لا توجد")+"</p>";
 if(!state.selected){$("company-detail").textContent="لا توجد شركة مختارة";return;}
 const c=state.selected;
 $("company-detail").innerHTML="<strong>"+esc(c.public_name)+"</strong><p>"+esc(c.legal_name)+"</p><p>الحالة: "+esc(status(c.status))+"</p><p>المدير المسجل: "+esc(c.owner_name)+"</p><small class='dim'>منتجات مسجلة: "+esc(c.products)+"</small>";
 $("admin-suspend").hidden=!isAdmin();
  $("suspend-company").textContent=c.status==="suspended"?"إعادة تفعيل الشركة بعد مراجعة مستنداتها":"إيقاف الشركة";
}
const imgTag=p=>/^\/uploads\/company-products\/[a-f0-9]{32}\/[a-f0-9]{32}\.(png|jpg|webp)$/i.test(p.image_url||"")?'<img alt="'+esc(p.title)+'" loading="lazy" src="'+esc(p.image_url)+'">':"<span>▦</span>";
function card(p,privateView){
 const approved=Boolean(p.approved_for_storefront);
 const tools=privateView?'<div class="actions">'+
 '<button type="button" class="tiny secondary" data-edit="'+esc(p.id)+'">تعديل</button>'+
 (isAdmin()?'<button type="button" class="tiny" data-approve="'+esc(p.id)+'">'+(approved?"إلغاء الاعتماد":"اعتماد المنتج")+'</button>':'')+
 '<button type="button" class="tiny secondary" data-active="'+esc(p.id)+'">'+(p.active?"إيقاف":"تفعيل")+'</button></div>':"";
 return '<article class="product-card"><div class="product-media">'+imgTag(p)+'</div>'+
 '<span class="sku">'+esc(p.sku)+'</span><h3>'+esc(p.title)+'</h3>'+
 '<p>'+esc(p.brand||"بدون براند")+" · "+esc(p.manufacturer||"شركة غير محددة")+'</p>'+
 '<p>'+esc(p.company_name||"")+'</p>'+
 '<p>المقاس: '+esc(p.size_label||"غير مسجل")+' · '+esc(p.finish||"")+'</p>'+
 (privateView?'<div class="price">'+(p.private_price_cents===null?"السعر غير مدخل":egp(p.private_price_cents))+'</div>':"")+
 '<span class="tag '+(approved&&p.active?"ok":"")+'">'+esc(approved?(p.active?"معتمد ومنشور":"معتمد لكن متوقف"):"بانتظار مراجعة الأدمن")+'</span>'+
 tools+'</article>';
}
function renderProducts(){
 const container=$("product-list");
 if(!canCompany()){container.innerHTML='<div class="panel dim">اختَر شركة لإدارة المنتجات. الحساب العام يستطيع البحث في المنتجات المنشورة فقط.</div>';return;}
 if(!state.products.length){container.innerHTML='<div class="panel dim">لا توجد منتجات لهذه الشركة حتى الآن. أضف المنتج بكوده وبراندِه ومقاسه الحقيقي.</div>';return;}
 const brands=[...new Set(state.products.map(p=>p.brand||"غير مصنف"))];
 container.innerHTML=brands.map(b=>'<div style="grid-column:1/-1"><h3>'+esc(b)+'</h3></div>'+state.products.filter(p=>(p.brand||"غير مصنف")===b).map(p=>card(p,true)).join("")).join("");
}
function renderStaff(){
 const container=$("staff-list");
 $("staff-form").hidden=!canStaff();
 if(!canStaff()){container.innerHTML='<p class="dim">صاحب الشركة أو أدمن المنصة فقط يدير الأعضاء.</p>';return;}
 container.innerHTML=state.staff.length?state.staff.map(s=>'<div class="list-row"><div class="info"><strong>'+esc(s.name)+'</strong><small>'+esc(s.email)+' · '+esc(s.role)+'</small></div><span class="tag '+(s.active?"ok":"")+'">'+(s.active?"نشط":"موقوف")+'</span></div>').join(""):'<p class="dim">لا يوجد مديرون مفوضون حاليًا.</p>';
}
function renderSales(){
 const el=$("sales-report");
 if(!canCompany()){el.innerHTML='<p class="dim">لا توجد شركة متاحة للتقرير.</p>';return;}
 if(!state.sales){el.innerHTML='<p class="dim">لم يُحمّل التقرير.</p>';return;}
 if(!state.sales.rows.length){el.innerHTML='<p class="dim">لا توجد مبيعات مدفوعة ومؤكدة لهذا الشهر. طلبات عرض السعر والمشتريات غير المدفوعة لا تُحسب مبيعات.</p>';return;}
 el.innerHTML='<table><thead><tr><th>الشركة</th><th>طلبات مدفوعة</th><th>إجمالي مدفوع</th></tr></thead><tbody>'+state.sales.rows.map(r=>'<tr><td>'+esc(r.public_name)+'</td><td>'+esc(r.orders_count)+'</td><td>'+egp(r.gross_cents)+'</td></tr>').join("")+'</tbody></table><p class="warning">تسوية المرتجعات وتوزيعها بين الشركات تحتاج دفتر محاسبي موثق قبل اعتماد صافي نهائي.</p>';
}
function renderTicker(){
 if(!isAdmin()){$("ticker-form").hidden=true;$("ticker-list").innerHTML='<p class="dim">الأدمن وحده يستطيع تعديل شريط الإعلانات.</p>';return;}
 $("ticker-form").hidden=false;
 $("ticker-list").innerHTML=state.announcements.length?state.announcements.map(t=>'<div class="list-row"><div class="info"><strong>'+esc(t.text_ar)+'</strong><small>'+esc(t.text_en)+'</small></div><span class="tag">'+esc(status(t.state))+'</span></div>').join(""):'<p class="dim">لم تُنشر أي إعلانات بعد.</p>';
}
function renderPackages(){
 const els=$("package-grid");
 const names={"topline":"الشريط العلوي","new-collections":"المجموعات الجديدة","home-hero-video":"فيديو الهيرو"};
 if(!state.packages.length){els.innerHTML='<div class="panel dim">لم ينشر الأدمن أسعار الباقات بعد. لن نظهر أسعارًا لم يعتمدها.</div>';return;}
 els.innerHTML=state.packages.map(p=>'<div class="package"><div class="package-visual">'+esc(names[p.id]||p.placement)+'</div><div class="package-body"><h3>'+esc(p.title_ar)+'</h3><p>'+esc(p.description_ar)+'</p><span class="tag '+(p.is_published?"ok":"")+'">'+(p.is_published?"منشورة":"مسودة خاصة بالأدمن")+'</span><p class="value">'+egp(p.price_cents)+'</p><p>'+esc(p.duration_days)+' يومًا · '+esc(p.specs)+'</p>'+
 (isAdmin()?'<form class="rate-edit" data-rate="'+esc(p.id)+'"><label>السعر بالجنيه<input type="number" name="price" min="0" step=".01" value="'+esc((Number(p.price_cents)/100).toFixed(2))+'" required></label><label>الأيام<input type="number" name="days" min="1" max="365" value="'+esc(p.duration_days)+'" required></label><label><input type="checkbox" name="published" '+(p.is_published?"checked":"")+'> نشر</label><button type="submit">حفظ الباقة</button></form>':"")+
 '</div></div>').join("");
 const select=$("ad-package");
 const available=state.packages.filter(p=>p.is_published);
 select.innerHTML=available.length?available.map(p=>'<option value="'+esc(p.id)+'">'+esc(p.title_ar)+'</option>').join(""):'<option value="">لا توجد باقة منشورة</option>';
 $("ad-form").hidden=!canCompany()||!available.length;
}
function renderAds(){
 const el=$("ad-requests");
 if(!state.user){el.innerHTML='<p class="dim">سجّل الدخول لإرسال إعلان.</p>';return;}
 el.innerHTML=state.ads.length?state.ads.map(a=>'<div class="list-row"><div class="info"><strong>'+esc(a.title)+'</strong><small>'+esc(a.public_name)+' · '+esc(a.package_id)+' · '+esc(status(a.state))+'</small></div>'+(isAdmin()?'<div class="actions"><button type="button" class="tiny" data-ad-review="'+esc(a.id)+'" data-ad-state="approved">موافقة على الطلب</button><button type="button" class="tiny danger" data-ad-review="'+esc(a.id)+'" data-ad-state="needs_revision">طلب تعديل</button></div>':"")+'</div>').join(""):'<p class="dim">لا توجد طلبات دعاية مسجلة.</p>';
}
function renderAll(){renderRail();renderOverview();renderProducts();renderStaff();renderSales();renderTicker();renderPackages();renderAds();}
function page(name){
 const titles={overview:"لوحة إدارة الشركات",products:"المنتجات والبراندات",search:"البحث عن منتج",sales:"المبيعات الشهرية",staff:"المديرون والصلاحيات",ticker:"شريط الأخبار والإعلانات",ads:"باقات الدعاية"};
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
 if(results.some(r=>r.status==="rejected"))notice("تعذر تحميل أحد الأقسام. تأكد من صلاحيات الحساب واتصال MySQL.",true);
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
  }else notice("فشل اتصال MySQL/الجلسة: "+e.message,true);
 }
}
async function searchProducts(){
 const q=$("search-input").value.trim();
 if(!q)return;
 $("search-results").textContent="جارٍ البحث...";
 try{
  const d=await request("search",{q});
  $("search-results").innerHTML=d.products.length?d.products.map(p=>card(p,Boolean(state.user&&("private_price_cents" in p)))).join(""):'<p class="dim">لم أجد منتجًا معتمدًا بهذا الكود أو البراند.</p>';
  $("similar-results").innerHTML=d.similar.length?d.similar.map(p=>card(p,false)).join(""):'<p class="dim">لا توجد منتجات مشابهة ببيانات موثقة حتى الآن.</p>';
 }catch(e){notice(e.message,true)}
}
function fillProduct(p){
 const form=$("product-form");form.hidden=false;$("product-form-title").textContent=p?"تعديل المنتج وإرساله للمراجعة":"منتج جديد";
 const fields=["id","sku","title","brand","manufacturer","category","finish","color","image_url","description"];
 for(const field of fields)if(form.elements.namedItem(field))form.elements.namedItem(field).value=p?.[field]??"";
 form.elements.width_cm.value=p?.width_mm?Number(p.width_mm)/10:"";
 form.elements.height_cm.value=p?.height_mm?Number(p.height_mm)/10:"";
 form.elements.price_egp.value=p?.private_price_cents===null?"":p?.private_price_cents!==undefined?Number(p.private_price_cents)/100:"";
 form.scrollIntoView({behavior:"smooth",block:"start"});
}
async function submitProduct(e){
 e.preventDefault();if(!canCompany())return notice("اختر الشركة أولًا",true);
 const f=new FormData(e.currentTarget),w=Number(f.get("width_cm")),h=Number(f.get("height_cm"));
 if(!Number.isFinite(w)||!Number.isFinite(h)||w<5||h<5)return notice("أدخل المقاس الحقيقي للسيراميك",true);
 const rawPrice=String(f.get("price_egp")).trim();
 const data={company_id:companyId(),id:f.get("id"),sku:f.get("sku"),title:f.get("title"),brand:f.get("brand"),manufacturer:f.get("manufacturer"),category:f.get("category"),finish:f.get("finish"),color:f.get("color"),width_mm:Math.round(w*10),height_mm:Math.round(h*10),size_label:w+"×"+h+" سم",description:f.get("description"),image_url:f.get("image_url"),price_cents:rawPrice===""?null:Math.round(Number(rawPrice)*100)};
 try{await request("product-save",{},data);notice("تم حفظ المنتج كمسودة. يحتاج اعتماد أدمن IDEA قبل الظهور العام.");$("product-form").hidden=true;await loadCompany()}catch(x){notice(x.message,true)}
}
async function saveStaff(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{await request("staff-save",{}, {company_id:companyId(),email:f.get("email"),active:f.get("active")==="true"});notice("تم تعديل صلاحية مدير الشركة.");await loadCompany()}catch(x){notice(x.message,true)}
}
async function saveTicker(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{await request("ticker-save",{},Object.fromEntries(f));notice("تم حفظ الرسالة.");const b=await request("bootstrap");state.announcements=b.announcements||[];renderTicker();e.currentTarget.reset()}catch(x){notice(x.message,true)}
}
async function saveAd(e){
 e.preventDefault();const f=new FormData(e.currentTarget);
 try{await request("ad-request",{}, {...Object.fromEntries(f),company_id:companyId()});notice("وصل الطلب للإدارة للمراجعة؛ لا يتم نشره تلقائيًا.");e.currentTarget.reset();await loadCompany()}catch(x){notice(x.message,true)}
}
document.querySelector(".sections").addEventListener("click",e=>{const b=e.target.closest("[data-page]");if(b)page(b.dataset.page)});
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>page(b.dataset.go)));
$("company-list").addEventListener("click",async e=>{const b=e.target.closest("[data-company]");if(!b)return;state.selected=state.companies.find(c=>c.id===b.dataset.company)||null;await loadCompany()});
$("product-add").addEventListener("click",()=>canCompany()?fillProduct(null):notice("اختر الشركة أولًا",true));
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
  ?"تأكيد مراجعة مستندات الشركة وصلاحية إعادة تفعيلها؟ المنتجات القديمة ستبقى متوقفة حتى اعتمادها."
  :"تأكيد إيقاف الشركة وجميع منتجاتها؟";
 if(!confirm(question))return;
 try{
  const newStatus=activate?"verified":"suspended";
  await request("company-status",{}, {company_id:companyId(),status:newStatus,reviewed:activate});
  notice(activate?"تمت إعادة تفعيل الشركة بعد المراجعة.":"تم إيقاف الشركة ومنتجاتها.");
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
  if(!confirm((yes?"اعتماد":"إلغاء اعتماد")+" المنتج "+product.title+"؟"))return;
  try{await request("product-approval",{}, {company_id:companyId(),id,approved:yes,notes:""});notice("تم تعديل اعتماد المنتج.");await loadCompany()}catch(err){notice(err.message,true)}
 }
 if(el.dataset.active){
  try{await request("product-active",{}, {company_id:companyId(),id,active:!product.active});notice("تم تحديث حالة ظهور المنتج.");await loadCompany()}catch(err){notice(err.message,true)}
 }
}
$("package-grid").addEventListener("submit",async e=>{
 const form=e.target.closest("form[data-rate]");if(!form)return;e.preventDefault();
 const f=new FormData(form);
 try{await request("package-save",{}, {id:form.dataset.rate,price_cents:Math.round(Number(f.get("price"))*100),duration_days:Number(f.get("days")),is_published:f.get("published")==="on"});const b=await request("bootstrap");state.packages=b.packages||[];renderPackages();notice("تم حفظ سعر الباقة والتحكم في نشرها.")}catch(err){notice(err.message,true)}
});
$("ad-requests").addEventListener("click",async e=>{
 const b=e.target.closest("[data-ad-review]");if(!b)return;
 try{await request("ad-review",{}, {id:b.dataset.adReview,state:b.dataset.adState,notes:"تتم مراجعة المحتوى والمواصفات قبل النشر."});notice("تم تحديث حالة الطلب. النشر يحتاج خطوة إدارية منفصلة.");await loadCompany()}catch(err){notice(err.message,true)}
});
$("lang").value=userLang();
$("lang").addEventListener("change",e=>{localStorage.setItem("idea-language",e.target.value);document.documentElement.lang=e.target.value;document.documentElement.dir=e.target.value==="en"?"ltr":"rtl";location.replace(e.target.value==="en"?"/marketplace/en.html"+location.hash:"/marketplace/"+location.hash);notice("تم اختيار لغة الواجهة؛ الشريط العلوي يعرض الرسائل باللغة المختارة.")});
document.documentElement.lang=userLang();document.documentElement.dir=userLang()==="ar"?"rtl":"ltr";
$("theme").addEventListener("click",()=>{const light=document.documentElement.dataset.mode!=="light";document.documentElement.dataset.mode=light?"light":"dark";localStorage.setItem("idea-display",light?"light":"dark")});
document.documentElement.dataset.mode=localStorage.getItem("idea-display")==="light"?"light":"dark";
$("sales-month").value=new Date().toLocaleDateString("en-CA",{timeZone:"Africa/Cairo",year:"numeric",month:"2-digit"}).slice(0,7);
page(location.hash.slice(1)||"overview");bootstrap();
})();