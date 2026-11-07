import {Box3,CylinderGeometry,Vector3} from 'three';
import {profileSolid,taperedSweep} from '../engine/geometry.ts';
import {Assembly} from '../families/assembly.ts';
import {colorways} from './config.ts';
import type {Configuration} from './config.ts';
import {protectiveGuard} from './geometry.ts';
export function rusticLantern(config:Configuration){
 const p=config.applied,w=p.bodyWidth,h=p.bodyHeight,d=w*.82,oct=p.enclosureProfile==='octagonal',cut=oct?w*.25:w*.035;
 const a=new Assembly(config,colorways[p.colorway]),rise=Number(p.hoodRise),base=w*.32,top=base+h,hoodY=top+w*.27*rise,capTop=top+w*.52*rise;
 const section=(name:string,role:string,rows:Array<[number,number,number]>)=>a.mesh(name,profileSolid(rows.map(([y,width,depth])=>({y,width,depth,chamfer:Math.min(cut,width*.28,depth*.28)}))),role);
 section('foot','structure',[[0,w*.82,d*.84],[w*.04,w*.94,d*.98],[w*.075,w*.94,d*.98]]);
 section('oil-reservoir','body',[[w*.065,w*.94,d*.98],[w*.14,w*1.02,d*1.02],[w*.245,w*.97,d*.97],[base,w*.78,d*.8]]);
 section('burner-collar','structure',[[base-w*.03,w*.4,d*.4],[base+w*.035,w*.34,d*.34]]);
 section('enclosure','enclosure',[[base,w*.70,d*.70],[base+h*.19,w*.94,d*.94],[base+h*.75,w*.82,d*.82],[top,w*.60,d*.60]]);
 section('lower-frame','structure',[[base-w*.022,w*.84,d*.84],[base+w*.025,w*.84,d*.84]]);
 section('upper-frame','structure',[[top-w*.025,w*.72,d*.72],[top+w*.025,w*.72,d*.72]]);
 const frame=w*(p.frameWeight==='heavy'?.075:.055),guardDepth=w*.032;
 for(let i=0;i<Number(p.guardCount);i++){
  const t=(i+.5)*Math.PI*2/Number(p.guardCount),dx=Math.cos(t),dz=Math.sin(t);
  const radial=(width:number,depth:number)=>{
    const chamfer=Math.min(cut,width*.28,depth*.28);
    return Math.min(width*.5/Math.max(1e-8,Math.abs(dx)),depth*.5/Math.max(1e-8,Math.abs(dz)),(width*.5+depth*.5-chamfer)/(Math.abs(dx)+Math.abs(dz)))+guardDepth*.12;
  };
  const stations:Array<[number,number,number]>=[[base-w*.012,w*.84,d*.84],[base+h*.19,w*.94,d*.94],[base+h*.75,w*.82,d*.82],[top+w*.012,w*.72,d*.72]];
  const centers=stations.map(([y,width,depth]):[number,number,number]=>{const r=radial(width,depth);return [dx*r,y,dz*r];});
  a.mesh('guard-upright-'+i,protectiveGuard(centers,frame*(i%2?.72:1)*(4/Number(p.guardCount))**.3,guardDepth,t),'structure');
 }
 if(p.guardLayout==='crossbar')for(const z of [-1,1])a.beam('guard-crossbar-'+z,[-w*.34,base+h*.48,z*d*.43],[w*.34,base+h*.48,z*d*.43],frame*.45,guardDepth,'structure');
 const flare=1+Number(p.hoodFlare)*1.5;
 section('hood','body',[[top,w*.72,d*.72],[top+w*.055*rise,w*flare,d*flare],[top+w*.08*rise,w*flare,d*flare],[hoodY,w*.55,d*.55]]);
 section('vent-core','structure',[[hoodY-w*.015,w*.39,d*.39],[capTop-w*.055,w*.35,d*.35]]);
 for(let i=0;i<4;i++){
  const t=(i+.5)*Math.PI/2,x=Math.cos(t)*w*.235,z=Math.sin(t)*d*.235;
  a.beam('vent-divider-'+i,[x,hoodY-w*.012,z],[x*.85,capTop-w*.05,z*.85],w*.045,w*.04,'body');
 }
 section('vented-cap','body',[[capTop-w*.06,w*.54,d*.54],[capTop-w*.015,w*.56,d*.56],[capTop+w*.075,w*.28,d*.28],[capTop+w*.095,w*.28,d*.28]]);
 const mountY=hoodY+w*.01,rx=w*(p.carryHoop==='round'?.39:p.carryHoop==='tall'?.28:.33);
 const wire=w*.022,gapBottom=capTop+w*.14,gapHeight=p.handleClearance,requestedHalf=rx*.55;
 const profile=Array.from({length:17},(_,i)=>{const t=-Math.PI/2+i*Math.PI*2/16;return {x:Math.cos(t),y:(1+Math.sin(t))/2};});
 const crossing=(x:number)=>{
  const ys:number[]=[];
  for(let i=0;i<profile.length-1;i++){
   const a=profile[i]!,b=profile[i+1]!;
   if(Math.abs(b.x-a.x)<1e-9||x<Math.min(a.x,b.x)-1e-9||x>Math.max(a.x,b.x)+1e-9)continue;
   ys.push(a.y+(b.y-a.y)*(x-a.x)/(b.x-a.x));
  }
  return Math.max(...ys);
 };
 const cornerFraction=crossing((requestedHalf+wire*1.5)/rx);
 const hoopTop=mountY+(gapBottom+gapHeight+wire*1.5-mountY)/cornerFraction;
 const cy=(mountY+hoopTop)/2,ry=(hoopTop-mountY)/2;
 const innerHalfAt=(y:number)=>{
  const level=(y-mountY)/(hoopTop-mountY),xs:number[]=[];
  for(let i=0;i<profile.length-1;i++){
   const a=profile[i]!,b=profile[i+1]!;
   if(Math.abs(b.y-a.y)<1e-9||level<Math.min(a.y,b.y)-1e-9||level>Math.max(a.y,b.y)+1e-9)continue;
   const x=a.x+(b.x-a.x)*(level-a.y)/(b.y-a.y);if(x>=0)xs.push(x*rx);
  }
  return Math.min(...xs)-wire*1.5;
 };
 const gapWidth=2*Math.min(innerHalfAt(gapBottom),innerHalfAt(gapBottom+gapHeight));
 if(!Number.isFinite(gapWidth)||gapWidth<requestedHalf*2)throw new Error('Hoop profile cannot retain requested carry opening');
 const points:Array<{center:[number,number,number];radius:number}>=[];
 for(let i=0;i<=16;i++){
  const t=-Math.PI/2+i*Math.PI*2/16;
  points.push({center:[Math.cos(t)*rx,cy+Math.sin(t)*ry,0],radius:wire});
 }
 a.mesh('handle',taperedSweep(points,6),'structure');
 for(const side of [-1,1]){
  a.beam('handle-seat-'+side,[side*w*.23,hoodY-w*.025,0],[side*rx*.76,cy-ry*Math.sqrt(1-.76**2),0],w*.065,w*.09,'body');
  if(p.detail==='inspection'){
   const pin=a.mesh('handle-rivet-'+side,new CylinderGeometry(w*.019,w*.019,w*.03,8),'accent',[side*w*.25,hoodY+w*.015,w*.065]);pin.rotation.x=Math.PI/2;
  }
 }
 const root=a.root;root.updateMatrixWorld(true);const bounds=new Box3().setFromObject(root,true);
 const anchors={ground:[0,0,0],carry:[0,hoopTop+wire,0]};root.userData.anchors=anchors;
 return {root,config,materials:a.materials,bounds,dimensions:bounds.getSize(new Vector3()),handleGap:{width:gapWidth,bottom:gapBottom,height:gapHeight},anchors};
}
