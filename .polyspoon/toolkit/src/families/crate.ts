import {CylinderGeometry} from 'three';
import {Assembly} from './assembly.ts';
import {profileSolid,repeatSpan} from '../engine/geometry.ts';
import type {Configuration} from './config.ts';
export function crate(config:Configuration){
 const a=new Assembly(config),p=config.applied,w=Number(p.width),h=Number(p.height),d=Number(p.depth),size=Math.min(w,h,d);
 const frame=size*(p.frameWeight==='light'?.085:.13),plank=Math.min(.045,Math.max(.022,size*.065)),gap=Number(p.slatGap),count=Number(p.plankCourses);
 const rimDrop=p.lid==='open-top'?frame*.40:0;
 const floorTop=frame*.7+plank,wallBottom=floorTop,wallTop=h-frame*.64-rimDrop,row=(wallTop-wallBottom-gap*(count-1))/count;
 function board(name:string,from:[number,number,number],to:[number,number,number],width:number,depth:number,index:number){
  const mesh=a.beam(name,from,to,width,depth,'wood',Math.min(.005,width*.10));
  const tone=(index%3-1)*Number(p.toneVariation),key='wood-tone-'+(index%3);
  if(!a.materials[key]){const material=a.materials.wood!.clone();material.name=key;material.color.multiplyScalar(1+tone);a.materials[key]=material;}
  mesh.material=a.materials[key]!;
 }
 for(const sx of [-1,1])for(const sz of [-1,1]){
  a.mesh('corner-'+sx+'-'+sz,profileSolid([{y:0,width:frame,depth:frame,chamfer:frame*.15},{y:h-frame*.25,width:frame,depth:frame,chamfer:frame*(.15+Number(p.weathering)*.1)},{y:h,width:frame*.82,depth:frame*.82,chamfer:frame*.14}]),'timber',[sx*(w-frame)/2,0,sz*(d-frame)/2]);
 }
 for(const face of [-1,1]){
  for(let i=0;i<count;i++){
   const y=wallBottom+row/2+i*(row+gap);
   board('front-plank-'+face+'-'+i,[-w/2+frame*.7,y,face*(d/2-plank*.65)],[w/2-frame*.7,y,face*(d/2-plank*.65)],row,plank,i);
   board('side-plank-'+face+'-'+i,[face*(w/2-plank*.65),y,-d/2+frame*.7],[face*(w/2-plank*.65),y,d/2-frame*.7],plank,row,i+1);
  }
  for(const upper of [false,true]){
   const y=upper?h-frame*.5-rimDrop:frame*.5;
   a.beam('face-rim-'+face+'-'+upper,[-w/2+frame*.5,y,face*(d/2-frame*.5)],[w/2-frame*.5,y,face*(d/2-frame*.5)],frame,frame*.8,'timber',frame*.1);
   a.beam('side-rim-'+face+'-'+upper,[face*(w/2-frame*.5),y,-d/2+frame*.5],[face*(w/2-frame*.5),y,d/2-frame*.5],frame*.8,frame,'timber',frame*.1);
  }
  if(p.brace==='diagonal')a.beam('diagonal-'+face,[-w/2+frame*.8,frame*.7,face*(d/2+plank*.25)],[w/2-frame*.8,h-frame*.7,face*(d/2+plank*.25)],frame*.73,plank*.65,'timber',.004);
  if(p.detail==='inspection')for(const side of [-1,1])for(const upper of [false,true]){
   const peg=a.mesh('joint-peg-'+face+'-'+side+'-'+upper,new CylinderGeometry(frame*.10,frame*.10,plank*.25,6),'wood',[side*(w/2-frame),upper?h-frame*.5-rimDrop:frame*.5,face*(d/2-frame*.1+plank*.125-Math.min(.0015,plank*.04))]);peg.rotation.x=Math.PI/2;
  }
 }
 const floor=repeatSpan(w-frame*1.25,.18,Math.min(gap,.012));
 for(let i=0;i<floor.count;i++)board('floor-board-'+i,[floor.centers[i]!,floorTop-plank/2,-d/2+frame*.5],[floor.centers[i]!,floorTop-plank/2,d/2-frame*.5],floor.width,plank,i);
 if(p.lid==='closed'){
  const lid=repeatSpan(w-frame*1.45,.18,Math.min(gap,.01));
  for(let i=0;i<lid.count;i++)board('lid-plank-'+i,[lid.centers[i]!,h-plank/2,-d/2+frame*.55],[lid.centers[i]!,h-plank/2,d/2-frame*.55],lid.width,plank,i);
  a.anchors.stack=[0,h,0];
 }else a.anchors.interior=[0,floorTop,0];
 return a.finish();
}
