import {Vector3,BufferGeometry,Float32BufferAttribute} from 'three';
import {clippedStoneFaces} from '../engine/convex-stone.ts';
import {Assembly} from './assembly.ts';
import {palettes} from './config.ts';
import type {Configuration} from './config.ts';
export function boulder(config:Configuration){
 const p=config.applied,a=new Assembly(config,{...palettes[p.colorway],moss:'#66724b'}),w=Number(p.width),h=Number(p.height),d=Number(p.depth),lean=Number(p.lean);
 const angularity=Number(p.angularity),crest=Number(p.crest),shoulder=Number(p.shoulderHeight),standing=p.form==='standing';
 let seed=(Number(p.seed)+1)>>>0;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 const bias=(random()-.5)*.045,cut=.06+(1-angularity)*.16;
 const traditionalCuts=[
  {normal:[1,standing?.24:.43,.35],limit:.53+bias},
  {normal:[-1,.16,.18],limit:.48-bias},
  {normal:[-.32,.28,1],limit:.55},
  {normal:[.26,.37,-1],limit:.47},
  {normal:[1,-.38,.23],limit:.43},
  {normal:[-1,-.53,.04],limit:.40},
  {normal:[-.13,-.42,1],limit:.47},
  {normal:[.24,-.34,-1],limit:.37},
  {normal:[1,.17,.72],limit:.81-cut*.8},
  {normal:[-.55,.18,1],limit:.78-cut*.9},
  {normal:[.65,.16,-1],limit:.78-cut*.55},
  {normal:[-1,.31,-.64],limit:.78-cut*.85},
  {normal:[.85,1.18,.32],limit:.33+shoulder*1.18},
  {normal:[-1,.78,.20],limit:.35+shoulder*.98},
  {normal:[-.23,1.12,1],limit:.30+shoulder*1.12},
  {normal:[.28,.94,-1],limit:.48+shoulder*1.10},
  {normal:[-(crest*.40+.18),1,.14],limit:.90},
 ];
 const field=p.form==='field',grade=Number(p.facetGrade),burial=Number(p.burialDepth);
 const fieldCuts:Array<{normal:[number,number,number];limit:number}>=[];
 const sides=grade===0?7:grade===1?9:12;
 for(let i=0;i<sides;i++){
  const angle=i*Math.PI*2/sides+.13+.10*Math.sin(i*1.8),dx=Math.cos(angle),dz=Math.sin(angle),r=.51+(random()-.5)*(.06+angularity*.08);
  fieldCuts.push({normal:[dx,.23+.16*Math.sin(i*1.7+.4),dz],limit:r+.10+.035*Math.sin(i*2.3)});
  fieldCuts.push({normal:[dx,.57+.21*Math.sin(i*2.1+.7),dz],limit:r+.27+shoulder*.13+.09*Math.sin(i*1.3)});
  fieldCuts.push({normal:[dx,-.47-.22*Math.cos(i*1.9),dz],limit:r-.065+.025*Math.sin(i)});
 }
 fieldCuts.push({normal:[-.07-crest*.2,1,.055],limit:1.01});
 const cuts=field?fieldCuts:traditionalCuts as Array<{normal:[number,number,number];limit:number}>;
 cuts.push({normal:[0,-1,0],limit:-burial*.6});
 const normalized=clippedStoneFaces(cuts);
 const all=normalized.flat(),topY=Math.max(...all.map(v=>v.y)),bottomY=Math.min(...all.map(v=>v.y));
 const faces=normalized.map(face=>face.map(v=>{
  const y=(v.y-bottomY)/(topY-bottomY);
  return new Vector3((v.x+lean*y+crest*y*.18)*w,y*h*(1-burial),v.z*d);
 }));
 const records=faces.map((vertices,index)=>({vertices,index}));
 const stone:number[]=[],moss:number[]=[],patches:unknown[]=[];
 const coverage=Number(p.mossCoverage),exposedHeight=h*(1-burial);
 const growthAngle=(Number(p.seed)*.61803398875%1)*Math.PI*2;
 const cutoff=.95-coverage*.36;
 const vertical=(v:Vector3)=>v.y/exposedHeight;
 const growthRegions:Array<Array<(v:Vector3)=>number>>=[[(v:Vector3)=>vertical(v)-cutoff]];
 for(const [offset,depth,slope] of [[0,.17,.52],[2.12,.23,.68],[4.36,.14,.44]]){
  const angle=growthAngle+offset!,dx=Math.cos(angle),dz=Math.sin(angle),reach=depth!+coverage*.065;
  const radial=(v:Vector3)=>v.x/w*dx+v.z/d*dz;
  const side=(v:Vector3)=>-v.x/w*dz+v.z/d*dx;
  growthRegions.push([
   v=>vertical(v)-cutoff+slope!*(radial(v)-.025),
   v=>vertical(v)-cutoff+reach-side(v)*1.05,
   v=>vertical(v)-cutoff+reach+side(v)*1.05,
  ]);
 }
 const clip=(vertices:Vector3[],plane:(v:Vector3)=>number,positive:boolean)=>{
  const polygon:Vector3[]=[];
  const append=(v:Vector3)=>{if(!polygon.some(p=>p.distanceToSquared(v)<1e-18))polygon.push(v);};
  for(let i=0;i<vertices.length;i++){
   const a=vertices[i]!,b=vertices[(i+1)%vertices.length]!,da=plane(a)*(positive?1:-1),db=plane(b)*(positive?1:-1);
   if(da>=0)append(a);
   if((da>0&&db<0)||(da<0&&db>0))append(a.clone().lerp(b,da/(da-db)));
  }
  return polygon;
 };
 const surfaces:Array<{out:number[];vertices:Vector3[]}>=[];
 const addSurface=(out:number[],vertices:Vector3[])=>{
  if(vertices.length>=3)surfaces.push({out,vertices});
 };
 for(const face of records){
  if(p.moss!=='top'){addSurface(stone,face.vertices);continue;}
  let uncovered=[face.vertices];
  for(const region of growthRegions){
   const remaining:Vector3[][]=[];
   for(const polygon of uncovered){
    let patch=polygon;
    for(const plane of region){
     const outside=clip(patch,plane,false);
     if(outside.length>=3)remaining.push(outside);
     patch=clip(patch,plane,true);
     if(patch.length<3)break;
    }
    if(patch.length>=3){
     addSurface(moss,patch);
     patches.push({face:face.index,outer:face.vertices.map(v=>v.toArray()),vertices:patch.map(v=>v.toArray())});
    }
   }
   uncovered=remaining;
  }
  for(const polygon of uncovered)addSurface(stone,polygon);
 }
 const precision=Number.EPSILON*128*Math.max(1,w,h,d),shared:Vector3[]=[];
 for(const surface of surfaces)surface.vertices=surface.vertices.map(point=>{
  const existing=shared.find(v=>v.distanceToSquared(point)<=precision*precision);
  if(existing)return existing;
  shared.push(point);return point;
 });
 for(const surface of surfaces){
  const boundary:Vector3[]=[];
  for(let i=0;i<surface.vertices.length;i++){
   const a=surface.vertices[i]!,b=surface.vertices[(i+1)%surface.vertices.length]!,delta=b.clone().sub(a),lengthSquared=delta.lengthSq();
   const splits=shared.flatMap(point=>{
    const t=point.clone().sub(a).dot(delta)/lengthSquared;
    if(t<=0||t>=1)return [];
    const distance=point.distanceToSquared(a.clone().addScaledVector(delta,t));
    return distance<=precision*precision?[{point,t}]:[];
   }).sort((a,b)=>a.t-b.t);
   boundary.push(a,...splits.map(s=>s.point));
  }
  const center=boundary.reduce((sum,v)=>sum.add(v),new Vector3()).multiplyScalar(1/boundary.length);
  for(let i=0;i<boundary.length;i++){
   const a=boundary[i]!,b=boundary[(i+1)%boundary.length]!;
   if(a.clone().sub(center).cross(b.clone().sub(center)).lengthSq()>1e-18)surface.out.push(...center.toArray(),...a.toArray(),...b.toArray());
  }
 }
 for(const [name,role,positions] of [['stone-mass','stone',stone],['moss-region','moss',moss]] as const){
  if(!positions.length)continue;
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();
  const mesh=a.mesh(name,geometry,role);
  if(role==='stone')mesh.userData.majorFaces=faces.map(vertices=>({vertices:vertices.map(v=>v.toArray())}));
  else mesh.userData.patches=patches;
 }
 a.anchors.top=faces.flat().reduce((best,v)=>v.y>best.y?v:best,faces[0]![0]!).toArray() as [number,number,number];
 return a.finish();
}
