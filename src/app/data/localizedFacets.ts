import type { Locale } from "./types";

// Translate controlled catalogue facets for display ONLY. Raw supplier values
// remain unchanged in source records and URL filters.
const attributes: Record<string, {ar:string;fr:string}> = {
 "floor":{ar:"أرضيات",fr:"Sol"},"wall":{ar:"حوائط",fr:"Mur"},
 "wall and floor":{ar:"حوائط وأرضيات",fr:"Mur et sol"},
 "bathroom":{ar:"حمام",fr:"Salle de bains"},"kitchen":{ar:"مطبخ",fr:"Cuisine"},
 "outdoor":{ar:"خارجي",fr:"Extérieur"},"indoor":{ar:"داخلي",fr:"Intérieur"},
 "outdoor - floor":{ar:"أرضيات خارجية",fr:"Sol extérieur"},
 "outdoor - wall":{ar:"حوائط خارجية",fr:"Mur extérieur"},
 "matte":{ar:"مطفي",fr:"Mat"},"matt":{ar:"مطفي",fr:"Mat"},
 "glossy":{ar:"لامع",fr:"Brillant"},"polished":{ar:"مصقول",fr:"Poli"},
 "semi-matte":{ar:"نصف مطفي",fr:"Satiné"},"satin":{ar:"ساتان",fr:"Satin"},
 "beige":{ar:"بيج",fr:"Beige"},"white":{ar:"أبيض",fr:"Blanc"},
 "grey":{ar:"رمادي",fr:"Gris"},"gray":{ar:"رمادي",fr:"Gris"},
 "black":{ar:"أسود",fr:"Noir"},"brown":{ar:"بني",fr:"Marron"},
 "blue":{ar:"أزرق",fr:"Bleu"},"green":{ar:"أخضر",fr:"Vert"},
 "red":{ar:"أحمر",fr:"Rouge"},"gold":{ar:"ذهبي",fr:"Doré"},
 "ivory":{ar:"عاجي",fr:"Ivoire"},"cream":{ar:"كريمي",fr:"Crème"},
 "wood":{ar:"خشبي",fr:"Bois"},"stone":{ar:"حجري",fr:"Pierre"},
 "porcelain":{ar:"بورسلين",fr:"Grès cérame"},"ceramic":{ar:"سيراميك",fr:"Céramique"},
 "marble look":{ar:"مظهر رخامي",fr:"Aspect marbre"},
 "mosaic":{ar:"موزاييك",fr:"Mosaïque"},
 "beige / black":{ar:"بيج وأسود",fr:"Beige et noir"},
 "beige / olive":{ar:"بيج وزيتوني",fr:"Beige et olive"},
 "beige x blue":{ar:"بيج وأزرق",fr:"Beige et bleu"},
 "beige x brown":{ar:"بيج وبني",fr:"Beige et marron"},
};
export function localizedFacet(value:string,locale:Locale){
 if(locale==="en")return value;
 const key=value.trim().toLowerCase();
 const dict=attributes[key];
 if(dict)return dict[locale];
 // For joined colour values with known terms, keep source unchanged instead
 // of introducing inaccurate descriptions.
 return value;
}
