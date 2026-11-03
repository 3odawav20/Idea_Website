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

/** A retailer or brand is NOT automatically the manufacturer. */
export function productMaker(product: Product, locale: "ar"|"en"|"fr") {
  const labels={ar:"الشركة المصنّعة",en:"Manufacturer",fr:"Fabricant"};
  if(product.manufacturer?.trim()) return {
    label:labels[locale],value:product.manufacturer.trim(),verified:true,
  };
  const waiting={
    ar:"قيد التوثيق من المصدر",en:"Source confirmation pending",
    fr:"En attente de vérification",
  };
  return {label:labels[locale],value:waiting[locale],verified:false};
}

export function sourceSku(product: Product): string|null {
  return product.code?.trim()||null;
}
