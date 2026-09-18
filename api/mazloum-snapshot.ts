export interface MazloumSnapshotProduct {
  id: string;
  name: string;
  productUrl: string;
  image: string | null;
  category: string | null;
  price: string | null;
  previousPrice: string | null;
  discount: string | null;
  badges: string[];
}

export const MAZLOUM_SNAPSHOT: MazloumSnapshotProduct[] = [
  { id:"2297", name:"LIETO", productUrl:"https://mazloumhome.com/living-rooms/2297-lieto.html", image:"https://mazloum-img.s3-eu-west-1.amazonaws.com/img/p/1/0/3/7/2/10372-home_default.jpg", category:"Living Rooms", price:"EGP 343,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2295", name:"TANGRAM", productUrl:"https://mazloumhome.com/living-rooms/2295-7247-tangram.html#/50-material-fabric/2305-color-taupe/5530-dimension_model-h72_94w276d242_cm", image:null, category:"Living Rooms", price:"EGP 199,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2294", name:"TANGRAM", productUrl:"https://mazloumhome.com/living-rooms/2294-7244-tangram.html#/143-material-leather/6229-color-musk_green/6274-dimension_model-h72_94w223d102_2_cm", image:null, category:"Living Rooms", price:"EGP 257,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2293", name:"LIETO", productUrl:"https://mazloumhome.com/living-rooms/2293-lieto.html", image:null, category:"Living Rooms", price:"EGP 259,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2292", name:"LIETO", productUrl:"https://mazloumhome.com/living-rooms/2292-lieto.html", image:null, category:"Living Rooms", price:"EGP 259,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2291", name:"STUPORE", productUrl:"https://mazloumhome.com/living-rooms/2291-stupore.html", image:null, category:"Living Rooms", price:"EGP 304,760.00", previousPrice:"EGP 320,800.00", discount:"-5%", badges:["On sale!","-5%","New"] },
  { id:"2289", name:"GAIA", productUrl:"https://mazloumhome.com/sofachairs/2289-gaia.html", image:null, category:"Sofa&Chairs", price:"EGP 13,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2288", name:"GRATITUDINE", productUrl:"https://mazloumhome.com/sofachairs/2288-gratitudine.html", image:null, category:"Sofa&Chairs", price:"EGP 65,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2286", name:"SIDNEY", productUrl:"https://mazloumhome.com/sofachairs/2286-7191-sidney.html#/50-material-fabric/2783-color-greige/5585-dimension_model-h111w82d93_157_cm", image:null, category:"Sofa&Chairs", price:"EGP 172,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2284", name:"BRAMA", productUrl:"https://mazloumhome.com/living-rooms/2284-7184-brama.html#/143-material-leather/5858-color-sambuco", image:null, category:"Living Rooms", price:"EGP 402,424.75", previousPrice:"EGP 445,900.00", discount:"-9.75%", badges:["-9.75%","New"] },
  { id:"2283", name:"GAIA", productUrl:"https://mazloumhome.com/sofachairs/2283-7181-gaia.html#/50-material-fabric/5521-dimension_model-h43w39d39_cm/6483-color-pewter", image:null, category:"Sofa&Chairs", price:"EGP 14,900.00", previousPrice:null, discount:null, badges:["New"] },
  { id:"2281", name:"DAMEN", productUrl:"https://mazloumhome.com/sofachairs/2281-damen.html", image:null, category:"Sofa&Chairs", price:"EGP 69,900.00", previousPrice:null, discount:null, badges:["New"] },

  { id:"1823", name:"U255", productUrl:"https://mazloumhome.com/sofachairs/1823-u255.html", image:null, category:"Sofa&Chairs", price:"EGP 50,252.00", previousPrice:"EGP 73,900.00", discount:"-32%", badges:["Sale"] },
  { id:"2254", name:"A.I. LITE", productUrl:"https://mazloumhome.com/sofachairs/2254-6720-ai-lite.html", image:null, category:"Sofa&Chairs", price:"EGP 12,900.00", previousPrice:null, discount:null, badges:[] },
  { id:"89", name:"MOKA", productUrl:"https://mazloumhome.com/sofachairs/89-moka.html", image:null, category:"Sofa&Chairs", price:"EGP 66,160.00", previousPrice:"EGP 82,700.00", discount:"-20%", badges:["Sale"] },
  { id:"1956", name:"MAUI SOFT NOMA", productUrl:"https://mazloumhome.com/sofachairs/1956-maui-soft-noma.html", image:null, category:"Sofa&Chairs", price:"EGP 47,900.00", previousPrice:null, discount:null, badges:[] },
  { id:"84", name:"ODEON", productUrl:"https://mazloumhome.com/sofachairs/84-odeon.html", image:null, category:"Sofa&Chairs", price:"EGP 82,640.00", previousPrice:"EGP 103,300.00", discount:"-20%", badges:["Sale"] },
  { id:"87", name:"WEBY", productUrl:"https://mazloumhome.com/sofachairs/87-weby.html", image:null, category:"Sofa&Chairs", price:"EGP 75,920.00", previousPrice:"EGP 94,900.00", discount:"-20%", badges:["Sale"] },

  { id:"206", name:"WS 053", productUrl:"https://mazloumhome.com/wall-lamp/206-ws-053.html", image:"https://mazloum-img.s3-eu-west-1.amazonaws.com/img/p/5/3/8/3/5383-home_default.jpg", category:"Wall Lamp", price:"EGP 1,360.00", previousPrice:null, discount:null, badges:[] },
  { id:"1842", name:"ASIMETRIC", productUrl:"https://mazloumhome.com/wall-lamp/1842-asimetric.html", image:null, category:"Wall Lamp", price:"EGP 2,880.00", previousPrice:"EGP 3,600.00", discount:"-20%", badges:["Sale"] },
  { id:"779", name:"KE 023", productUrl:"https://mazloumhome.com/wall-lamp/779-ke-023.html", image:null, category:"Wall Lamp", price:"EGP 1,120.00", previousPrice:"EGP 1,400.00", discount:"-20%", badges:["Sale"] },
  { id:"1846", name:"PARACURU", productUrl:"https://mazloumhome.com/wall-lamp/1846-paracuru.html", image:null, category:"Wall Lamp", price:"EGP 3,840.00", previousPrice:"EGP 4,800.00", discount:"-20%", badges:["Sale"] },
  { id:"1836", name:"BOAVISTA", productUrl:"https://mazloumhome.com/wall-lamp/1836-boavista.html", image:null, category:"Wall Lamp", price:"EGP 2,320.00", previousPrice:"EGP 2,900.00", discount:"-20%", badges:["Sale"] },
  { id:"1636", name:"TOJA 472", productUrl:"https://mazloumhome.com/wall-lamp/1636-toja-472.html", image:null, category:"Wall Lamp", price:"EGP 3,600.00", previousPrice:"EGP 4,500.00", discount:"-20%", badges:["Sale"] },
  { id:"1630", name:"HEMISFERIC 466", productUrl:"https://mazloumhome.com/wall-lamp/1630-hemisferic-466.html", image:null, category:"Wall Lamp", price:"EGP 4,640.00", previousPrice:"EGP 5,800.00", discount:"-20%", badges:["Sale"] },
  { id:"1736", name:"BARKAN", productUrl:"https://mazloumhome.com/wall-lamp/1736-barkan.html", image:null, category:"Wall Lamp", price:"EGP 3,675.00", previousPrice:"EGP 4,900.00", discount:"-25%", badges:["Sale"] },

  { id:"2133", name:"A61206", productUrl:"https://mazloumhome.com/vases/2133-a61206.html", image:"https://mazloum-img.s3-eu-west-1.amazonaws.com/img/p/9/0/1/6/9016-home_default.jpg", category:"Vases", price:"EGP 3,900.00", previousPrice:null, discount:null, badges:[] },
  { id:"1529", name:"ABSOLUTE VASE", productUrl:"https://mazloumhome.com/vases/1529-absolute-vase.html", image:null, category:"Vases", price:"EGP 6,750.00", previousPrice:"EGP 7,500.00", discount:"-10%", badges:["Sale"] },
  { id:"1801", name:"LORD VASE", productUrl:"https://mazloumhome.com/vases/1801-lord-vase.html", image:null, category:"Vases", price:"EGP 16,380.00", previousPrice:"EGP 18,200.00", discount:"-10%", badges:["Sale"] },
  { id:"1440", name:"VENISSA VASE", productUrl:"https://mazloumhome.com/vases/1440-venissa-vase.html", image:null, category:"Vases", price:"EGP 6,750.00", previousPrice:"EGP 7,500.00", discount:"-10%", badges:["Sale"] },
  { id:"1523", name:"PASSADE VASE", productUrl:"https://mazloumhome.com/vases/1523-passade-vase.html", image:null, category:"Vases", price:"EGP 18,810.00", previousPrice:"EGP 20,900.00", discount:"-10%", badges:["Sale"] },
  { id:"2131", name:"E77972", productUrl:"https://mazloumhome.com/vases/2131-e77972.html", image:null, category:"Vases", price:"EGP 3,500.00", previousPrice:null, discount:null, badges:[] },
  { id:"2126", name:"E61149", productUrl:"https://mazloumhome.com/vases/2126-e61149.html", image:null, category:"Vases", price:"EGP 2,600.00", previousPrice:null, discount:null, badges:[] },
  { id:"2130", name:"E77967", productUrl:"https://mazloumhome.com/vases/2130-e77967.html", image:null, category:"Vases", price:"EGP 4,500.00", previousPrice:null, discount:null, badges:[] },

  { id:"1798", name:"FORMELLA", productUrl:"https://mazloumhome.com/wall-objects/1798-formella.html", image:null, category:"Wall Objects", price:"EGP 9,450.00", previousPrice:"EGP 10,500.00", discount:"-10%", badges:["Sale"] },
  { id:"195", name:"SASSO STONE", productUrl:"https://mazloumhome.com/wall-objects/195-sasso-stone.html", image:null, category:"Wall Objects", price:"EGP 14,775.00", previousPrice:"EGP 19,700.00", discount:"-25%", badges:["Sale"] },
  { id:"197", name:"SASSO STONE", productUrl:"https://mazloumhome.com/wall-objects/197-sasso-stone.html", image:null, category:"Wall Objects", price:"EGP 31,650.00", previousPrice:"EGP 42,200.00", discount:"-25%", badges:["Sale"] },
];
