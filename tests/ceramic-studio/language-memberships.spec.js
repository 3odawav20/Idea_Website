import { test, expect } from '@playwright/test';

test('language switches all studio controls, persists on reload and preserves the selected material',async({page})=>{
  const errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/ai-room-visualizer?product=494',{waitUntil:'domcontentloaded'});
  await expect(page.locator('.design-summary h3')).toHaveText('Amazon');
  await page.getByRole('button',{name:'AR',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('dir','rtl');
  await expect(page.locator('#mode')).toContainText('توليد بالذكاء الاصطناعي');
  await page.reload({waitUntil:'domcontentloaded'});
  await expect(page.locator('html')).toHaveAttribute('lang','ar');
  await page.getByRole('button',{name:'EN',exact:true}).click();
  await expect(page.locator('html')).toHaveAttribute('dir','ltr');
  await expect(page.locator('.design-summary h3')).toHaveText('Amazon');
  await expect(page.locator('#mode')).not.toContainText(/[\u0600-\u06ff]/);
  expect(await page.locator('.studio').evaluate(node=>node.innerText)).not.toMatch(/[\u0600-\u06ff]/);
  await expect(page.locator('.studio select').first().locator('option').first()).toHaveAttribute('value','حمّام');
  await page.locator('.studio select').first().selectOption('مطبخ');
  await expect(page.locator('.studio select').first()).toHaveValue('مطبخ');
  const fonts=await page.locator('body, header, .studio, .studio select, footer').evaluateAll(nodes=>nodes.map(node=>getComputedStyle(node).fontFamily));
  expect(fonts.every(font=>font.includes('IDEA Cairo'))).toBe(true);
  expect(errors).toEqual([]);
});

test('customer and company registration are visible, distinct and send the right signup intent',async({page})=>{
  const payloads=[];
  await page.route('**/api/accounts.php?**',async route=>{
    const register=new URL(route.request().url()).searchParams.get('action')==='register';
    if(register)payloads.push(route.request().postDataJSON());
    await route.fulfill({status:register?503:200,contentType:'application/json',body:JSON.stringify(register?{error:'ACCOUNTS_UNAVAILABLE'}:{user:null,company:null,membership:null,csrf:'test-csrf'})});
  });
  await page.goto('/register',{waitUntil:'domcontentloaded'});
  await expect(page.locator('[data-account-type]')).toHaveCount(2);
  await page.locator('[data-account-type="customer"] a[href="/register/customer"]').click();
  await expect(page.getByRole('heading',{name:'Create a customer account',exact:true})).toBeVisible();
  await page.getByLabel('Full name',{exact:true}).fill('Customer Test');
  await page.getByLabel('Email address',{exact:true}).fill('customer@example.com');
  await page.getByLabel('Password',{exact:true}).fill('StrongPassword123');
  await expect(page.locator('input[name="company"]')).toHaveCount(0);
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('We could not complete');
  expect(payloads[0].account_type).toBe('customer');
  expect(payloads[0].company_name).toBeUndefined();
  await page.locator('header a[href="/register/business"]').click();
  await page.getByLabel('Contact person',{exact:true}).fill('Company Test');
  await page.getByLabel('Company display name',{exact:true}).fill('Tile Company');
  await page.getByLabel('Legal company name',{exact:true}).fill('Tile Company LLC');
  await page.getByLabel('Phone number',{exact:true}).fill('+201000000000');
  await page.getByLabel('Email address',{exact:true}).fill('company@example.com');
  await page.getByLabel('Password',{exact:true}).fill('StrongPassword123');
  await page.getByRole('checkbox',{name:'Ceramic',exact:true}).check();
  await page.getByRole('checkbox',{name:'Marble',exact:true}).check();
  await page.getByLabel('Your main product category',{exact:true}).selectOption('ceramic');
  await page.getByLabel('Business type',{exact:true}).selectOption('wholesaler');
  await page.getByLabel('Typical contract value (EGP)',{exact:true}).selectOption('500k_2m');
  await page.getByLabel('Main governorate',{exact:true}).fill('Cairo');
  await page.getByLabel('Delivery areas / governorates',{exact:true}).fill('Cairo, Giza');
  await page.getByRole('button',{name:'Create account',exact:true}).click();
  await expect(page.getByRole('status')).toContainText('We could not complete');
  expect(payloads[1].account_type).toBe('business');
  expect(payloads[1].company_name).toBe('Tile Company');
  expect(payloads[1].business_profile.categories).toEqual(['ceramic','marble']);
  expect(payloads[1].business_profile.contract_volume).toBe('500k_2m');
  expect(payloads[1]).not.toHaveProperty('role');
});

test('memberships send visitors to the matching signup, and both languages fit on mobile',async({page})=>{
  await page.setViewportSize({width:390,height:844});
  for(const locale of ['ar','en']){
    await page.goto('/subscriptions/businesses',{waitUntil:'domcontentloaded'});
    await page.getByRole('button',{name:locale.toUpperCase(),exact:true}).click();
    await page.getByRole('button',{name:locale==='ar'?'سنوي':'Annual',exact:true}).click();
    await page.getByRole('button',{name:locale==='ar'?'طلب اشتراك شركة':'Request company membership',exact:true}).click();
    await expect(page).toHaveURL(/\/register\/business\?interval=annual/);
    await expect(page.locator('input[name="company"]')).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    await page.goto('/register',{waitUntil:'domcontentloaded'});
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
    const body=await page.locator('main').innerText();
    if(locale==='en')expect(body).not.toMatch(/[\u0600-\u06ff]/);
  }
});
