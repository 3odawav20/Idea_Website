// IDEA Gemini image editing: server-only key, authenticated calls, strict media URLs.
import { createClient } from "npm:@supabase/supabase-js@2";
const allow=(Deno.env.get("IDEA_ALLOWED_ORIGINS")||"https://idea-website-two.vercel.app,https://livefree.support,https://www.livefree.support,http://localhost:5173").split(",").map(x=>x.trim());
const hdr=(r:Request)=>({"Access-Control-Allow-Origin":allow.includes(r.headers.get("origin")||"")?r.headers.get("origin")!:allow[0],"Access-Control-Allow-Methods":"POST,GET,OPTIONS","Access-Control-Allow-Headers":"authorization,apikey,content-type,x-client-info","Vary":"Origin"});
const json=(r:Request,x:unknown,status=200)=>Response.json(x,{status,headers:hdr(r)});
const image=(str:string)=>{
 const m=str?.match(/^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
 if(!m||m[2].length>14_000_000)throw Error("INVALID_IMAGE");
 return {inlineData:{mimeType:m[1],data:m[2]}};
};
async function material(path:string,origin:string){
 let u:URL;try{u=new URL(path,origin)}catch{throw Error("INVALID_MATERIAL")}
 const hosts=(Deno.env.get("IDEA_IMAGE_HOSTS")||"").split(",").map(x=>x.trim());
 if(u.protocol!=="https:"||u.username||u.password||u.port||u.origin!==origin&&!hosts.includes(u.hostname))throw Error("MATERIAL_HOST_FORBIDDEN");
 const ctl=new AbortController(),timer=setTimeout(()=>ctl.abort(),12000);
 try{
  const r=await fetch(u.href,{redirect:"error",signal:ctl.signal});
  const mime=(r.headers.get("content-type")||"").split(";")[0];
  if(!r.ok||!["image/jpeg","image/png","image/webp"].includes(mime))throw Error("MATERIAL_NOT_IMAGE");
  if(Number(r.headers.get("content-length")||0)>6000000)throw Error("IMAGE_TOO_LARGE");
  const bytes=new Uint8Array(await r.arrayBuffer());
  if(bytes.length<1024||bytes.length>6000000)throw Error("INVALID_MATERIAL");
  let s="";for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));
  return {inlineData:{mimeType:mime,data:btoa(s)}};
 }finally{clearTimeout(timer)}
}
Deno.serve(async r=>{
 const origin=r.headers.get("origin")||"";
 if(r.method==="OPTIONS")return new Response(null,{status:204,headers:hdr(r)});
 if(!allow.includes(origin))return json(r,{error:"ORIGIN_FORBIDDEN"},403);
 if(r.method==="GET")return json(r,{ready:Boolean(Deno.env.get("GEMINI_API_KEY"))});
 if(r.method!=="POST")return json(r,{error:"METHOD_NOT_ALLOWED"},405);
 const token=(r.headers.get("authorization")||"").replace(/^Bearer\s+/i,"");
 if(!token)return json(r,{error:"AUTH_REQUIRED"},401);
 const client=createClient(Deno.env.get("SUPABASE_URL")||"",Deno.env.get("SUPABASE_ANON_KEY")||"",{auth:{persistSession:false,autoRefreshToken:false}});
 const {data,error}=await client.auth.getUser(token);
 if(error||!data.user)return json(r,{error:"AUTH_INVALID"},401);
 const key=Deno.env.get("GEMINI_API_KEY");
 if(!key)return json(r,{error:"GEMINI_API_NOT_CONFIGURED"},503);
 try{
  if(Number(r.headers.get("content-length")||0)>16000000)throw Error("REQUEST_TOO_LARGE");
  const b=await r.json();
  const room=image(b.roomImage),surface=await material(b.productImage,origin);
  if(!["floor","wall"].includes(b.target))throw Error("INVALID_TARGET");
  const grout=Number(b.groutMm),rot=Number(b.rotation);
  if(!Number.isFinite(grout)||grout<0||grout>8||!Number.isFinite(rot)||rot<0||rot>180)throw Error("INVALID_SETTINGS");
  const color=String(b.groutColor||"");
  if(!/^#[\da-fA-F]{6}$/.test(color))throw Error("INVALID_GROUT");
  const prompt="Photorealistically edit the FIRST supplied room photo. The SECOND image is the EXACT real ceramic/porcelain material reference. Change ONLY the "+(b.target==="floor"?"floor":"walls")+". LOCK all original room architecture, doors, windows, furniture, objects, faces, perspective, camera and lighting. Correct tile perspective, scale and occlusions. Original specified tile size: "+String(b.tileSize||"unverified").slice(0,50)+"; grout "+grout+" mm, color "+color+"; rotation "+rot+" degrees. Never invent labels, alter unaffected areas or create a new scene. Return a single realistic edited IMAGE.";
  const result=await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent",{method:"POST",headers:{"Content-Type":"application/json","x-goog-api-key":key},body:JSON.stringify({contents:[{parts:[{text:prompt},room,surface]}],generationConfig:{responseModalities:["TEXT","IMAGE"]}})});
  if(!result.ok)return json(r,{error:"PROVIDER_REJECTED",status:result.status},502);
  const response=await result.json(),parts=response.candidates?.flatMap((c:{content?:{parts?:Array<{inlineData?:{mimeType?:string,data?:string}}>}})=>c.content?.parts||[])||[];
  const found=parts.find((p:{inlineData?:{mimeType?:string,data?:string}})=>p.inlineData?.mimeType?.startsWith("image/")&&p.inlineData?.data);
  if(!found)return json(r,{error:"NO_IMAGE"},502);
  return json(r,{image:"data:"+found.inlineData.mimeType+";base64,"+found.inlineData.data});
 }catch(e){const reason=e instanceof Error?e.message:"UNKNOWN";console.error("IDEA_RENDER",reason);return json(r,{error:/^(INVALID|MATERIAL|IMAGE_TOO|REQUEST_TOO)/.test(reason)?reason:"RENDER_UNAVAILABLE"},/^(INVALID|MATERIAL|IMAGE_TOO|REQUEST_TOO)/.test(reason)?400:503);}
});
