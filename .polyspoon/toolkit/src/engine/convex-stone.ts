import {Vector3} from 'three';
export interface StoneCut {normal:[number,number,number];limit:number}
export function clippedStoneFaces(cuts:StoneCut[]):Vector3[][]{
 const v=(x:number,y:number,z:number)=>new Vector3(x,y,z);
 let faces=[
  [v(-.65,0,-.6),v(.65,0,-.6),v(.65,0,.6),v(-.65,0,.6)],
  [v(-.65,1.5,-.6),v(-.65,1.5,.6),v(.65,1.5,.6),v(.65,1.5,-.6)],
  [v(-.65,0,-.6),v(-.65,0,.6),v(-.65,1.5,.6),v(-.65,1.5,-.6)],
  [v(.65,0,-.6),v(.65,1.5,-.6),v(.65,1.5,.6),v(.65,0,.6)],
  [v(-.65,0,-.6),v(-.65,1.5,-.6),v(.65,1.5,-.6),v(.65,0,-.6)],
  [v(-.65,0,.6),v(.65,0,.6),v(.65,1.5,.6),v(-.65,1.5,.6)],
 ];
 for(const cut of cuts){
  if(![...cut.normal,cut.limit].every(Number.isFinite))throw new Error('Invalid stone cut');
  const normal=new Vector3(...cut.normal);if(normal.length()<1e-8)throw new Error('Empty stone cut normal');
  const boundary:Vector3[]=[],next:Vector3[][]=[];
  const unique=(list:Vector3[],point:Vector3)=>{if(!list.some(p=>p.distanceToSquared(point)<1e-16))list.push(point);};
  for(const face of faces){
   const polygon:Vector3[]=[];
   for(let i=0;i<face.length;i++){
    const a=face[i]!,b=face[(i+1)%face.length]!,da=normal.dot(a)-cut.limit,db=normal.dot(b)-cut.limit;
    if(da<=1e-10)unique(polygon,a);
    if((da< -1e-10&&db>1e-10)||(da>1e-10&&db< -1e-10)){
     const point=a.clone().lerp(b,da/(da-db));unique(polygon,point);unique(boundary,point);
    }
    if(Math.abs(da)<=1e-10)unique(boundary,a);
   }
   if(polygon.length>=3)next.push(polygon);
  }
  if(boundary.length>=3){
   normal.normalize();const center=boundary.reduce((s,p)=>s.add(p),new Vector3()).multiplyScalar(1/boundary.length);
   const u=new Vector3(Math.abs(normal.y)<.9?0:1,Math.abs(normal.y)<.9?1:0,0).cross(normal).normalize(),v=normal.clone().cross(u);
   boundary.sort((a,b)=>Math.atan2(a.clone().sub(center).dot(v),a.clone().sub(center).dot(u))-Math.atan2(b.clone().sub(center).dot(v),b.clone().sub(center).dot(u)));
   if(!next.some(face=>face.length===boundary.length&&face.every(p=>boundary.some(q=>p.distanceToSquared(q)<1e-16))))next.push(boundary);
  }
  faces=next;
 }
 if(faces.length<4)throw new Error('Stone cuts removed the solid');
 return faces;
}
