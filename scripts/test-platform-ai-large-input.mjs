import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import fs from 'node:fs';

const root=process.cwd(),php=process.env.IDEA_TEST_PHP||root+'/../php-runtime/php.exe';
const extensions=['-d','extension_dir='+root+'/../php-runtime/ext','-d','extension=pdo_sqlite'];
const fixture=(...args)=>execFileSync(php,[...extensions,'scripts/prepare-platform-test.php',...args]).toString().trim();
const suffix=Date.now(),password='Fixture-Password-12345',email=`platform-large-ai-${suffix}@example.test`;
let cookie='',csrf='';
async function call(action,data,expected=200,platform=true){
 const response=await fetch('http://127.0.0.1:5180/api/'+(platform?'platform':'accounts')+'.php?action='+action,{method:data?'POST':'GET',headers:{Cookie:cookie,...(data?{'X-CSRF-Token':csrf,...(data instanceof FormData?{}:{'Content-Type':'application/json'})}:{})},body:data?data instanceof FormData?data:JSON.stringify(data):undefined});
 for(const value of response.headers.getSetCookie())if(value.startsWith('IDEASESSID='))cookie=value.split(';')[0];
 const result=await response.json();if(result.csrf)csrf=result.csrf;assert.equal(response.status,expected,action+': '+JSON.stringify(result));return result;
}
await fixture();
await call('session',undefined,200,false);
await call('register',{email,password,display_name:'Large AI input fixture'},200,false);
fixture('promote',email);
await call('login',{email,password},200,false);
const fixtureDir=root+'/artifacts/php-platform-test';
execFileSync(php,['-d','extension_dir='+root+'/../php-runtime/ext','-d','extension=gd','-r',`$image=imagecreatetruecolor(96,64);imagejpeg($image,'${fixtureDir.replaceAll('\\','/')}/gemini-result.jpg');`]);
const data='data:image/png;base64,'+fs.readFileSync('public/ceramic-studio/room.png').toString('base64');
assert(Buffer.byteLength(data)>3000000,'the live room sample must exceed the former 3 MB JSON field limit');
const job=await call('ai-create',{room:data,material:data,surface:'الحوائط',size:'60 × 120',angle:'0',grout:'#d8d1c5',roomType:'غرفة معيشة',points:[]});
assert.equal((await call('ai-process',{id:job.id})).state,'completed');
const image=await fetch('http://127.0.0.1:5180/api/platform.php?action=ai-image&id='+job.id,{headers:{Cookie:cookie}});assert.equal(image.status,200);assert.equal(image.headers.get('content-type'),'image/jpeg');
const quota=await call('ai-quota');assert.deepEqual({used:quota.used,remaining:quota.remaining},{used:1,remaining:1});
console.log('PASS: an encoded room image over 3 MB is accepted, sanitized, processed through the image-provider fixture, and returned as a private JPEG without exceeding quota.');
