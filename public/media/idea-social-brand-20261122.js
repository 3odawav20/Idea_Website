/* Compatibility enhancement for the existing cPanel SPA. No credentials or account data. */
(() => {
  const routes = new Set(['/login', '/register', '/register/customer', '/register/business', '/business/login']);
  const namespace = 'http://www.w3.org/2000/svg';
  const brands = [
    ['google','Google', [['#4285F4','M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z'],['#34A853','M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z'],['#FBBC05','M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z'],['#EA4335','M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z']]],
    ['microsoft','Microsoft',[['#F25022','M1 1h10.5v10.5H1z'],['#7FBA00','M12.5 1H23v10.5H12.5z'],['#00A4EF','M1 12.5h10.5V23H1z'],['#FFB900','M12.5 12.5H23V23H12.5z']]],
    ['whatsapp','WhatsApp',[['#25D366','M12.03 2C6.51 2 2.02 6.48 2.02 12c0 1.76.46 3.48 1.33 4.99L2 22l5.15-1.35A9.97 9.97 0 0 0 12.03 22c5.52 0 10.01-4.48 10.01-10S17.55 2 12.03 2Z'],['#fff','M17.52 14.95c-.29-.15-1.74-.86-2.01-.96-.27-.1-.47-.15-.66.15-.2.29-.76.96-.93 1.15-.17.2-.34.22-.64.07-.29-.15-1.24-.46-2.37-1.46-.88-.78-1.47-1.75-1.64-2.04-.17-.29-.02-.45.13-.6.15-.15.29-.34.44-.51.15-.17.2-.29.29-.49.1-.2.05-.37-.02-.51-.07-.15-.66-1.59-.91-2.18-.24-.57-.48-.5-.66-.51h-.56c-.2 0-.51.07-.78.37-.27.29-1.03 1-1.03 2.45 0 1.44 1.05 2.84 1.2 3.04.15.2 2.07 3.16 5.01 4.43.7.3 1.25.48 1.67.62.7.22 1.34.19 1.85.12.56-.08 1.74-.71 1.98-1.4.25-.69.25-1.27.17-1.4-.07-.12-.27-.2-.56-.34Z']]],
    ['facebook','Facebook',[['#1877F2','M12 0a12 12 0 1 0 0 24 12 12 0 1 0 0-24Z'],['#fff','M15.12 12.96l.53-3.46h-3.32V7.25c0-.95.46-1.87 1.95-1.87h1.51V2.43S14.42 2.2 13.1 2.2c-2.74 0-4.53 1.66-4.53 4.66V9.5H5.53v3.46h3.04v9.45h3.76v-9.45h2.79Z']]],
    ['apple','Apple',[['currentColor','M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43Zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45Z']]],
    ['github','GitHub',[['currentColor','M12 .75a11.25 11.25 0 0 0-3.56 21.92c.56.1.77-.24.77-.54v-2.1c-3.13.68-3.8-1.33-3.8-1.33-.5-1.3-1.25-1.65-1.25-1.65-1.02-.7.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15 1 1.7 2.61 1.2 3.25.92.1-.72.4-1.2.72-1.47-2.5-.28-5.12-1.25-5.12-5.56 0-1.23.44-2.23 1.15-3.02-.12-.28-.5-1.43.1-2.99 0 0 .94-.3 3.1 1.15a10.8 10.8 0 0 1 5.66 0c2.16-1.45 3.1-1.15 3.1-1.15.61 1.56.23 2.71.11 2.99a4.36 4.36 0 0 1 1.15 3.02c0 4.32-2.63 5.27-5.14 5.55.4.35.76 1.04.76 2.1v3.07c0 .3.2.65.77.54A11.25 11.25 0 0 0 12 .75Z']]],
    ['linkedin','LinkedIn',[['#0A66C2','M0 2Q0 0 2 0h20q2 0 2 2v20q0 2-2 2H2q-2 0-2-2Z'],['#fff','M5 9h3.2v10H5zm1.6-4.8a1.85 1.85 0 1 0 0 3.7 1.85 1.85 0 0 0 0-3.7ZM10.3 9h3.1v1.4h.1c.7-1.1 1.8-1.7 3.3-1.7 3.4 0 4 2.2 4 5V19h-3.2v-4.7c0-1.2 0-2.5-1.7-2.5s-2.4 1-2.4 2.4V19h-3.2z']]],
    ['x','X',[['currentColor','M18.9 2H22l-6.8 7.8L23 22h-6.1l-4.8-7.5L5.5 22H2l7.9-9.1L1 2h6.1l4.4 6.8L18.9 2zM17.9 20h1.8L6.1 4H4.2z']]]
  ];
  const labels = {
    ar:['أو تابع باستخدام','قريبًا','متاح','تسجيل الدخول بجوجل يثبت هويتك فقط؛ طلب الشركة وصلاحياتها يخضعان للمراجعة.'],
    en:['Or continue with','Coming soon','Available','Google verifies your identity. Company onboarding and access require review.'],
    fr:['Ou continuer avec','Bientôt disponible','Disponible','Google vérifie votre identité. Les droits de société nécessitent une validation.']
  };
  const providerApi = '/api/social-auth.php';
  let flags = null;
  let fetching = null;
  function icon(parts) {
    const svg=document.createElementNS(namespace,'svg');svg.setAttribute('viewBox','0 0 24 24');svg.setAttribute('aria-hidden','true');
    for(const [fill,d] of parts){const p=document.createElementNS(namespace,'path');p.setAttribute('fill',fill);p.setAttribute('d',d);svg.append(p);}
    return svg;
  }
  function getFlags() {
    if(!fetching) fetching=fetch(providerApi+'?action=providers',{credentials:'same-origin',cache:'no-store',headers:{Accept:'application/json'}}).then(async r=>{
      if(!r.ok) throw Error('unavailable');const payload=await r.json();flags=payload.ok===true?payload.providers:{};
    }).catch(()=>{flags={};});
    return fetching;
  }
  function mount() {
    const route=location.pathname.replace(/\/$/,'');
    const actions=document.querySelector('form.idea-auth-panel .idea-auth-actions');
    if(!routes.has(route)||!actions)return;
    const locale=labels[document.documentElement.lang?.split('-')[0]]||labels.en;
    const business=route.includes('business');
    const existing=actions.querySelector('[data-idea-social-brand]');
    const key=route+'|'+locale[0];
    if(existing?.dataset.key===key)return;
    existing?.remove();
    const panel=document.createElement('section');panel.className='idea-social-brand';panel.dataset.ideaSocialBrand='true';panel.dataset.key=key;
    const heading=document.createElement('p');heading.className='idea-social-brand-heading';heading.textContent=locale[0];panel.append(heading);
    const grid=document.createElement('div');grid.className='idea-social-brand-grid';panel.append(grid);
    for(const [id,name,paths] of brands){
      const btn=document.createElement('button');btn.type='button';btn.disabled=true;btn.dataset.provider=id;btn.append(icon(paths));
      const text=document.createElement('span');text.textContent=name;const status=document.createElement('small');status.textContent=locale[1];text.append(status);btn.append(text);
      btn.addEventListener('click',()=>{if(id==='google' && flags?.google===true)location.assign(providerApi+'?action=start&provider=google');});grid.append(btn);
    }
    if(business){const message=document.createElement('p');message.className='idea-social-brand-note';message.textContent=locale[3];panel.append(message);}
    actions.append(panel);
    const old=actions.querySelector('.idea-auth-social');if(old)old.hidden=true;
    getFlags().then(()=>{if(!panel.isConnected)return;const google=panel.querySelector('[data-provider="google"]');if(flags?.google===true){google.disabled=false;google.querySelector('small').textContent=locale[2];}});
  }
  const run=()=>{try{mount();}catch{ /* Existing account form remains available. */ }};
  let scheduled=false;
  const schedule=()=>{if(!scheduled){scheduled=true;requestAnimationFrame(()=>{scheduled=false;run();});}};
  new MutationObserver(schedule).observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['lang']});
  addEventListener('popstate',schedule);run();
})();
