from pathlib import Path
root=Path(__file__).resolve().parents[2]/"server/cpanel/marketplace"
p=root/"marketplace.js"
s=p.read_text("utf-8")
old='$("admin-suspend").hidden=!(isAdmin()&&c.status!=="suspended");'
assert s.count(old)==1
s=s.replace(old,'''$("admin-suspend").hidden=!isAdmin();
  $("suspend-company").textContent=c.status==="suspended"?"إعادة تفعيل الشركة بعد مراجعة مستنداتها":"إيقاف الشركة";''',1)
a=s.index('$("suspend-company").addEventListener("click",async()=>{')
b=s.index('$("product-list").addEventListener("click",productClick);',a)
replacement='''$("suspend-company").addEventListener("click",async()=>{
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
'''
s=s[:a]+replacement+s[b:]
p.write_text(s,encoding="utf-8")
print("COMPANY_APPROVE_SUSPEND_UI_READY")
