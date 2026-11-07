import {CylinderGeometry} from 'three';
import {Assembly} from './assembly.ts';
import {profileSolid} from '../engine/geometry.ts';
import type {Configuration} from './config.ts';
export function fence(config:Configuration){
 const a=new Assembly(config),p=config.applied,length=Number(p.length),h=Number(p.height),bays=Number(p.bays),span=length/bays;
 const heavy=p.memberWeight==='stout',post=(.13+h*.04)*(heavy?1:.8),capHeight=post*.52,railHeight=h*(heavy?.125:.098),railDepth=post*.52;
 for(let i=0;i<=bays;i++){
  const x=-length/2+i*span,age=Number(p.weathering),taper=1-age*.10;
  a.mesh('post-'+i,profileSolid([{y:0,width:post,depth:post,chamfer:post*.1},{y:h*.48,width:post*(1-age*.035),depth:post*(1-age*.025),chamfer:post*(.1+age*.1)},{y:h-capHeight,width:post*taper,depth:post*taper,chamfer:post*.12}]),'timber',[x,0,0]);
  a.mesh('post-cap-'+i,profileSolid([{y:h-capHeight,width:post*taper,depth:post*taper,chamfer:post*.12},{y:h-capHeight*.55,width:post*taper,depth:post*taper,chamfer:post*.1},{y:h,width:post*(p.postHead==='flat'?taper:p.postHead==='peaked'?.22:.65),depth:post*(p.postHead==='flat'?taper:p.postHead==='peaked'?.22:.65),chamfer:post*(p.postHead==='peaked'?.035:.075)}]),'timber',[x,0,0]);
  if(i===bays)continue;
  for(let level=0;level<Number(p.railCount);level++){
   const y=h*(.20+.60*level/(Number(p.railCount)-1));
   a.beam('rail-'+i+'-'+level,[x+post*.12,y,0],[x+span-post*.12,y,0],railHeight,railDepth,'wood',.009);
   if(p.detail==='inspection')for(const end of [0,1]){
    const peg=a.mesh('joint-peg-'+i+'-'+level+'-'+end,new CylinderGeometry(railHeight*.105,railHeight*.105,.018,7),'timber',[x+end*span+(end?-1:1)*post*.31,y,railDepth*.55]);peg.rotation.x=Math.PI/2;
   }
  }
  if(p.railStyle==='cross-braced')a.beam('brace-'+i,[x+post*.2,h*.24,-railDepth*.72],[x+span-post*.2,h*.77,-railDepth*.72],railHeight*.7,railDepth*.65,'wood',.006);
  if(p.infill==='pickets'){
   const width=(.055+h*.018)*(heavy?1:.86),space=Math.max(Number(p.picketSpacing),width+.02),usable=span-post*1.15,count=Math.max(1,Math.floor(usable/space));
   const actual=usable/count;
   for(let j=0;j<count;j++){
    const px=x+post*.575+actual*(j+.5),tip=h*.96;
    a.mesh('picket-'+i+'-'+j,profileSolid([{y:h*.10,width,depth:railDepth*.62,chamfer:width*.1},{y:tip-width*.65,width,depth:railDepth*.62,chamfer:width*.1},{y:tip,width:width*.23,depth:railDepth*.62,chamfer:width*.07}]),'wood',[px,0,railDepth*.75]);
   }
  }
 }
 a.anchors.start=[-length/2,0,0];a.anchors.end=[length/2,0,0];return a.finish();
}
