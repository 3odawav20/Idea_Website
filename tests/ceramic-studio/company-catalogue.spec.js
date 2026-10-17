import {test,expect} from '@playwright/test';
test('company draft upload uses PHP and image generation stays customer-only',async({page})=>{
 let product=null,uploads=0;const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const snapshot={csrf:'test-company-session',user:{id:'supplier1',name:'Supplier',email:'supplier@example.test',role:'supplier',created_at:Date.now()},company:{id:'company1',owner_id:'supplier1',public_name:'Tile Co',legal_name:'Tile Co LLC',email:'supplier@example.test',phone:'',description:'',business_details:{},status:'submitted',created_at:Date.now()},membership:null};
 await page.route('**/api/accounts.php?**',async route=>{const action=new URL(route.request().url()).searchParams.get('action');let data=snapshot;
   if(action==='products')data={products:product?[product]:[]};
   if(action==='upload'){uploads++;data={image:'/uploads/company-products/supplier1/tile.png'};}
   if(action==='product'){product={...route.request().postDataJSON(),id:'product1',active:false};data={id:'product1'};}
   if(action==='favorites')data={favorites:[]};
   await route.fulfill({status:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('/business/products',{waitUntil:'domcontentloaded'});await expect(page.getByRole('heading',{name:'Your company catalogue'})).toBeVisible();
 await page.getByLabel('Product name',{exact:true}).fill('Amazon');await page.getByLabel('Brand',{exact:true}).fill('Art Ceramic');await page.getByLabel('Tile dimensions (cm)',{exact:true}).fill('30 × 90');await page.getByLabel('Material',{exact:true}).selectOption('porcelain');
 await page.getByLabel('Product photo',{exact:true}).setInputFiles({name:'tile.png',mimeType:'image/png',buffer:Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2e0sAAAAASUVORK5CYII=','base64')});
 await page.getByRole('button',{name:'Save product for review'}).click();await expect(page.getByRole('status')).toContainText('Product saved as a draft');expect(uploads).toBe(1);expect(product.specifications.material).toBe('porcelain');
 await page.goto('/ai-room-visualizer',{waitUntil:'domcontentloaded'});await expect(page.locator('.studio .generate')).toBeDisabled();expect(errors).toEqual([]);
});
