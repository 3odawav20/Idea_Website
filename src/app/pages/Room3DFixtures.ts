import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import type { RoomMode } from "./Room3DLighting";

export type FixtureKind =
  | "bathtub" | "basin" | "bath-faucet" | "toilet" | "shower" | "mirror"
  | "kitchen-faucet" | "kitchen-sink" | "sofa" | "coffee-table"
  | "floor-lamp" | "tv" | "door" | "window";
export type Wall = "back" | "left" | "right";
export type PlacedFixture = {
  id: string; kind: FixtureKind; x: number; y: number; z: number;
  rotation: number; wall?: Wall; color?: string; scale?: number;
};
export type RoomDimensions = { width: number; length: number; height: number };
export const fixtureKinds: FixtureKind[] = [
  "bathtub","basin","bath-faucet","toilet","shower","mirror",
  "kitchen-faucet","kitchen-sink","sofa","coffee-table","floor-lamp",
  "tv","door","window"
];
export const fixtureLabels: Record<FixtureKind, {en:string;ar:string;fr:string}> = {
  bathtub:{en:"Bathtub",ar:"بانيو",fr:"Baignoire"},
  basin:{en:"Washbasin",ar:"حوض حمام",fr:"Lavabo"},
  "bath-faucet":{en:"Bathroom faucet",ar:"حنفية حمام",fr:"Robinet salle de bain"},
  toilet:{en:"Toilet",ar:"قاعدة حمام",fr:"WC"},
  shower:{en:"Shower",ar:"دش",fr:"Douche"},
  mirror:{en:"Mirror",ar:"مراية",fr:"Miroir"},
  "kitchen-faucet":{en:"Kitchen faucet",ar:"حنفية مطبخ",fr:"Robinet cuisine"},
  "kitchen-sink":{en:"Kitchen sink",ar:"حوض مطبخ",fr:"Évier de cuisine"},
  sofa:{en:"Sofa",ar:"كنبة",fr:"Canapé"},
  "coffee-table":{en:"Coffee table",ar:"ترابيزة وسط",fr:"Table basse"},
  "floor-lamp":{en:"Floor lamp",ar:"أباجورة أرضية",fr:"Lampadaire"},
  tv:{en:"Television",ar:"شاشة",fr:"Télévision"},
  door:{en:"Door",ar:"باب",fr:"Porte"},
  window:{en:"Window",ar:"شباك",fr:"Fenêtre"}
};
export const wallFixtureKinds: readonly FixtureKind[] = ["door","window","mirror","shower","tv"];
const white = new THREE.MeshStandardMaterial({color:0xf1f0eb,roughness:.28,metalness:.02});
const ceramic = new THREE.MeshPhysicalMaterial({color:0xe4e9eb,roughness:.2,clearcoat:.7});
const dark = new THREE.MeshStandardMaterial({color:0x24282b,roughness:.42,metalness:.12});
const steel = new THREE.MeshStandardMaterial({color:0xadb7bd,metalness:.83,roughness:.21});
const glass = new THREE.MeshPhysicalMaterial({color:0xa4bdc8,metalness:.08,roughness:.09,transparent:true,opacity:.67,depthWrite:false});
const oak = new THREE.MeshStandardMaterial({color:0x9a7758,roughness:.65});
const fabric = new THREE.MeshStandardMaterial({color:0xb5afa5,roughness:.94});
const steelBlue = new THREE.MeshStandardMaterial({color:0x567387,roughness:.28,metalness:.25});

export function createRoomFixture(kind:FixtureKind,id:string): THREE.Group {
  const g=new THREE.Group();
  g.name="IDEA_" + kind.toUpperCase();
  g.userData.fixtureId=id;
  g.userData.kind=kind;
  // Tintable finishes are cloned for each fixture: recolouring one object
  // cannot unintentionally recolour every other object in the room.
  const perObjectFinishes=new Map<THREE.Material,THREE.MeshStandardMaterial>();
  const finishEntries:Array<{material:THREE.MeshStandardMaterial;original:number}>=[];
  g.userData.finishEntries=finishEntries;
  const add=(geometry:THREE.BufferGeometry, material:THREE.Material,x=0,y=0,z=0)=>{
    let used=material;
    if(material===white||material===ceramic||material===oak||material===fabric){
      let local=perObjectFinishes.get(material);
      if(!local){
        local=(material as THREE.MeshStandardMaterial).clone();
        perObjectFinishes.set(material,local);
        finishEntries.push({material:local,original:local.color.getHex()});
      }
      used=local;
    }
    const mesh=new THREE.Mesh(geometry,used);
    mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;g.add(mesh);
    return mesh;
  };
  const box=(w:number,h:number,d:number,mat:THREE.Material,x=0,y=0,z=0)=>add(new THREE.BoxGeometry(w,h,d),mat,x,y,z);
  const cyl=(r:number,h:number,mat:THREE.Material,x=0,y=0,z=0)=>add(new THREE.CylinderGeometry(r,r,h,20),mat,x,y,z);
  // Porcelain washbasin with a curved inner bowl instead of three flat boxes.
  const sink=(width=.72)=>{
    const profile=[
      new THREE.Vector2(.03,.71),new THREE.Vector2(.11,.71),
      new THREE.Vector2(.19,.73),new THREE.Vector2(.26,.77),
      new THREE.Vector2(.305,.83),new THREE.Vector2(.326,.855),
      new THREE.Vector2(.329,.869),new THREE.Vector2(.307,.876),
      new THREE.Vector2(.288,.852)
    ];
    const bowl=add(new THREE.LatheGeometry(profile,56),ceramic,0,0,.02);
    bowl.scale.set(width/.72,1,.88);
    cyl(.037,.006,steel,0,.718,.02);
  };
  const tap=(high=.31,reach=.18)=>{
    cyl(.027,.09,steel,.19,.88,-.15);
    cyl(.016,high,steel,.19,1+high/2-.075,-.15);
    const nozzle=box(reach,.03,.032,steel,.19-reach/2,1+high-.075,-.15);
    nozzle.castShadow=true;
    cyl(.014,.055,steel,.25,.95,-.15);
  };
  switch(kind) {
    case "bathtub": {
      // Beveled freestanding shell with a real inset cavity and chrome drain.
      const rounded=(w:number,d:number,r:number)=>{
        const s=new THREE.Shape(),x=-w/2,z=-d/2;
        s.moveTo(x+r,z);s.lineTo(x+w-r,z);s.quadraticCurveTo(x+w,z,x+w,z+r);
        s.lineTo(x+w,z+d-r);s.quadraticCurveTo(x+w,z+d,x+w-r,z+d);
        s.lineTo(x+r,z+d);s.quadraticCurveTo(x,z+d,x,z+d-r);
        s.lineTo(x,z+r);s.quadraticCurveTo(x,z,x+r,z);s.closePath();return s;
      };
      const shell=rounded(1.66,.82,.18);
      const inner=rounded(1.34,.54,.15);
      shell.holes.push(new THREE.Path(inner.getPoints(12)));
      const tub=add(new THREE.ExtrudeGeometry(shell,{
        depth:.47,steps:1,bevelEnabled:true,bevelSize:.014,bevelThickness:.012,bevelSegments:3,curveSegments:12
      }),ceramic,0,.17,0);
      tub.rotation.x=-Math.PI/2;
      box(1.33,.04,.52,white,0,.19,0);
      cyl(.036,.007,steel,-.52,.216,0);
      break;
    }
    case "basin":
      add(new THREE.CylinderGeometry(.12,.16,.64,32),white,0,.34,0);
      sink(); break;
    case "bath-faucet": tap(.26,.21);break;
    case "kitchen-faucet": {
      cyl(.032,.12,steel,0,.1,0);
      const curve=new THREE.CatmullRomCurve3([
        new THREE.Vector3(0,.08,0),new THREE.Vector3(0,.33,0),
        new THREE.Vector3(-.015,.43,0),new THREE.Vector3(-.23,.43,0),
        new THREE.Vector3(-.25,.32,0)
      ]);
      add(new THREE.TubeGeometry(curve,36,.017,10,false),steel);
      cyl(.013,.045,steel,-.25,.30,0);
      break;
    }
    case "kitchen-sink":box(.85,.12,.56,oak,0,.77,0);sink(.7);break;
    case "toilet":
      box(.42,.56,.18,ceramic,0,.47,-.25);
      cyl(.27,.36,ceramic,0,.24,.05);
      box(.48,.05,.58,white,0,.42,.03);break;
    case "shower":
      cyl(.024,1.55,steel,0,0,0);
      box(.27,.025,.035,steel,.12,.7,0);
      cyl(.14,.03,steel,.29,.68,0);break;
    case "mirror": {
      box(.86,1.13,.046,oak,0,0,0);
      // Real scene reflection at a capped resolution to limit GPU load.
      const reflection=new Reflector(new THREE.PlaneGeometry(.76,1.03),{
        textureWidth:256,textureHeight:384,clipBias:.003,color:0xc2c9ce
      });
      reflection.position.z=.035;
      g.add(reflection);
      // Reflector can render nearly black in software WebGL. A subtle
      // silver-glass sheen keeps the surface readable without replacing
      // its live reflections on supported hardware.
      const sheen=new THREE.Mesh(new THREE.PlaneGeometry(.755,1.025),
        new THREE.MeshPhysicalMaterial({
          color:0xaebdc8,metalness:.72,roughness:.08,clearcoat:1,
          clearcoatRoughness:.06,transparent:true,opacity:.46,
          depthWrite:false,envMapIntensity:1.4,side:THREE.DoubleSide
        }));
      sheen.position.z=.038;
      sheen.userData.fixtureOverlayMaterial=true;
      g.add(sheen);
      break;
    }
    case "sofa":
      box(1.85,.39,.81,fabric,0,.30,0);
      box(1.85,.68,.18,fabric,0,.64,-.36);
      box(.19,.43,.82,fabric,-.92,.48,0);
      box(.19,.43,.82,fabric,.92,.48,0);
      for(const x of [-.52,0,.52])box(.48,.13,.68,white,x,.54,.05);
      break;
    case "coffee-table":
      box(1.05,.075,.59,oak,0,.45,0);
      for(const x of [-.42,.42])for(const z of [-.20,.20])cyl(.025,.40,steel,x,.21,z);
      break;
    case "floor-lamp":
      cyl(.22,.06,dark,0,.04,0);
      cyl(.018,1.45,steel,0,.76,0);
      add(new THREE.ConeGeometry(.24,.41,24,1,true),white,0,1.6,0);
      break;
    case "tv":
      box(1.3,.74,.065,dark,0,0,0);
      box(1.24,.68,.068,steelBlue,0,0,.04);
      break;
    case "door":
      box(.95,2.08,.075,oak,0,0,0);
      box(.83,1.96,.015,white,0,0,.045);
      cyl(.035,.065,steel,.32,-.07,.08).rotation.x=Math.PI/2;
      box(1.03,.045,.10,steel,0,1.06,0);
      break;
    case "window":
      box(1.38,1.08,.09,white,0,0,0);
      box(1.26,.95,.10,glass,0,0,.045);
      box(.045,1.0,.13,white,0,0,.095);
      box(1.29,.045,.13,white,0,0,.095);
      break;
  }
  return g;
}

/** Change a single fixture's finish without rebuilding the room. */
export function setFixtureColor(group:THREE.Group,color?:string){
  const entries=group.userData.finishEntries as Array<{material:THREE.MeshStandardMaterial;original:number}>|undefined;
  for(const entry of entries??[]){
    if(color&&/^#[0-9a-f]{6}$/i.test(color))entry.material.color.set(color);
    else entry.material.color.setHex(entry.original);
  }
}

/** Fixtures are layout-scale procedural placeholders, not certified product models. */
export function fixturePreset(mode:RoomMode):PlacedFixture[] {
  const make=(id:string,kind:FixtureKind,x:number,z:number,y=0,wall?:Wall):PlacedFixture=>({id,kind,x,y,z,rotation:0,wall});
  switch(mode){
    case "bathroom": return [
      make("bath-tub","bathtub",-.94,-.84),
      make("bath-basin","basin",.88,-.89),
      make("bath-toilet","toilet",.95,.84),
      make("bath-mirror","mirror",.75,-1.96,1.65,"back"),
      make("bath-shower","shower",-1.65,-1.96,1.5,"back")
    ];
    case "living": return [
      make("living-sofa","sofa",0,-.85),
      make("living-table","coffee-table",0,.35),
      make("living-lamp","floor-lamp",-1.44,-1.25),
      make("living-tv","tv",0,-1.96,1.48,"back")
    ];
    case "kitchen":return [];
    default:return [];
  }
}
export function positionFixture(group:THREE.Group,fixture:PlacedFixture,dims:RoomDimensions) {
  const {width:w,length:l,height:h}=dims;
  const onWall=fixture.wall;
  const scale=THREE.MathUtils.clamp(fixture.scale??1,.6,1.5);
  group.scale.setScalar(scale);
  const wallLength=onWall==="back"?w:l;
  const half=fixture.kind==="window"?.72:fixture.kind==="tv"?.7:fixture.kind==="door"?.55:fixture.kind==="mirror"?.45:.3;
  const wallMargin=Math.min(wallLength/2,half*scale+.06);
  const horizontal=THREE.MathUtils.clamp(onWall==="back"?fixture.x:fixture.z,-wallLength/2+wallMargin,wallLength/2-wallMargin);
  if(onWall){
    const halfHeight=fixture.kind==="mirror"?.57:fixture.kind==="window"?.54:fixture.kind==="tv"?.38:fixture.kind==="shower"?.8:.5;
    const clearance=halfHeight*scale;
    const y=fixture.kind==="door"?Math.min(h/2,1.07):THREE.MathUtils.clamp(
      fixture.y,Math.min(clearance,h/2),Math.max(Math.min(clearance,h/2),h-clearance)
    );
    if(onWall==="back"){group.position.set(horizontal,y,-l/2+.055);group.rotation.set(0,0,0);}
    if(onWall==="left"){group.position.set(-w/2+.055,y,horizontal);group.rotation.set(0,Math.PI/2,0);}
    if(onWall==="right"){group.position.set(w/2-.055,y,horizontal);group.rotation.set(0,-Math.PI/2,0);}
  }else{
    const halfWidth=fixture.kind==="bathtub"?.88:fixture.kind==="sofa"?1:fixture.kind==="coffee-table"?.58:.35;
    const halfDepth=fixture.kind==="bathtub"?.45:fixture.kind==="sofa"?.46:fixture.kind==="coffee-table"?.35:.34;
    group.position.set(THREE.MathUtils.clamp(fixture.x,-w/2+Math.min(halfWidth*scale,w/2),w/2-Math.min(halfWidth*scale,w/2)),0,THREE.MathUtils.clamp(fixture.z,-l/2+Math.min(halfDepth*scale,l/2),l/2-Math.min(halfDepth*scale,l/2)));
    group.rotation.set(0,fixture.rotation*Math.PI/180,0);
  }
}
/** Dispose only geometry and per-object finishes, never shared catalogue materials. */
export function disposeFixture(group:THREE.Group){
  group.traverse(obj=>{
    if(obj instanceof THREE.Mesh)obj.geometry.dispose();
    if(obj instanceof Reflector)obj.getRenderTarget().dispose();
    if(obj instanceof THREE.Mesh&&(obj instanceof Reflector||obj.userData.fixtureOverlayMaterial)){
      const materials=Array.isArray(obj.material)?obj.material:[obj.material];
      materials.forEach(material=>material.dispose());
    }
  });
  const entries=group.userData.finishEntries as Array<{material:THREE.MeshStandardMaterial}>|undefined;
  for(const entry of entries??[])entry.material.dispose();
}
