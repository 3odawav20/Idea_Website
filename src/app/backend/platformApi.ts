import { accountEndpoint, accountRequest } from './accountsApi';
export const platformEndpoint=accountEndpoint.replace(/accounts\.php(?:\?.*)?$/, 'platform.php');
export async function platformRequest(action:string,data?:Record<string,any>|FormData):Promise<any>{
 const session=await accountRequest('session');const multipart=data instanceof FormData;
 const r=await fetch(`${platformEndpoint}?action=${encodeURIComponent(action)}`,{method:data?'POST':'GET',credentials:'same-origin',cache:'no-store',headers:data?{'X-CSRF-Token':session.csrf,...(multipart?{}:{'Content-Type':'application/json'})}:{},body:data?multipart?data:JSON.stringify(data):undefined});
 let result;try{result=await r.json();}catch{throw new Error('PLATFORM_UNAVAILABLE');}if(!r.ok)throw new Error(result.error||'PLATFORM_UNAVAILABLE');return result;
}
export function platformUrl(action:string,id:string){return `${platformEndpoint}?action=${encodeURIComponent(action)}&id=${encodeURIComponent(id)}`;}
export async function generateRoomDesign(input:Record<string,any>,onProgress?:(stage:string)=>void){
 onProgress?.('creating');const job=await platformRequest('ai-create',input);onProgress?.('processing');try{await platformRequest('ai-process',{id:job.id});}catch(error){if(!(error instanceof TypeError))throw error;}
 let record:any;const deadline=Date.now()+240000;do{const response=await fetch(platformUrl('ai-job',job.id),{credentials:'same-origin',cache:'no-store'});if(!response.ok)throw new Error('JOB_STATUS_UNAVAILABLE');record=await response.json();if(!['queued','processing'].includes(record.state))break;await new Promise(resolve=>setTimeout(resolve,2000));}while(Date.now()<deadline);
 if(record.state!=='completed')throw new Error(record.error_code||'GENERATION_IN_PROGRESS');onProgress?.('downloading');const r=await fetch(platformUrl('ai-image',job.id),{credentials:'same-origin',cache:'no-store'});if(!r.ok)throw new Error('IMAGE_NOT_READY');const blob=await r.blob();return await new Promise<string>((resolve,reject)=>{const f=new FileReader();f.onload=()=>resolve(String(f.result));f.onerror=reject;f.readAsDataURL(blob);});
}
