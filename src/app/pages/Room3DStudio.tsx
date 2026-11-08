import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Room3DLighting, NATURAL_LIGHT } from "./Room3DLighting";
import type { RoomLightSettings, RoomMode } from "./Room3DLighting";
import { installMaterialEnvironment, makeLightRig, updateLightRig, makeTileNormalMap, addKitchenPreview } from "./Room3DRealism";
import type { LightRig } from "./Room3DRealism";
import { ArrowLeft, Camera, RotateCcw, Trash2, Maximize2 } from "lucide-react";
import { useStore } from "../store/store";
import { useI18n } from "../i18n/i18n";
import type { Product } from "../data/types";
import surfaceMaterials from "../data/surfaceMaterials.json";
import "./Room3DStudio.css";

type Surface = "floor" | "back" | "left" | "right";
type FixtureKind = "bathtub" | "basin" | "faucet" | "toilet";
type Fixture = { id: string; kind: FixtureKind; productId?: string; surface: Surface; x: number; y: number; z: number; };
type CameraPreset = "perspective" | "top" | "front" | "left" | "right";
const FIXTURE_COLLS = new Set(["sanitary-ware", "faucets", "bathroom-sets", "bathroom-units", "bathtubs", "shower-units"]);
const localTileImages = new Map((surfaceMaterials as {id:string;image:string}[]).map(m => [m.id,m.image]));
const SURFACES: Surface[] = ["floor","back","left","right"];
const labels = {
  en: {
    title:"IDEA · Interactive 3D Room",sub:"An empty room to build your layout. Orbit, place and move real catalogue choices when available.",
    back:"Room designer", view:"Camera", perspective:"3D orbit",top:"Top",front:"Front",left:"Left",right:"Right",
    roof:"Show ceiling", surface:"Select surface",floor:"Floor",backWall:"Back wall",leftWall:"Left wall",rightWall:"Right wall",
    dimensions:"Room size (metres)",length:"Length",width:"Width",height:"Height",catalogue:"Bathroom fixtures",
    catalogueEmpty:"No verified sanitary fixtures are published yet. Use the clearly marked layout placeholders below.",
    demo:"Layout placeholders — generic shapes, not supplier products",bathtub:"Bathtub",basin:"Washbasin",faucet:"Faucet",toilet:"Toilet",
    place:"Add to room",selected:"Selected fixture",delete:"Remove",reset:"Clear room",hint:"Drag to orbit • Scroll to zoom • Select a surface, then place an item. Drag a placed item to move it.",
    placements:"Placed objects",noItems:"Empty room — choose a fixture",floorTile:"Floor material",wallTile:"Wall material",
    bare:"Plain surface",tile:"Tiles",realSize:"Repeat at catalogue size",note:"The room is a visual layout tool. Generic fixture geometry is NOT an exact 3D model of a branded product. No plumbing or construction clearance is certified.",
    name:"Product",placeOn:"Place on",choose:"Choose fixture",openRoof:"Ceiling hidden for the editor",save:"Save layout locally",
    selectFixture:"Select a fixture before dropping",mock:"Generic preview", materialUnavailable:"No verified tile size",
  },
  ar: {
    title:"IDEA · تصميم الغرفة ثلاثي الأبعاد",sub:"غرفة فاضية تقدر تلفّها، وتشوفها من فوق ومن الجنب، وتحط فيها التجهيزات وتحركها.",
    back:"مصمم الغرف",view:"زاوية الكاميرا",perspective:"منظور 3D",top:"من أعلى",front:"من الأمام",left:"يسار",right:"يمين",
    roof:"إظهار السقف",surface:"اختار السطح",floor:"الأرضية",backWall:"الحيطة الخلفية",leftWall:"الحيطة اليسار",rightWall:"الحيطة اليمين",
    dimensions:"مقاسات الغرفة بالمتر",length:"الطول",width:"العرض",height:"الارتفاع",catalogue:"تجهيزات الحمام",
    catalogueEmpty:"لا توجد تجهيزات صحية موثّقة منشورة حاليًا. استخدم الأشكال التوضيحية أدناه مؤقتًا.",
    demo:"أشكال توضيحية للتوزيع وليست منتجات حقيقية",bathtub:"بانيو",basin:"حوض",faucet:"حنفية",toilet:"قاعدة حمام",
    place:"أضف للغرفة",selected:"العنصر المختار",delete:"حذف",reset:"تفريغ الغرفة",hint:"اسحب لتدوير الكاميرا • لف عجلة الماوس للتقريب • اختار حيطة أو أرضية وأضف العنصر. اسحب العنصر لتحريكه.",
    placements:"العناصر الموجودة",noItems:"الغرفة فاضية — اختار عنصرًا",floorTile:"خامة الأرضية",wallTile:"خامة الحيطة",
    bare:"بدون بلاط",tile:"بلاط",realSize:"تكرار بالمقاس المسجل",note:"أشكال التجهيزات هنا توضيحية ولا تمثل موديلات هندسية مطابقة للشركة. لا تُستخدم لتأكيد أبعاد السباكة أو التنفيذ.",
    name:"المنتج",placeOn:"التركيب على",choose:"اختار عنصر",openRoof:"السقف مفتوح لتسهيل الرؤية",save:"حفظ التصميم محليًا",
    selectFixture:"اختار العنصر قبل وضعه",mock:"نموذج توضيحي",materialUnavailable:"مقاس البلاطة غير موثّق",
  },
  fr: {
    title:"IDEA · Pièce 3D interactive",sub:"Une pièce vide à aménager. Tournez la caméra et déplacez les équipements.",
    back:"Concepteur",view:"Caméra",perspective:"Orbite 3D",top:"Dessus",front:"Face",left:"Gauche",right:"Droite",
    roof:"Afficher plafond",surface:"Surface",floor:"Sol",backWall:"Mur arrière",leftWall:"Mur gauche",rightWall:"Mur droit",
    dimensions:"Dimensions (mètres)",length:"Longueur",width:"Largeur",height:"Hauteur",catalogue:"Équipements sanitaires",
    catalogueEmpty:"Aucun produit sanitaire vérifié publié. Utilisez les formes de démonstration.",
    demo:"Formes génériques — pas des modèles fournisseurs",bathtub:"Baignoire",basin:"Vasque",faucet:"Robinet",toilet:"WC",
    place:"Placer",selected:"Élément choisi",delete:"Supprimer",reset:"Vider",hint:"Glisser pour tourner • Molette pour zoom • Choisir une surface et déplacer un élément.",
    placements:"Éléments placés",noItems:"Pièce vide",floorTile:"Matériau du sol",wallTile:"Matériau des murs",
    bare:"Surface nue",tile:"Carrelage",realSize:"Répétition au format déclaré",note:"Les modèles sont des approximations visuelles, sans précision d'ingénierie ni plomberie validée.",
    name:"Produit",placeOn:"Surface",choose:"Choisir",openRoof:"Plafond masqué pour la conception",save:"Enregistrer localement",
    selectFixture:"Choisir avant de placer",mock:"Modèle générique", materialUnavailable:"Dimensions inconnues",
  }
} as const;

const fixtureKind = (product: Product): FixtureKind => {
  if (product.collection === "bathtubs") return "bathtub";
  if (product.collection === "faucets") return "faucet";
  if (product.collection === "sanitary-ware" && /toilet|wc/i.test(product.name.en)) return "toilet";
  return "basin";
};
const materialSize = (p: Product) => p.sizes.find(s =>
  typeof s.widthMm === "number" && typeof s.heightMm === "number" && s.widthMm > 0 && s.heightMm > 0);
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const newId = () => "fixture_" + Math.random().toString(36).slice(2,11);
const defaultPositions = (kind: FixtureKind, surface: Surface, width: number, length: number) => {
  if (surface === "back") return {x:0,y:kind==="faucet"?1.2:kind==="basin"?.85:.35,z:-length/2};
  if (surface === "left") return {x:-width/2,y:kind==="faucet"?1.2:.85,z:0};
  if (surface === "right") return {x:width/2,y:kind==="faucet"?1.2:.85,z:0};
  return {x:0,y:0,z:0};
};

const colorMaterials = {
  white: new THREE.MeshStandardMaterial({color:0xf5f4f0,roughness:.28,metalness:.03}),
  ceramic: new THREE.MeshStandardMaterial({color:0xe5e1db,roughness:.3}),
  dark: new THREE.MeshStandardMaterial({color:0x535b64,metalness:.8,roughness:.22}),
  water: new THREE.MeshStandardMaterial({color:0xc5d9df,roughness:.17,transparent:true,opacity:.72}),
  accent: new THREE.MeshStandardMaterial({color:0xc59b64,metalness:.65,roughness:.31}),
};

function meshBox(w:number,h:number,d:number,material:THREE.Material,x=0,y=0,z=0) {
  const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
  m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;return m;
}
function buildFixture(entry:Fixture) {
  const group=new THREE.Group();group.userData.fixtureId=entry.id;
  const { white,ceramic,dark,water,accent }=colorMaterials;
  if(entry.kind==="bathtub"){
    const tub=meshBox(1.65,.58,.78,white,0,.31,0);
    group.add(tub,meshBox(1.39,.025,.55,water,0,.605,0));
    for(const x of [-.77,.77])for(const z of [-.34,.34])
      group.add(meshBox(.08,.08,.08,ceramic,x,.66,z));
    const drain=new THREE.Mesh(new THREE.CylinderGeometry(.033,.033,.01,20),dark);
    drain.position.set(.45,.63,0);group.add(drain);
  }else if(entry.kind==="basin"){
    group.add(meshBox(.76,.11,.49,white,0,.04,0));
    const bowl=new THREE.Mesh(new THREE.CylinderGeometry(.21,.17,.09,28),ceramic);
    bowl.position.y=.1;group.add(bowl);
    group.add(meshBox(.045,.27,.04,accent,.2,.27,-.1));
    group.add(meshBox(.18,.045,.04,accent,.13,.39,-.1));
    group.add(meshBox(.12,.67,.1,dark,0,-.36,0));
  }else if(entry.kind==="faucet"){
    const shaft=new THREE.Mesh(new THREE.CylinderGeometry(.043,.055,.48,18),dark);
    shaft.position.y=.25;group.add(shaft);
    const spout=meshBox(.31,.052,.055,dark,.13,.5,0);
    group.add(spout);
    const nozzle=new THREE.Mesh(new THREE.CylinderGeometry(.025,.025,.09,16),accent);
    nozzle.position.set(.28,.44,0);group.add(nozzle);
    group.add(meshBox(.09,.045,.09,accent,-.065,.24,0));
  }else{
    group.add(meshBox(.49,.26,.57,white,0,.23,0));
    const seat=new THREE.Mesh(new THREE.TorusGeometry(.18,.055,8,32),ceramic);
    seat.rotation.x=-Math.PI/2;seat.position.set(0,.41,.1);group.add(seat);
    group.add(meshBox(.46,.5,.16,white,0,.5,-.29));
  }
  group.position.set(entry.x,entry.y,entry.z);
  if(entry.surface==="back")group.rotation.y=0;
  if(entry.surface==="left")group.rotation.y=Math.PI/2;
  if(entry.surface==="right")group.rotation.y=-Math.PI/2;
  return group;
}

function makeSurfaceTexture(src:string,repeatX:number,repeatY:number,onReady:(tx:THREE.Texture)=>void) {
  const texture=new THREE.TextureLoader().load(src,(t)=>{
    t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(repeatX,repeatY);t.anisotropy=8;onReady(t);
  },undefined,()=>{});
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(repeatX,repeatY);
  return texture;
}

export function Room3DStudio() {
  const mount=useRef<HTMLDivElement>(null);
  const sceneRef=useRef<{
    camera:THREE.PerspectiveCamera;controls:OrbitControls;renderer:THREE.WebGLRenderer;
    scene:THREE.Scene;surfaces:Record<Surface,THREE.Mesh>;fixtures:THREE.Group[];lightingRig:LightRig;
  }|null>(null);
  const lastCamera=useRef<{pos:THREE.Vector3;target:THREE.Vector3}|null>(null);
  const {products}=useStore();const {locale}=useI18n();
  const lang=locale==="ar"||locale==="fr"?locale:"en";const t=labels[lang];
  const [dims,setDims]=useState({width:4,length:4,height:2.8});
  const [ceiling,setCeiling]=useState(false);
  const [roomMode,setRoomMode]=useState<RoomMode>("empty");
  const [lighting,setLighting]=useState<RoomLightSettings>({...NATURAL_LIGHT});
  const [surface,setSurface]=useState<Surface>("floor");
  const [view,setView]=useState<CameraPreset>("perspective");
  const [placed,setPlaced]=useState<Fixture[]>([]);
  const [selectedId,setSelectedId]=useState<string|null>(null);
  const [pending,setPending]=useState<{kind:FixtureKind;productId?:string}|null>(null);
  const [tileChoice,setTileChoice]=useState<Record<Surface,string>>({floor:"",back:"",left:"",right:""});
  const [notice,setNotice]=useState("");

  const catalogue=useMemo(()=>products.filter(p=>FIXTURE_COLLS.has(p.collection)&&p.approved),[products]);
  const tiles=useMemo(()=>products.filter(p=>
    ["ceramics","porcelain","marble"].includes(p.collection) &&
    materialSize(p) && !!p.source?.original?.tiles?.[0]),[products]);
  const byId=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products]);
  const changeSceneMode=(next:RoomMode)=>{
    if(next==="kitchen" && !Object.values(tileChoice).some(Boolean)){
      // Only genuine catalogue products: no invented tile materials.
      const wood=tiles.find(p=>/africa beige/i.test(p.name.en));
      const stone=tiles.find(p=>/fashion carrara/i.test(p.name.en));
      setTileChoice(s=>({...s,floor:wood?.id??"",back:stone?.id??"",left:stone?.id??""}));
    }
    setRoomMode(next);
  };

  const applyView=(preset:CameraPreset)=>{
    setView(preset);
    const state=sceneRef.current;if(!state)return;
    const {camera,controls}=state;
    const distance=Math.max(dims.width,dims.length,dims.height)*1.8;
    const target=new THREE.Vector3(0,dims.height*.42,0);
    if(preset==="top")camera.position.set(0,distance,0.01);
    if(preset==="front")camera.position.set(0,dims.height*.65,distance);
    if(preset==="left")camera.position.set(-distance,dims.height*.6,0);
    if(preset==="right")camera.position.set(distance,dims.height*.6,0);
    if(preset==="perspective")camera.position.set(distance*.85,dims.height*.9,distance*.9);
    controls.target.copy(target);controls.update();lastCamera.current={pos:camera.position.clone(),target:target.clone()};
  };

  // Full three.js WebGL geometry. No rasterized room mockup or prerendered image.
  useEffect(()=>{
    const host=mount.current;if(!host)return;
    const width=Math.max(host.clientWidth,1),height=Math.max(host.clientHeight,1);
    let renderer:THREE.WebGLRenderer;
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}catch{
      setNotice("WebGL is not available in this browser.");return;
    }
    renderer.setSize(width,height);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.outputColorSpace=THREE.SRGBColorSpace;
    renderer.toneMapping=THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure=lighting.exposure;
    renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
    renderer.setClearColor(0x171a1b,1);host.appendChild(renderer.domElement);
    renderer.domElement.style.touchAction="none";
    const scene=new THREE.Scene();scene.background=new THREE.Color(0x171a1b);
    const camera=new THREE.PerspectiveCamera(44,width/height,.1,100);
    camera.position.copy(lastCamera.current?.pos??new THREE.Vector3(6,4.6,6.5));
    const controls=new OrbitControls(camera,renderer.domElement);
    controls.enableDamping=true;controls.dampingFactor=.06;controls.minDistance=1.5;controls.maxDistance=22;
    controls.maxPolarAngle=Math.PI*.92;
    controls.target.copy(lastCamera.current?.target??new THREE.Vector3(0,dims.height*.4,0));
    controls.update();
    const releaseEnvironment=installMaterialEnvironment(scene,renderer);
    const lightingRig=makeLightRig(scene);
    updateLightRig(lightingRig,lighting,dims,renderer,scene);
    const surfaceList={} as Record<Surface,THREE.Mesh>;
    const finish=(id:Surface,a:number,b:number)=>{
      const product=byId.get(tileChoice[id]);
      const s=product&&materialSize(product);
      const localImage=product ? localTileImages.get(product.id) : undefined;
      const face=localImage ? import.meta.env.BASE_URL.replace(/\/$/,"") + localImage : product?.source?.original?.tiles?.[0];
      const roughness=lighting.finish==="polished"?.18:lighting.finish==="satin"?.38:.79;
      const base=new THREE.MeshPhysicalMaterial({
        color:id==="floor"?0xded9d0:0xe6e0d7,
        roughness, metalness:0, ior:1.52,
        clearcoat:lighting.finish==="polished"?.48:lighting.finish==="satin"?.22:.04,
        clearcoatRoughness:lighting.finish==="polished"?.09:.26,
        envMapIntensity:lighting.finish==="polished"?.82:.76,
        side:id==="floor"?THREE.DoubleSide:THREE.FrontSide,
      });
      if(face&&s){
        const tw=s.widthMm!/1000,th=s.heightMm!/1000;
        const across=Math.max(.2,a/tw),high=Math.max(.2,b/th);
        base.map=makeSurfaceTexture(face,across,high,()=>{base.needsUpdate=true;});
        base.normalMap=makeTileNormalMap(across,high);
        base.normalScale.set(.16,.16);
        base.color.set(0xffffff);base.needsUpdate=true;
      }
      return base;
    };
    const w=dims.width,l=dims.length,h=dims.height;
    const plane=(id:Surface,geom:THREE.PlaneGeometry,material:THREE.Material,position:THREE.Vector3,rotate:[number,number,number])=>{
      const m=new THREE.Mesh(geom,material);m.position.copy(position);m.rotation.set(...rotate);
      m.receiveShadow=true;m.userData.surface=id;scene.add(m);surfaceList[id]=m;
      const edges=new THREE.LineSegments(new THREE.EdgesGeometry(geom),new THREE.LineBasicMaterial({color:0x9d8668,transparent:true,opacity:.6}));
      edges.position.copy(position);edges.rotation.copy(m.rotation);scene.add(edges);
    };
    plane("floor",new THREE.PlaneGeometry(w,l),finish("floor",w,l),new THREE.Vector3(0,0,0),[-Math.PI/2,0,0]);
    plane("back",new THREE.PlaneGeometry(w,h),finish("back",w,h),new THREE.Vector3(0,h/2,-l/2),[0,0,0]);
    plane("left",new THREE.PlaneGeometry(l,h),finish("left",l,h),new THREE.Vector3(-w/2,h/2,0),[0,Math.PI/2,0]);
    plane("right",new THREE.PlaneGeometry(l,h),finish("right",l,h),new THREE.Vector3(w/2,h/2,0),[0,-Math.PI/2,0]);
    if(ceiling){
      const roof=new THREE.Mesh(new THREE.PlaneGeometry(w,l),
        new THREE.MeshStandardMaterial({color:0xe1ded6,transparent:true,opacity:.32,side:THREE.DoubleSide,depthWrite:false}));
      roof.rotation.x=Math.PI/2;roof.position.y=h;scene.add(roof);
    }
    if(roomMode==="kitchen")addKitchenPreview(scene,w,l,h);
    const fixtureMeshes=placed.map(f=>buildFixture(f));
    for(const group of fixtureMeshes)scene.add(group);
    sceneRef.current={camera,controls,renderer,scene,surfaces:surfaceList,fixtures:fixtureMeshes,lightingRig};
    const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
    let dragging:string|null=null,downPoint={x:0,y:0};
    const pointer=(e:PointerEvent)=>{
      const box=renderer.domElement.getBoundingClientRect();
      ndc.set(((e.clientX-box.left)/box.width)*2-1,-((e.clientY-box.top)/box.height)*2+1);
      ray.setFromCamera(ndc,camera);
    };
    const surfaceHit=(e:PointerEvent)=>{
      pointer(e);return ray.intersectObjects(Object.values(surfaceList),false)[0];
    };
    const pointerDown=(e:PointerEvent)=>{
      pointer(e);downPoint={x:e.clientX,y:e.clientY};
      const hits=ray.intersectObjects(fixtureMeshes,true);
      if(hits.length){
        let obj:THREE.Object3D|null=hits[0].object;
        while(obj&&!obj.userData.fixtureId)obj=obj.parent;
        if(obj?.userData.fixtureId){
          dragging=String(obj.userData.fixtureId);
          setSelectedId(dragging);
          controls.enabled=false;
          renderer.domElement.setPointerCapture(e.pointerId);
          return;
        }
      }
    };
    const move=(e:PointerEvent)=>{
      if(!dragging)return;
      const item=placed.find(f=>f.id===dragging);if(!item)return;
      const hit=surfaceHit(e);
      if(!hit||hit.object.userData.surface!==item.surface)return;
      const {point}=hit;
      const x=clamp(point.x,-w/2+.3,w/2-.3);
      const z=clamp(point.z,-l/2+.3,l/2-.3);
      const y=clamp(point.y,.24,h-.25);
      const group=fixtureMeshes.find(g=>g.userData.fixtureId===dragging);
      if(group)group.position.set(item.surface==="left"?-w/2:item.surface==="right"?w/2:x,
        item.surface==="floor"?0:y,item.surface==="back"?-l/2:z);
    };
    const up=(e:PointerEvent)=>{
      if(dragging){
        const found=fixtureMeshes.find(g=>g.userData.fixtureId===dragging);
        if(found)setPlaced(arr=>arr.map(f=>f.id===dragging?{...f,x:found.position.x,y:found.position.y,z:found.position.z}:f));
      }else if(Math.hypot(e.clientX-downPoint.x,e.clientY-downPoint.y)<6){
        const hit=surfaceHit(e);
        if(hit)setSurface(hit.object.userData.surface as Surface);
      }
      dragging=null;controls.enabled=true;
      if(renderer.domElement.hasPointerCapture(e.pointerId))renderer.domElement.releasePointerCapture(e.pointerId);
    };
    renderer.domElement.addEventListener("pointerdown",pointerDown);
    renderer.domElement.addEventListener("pointermove",move);
    renderer.domElement.addEventListener("pointerup",up);
    let raf=0;const draw=()=>{raf=requestAnimationFrame(draw);controls.update();renderer.render(scene,camera);};
    draw();
    const resize=new ResizeObserver(()=>{
      const ww=Math.max(host.clientWidth,1),hh=Math.max(host.clientHeight,1);
      camera.aspect=ww/hh;camera.updateProjectionMatrix();renderer.setSize(ww,hh);
    });resize.observe(host);
    return()=>{
      cancelAnimationFrame(raf);resize.disconnect();
      lastCamera.current={pos:camera.position.clone(),target:controls.target.clone()};
      renderer.domElement.removeEventListener("pointerdown",pointerDown);
      renderer.domElement.removeEventListener("pointermove",move);
      renderer.domElement.removeEventListener("pointerup",up);
      controls.dispose();
      scene.traverse(o=>{
        if(o instanceof THREE.Mesh || o instanceof THREE.LineSegments){
          o.geometry.dispose();
          const mats=Array.isArray(o.material)?o.material:[o.material];
          for(const m of mats)if(m&&!Object.values(colorMaterials).includes(m as THREE.MeshStandardMaterial)){
            const mm=m as THREE.MeshStandardMaterial;
            if(mm.map)mm.map.dispose();
            if(mm.normalMap)mm.normalMap.dispose();
            if(mm.roughnessMap)mm.roughnessMap.dispose();
            m.dispose();
          }
        }
      });
      releaseEnvironment();
      renderer.dispose();renderer.domElement.remove();sceneRef.current=null;
    };
  },[dims.width,dims.length,dims.height,ceiling,placed,tileChoice.floor,tileChoice.back,tileChoice.left,tileChoice.right,byId,roomMode,lighting.finish]);

  // Sliders update the live light rig; they do not rebuild the WebGL scene.
  useEffect(()=>{
    const state=sceneRef.current;
    if(state)updateLightRig(state.lightingRig,lighting,dims,state.renderer,state.scene);
  },[lighting,roomMode,dims.width,dims.length,dims.height]);

  const place=(choice:{kind:FixtureKind;productId?:string},target:Surface=surface,at?:THREE.Vector3)=>{
    const validSurface=choice.kind==="bathtub"||choice.kind==="toilet"?"floor":target;
    const base=defaultPositions(choice.kind,validSurface,dims.width,dims.length);
    const pos=at&&validSurface===target
      ? {
          x:clamp(at.x,-dims.width/2+.32,dims.width/2-.32),
          y:validSurface==="floor"?0:clamp(at.y,.3,dims.height-.3),
          z:clamp(at.z,-dims.length/2+.32,dims.length/2-.32),
        }
      :base;
    if(validSurface==="back")pos.z=-dims.length/2;
    if(validSurface==="left")pos.x=-dims.width/2;
    if(validSurface==="right")pos.x=dims.width/2;
    const id=newId();setPlaced(current=>[...current,{...pos,id,kind:choice.kind,productId:choice.productId,surface:validSurface}]);
    setSelectedId(id);
  };
  const dropFixture=(event:React.DragEvent<HTMLDivElement>)=>{
    event.preventDefault();
    if(!pending)return;
    const state=sceneRef.current;
    if(!state){place(pending);setPending(null);return;}
    const box=state.renderer.domElement.getBoundingClientRect();
    const cursor=new THREE.Vector2(
      (event.clientX-box.left)/box.width*2-1,
      -(event.clientY-box.top)/box.height*2+1
    );
    const ray=new THREE.Raycaster();
    ray.setFromCamera(cursor,state.camera);
    const hit=ray.intersectObjects(Object.values(state.surfaces),false)[0];
    if(hit){
      const selectedSurface=hit.object.userData.surface as Surface;
      setSurface(selectedSurface);
      place(pending,selectedSurface,hit.point);
    }else place(pending);
    setPending(null);
  };
  const selected=placed.find(f=>f.id===selectedId);
  const identify=(f:Fixture)=>f.productId?byId.get(f.productId)?.name[lang]??t.mock:t[f.kind];
  const serialized=()=>JSON.stringify({version:2,dimensions:dims,ceiling,placed,tileChoice,roomMode,lighting},null,2);
  const download=()=>{
    const blob=new Blob([serialized()],{type:"application/json"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="idea-room-3d-layout.json";a.click();URL.revokeObjectURL(url);
  };
  const reset=()=>{setPlaced([]);setSelectedId(null);setNotice("");};

  return (
    <main className="idea-room3d" dir={lang==="ar"?"rtl":"ltr"}>
      <header className="idea-room3d-heading">
        <Link to="/"><ArrowLeft size={17}/>{lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home"}</Link>
        <div><span>IDEA / 3D SPACE STUDIO</span><h1>{t.title}</h1><p>{t.sub}</p></div>
      </header>
      <div className="idea-room3d-workspace">
        <aside className="idea-room3d-side">
          <h2>{t.dimensions}</h2>
          <div className="idea-room3d-dims">
            {(["width","length","height"] as const).map(k=><label key={k}>{t[k]}
              <input type="number" min={1.8} max={9} step={.1} value={dims[k]} onChange={e=>setDims(s=>({...s,[k]:clamp(Number(e.target.value)||2,1.8,9)}))} />
            </label>)}
          </div>
          <Room3DLighting locale={lang} mode={roomMode} onModeChange={changeSceneMode}
            settings={lighting} onSettingsChange={setLighting} />
          <h2>{t.view}</h2>
          <div className="idea-room3d-pills">{(["perspective","top","front","left","right"] as const).map(p=>
            <button key={p} type="button" className={p===view?"active":""} onClick={()=>applyView(p)}>{t[p]}</button>)}</div>
          <label className="idea-room3d-toggle"><input type="checkbox" checked={ceiling} onChange={e=>setCeiling(e.target.checked)} />{t.roof}</label>
          <h2>{t.surface}</h2>
          <div className="idea-room3d-pills">
            {SURFACES.map(s=><button key={s} type="button" className={surface===s?"active":""}
              onClick={()=>setSurface(s)}>{s==="floor"?t.floor:s==="back"?t.backWall:s==="left"?t.leftWall:t.rightWall}</button>)}
          </div>
          <h2>{t.floorTile} / {t.wallTile}</h2>
          {SURFACES.map(k=><label key={k} className="idea-room3d-select-label">{k==="floor"?t.floor:k==="back"?t.backWall:k==="left"?t.leftWall:t.rightWall}
            <select value={tileChoice[k]} onChange={e=>setTileChoice(s=>({...s,[k]:e.target.value}))}>
              <option value="">{t.bare}</option>
              {tiles.slice(0,180).map(p=><option key={p.id} value={p.id}>{p.name[lang]} · {materialSize(p)!.widthMm!/10}×{materialSize(p)!.heightMm!/10} cm</option>)}
            </select></label>)}
          <p className="idea-room3d-disclaimer">{t.realSize}</p>
        </aside>

        <section className="idea-room3d-main">
          <div className="idea-room3d-stage" ref={mount} aria-label={t.title}
            onDragOver={e=>e.preventDefault()}
            onDrop={dropFixture}>
            <div className="idea-room3d-overlay">
              <span><Camera size={15}/>{t[view]}</span><span>{dims.width} × {dims.length} × {dims.height} m</span>
            </div>
          </div>
          <div className="idea-room3d-bottom">
            <p>{t.hint}</p>
            <div>
              <button type="button" onClick={()=>applyView("perspective")}><Maximize2 size={15}/>{t.perspective}</button>
              <button type="button" onClick={reset}><RotateCcw size={15}/>{t.reset}</button>
              <button type="button" onClick={download}>{t.save}</button>
            </div>
          </div>
          {notice&&<p role="status">{notice}</p>}
        </section>

        <aside className="idea-room3d-side idea-room3d-catalog">
          <h2>{t.catalogue} <small>{catalogue.length}</small></h2>
          {catalogue.length>0?<div className="idea-room3d-fixture-list">
            {catalogue.map(p=><button type="button" key={p.id}
              draggable onDragStart={()=>setPending({kind:fixtureKind(p),productId:p.id})}
              onClick={()=>place({kind:fixtureKind(p),productId:p.id})}>
              <img src={p.image} alt="" loading="lazy"/>
              <span><strong>{p.name[lang]}</strong><small>{p.brand}</small><em>{t.place}</em></span></button>)}
          </div>:<p className="idea-room3d-empty">{t.catalogueEmpty}</p>}
          <h3>{t.demo}</h3>
          <div className="idea-room3d-demo-list">
            {(["bathtub","basin","faucet","toilet"] as const).map(kind=><button key={kind} type="button"
              draggable onDragStart={()=>setPending({kind})} onDragEnd={()=>setPending(null)}
              onClick={()=>place({kind})}><span>{t[kind]}</span><small>{t.place} +</small></button>)}
          </div>
          <h2>{t.placements} <small>{placed.length}</small></h2>
          {placed.length?<div className="idea-room3d-placed">
            {placed.map(f=><button type="button" key={f.id} className={f.id===selectedId?"active":""}
              onClick={()=>setSelectedId(f.id)}>{identify(f)} <small>{f.surface}</small></button>)}
          </div>:<p className="idea-room3d-empty">{t.noItems}</p>}
          {selected&&<button type="button" className="idea-room3d-delete" onClick={()=>{setPlaced(a=>a.filter(f=>f.id!==selectedId));setSelectedId(null);}}>
            <Trash2 size={15}/>{t.delete}: {identify(selected)}</button>}
          <p className="idea-room3d-disclaimer">{t.note}</p>
        </aside>
      </div>
    </main>
  );
}
