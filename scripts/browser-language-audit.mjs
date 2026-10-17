import { chromium } from '@playwright/test';import fs from 'node:fs';
const browser=await chromium.launch({channel:'chrome'}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
page.on('pageerror',e=>errors.push(e.message));const result=[];
for(const locale of ['ar','en']){
await page.goto('http://127.0.0.1:5178/register',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:locale.toUpperCase(),exact:true}).click();
for(const route of ['/register','/register/customer','/register/business','/ai-room-visualizer?product=494&preview=amazon-room','/products','/subscriptions','/subscriptions/customers','/subscriptions/businesses','/room-designer','/room-designer/photo-guide','/room-designer/new','/login','/collections','/product/manila','/request-quote/new','/surface-styles','/tile-showroom','/about','/downloads','/contact','/']){
await page.goto('http://127.0.0.1:5178'+route,{waitUntil:'domcontentloaded'});await page.locator('main').waitFor({timeout:3000}).catch(()=>errors.push('Missing main: '+route));await page.locator('main h1').first().waitFor({timeout:1000}).catch(()=>{});await page.waitForTimeout(300);
const data=await page.evaluate(locale=>{const nodes=[],walk=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while(n=walk.nextNode()){if(!n.parentElement?.checkVisibility()||['SCRIPT','STYLE','OPTION'].includes(n.parentElement.tagName))continue;const value=n.textContent.trim();if(locale==='en'?/[\u0600-\u06ff]/.test(value):/[a-z]{2,}/i.test(value))nodes.push(value);}return{dir:document.documentElement.dir,text:[...new Set(nodes)],overflow:document.documentElement.scrollWidth>innerWidth,font:getComputedStyle(document.body).fontFamily};},locale);
result.push({locale,route,...data});
fs.writeFileSync('artifacts/browser-language-audit.json',JSON.stringify({errors,result},null,2));
console.log(locale,route,data.text.length,data.overflow?'OVERFLOW':'');
if(route==='/register'||route.startsWith('/ai-room'))await page.screenshot({path:`artifacts/${locale}-${route==='/register'?'accounts':'studio'}.png`,fullPage:true});
}}
fs.writeFileSync('artifacts/browser-language-audit.json',JSON.stringify({errors,result},null,2));console.log(JSON.stringify({errors,result},null,2));await browser.close();
