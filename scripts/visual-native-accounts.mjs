import {chromium,expect} from '@playwright/test';import fs from 'node:fs';
const records=JSON.parse(fs.readFileSync('artifacts/account-test-records.json')),browser=await chromium.launch({channel:'chrome'}),errors=[],results=[];
for(const role of ['buyer','supplier','admin']){
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage();page.on('pageerror',e=>errors.push(role+': '+e.message));
 await page.goto('http://127.0.0.1:5178/login',{waitUntil:'domcontentloaded'});
 await page.getByLabel('Email address',{exact:true}).fill(role==='buyer'?records.buyerEmail:role==='admin'?records.adminEmail:records.suppliers[0].email);
 await page.getByLabel('Password',{exact:true}).fill(records.password);await page.getByRole('button',{name:'Sign in',exact:true}).click();
 await expect(page).toHaveURL(role==='buyer'?/\/account$/:role==='admin'?/\/admin$/:/\/business$/);
 const routes=role==='buyer'?['/account/inbox','/account/outbox','/request-quote/new']:role==='supplier'?['/business/inbox','/business/outbox','/business/products','/business/settings']:['/admin'];
 for(const locale of ['en','ar']){
  await page.getByRole('button',{name:locale.toUpperCase(),exact:true}).click();
  for(const route of routes){await page.goto('http://127.0.0.1:5178'+route,{waitUntil:'domcontentloaded'});await page.locator('main').waitFor();await page.waitForTimeout(350);
   if(route.endsWith('/inbox')&&role!=='admin'){const item=page.getByRole('button',{name:/Amazon/}).first();if(await item.count())await item.click();}
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);results.push({role,locale,route,overflow});
   await page.screenshot({path:`artifacts/native-${role}-${locale}-${route.split('/').at(-1)}.png`,fullPage:true});
  }
 }
 await page.setViewportSize({width:390,height:844});await page.goto('http://127.0.0.1:5178'+routes[0],{waitUntil:'domcontentloaded'});await page.waitForTimeout(350);results.push({role,mobile:true,overflow:await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)});await page.screenshot({path:`artifacts/native-${role}-mobile.png`,fullPage:true});await context.close();
}
fs.writeFileSync('artifacts/native-accounts-visual.json',JSON.stringify({errors,results},null,2));console.log(JSON.stringify({errors,results},null,2));await browser.close();
