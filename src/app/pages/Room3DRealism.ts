import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import type { RoomLightSettings } from "./Room3DLighting";

export type LightRig = {
  hemi:THREE.HemisphereLight;
  ambient:THREE.AmbientLight;
  key:THREE.DirectionalLight;
  spot:THREE.SpotLight;
  fill:THREE.PointLight;
  bulb:THREE.Mesh;
  bulbMat:THREE.MeshBasicMaterial;
};

export function installMaterialEnvironment(scene:THREE.Scene,renderer:THREE.WebGLRenderer) {
  const pmrem=new THREE.PMREMGenerator(renderer);
  const room=new RoomEnvironment();
  // Soft neutral studio reflection. Not a substitute for calibrated on-site HDRI.
  const target=pmrem.fromScene(room,.04);
  scene.environment=target.texture;
  scene.environmentIntensity=.52;
  room.dispose();pmrem.dispose();
  return ()=>{scene.environment=null;target.dispose();};
}
export function makeLightRig(scene:THREE.Scene):LightRig {
  const hemi=new THREE.HemisphereLight(0xfff8f0,0x56606b,.45);
  const ambient=new THREE.AmbientLight(0xffffff,.16);
  const key=new THREE.DirectionalLight(0xfff6e9,1.3);
  key.position.set(-2.7,5.4,3.2);
  key.castShadow=true;
  key.shadow.mapSize.set(2048,2048);
  key.shadow.camera.near=.5;
  key.shadow.camera.far=24;
  key.shadow.camera.left=-8;
  key.shadow.camera.right=8;
  key.shadow.camera.top=8;
  key.shadow.camera.bottom=-8;
  key.shadow.bias=-.00015;
  key.shadow.normalBias=.015;
  key.shadow.radius=4;
  const spot=new THREE.SpotLight(0xffefdc,50,12,Math.PI/2.8,.75,2);
  spot.castShadow=true;
  spot.shadow.mapSize.set(1024,1024);
  spot.shadow.normalBias=.02;
  spot.shadow.bias=-.0001;
  spot.shadow.radius=5;
  const fill=new THREE.PointLight(0xffe6ce,8,8,2);
  const bulbMat=new THREE.MeshBasicMaterial({color:0xffeddb,toneMapped:false});
  const bulb=new THREE.Mesh(new THREE.SphereGeometry(.07,18,12),bulbMat);
  scene.add(hemi,ambient,key,spot,spot.target,fill,bulb);
  return {hemi,ambient,key,spot,fill,bulb,bulbMat};
}
export function updateLightRig(
  rig:LightRig,settings:RoomLightSettings,
  dims:{width:number;length:number;height:number},renderer:THREE.WebGLRenderer,scene:THREE.Scene
){
  const enabled=settings.enabled?1:0;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure=settings.exposure;
  const color=new THREE.Color(settings.color);
  const sun=rig.key;
  rig.ambient.intensity=(.12+settings.ambient*.27)*enabled;
  rig.hemi.intensity=(.20+settings.ambient*.58)*enabled;
  sun.intensity=settings.daylightPower*1.30*enabled;
  sun.color.set("#fff1dc");
  sun.castShadow=settings.shadows;
  const x=settings.x*dims.width*.42;
  const z=settings.z*dims.length*.42;
  const height=Math.max(.7,Math.min(dims.height-.13,dims.height*settings.height));
  rig.spot.position.set(x,height,z);
  rig.spot.target.position.set(x*.18,.03,z*.18);
  rig.spot.target.updateMatrixWorld();
  rig.spot.color.copy(color);
  rig.spot.intensity=55*settings.power*enabled;
  rig.spot.distance=Math.max(7,dims.width+dims.length);
  rig.spot.castShadow=settings.shadows;
  rig.fill.position.set(-x*.5,dims.height*.68,-z*.5);
  rig.fill.color.copy(color);
  rig.fill.intensity=6*settings.power*enabled;
  rig.bulb.position.copy(rig.spot.position);
  rig.bulb.visible=!!settings.enabled;
  rig.bulbMat.color.copy(color);
  scene.environmentIntensity=settings.finish==="polished"?.43:.50;
  const kitchenStrip=scene.getObjectByName("IDEA_KITCHEN_LED") as THREE.Mesh|undefined;
  if(kitchenStrip && kitchenStrip.material instanceof THREE.MeshBasicMaterial){
    kitchenStrip.material.color.copy(color);
    kitchenStrip.visible=settings.enabled;
  }
}

/** Tile grout edge normal pattern; one tile per texture repeat. */
export function makeTileNormalMap(tilesAcross:number,tilesHigh:number):THREE.DataTexture{
  const n=128;
  const pixels=new Uint8Array(n*n*4);
  for(let y=0;y<n;y++)for(let x=0;x<n;x++){
    const edgeX=x<=1||x>=n-2;
    const edgeY=y<=1||y>=n-2;
    const fluctuation=Math.sin(x*31.41+y*14.73)*1.6;
    const k=(y*n+x)*4;
    pixels[k]=Math.max(0,Math.min(255,Math.round(128+(edgeX?(x<n/2?-19:19):fluctuation))));
    pixels[k+1]=Math.max(0,Math.min(255,Math.round(128+(edgeY?(y<n/2?-19:19):fluctuation))));
    pixels[k+2]=edgeX||edgeY?247:255;
    pixels[k+3]=255;
  }
  const t=new THREE.DataTexture(pixels,n,n,THREE.RGBAFormat);
  t.wrapS=t.wrapT=THREE.RepeatWrapping;
  t.repeat.set(tilesAcross,tilesHigh);
  t.needsUpdate=true;
  t.generateMipmaps=true;
  t.minFilter=THREE.LinearMipmapLinearFilter;
  t.magFilter=THREE.LinearFilter;
  t.colorSpace=THREE.NoColorSpace;
  return t;
}

function makeKitchenWoodTexture():THREE.CanvasTexture{
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#b99c82";ctx.fillRect(0,0,512,512);
  // Subtle organic vertical grain, not a flat plastic cabinet color.
  for(let i=0;i<190;i++){
    const x=i*2.72;
    const shade= i%7===0?"rgba(80,49,32,.14)":i%3===0?"rgba(255,242,211,.15)":"rgba(86,61,41,.065)";
    ctx.beginPath();ctx.strokeStyle=shade;ctx.lineWidth=i%11===0?2.2:.75;
    for(let y=0;y<=512;y+=16){
      const px=x+Math.sin(y*.021+i*.7)*1.2+Math.sin(y*.006+i)*1.4;
      if(y===0)ctx.moveTo(px,y);else ctx.lineTo(px,y);
    }
    ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  return tex;
}
function makeKitchenStoneTexture():THREE.CanvasTexture{
  const canvas=document.createElement("canvas");canvas.width=512;canvas.height=512;
  const ctx=canvas.getContext("2d")!;
  ctx.fillStyle="#d0cbc2";ctx.fillRect(0,0,512,512);
  for(let i=0;i<21;i++){
    const seed=i*23.7;
    ctx.beginPath();
    ctx.strokeStyle=i%4===0?"rgba(104,99,92,.13)":"rgba(251,248,242,.20)";
    ctx.lineWidth=i%5===0?2.1:.85;
    for(let x=-24;x<560;x+=14){
      const y=seed*1.7+x*.45+Math.sin(x*.028+i*8)*7;
      if(x===-24)ctx.moveTo(x,y);else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  const tex=new THREE.CanvasTexture(canvas);
  tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=8;
  return tex;
}

/** Editable generic kitchen, not a manufacturer's verified 3D asset. */
export function addKitchenPreview(scene:THREE.Scene,w:number,l:number,h:number){
  const group=new THREE.Group();
  group.name="IDEA_GENERIC_KITCHEN";
  const matte=new THREE.MeshPhysicalMaterial({color:0xddd7cb,roughness:.54,clearcoat:.1});
  const doors=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.48,clearcoat:.12,map:makeKitchenWoodTexture()});
  const worktop=new THREE.MeshPhysicalMaterial({color:0xffffff,roughness:.23,clearcoat:.35,clearcoatRoughness:.16,metalness:.02,map:makeKitchenStoneTexture()});
  const chrome=new THREE.MeshStandardMaterial({color:0xc7cdd2,metalness:.78,roughness:.22});
  const black=new THREE.MeshPhysicalMaterial({color:0x22282d,roughness:.19,metalness:.22,clearcoat:.72});
  const glass=new THREE.MeshPhysicalMaterial({color:0x363d42,metalness:.1,roughness:.09,clearcoat:.98});
  const wood=new THREE.MeshStandardMaterial({color:0x98745a,roughness:.68});
  const strip=new THREE.MeshBasicMaterial({color:0xffe6bf,toneMapped:false});
  const box=(a:number,b:number,c:number,m:THREE.Material,x:number,y:number,z:number)=>{
    const obj=new THREE.Mesh(new THREE.BoxGeometry(a,b,c),m);
    obj.position.set(x,y,z);obj.receiveShadow=true;obj.castShadow=true;group.add(obj);return obj;
  };
  const available=Math.max(2,Math.min(w-.42,3.65));
  const cabinetWidth=available/4;
  const bz=-l/2+.37;
  const centerX=0;
  box(available,.78,.65,matte,centerX,.40,bz);
  for(let i=0;i<4;i++){
    const x=(i-1.5)*cabinetWidth;
    box(cabinetWidth-.025,.70,.035,doors,x,.42,bz+.34);
    box(.125,.012,.026,chrome,x+cabinetWidth*.32,.62,bz+.367);
  }
  box(available+.04,.052,.72,worktop,0,.82,bz+.01);
  // Sink cutout reads as a dark recessed ceramic basin.
  box(.55,.009,.39,black,-available*.21,.854,bz+.02);
  box(.48,.009,.33,chrome,-available*.21,.861,bz+.02);
  box(.43,.006,.27,black,-available*.21,.868,bz+.02);
  const tapBase=new THREE.Mesh(new THREE.CylinderGeometry(.035,.042,.12,20),chrome);
  tapBase.position.set(-available*.21+.23,.92,bz-.16);group.add(tapBase);
  const upright=new THREE.Mesh(new THREE.CylinderGeometry(.022,.024,.3,20),chrome);
  upright.position.set(-available*.21+.23,1.11,bz-.16);group.add(upright);
  box(.23,.038,.03,chrome,-available*.21+.12,1.25,bz-.16);
  box(.36,.012,.32,glass,available*.22,.858,bz+.02);
  for(const px of [-.09,.09])for(const pz of [-.08,.08]){
    const ring=new THREE.Mesh(new THREE.TorusGeometry(.052,.01,6,24),chrome);
    ring.position.set(available*.22+px,.868,bz+.02+pz);
    ring.rotation.x=-Math.PI/2;group.add(ring);
  }
  const upperY=Math.max(1.65,Math.min(h-.42,2.16));
  for(let i=0;i<4;i++){
    const x=(i-1.5)*cabinetWidth;
    if(i===2)continue; // shallow range hood above cooktop
    box(cabinetWidth-.025,.56,.31,matte,x,upperY,bz-.14);
    box(cabinetWidth-.035,.54,.025,doors,x,upperY,bz+.025);
    box(.10,.012,.024,chrome,x+cabinetWidth*.25,upperY-.13,bz+.047);
  }
  box(cabinetWidth*.72,.16,.35,chrome,cabinetWidth*.5,upperY+.18,bz-.12);
  box(cabinetWidth*.55,.023,.39,chrome,cabinetWidth*.5,upperY+.03,bz+.02);
  // Visible under-cabinet LED strip offers localized glossy highlight.
  const led=box(available*.9,.016,.024,strip,0,upperY-.32,bz+.031);
  led.name="IDEA_KITCHEN_LED";
  box(available+.08,.08,.10,wood,0,.10,bz+.42);
  scene.add(group);
  return group;
}
