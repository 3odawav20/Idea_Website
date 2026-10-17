import { useCallback } from 'react';
import { useI18n } from './i18n';
import pairs from './ui-pairs.json';

const arabic=new Map<string,string>(),english=new Map<string,string>();
const key=(s:string)=>s.trim().replace(/\s+/g,' ').toLowerCase();
for(const [en,ar] of pairs){if(!en||!ar)continue;arabic.set(key(en),ar);english.set(key(ar),en);}
const protectedNames=new Set(['IDEA','Amazon','Art Ceramic','VISA','Fawry','meeza','EN','AR','FR','Firebase','Supabase']);
export function translateUiText(value:string,locale:string):string {
  const errors: Record<string,[string,string]> = {
    AUTH_REQUIRED:['Sign in to your IDEA account to enable AI generation. Local preview is available without an account.','سجّل الدخول من حساب IDEA أولًا لتفعيل التوليد الذكي. المعاينة المحلية متاحة بدون حساب.'],
    CUSTOMER_ONLY:['Image generation is available to customer accounts only.','توليد الصور مخصص لحسابات العملاء فقط.'],
    ACCOUNTS_UNAVAILABLE:['Account service is currently unavailable. Please try again later.','خدمة الحسابات غير متاحة حاليًا. حاول لاحقًا.'],
    ACCOUNTS_NOT_CONFIGURED:['Account service is currently unavailable. Please try again later.','خدمة الحسابات غير متاحة حاليًا. حاول لاحقًا.'],
    under_100k:['Under EGP 100,000','أقل من ١٠٠ ألف جنيه'],
    '100k_500k':['EGP 100,000 – 500,000','من ١٠٠ إلى ٥٠٠ ألف جنيه'],
    '500k_2m':['EGP 500,000 – 2 million','من ٥٠٠ ألف إلى ٢ مليون جنيه'],
    '2m_10m':['EGP 2 – 10 million','من ٢ إلى ١٠ مليون جنيه'],
    over_10m:['Over EGP 10 million','أكثر من ١٠ مليون جنيه'],
    prefer_not_to_say:['Prefer to discuss later','أفضل مناقشته لاحقًا'],
    retailer:['Retail showroom','معرض تجزئة'],wholesaler:['Wholesaler / distributor','تاجر جملة أو موزع'],manufacturer:['Manufacturer','مصنع'],importer:['Importer','مستورد'],contractor:['Supply and installation','توريد وتركيب'],
    all:['All selected categories','كل الأنواع المختارة'],sqm:['m²','م²'],pieces:['pieces','قطعة'],ton:['tonnes','طن'],kg:['kg','كجم'],
  };
  if(errors[value])return errors[value][locale==='ar'?1:0];
  const text=key(value);if(!text||protectedNames.has(text)||locale==='fr')return value;
  const result=(locale==='ar'?arabic:english).get(text);
  if(result)return (value.match(/^\s*/)?.[0] || '')+result+(value.match(/\s*$/)?.[0] || '');
  if(locale==='ar'&&/^[a-z\s/×-]+$/i.test(text)) {
    const parts=text.split(/\s+([\/×x-])\s+/);
    if(parts.length>1&&parts.every(part=>/^[\/×x-]$/.test(part)||arabic.has(key(part)))) return parts.map(part=>arabic.get(key(part))||part).join(' ');
  }
  // Keep measurements readable without changing their underlying form values.
  if(locale==='ar'&&/^\d+(?:[.,]\d+)?(?:\s*[×x]\s*\d+(?:[.,]\d+)?)?\s*(cm|mm|m²|m2|m)$/i.test(text))return value.replace(/\bcm\b/gi,'سم').replace(/\bmm\b/gi,'مم').replace(/m²|m2/g,'م²').replace(/\bm\b/g,'م');
  return value;
}
export function useUiText(){const {locale}=useI18n();return useCallback(function localize(value:any):any {if(typeof value==='string')return translateUiText(value,locale);if(Array.isArray(value))return value.map(localize);return value;},[locale]);}
