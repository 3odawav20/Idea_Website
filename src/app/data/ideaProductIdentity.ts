import type { Product } from "./types";

/** Deterministic IDEA listing reference; never pretend this is a factory SKU.
 * Matching across suppliers needs independent review, not image resemblance.
 */
export function ideaInternalCode(product: Product): string {
  const source=product.source;
  const identity=source?.sourceId && source.recordId
    ? source.sourceId+"|"+source.recordId : "catalogue|"+product.id;
  let hash=0xcbf29ce484222325n;
  const prime=0x100000001b3n;
  for (const byte of new TextEncoder().encode(identity)) {
    hash=(hash^BigInt(byte))*prime&0xffffffffffffffffn;
  }
  return "IDEA-REF-"+hash.toString(16).toUpperCase().padStart(16,"0");
}

function normalizedIdentity(value:string):string {
  return value.normalize("NFKC").replace(/[^0-9a-z\u0600-\u06ff]/gi,"").toLocaleLowerCase();
}

function sourceSellerAffiliation(product:Product):string|null {
  const provider=product.source?.provider?.trim()||"";
  const match=provider.match(/^(.*?)\s+(?:(?:shopify\s+)?catalog(?:ue)?(?:\s+export)?|product\s+feed)$/i);
  return match?.[1]?.trim()||null;
}

function isSourceSellerAffiliation(product:Product,value:string):boolean {
  const seller=sourceSellerAffiliation(product);
  return Boolean(seller&&normalizedIdentity(seller)===normalizedIdentity(value));
}

/** A retailer or brand is NOT automatically the manufacturer. */
export function productMaker(product: Product, locale: "ar"|"en"|"fr") {
  const labels={ar:"الشركة المصنّعة",en:"Manufacturer",fr:"Fabricant"};
  const manufacturer=product.manufacturer?.trim();
  if(manufacturer&&!isSourceSellerAffiliation(product,manufacturer)) return {
    label:labels[locale],value:manufacturer,verified:true,
  };
  const waiting={
    ar:"قيد التوثيق من المصدر",en:"Source confirmation pending",
    fr:"En attente de vérification",
  };
  return {label:labels[locale],value:waiting[locale],verified:false};
}

export function publicProductBrand(product: Product): string|null {
  const brand=product.brand?.trim();
  if(!brand||isSourceSellerAffiliation(product,brand))return null;
  return brand;
}

export function sourceSku(product: Product): string|null {
  return product.code?.trim()||null;
}
