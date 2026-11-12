import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { Room3DLighting, NATURAL_LIGHT } from "./Room3DLighting";
import type { RoomLightSettings, RoomMode } from "./Room3DLighting";
import { installMaterialEnvironment, makeLightRig, updateLightRig, makeTileNormalMap, addKitchenPreview } from "./Room3DRealism";
import type { LightRig } from "./Room3DRealism";
import { ArrowLeft, Camera, RotateCcw, Maximize2, Plus, Trash2, Copy, RotateCw } from "lucide-react";
import { useStore } from "../store/store";
import { useI18n } from "../i18n/i18n";
import type { Product } from "../data/types";
import { Room3DMaterialGallery, materialFace, verifiedSizes } from "./Room3DMaterialGallery";
import { createRoomFixture, disposeFixture, fixtureKinds, fixtureLabels, fixturePreset, positionFixture, setFixtureColor, wallFixtureKinds } from "./Room3DFixtures";
import type { PlacedFixture, FixtureKind, RoomDimensions } from "./Room3DFixtures";
import "./Room3DStudio.css";

type Surface = "floor" | "back" | "left" | "right";
type CameraPreset = "perspective" | "top" | "front" | "left" | "right";
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

const materialSize = (p:Product,sizeId?:string) => verifiedSizes(p).find(size=>size.id===sizeId) ?? verifiedSizes(p)[0];
const clamp = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
function makeSurfaceTexture(src:string,repeatX:number,repeatY:number,onReady:(tx:THREE.Texture)=>void,onError?:()=>void) {
  const texture=new THREE.TextureLoader().load(src,(t)=>{
    t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.repeat.set(repeatX,repeatY);t.anisotropy=8;onReady(t);
  },undefined,()=>onError?.());
  texture.colorSpace=THREE.SRGBColorSpace;
  texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.repeat.set(repeatX,repeatY);
  return texture;
}

function syncRoomFixtures(scene:THREE.Scene,groups:Map<string,THREE.Group>,items:PlacedFixture[],dims:RoomDimensions){
  const ids=new Set(items.map(i=>i.id));
  for(const [id,group] of groups){
    if(!ids.has(id)){scene.remove(group);disposeFixture(group);groups.delete(id);}
  }
  for(const fixture of items){
    let group=groups.get(fixture.id);
    if(group&&group.userData.kind!==fixture.kind){
      scene.remove(group);disposeFixture(group);groups.delete(fixture.id);group=undefined;
    }
    if(!group){
      group=createRoomFixture(fixture.kind,fixture.id);
      scene.add(group);
      groups.set(fixture.id,group);
    }
    positionFixture(group,fixture,dims);
    setFixtureColor(group,fixture.color);
  }
}
export function Room3DStudio() {
  const mount=useRef<HTMLDivElement>(null);
  const sceneRef=useRef<{
    camera:THREE.PerspectiveCamera;controls:OrbitControls;renderer:THREE.WebGLRenderer;
    scene:THREE.Scene;surfaces:Record<Surface,THREE.Mesh>;lightingRig:LightRig;fixtureGroups:Map<string,THREE.Group>;
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
  const [tileChoice,setTileChoice]=useState<Record<Surface,string>>({floor:"",back:"",left:"",right:""});
  const [sizeChoice,setSizeChoice]=useState<Record<Surface,string>>({floor:"",back:"",left:"",right:""});
  const [notice,setNotice]=useState("");
  const [fixtures,setFixtures]=useState<PlacedFixture[]>([]);
  const [selectedFixture,setSelectedFixture]=useState<string|null>(null);
  const [addKind,setAddKind]=useState<FixtureKind>("basin");
  const nextFixtureId=useRef(1);
  const fixtureLayouts=useRef<Partial<Record<RoomMode,PlacedFixture[]>>>({});
  const fixturesRef=useRef(fixtures);
  fixturesRef.current=fixtures;

  const tiles=useMemo(()=>products.filter(p=>
    ["ceramics","porcelain","marble"].includes(p.collection) && !!materialSize(p) && !!materialFace(p)),[products]);
  const byId=useMemo(()=>new Map(products.map(p=>[p.id,p])),[products]);
  const changeSceneMode=(next:RoomMode)=>{
    if(next===roomMode)return;
    fixtureLayouts.current[roomMode]=fixtures;
    setRoomMode(next);
    setSelectedFixture(null);
    setFixtures(fixtureLayouts.current[next] ?? fixturePreset(next));
  };
  const addFixture=()=>{
    const wall=wallFixtureKinds.includes(addKind)?(surface==="floor"?"back":surface):undefined;
    const offset=Math.min(fixtures.length*.31,1.15);
    const fixture:PlacedFixture={
      id:"custom-"+nextFixtureId.current++,
      kind:addKind,
      x:wall==="left"||wall==="right"?0:offset-.5,
      z:wall==="back"?-dims.length/2:wall==="left"?-dims.length/4:wall==="right"?dims.length/4:offset-.4,
      y:wall?(addKind==="door"?1.05:addKind==="window"?1.65:1.5):0,
      rotation:0,wall
    };
    setFixtures(old=>[...old,fixture]);
    setSelectedFixture(fixture.id);
  };
  const editFixture=(id:string,changes:Partial<PlacedFixture>)=>setFixtures(old=>old.map(item=>item.id===id?{...item,...changes}:item));
  const deleteFixture=()=>{if(!selectedFixture)return;setFixtures(old=>old.filter(item=>item.id!==selectedFixture));setSelectedFixture(null);};
  const duplicateFixture=()=>{
    const item=fixtures.find(o=>o.id===selectedFixture);if(!item)return;
    const newId="custom-"+nextFixtureId.current++;
    setFixtures(old=>[...old,{...item,id:newId,x:item.x+.25,z:item.z+.25}]);
    setSelectedFixture(newId);
  };
  const currentFixture=fixtures.find(item=>item.id===selectedFixture);

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
    try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:false,powerPreference:"high-performance"});}catch{
      setNotice("WebGL is not available in this browser.");return;
    }
    renderer.setSize(width,height);renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio||1,1.5),2));
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
      const s=product&&materialSize(product,sizeChoice[id]);
      const face=product?materialFace(product):null;
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
        base.map=makeSurfaceTexture(face,across,high,(texture)=>{texture.anisotropy=Math.min(16,renderer.capabilities.getMaxAnisotropy());base.needsUpdate=true;},()=>setNotice(lang==="ar"?"تعذر تحميل صورة البلاطة الأصلية للـ 3D.":"The source tile image could not load as a WebGL texture."));
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
    const fixtureGroups=new Map<string,THREE.Group>();
    syncRoomFixtures(scene,fixtureGroups,fixturesRef.current,dims);
    sceneRef.current={camera,controls,renderer,scene,surfaces:surfaceList,lightingRig,fixtureGroups};
    // Pick and drag real 3D objects on their floor or selected wall plane.
    const ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
    let downPoint:{x:number;y:number}|null=null;
    let dragging:{id:string;fixture:PlacedFixture;plane:THREE.Plane;start:THREE.Vector3;moved:boolean}|null=null;
    const setPointerRay=(event:PointerEvent)=>{
      const box=renderer.domElement.getBoundingClientRect();
      ndc.set((event.clientX-box.left)/box.width*2-1,-(event.clientY-box.top)/box.height*2+1);
      ray.setFromCamera(ndc,camera);
    };
    const down=(event:PointerEvent)=>{
      downPoint={x:event.clientX,y:event.clientY};
      if(event.button!==0)return;
      setPointerRay(event);
      const groups=Array.from(fixtureGroups.values());
      const hits=ray.intersectObjects(groups,true);
      if(!hits.length)return;
      let node:THREE.Object3D|null=hits[0].object;
      while(node && !node.userData.fixtureId)node=node.parent;
      const id=node?.userData.fixtureId as string|undefined;
      const fixture=fixturesRef.current.find(item=>item.id===id);
      if(!fixture)return;
      setSelectedFixture(fixture.id);
      const normal=fixture.wall==="back"?new THREE.Vector3(0,0,1):fixture.wall==="left"||fixture.wall==="right"?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0);
      const point=fixture.wall==="back"?new THREE.Vector3(0,0,-l/2):fixture.wall==="left"?new THREE.Vector3(-w/2,0,0):fixture.wall==="right"?new THREE.Vector3(w/2,0,0):new THREE.Vector3(0,0,0);
      const plane=new THREE.Plane().setFromNormalAndCoplanarPoint(normal,point);
      const start=new THREE.Vector3();
      if(!ray.ray.intersectPlane(plane,start))return;
      dragging={id:fixture.id,fixture:{...fixture},plane,start,moved:false};
      controls.enabled=false;
      renderer.domElement.setPointerCapture(event.pointerId);
    };
    const move=(event:PointerEvent)=>{
      if(!dragging||!downPoint)return;
      if(Math.hypot(event.clientX-downPoint.x,event.clientY-downPoint.y)<4 && !dragging.moved)return;
      setPointerRay(event);
      const point=new THREE.Vector3();
      if(!ray.ray.intersectPlane(dragging.plane,point))return;
      // Keep the grab point stable, including when picking the rim of a tub.
      const dx=point.x-dragging.start.x,dy=point.y-dragging.start.y,dz=point.z-dragging.start.z;
      if(dragging.fixture.wall==="back"){
        dragging.fixture.x+=dx;
        if(dragging.fixture.kind!=="door")dragging.fixture.y+=dy;
      }else if(dragging.fixture.wall==="left"||dragging.fixture.wall==="right"){
        dragging.fixture.z+=dz;
        if(dragging.fixture.kind!=="door")dragging.fixture.y+=dy;
      }else {
        dragging.fixture.x+=dx;dragging.fixture.z+=dz;
      }
      dragging.start.copy(point);
      dragging.moved=true;
      const group=fixtureGroups.get(dragging.id);
      if(group)positionFixture(group,dragging.fixture,dims);
    };
    const up=(event:PointerEvent)=>{
      if(dragging){
        const done=dragging;
        dragging=null;
        controls.enabled=true;
        if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
        if(done.moved)setFixtures(old=>old.map(item=>item.id===done.id?done.fixture:item));
        downPoint=null;
        return;
      }
      if(!downPoint||Math.hypot(event.clientX-downPoint.x,event.clientY-downPoint.y)>=6)return;
      setPointerRay(event);
      const hit=ray.intersectObjects(Object.values(surfaceList),false)[0];
      if(hit)setSurface(hit.object.userData.surface as Surface);
      downPoint=null;
    };
    const cancel=(event:PointerEvent)=>{
      dragging=null;downPoint=null;controls.enabled=true;
      if(renderer.domElement.hasPointerCapture(event.pointerId))renderer.domElement.releasePointerCapture(event.pointerId);
    };
    renderer.domElement.addEventListener("pointerdown",down);
    renderer.domElement.addEventListener("pointermove",move);
    renderer.domElement.addEventListener("pointerup",up);
    renderer.domElement.addEventListener("pointercancel",cancel);
    let raf=0;const draw=()=>{raf=requestAnimationFrame(draw);controls.update();renderer.render(scene,camera);};
    draw();
    const resize=new ResizeObserver(()=>{
      const ww=Math.max(host.clientWidth,1),hh=Math.max(host.clientHeight,1);
      camera.aspect=ww/hh;camera.updateProjectionMatrix();renderer.setSize(ww,hh);
    });resize.observe(host);
    return()=>{
      cancelAnimationFrame(raf);resize.disconnect();
      lastCamera.current={pos:camera.position.clone(),target:controls.target.clone()};
      renderer.domElement.removeEventListener("pointerdown",down);
      renderer.domElement.removeEventListener("pointermove",move);
      renderer.domElement.removeEventListener("pointerup",up);
      renderer.domElement.removeEventListener("pointercancel",cancel);
      controls.dispose();
      for(const group of fixtureGroups.values()){scene.remove(group);disposeFixture(group);}
      fixtureGroups.clear();
      scene.traverse(o=>{
        if(o instanceof THREE.Mesh || o instanceof THREE.LineSegments){
          o.geometry.dispose();
          const mats=Array.isArray(o.material)?o.material:[o.material];
          for(const m of mats)if(m){
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
  },[dims.width,dims.length,dims.height,ceiling,tileChoice.floor,tileChoice.back,tileChoice.left,tileChoice.right,sizeChoice.floor,sizeChoice.back,sizeChoice.left,sizeChoice.right,byId,roomMode,lighting.finish]);

  // Swapping and editing fixtures updates only their meshes, not the full renderer.
  useEffect(()=>{
    const state=sceneRef.current;
    if(state)syncRoomFixtures(state.scene,state.fixtureGroups,fixtures,dims);
  },[fixtures,roomMode,dims.width,dims.length,dims.height]);

  // Sliders update the live light rig; they do not rebuild the WebGL scene.
  useEffect(()=>{
    const state=sceneRef.current;
    if(state)updateLightRig(state.lightingRig,lighting,dims,state.renderer,state.scene);
  },[lighting,roomMode,dims.width,dims.length,dims.height]);

  const serialized=()=>JSON.stringify({version:4,dimensions:dims,ceiling,tileChoice,sizeChoice,roomMode,lighting,fixtures},null,2);
  const download=()=>{
    const blob=new Blob([serialized()],{type:"application/json"});const url=URL.createObjectURL(blob);
    const a=document.createElement("a");a.href=url;a.download="idea-room-3d-materials.json";a.click();URL.revokeObjectURL(url);
  };
  const reset=()=>{setTileChoice({floor:"",back:"",left:"",right:""});setSizeChoice({floor:"",back:"",left:"",right:""});setFixtures([]);setSelectedFixture(null);setNotice("");};

  return (
    <main className="idea-room3d" dir={lang==="ar"?"rtl":"ltr"}>
      <header className="idea-room3d-heading">
        <Link to="/"><ArrowLeft size={17}/>{lang === "ar" ? "الرئيسية" : lang === "fr" ? "Accueil" : "Home"}</Link>
        <div><span>IDEA / 3D SPACE STUDIO</span><h1><strong className="idea-room3d-heading-brand">IDEA</strong> <span className="idea-room3d-heading-title">{t.title.replace(/^IDEA\s*·\s*/,"")}</span></h1><p>{t.sub}</p></div>
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
          <section className="idea-room3d-fixture-editor" aria-label={lang==="ar"?"عناصر الغرفة":"Room fixtures"}>
            <h2>{lang==="ar"?"الأثاث والتجهيزات القابلة للتعديل":lang==="fr"?"Éléments modifiables":"Editable furniture & fixtures"}</h2>
            <p className="idea-room3d-disclaimer">{lang==="ar"?"اختار عنصر واضغط إضافة. اسحبه جوه المشهد أو عدّل مكانه من هنا. الأشكال للتخطيط وليست موديلات مورّد موثقة.":lang==="fr"?"Ajoutez et déplacez des éléments génériques dans la pièce.": "Add and drag generic planning objects, then adjust position and rotation below. Not exact supplier models."}</p>
            <select aria-label={lang==="ar"?"اختار التجهيز":"Choose fixture"} value={addKind} onChange={e=>setAddKind(e.target.value as FixtureKind)}>
              {fixtureKinds.map(kind=><option key={kind} value={kind}>{fixtureLabels[kind][lang]}</option>)}
            </select>
            <button className="idea-room3d-fixture-add" type="button" onClick={addFixture}><Plus size={15}/>{lang==="ar"?"أضف للغرفة":"Add to room"}</button>
            <div className="idea-room3d-fixture-chips">
              {fixtures.map(item=><button key={item.id} type="button" className={item.id===selectedFixture?"active":""} onClick={()=>setSelectedFixture(item.id)}>{fixtureLabels[item.kind][lang]}</button>)}
            </div>
            {currentFixture&&<div className="idea-room3d-fixture-properties">
              <strong>{lang==="ar"?"تعديل العنصر":"Edit selected object"}</strong>
              <label>{lang==="ar"?"بدّل العنصر":"Replace with"}
                <select value={currentFixture.kind} onChange={e=>{
                  const kind=e.target.value as FixtureKind;
                  const wall=wallFixtureKinds.includes(kind)?(currentFixture.wall??(surface==="floor"?"back":surface)):undefined;
                  editFixture(currentFixture.id,{kind,wall,y:wall?kind==="door"?dims.height/2:1.5:0});
                }}>
                  {fixtureKinds.map(kind=><option key={kind} value={kind}>{fixtureLabels[kind][lang]}</option>)}
                </select>
              </label>
              <label>{lang==="ar"?"لون / تشطيب العنصر":lang==="fr"?"Couleur / finition":"Object colour / finish"}
                <input type="color" value={currentFixture.color??"#f1f0eb"}
                  aria-label={lang==="ar"?"اختار لون العنصر":lang==="fr"?"Choisir la couleur":"Choose object colour"}
                  onChange={e=>editFixture(currentFixture.id,{color:e.target.value})}/>
              </label>
              <div className="idea-room3d-fixture-colors" role="group"
                aria-label={lang==="ar"?"ألوان جاهزة":lang==="fr"?"Couleurs":"Finish presets"}>
                {["#f1f0eb","#24282b","#d2c2a4","#95aab6","#b7a99d","#785846"].map(c=><button key={c}
                  type="button" title={c} aria-label={c}
                  aria-pressed={(currentFixture.color??"#f1f0eb")===c}
                  style={{backgroundColor:c}} onClick={()=>editFixture(currentFixture.id,{color:c})}/>)}
              </div>
              {wallFixtureKinds.includes(currentFixture.kind)&&<label>{lang==="ar"?"مكان المراية / الحيطة":lang==="fr"?"Mur de fixation":"Mounting wall"}
                <select value={currentFixture.wall??"back"} onChange={e=>{
                  const wall=e.target.value as "back"|"left"|"right";
                  editFixture(currentFixture.id,{
                    wall,x:0,z:0,
                    y:currentFixture.kind==="door"?1.05:Math.max(.65,currentFixture.y)
                  });
                }}>
                  <option value="back">{t.backWall}</option>
                  <option value="left">{t.leftWall}</option>
                  <option value="right">{t.rightWall}</option>
                </select>
              </label>}
              <div className="idea-room3d-fixture-coordinates">
                <label>X<input type="number" min={-dims.width/2} max={dims.width/2} step=".1" value={currentFixture.x.toFixed(2)}
                  onChange={e=>editFixture(currentFixture.id,{x:Number(e.target.value)})}/></label>
                <label>Z<input type="number" min={-dims.length/2} max={dims.length/2} step=".1" value={currentFixture.z.toFixed(2)}
                  onChange={e=>editFixture(currentFixture.id,{z:Number(e.target.value)})}/></label>
                {currentFixture.wall&&<label>Y<input type="number" min=".4" max={dims.height} step=".1" value={currentFixture.y.toFixed(2)}
                  onChange={e=>editFixture(currentFixture.id,{y:Number(e.target.value)})}/></label>}
              </div>
              {!currentFixture.wall&&<label className="idea-room3d-rotation"><RotateCw size={13}/> {lang==="ar"?"الدوران":"Rotation"}: {currentFixture.rotation}°
                <input type="range" min="0" max="360" step="5" value={currentFixture.rotation}
                  onChange={e=>editFixture(currentFixture.id,{rotation:Number(e.target.value)})}/>
              </label>}
              <label>{lang==="ar"?"حجم العنصر":lang==="fr"?"Taille de l'objet":"Object size"}: {Math.round((currentFixture.scale??1)*100)}%
                <input type="range" min=".6" max="1.5" step=".05" value={currentFixture.scale??1}
                  onChange={e=>editFixture(currentFixture.id,{scale:Number(e.target.value)})}
                  aria-label={lang==="ar"?"تكبير وتصغير العنصر":lang==="fr"?"Taille":"Object size"} />
              </label>
              <div className="idea-room3d-fixture-actions">
                <button type="button" onClick={duplicateFixture}><Copy size={14}/>{lang==="ar"?"نسخة":"Duplicate"}</button>
                <button type="button" onClick={deleteFixture}><Trash2 size={14}/>{lang==="ar"?"حذف":"Remove"}</button>
              </div>
            </div>}
          </section>
          <h2>{t.view}</h2>
          <div className="idea-room3d-pills">{(["perspective","top","front","left","right"] as const).map(p=>
            <button key={p} type="button" className={p===view?"active":""} onClick={()=>applyView(p)}>{t[p]}</button>)}</div>
          <label className="idea-room3d-toggle"><input type="checkbox" checked={ceiling} onChange={e=>setCeiling(e.target.checked)} />{t.roof}</label>
          <h2>{t.surface}</h2>
          <div className="idea-room3d-pills">
            {SURFACES.map(s=><button key={s} type="button" className={surface===s?"active":""}
              onClick={()=>setSurface(s)}>{s==="floor"?t.floor:s==="back"?t.backWall:s==="left"?t.leftWall:t.rightWall}</button>)}
          </div>
          <h2>{lang==="ar"?"الخامات المختارة":"Applied materials"}</h2>
          <div className="idea-room3d-selected-surfaces">
            {SURFACES.map(k=>{
              const product=byId.get(tileChoice[k]);
              const size=product?materialSize(product,sizeChoice[k]):null;
              return <button type="button" key={k} className={surface===k?"active":""} onClick={()=>setSurface(k)}>
                {k==="floor"?t.floor:k==="back"?t.backWall:k==="left"?t.leftWall:t.rightWall}
                <small>{product?product.name[lang]:"—"}{size?" · "+size.widthMm+" × "+size.heightMm+" mm":""}</small>
              </button>;
            })}
          </div>
          <p className="idea-room3d-disclaimer">{t.realSize}</p>
        </aside>

        <section className="idea-room3d-main">
          <div className="idea-room3d-stage" ref={mount} aria-label={t.title}>
            <div className="idea-room3d-overlay">
              <span><Camera size={15}/>{t[view]}</span><span>{dims.width} × {dims.length} × {dims.height} m</span>
            </div>
          </div>
          <div className="idea-room3d-bottom">
            <p>{lang==="ar"?"اسحب لتدوير المشهد، وقرّب بعجلة الماوس. اختار السطح ثم اختار البلاطة الأصلية ومقاسها من الكتالوج.":"Orbit the model, choose a floor or wall, then apply a real tile face at its verified format."}</p>
            <div>
              <button type="button" onClick={()=>applyView("perspective")}><Maximize2 size={15}/>{t.perspective}</button>
              <button type="button" onClick={reset}><RotateCcw size={15}/>{t.reset}</button>
              <button type="button" onClick={download}>{t.save}</button>
            </div>
          </div>
          {notice&&<p role="status">{notice}</p>}
        </section>

        <Room3DMaterialGallery products={tiles} locale={lang} surface={surface}
          activeProductId={tileChoice[surface]} activeSizeId={sizeChoice[surface]}
          onApply={(product,formatId)=>{
            setTileChoice(old=>({...old,[surface]:product.id}));
            setSizeChoice(old=>({...old,[surface]:formatId}));
            setNotice("");
          }}
          onClear={()=>{
            setTileChoice(old=>({...old,[surface]:""}));
            setSizeChoice(old=>({...old,[surface]:""}));
            setNotice("");
          }}
        />
      </div>
    </main>
  );
}
