import {test,expect} from '@playwright/test';

test('catalogue card opens the selected swatch and keeps it on reload in Arabic and English',async({page})=>{
 await page.addInitScript(()=>localStorage.setItem('idea.locale','ar'));
 await page.goto('/products',{waitUntil:'domcontentloaded'});
 const link=page.getByRole('link',{name:'جرّبه في مساحتك',exact:true}).first();
 const href=await link.getAttribute('href');expect(href).toMatch(/product=/);
 await link.click();await expect(page).toHaveURL(new RegExp(href.replaceAll('?','\\?')));
 const swatch=page.locator('.design-summary .selected-texture img');
 await expect(swatch).toBeVisible();const src=await swatch.getAttribute('src');
 await page.reload({waitUntil:'domcontentloaded'});await expect(swatch).toHaveAttribute('src',src);
 await page.goto('/products',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'EN',exact:true}).click();
 await expect(page.getByRole('link',{name:'Try it in your space',exact:true}).first()).toBeVisible();
});

test('company product uses its real published photo after navigation and reload, preserves quotation identity, and fails closed when unavailable',async({page})=>{
 const id='published-tile',item={id,company_id:'tile-company',title:'Supplier marble swatch',specifications:{material:'marble',image:'/ceramic-studio/materials/marble.svg',brand:'Tile brand',dimensions:'60 × 60'}};
 let available=true;
 await page.route('**/api/accounts.php?**',async route=>{
  const action=new URL(route.request().url()).searchParams.get('action');
  const data=action==='showrooms'?{companies:[{id:'tile-company',public_name:'Tile company'}],products:[item]}:action==='supplier-product'?available?item:{error:'PRODUCT_NOT_FOUND'}:{user:null,company:null,membership:null,csrf:'test-token'};
  await route.fulfill({status:action==='supplier-product'&&!available?404:200,contentType:'application/json',body:JSON.stringify(data)});
 });
 await page.goto('/suppliers',{waitUntil:'domcontentloaded'});await page.getByRole('link',{name:'Try it in your space',exact:true}).click();
 await expect(page).toHaveURL(/supplier=published-tile/);await expect(page.locator('.design-summary h3')).toHaveText(item.title);
 await page.reload({waitUntil:'domcontentloaded'});await expect(page.locator('.design-summary h3')).toHaveText(item.title);
 await expect(page.locator('.design-summary .selected-texture img')).toHaveAttribute('src',item.specifications.image);
 await page.locator('.design-summary').getByRole('button').last().click();await expect(page).toHaveURL(/\/request-quote\/new$/);await expect(page.locator('main')).toContainText(item.title);
 available=false;await page.goto('/ai-room-visualizer?supplier='+id,{waitUntil:'domcontentloaded'});await expect(page.getByRole('alert')).toBeVisible();await expect(page.locator('.studio')).toHaveCount(0);
});
