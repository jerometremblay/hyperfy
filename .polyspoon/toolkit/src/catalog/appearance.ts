import { Color, Float32BufferAttribute, Matrix3, Mesh, MeshBasicMaterial, Vector3 } from 'three';
import type { AssetBuild } from './types.ts';
import type { Appearance, Design } from '../engine/parameters.ts';
import { plainRecord } from '../engine/parameters.ts';

export const paletteNames=['None','Reduced4','GameBoy','PICO8','CGA','Mono'] as const;
export const shadingNames=['None','Toon3bands','Flat'] as const;
const paletteHex={
 Reduced4:['#202c39','#596b65','#b4ae8a','#f2e9d1'],
 GameBoy:['#0f380f','#306230','#8bac0f','#9bbc0f'],
 PICO8:['#000000','#1d2b53','#7e2553','#008751','#ab5236','#5f574f','#c2c3c7','#fff1e8','#ff004d','#ffa300','#ffec27','#00e436','#29adff','#83769c','#ff77a8','#ffccaa'],
 CGA:['#000000','#0000aa','#00aa00','#00aaaa','#aa0000','#aa00aa','#aa5500','#aaaaaa','#555555','#5555ff','#55ff55','#55ffff','#ff5555','#ff55ff','#ffff55','#ffffff'],
 Mono:['#000000','#ffffff'],
};
export function parseAppearance(input:unknown):Appearance {
 const value=plainRecord(input);
 if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||!['version','palette','shading','partColors'].includes(key)))throw new Error('Unknown appearance field');
 if(value.version!==1)throw new Error('Unsupported appearance version');
 if(!paletteNames.includes(value.palette as Appearance['palette']))throw new Error('Unknown appearance palette');
 if(!shadingNames.includes(value.shading as Appearance['shading']))throw new Error('Unknown appearance shading');
 const colors=plainRecord(value.partColors),partColors:Record<string,string>={};
 for(const key of Reflect.ownKeys(colors)){
  const color=colors[key as string];
  if(typeof key!=='string'||!key.length||key.length>160||!/^[a-zA-Z0-9_.-]+$/.test(key)||['__proto__','constructor','prototype'].includes(key)||typeof color!=='string'||!/^#[0-9a-f]{6}$/i.test(color))throw new Error('Invalid appearance part color');
  partColors[key]=color.toLowerCase();
 }
 return {version:1,palette:value.palette as Appearance['palette'],shading:value.shading as Appearance['shading'],partColors};
}
export function splitAppearance(input:unknown) {
 const value=plainRecord(input),parameters={...value};
 const appearance=Object.hasOwn(value,'appearance')?parseAppearance(value.appearance):undefined;
 delete parameters.appearance;
 return {parameters,appearance};
}
export function designInput(design:Design):Record<string,unknown> {
 return {...design.requested,...(design.appearance?{appearance:structuredClone(design.appearance)}:{})};
}
export function styleAsset(build:AssetBuild,appearance?:Appearance):void {
 if(!appearance)return;
 const names=new Set<string>();
 build.root.traverse(object=>{if(object instanceof Mesh)names.add(object.name);});
 build.root.userData.inactivePartColors=Object.keys(appearance.partColors).filter(name=>!names.has(name));
 build.config.appearance=structuredClone(appearance);
 if(appearance.palette==='None'&&appearance.shading==='None'&&!Object.keys(appearance.partColors).length)return;
 let palette=appearance.palette==='None'?undefined:paletteHex[appearance.palette].map(hex=>new Color(hex));
 if(appearance.palette==='Reduced4'){
  const colors=Object.values(build.materials).map(material=>material.color.clone());
  const unique=[...new Map(colors.map(color=>[color.getHexString(),color])).values()].sort((a,b)=>(a.r+a.g+a.b)-(b.r+b.g+b.b));
  palette=Array.from({length:4},(_,i)=>unique[Math.round(i*(unique.length-1)/3)]!.clone());
 }
 const authored=new Set(Object.values(build.materials)),styled:AssetBuild['materials']={};
 const light=new Vector3(-2,5,3).normalize();
 build.root.updateMatrixWorld(true);
 build.root.traverse(object=>{
  if(!(object instanceof Mesh))return;
  if(Array.isArray(object.material))throw new Error('Appearance requires a single material per part');
  const original=object.material as AssetBuild['materials'][string];
  const tint=appearance.partColors[object.name];
  const base=tint?new Color(tint):original.color.clone();
  const bake=Boolean(palette)||appearance.shading==='Toon3bands';
  let next=styled[original.name+(tint?'-'+object.name:'')];
  const key=original.name+(tint?'-'+object.name:'');
  if(!next){
   next=appearance.shading!=='None'?new MeshBasicMaterial({color:0xffffff,vertexColors:original.vertexColors,side:original.side}):original.clone();
   next.name=key;next.color.copy(bake?new Color(0xffffff):base);
   if(bake)next.vertexColors=true;
   if('flatShading' in next&&appearance.shading==='Flat')next.flatShading=true;
   styled[key]=next;
  }
  if(bake||appearance.shading==='Flat'){
   const old=object.geometry;
   const geometry=old.index?old.toNonIndexed():old.clone();
   geometry.computeVertexNormals();
   if(bake){
    const positions=geometry.getAttribute('position'),normals=geometry.getAttribute('normal'),tints=geometry.getAttribute('color');
    const values=new Float32Array(positions.count*3),normalMatrix=new Matrix3().getNormalMatrix(object.matrixWorld);
    for(let i=0;i<positions.count;i++){
     const color=base.clone();
     if(original.vertexColors&&tints)color.multiply(new Color().setRGB(tints.getX(i),tints.getY(i),tints.getZ(i)));
     if(appearance.shading==='Toon3bands'){
      const dot=new Vector3().fromBufferAttribute(normals,i).applyNormalMatrix(normalMatrix).dot(light);
      color.multiplyScalar(dot>0.55?1:dot>0?0.68:0.38);
     }
     if(palette){
      const distance=(candidate:Color)=>(color.r-candidate.r)**2+(color.g-candidate.g)**2+(color.b-candidate.b)**2;
      color.copy(palette.reduce((best,candidate)=>distance(candidate)<distance(best)?candidate:best));
     }
     color.toArray(values,i*3);
    }
    geometry.setAttribute('color',new Float32BufferAttribute(values,3));
   }
   object.geometry=geometry;old.dispose();
  }
  object.material=next;
 });
 build.materials=styled;
 for(const material of authored)material.dispose();
}
