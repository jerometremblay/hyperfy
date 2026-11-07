import {Box3,CylinderGeometry,Mesh,Vector3} from 'three';
import {rusticLantern} from './rustic.ts';
import {colorways,saveConfiguration} from './config.ts';
import {carryingBand,profileSolid,taperedSweep} from '../engine/geometry.ts';
import {Assembly} from '../families/assembly.ts';
import {protectiveGuard} from './geometry.ts';
export function generateLantern(input:unknown){
 const config=saveConfiguration(input);if(config.applied.construction==='rustic')return rusticLantern(config);
 const p=config.applied,w=p.bodyWidth,h=p.bodyHeight,d=w*.76,baseTop=w*.20,hoodBottom=baseTop+h,crownTop=hoodBottom+w*.50;
 const assembly=new Assembly(config,colorways[p.colorway]),root=assembly.root,materials=assembly.materials;
 const add=assembly.mesh.bind(assembly),heavy=p.frameWeight==='heavy',octagonal=p.enclosureProfile==='octagonal',frame=w*(heavy?.078:.058),flare=Number(p.hoodFlare);
 add('foot',profileSolid([{y:0,width:w*1.04,depth:d*1.06,chamfer:w*.08},{y:w*.055,width:w*1.10,depth:d*1.12,chamfer:w*.08}]),'structure');
 add('base',profileSolid([{y:w*.04,width:w*1.08,depth:d*1.10,chamfer:w*.08},{y:w*.095,width:w*1.14,depth:d*1.16,chamfer:w*.09},{y:baseTop,width:w*.94,depth:d*.96,chamfer:w*.07}]),'body');
 const chamfer=octagonal?w*.23:w*.06;
 add('enclosure',profileSolid([{y:baseTop,width:w*.87,depth:d*.88,chamfer:chamfer*.85},{y:baseTop+h*.16,width:w,depth:d,chamfer},{y:hoodBottom-h*.18,width:w*.96,depth:d*.96,chamfer:chamfer*.94},{y:hoodBottom,width:w*.86,depth:d*.88,chamfer:chamfer*.82}]),'enclosure');
 for(const [name,y,width,depth] of [['lower-frame',baseTop,w*.93,d*.98],['upper-frame',hoodBottom-w*.025,w*.91,d*.98]] as const){
  add(name,profileSolid([{y,width,depth,chamfer:octagonal?w*.18:w*.05},{y:y+w*.045,width,depth,chamfer:octagonal?w*.18:w*.05}]),'body');
 }
 const support=(angle:number)=>{
  const x=Math.cos(angle),z=Math.sin(angle),cut=octagonal?w*.19:w*.045;
  const r=Math.min(w*.51/Math.max(1e-8,Math.abs(x)),d*.52/Math.max(1e-8,Math.abs(z)),(w*.51+d*.52-cut)/(Math.abs(x)+Math.abs(z)));
  return [x*r,z*r] as const;
 };
 for(let i=0;i<Number(p.guardCount);i++){
  const angle=(i+.5)*Math.PI*2/Number(p.guardCount),[x,z]=support(angle);
  add('guard-upright-'+i,protectiveGuard([[x*.88,baseTop+w*.012,z*.88],[x,baseTop+h*.19,z],[x*.96,baseTop+h*.82,z*.96],[x*.87,hoodBottom-w*.002,z*.87]],frame*(4/Number(p.guardCount))**.3,w*.032,angle),'structure');
 }
 if(p.guardLayout==='crossbar')for(const side of [-1,1])assembly.beam('guard-crossbar-'+side,[-w*.40,baseTop+h*.44,side*d*.50],[w*.40,baseTop+h*.55,side*d*.50],frame*.60,frame*.44,'structure',w*.005);
 add('vent-core',profileSolid([{y:hoodBottom,width:w*.63,depth:d*.64,chamfer:w*.07},{y:hoodBottom+w*.12,width:w*.59,depth:d*.6,chamfer:w*.065}]),'structure');
 for(const side of [-1,1])for(let i=0;i<3;i++){
  assembly.beam('vent-divider-'+side+'-'+i,[(i-1)*w*.19,hoodBottom,side*d*.335],[(i-1)*w*.19,hoodBottom+w*.12,side*d*.31],w*.047,w*.04,'body',w*.004);
 }
 const hoodProfile=[{y:hoodBottom+w*.09,width:w*(1+2*flare),depth:d*(1+2*flare),chamfer:w*.13},{y:hoodBottom+w*.12,width:w*(1+2*flare),depth:d*(1+2*flare),chamfer:w*.13},{y:crownTop-w*.035,width:w*.50,depth:d*.54,chamfer:w*.055},{y:crownTop,width:w*.50,depth:d*.54,chamfer:w*.055}];
 add('hood',profileSolid(hoodProfile),'body');
 const hoodSurface=(x:number,z:number)=>{
  const clearance=(row:typeof hoodProfile[number])=>[row.width/2-Math.abs(x),row.depth/2-Math.abs(z),(row.width+row.depth)/2-row.chamfer-Math.abs(x)-Math.abs(z)];
  for(let i=hoodProfile.length-1;i>0;i--){
   const lower=hoodProfile[i-1]!,upper=hoodProfile[i]!,lo=clearance(lower),hi=clearance(upper);
   if(lo.some(value=>value<0))continue;
   const t=Math.min(1,...lo.map((value,j)=>hi[j]!<0?value/(value-hi[j]!):1));
   return lower.y+(upper.y-lower.y)*t;
  }
  throw new Error('Carry mount lies outside its hood support');
 };
 const band=w*.045,handleBase=crownTop+w*.09;
 if(p.handleProfile==='square')add('handle',carryingBand(w*.62,handleBase-w*.025,handleBase+p.handleClearance,band,w*.095),'structure');
 else{
  const x=w*.34,top=handleBase+p.handleClearance+band,corner=Math.min(w*.13,p.handleClearance*.44),points:Array<[number,number,number]>=[[-x,handleBase-w*.025,0],[-x,top-corner,0]];
  for(let i=1;i<=5;i++){const t=i*Math.PI/10;points.push([-x+corner-corner*Math.cos(t),top-corner+corner*Math.sin(t),0]);}
  points.push([x-corner,top,0]);
  for(let i=1;i<=5;i++){const t=i*Math.PI/10;points.push([x-corner+corner*Math.sin(t),top-corner+corner*Math.cos(t),0]);}
  points.push([x,handleBase-w*.025,0]);
  add('handle',taperedSweep(points.map(center=>({center,radius:band})),8),'structure');
 }
 const seatX=w*(p.handleProfile==='square'?.38:.34);
 for(const side of [-1,1]){
  const bottom=hoodBottom+w*.105,seat=profileSolid([{y:bottom,width:w*.12,depth:w*.17,chamfer:w*.015},{y:handleBase+w*.02,width:w*.11,depth:w*.15,chamfer:w*.015}]);
  const position=seat.getAttribute('position');
  for(let i=0;i<position.count;i++)if(Math.abs(position.getY(i)-bottom)<w*1e-5)position.setY(i,hoodSurface(position.getX(i)+side*seatX,position.getZ(i))-w*.012);
  seat.computeVertexNormals();
  add('handle-seat-'+side,seat,'body',[side*seatX,0,0]);
  if(p.detail==='inspection'){const pin=add('handle-rivet-'+side,new CylinderGeometry(w*.02,w*.02,w*.02,8),'accent',[side*seatX,handleBase-w*.02,w*.085]);pin.rotation.x=Math.PI/2;}
 }
 const plateDepth=w*.025,buttonDepth=w*.025,plateZ=d*.57;
 assembly.box('switch-plate',[w*.18,w*.10,plateDepth],'structure',[0,w*.115,plateZ]);
 const button=add('switch',new CylinderGeometry(w*.034,w*.034,buttonDepth,8),'accent',[0,w*.115,plateZ+plateDepth/2+buttonDepth/2]);button.rotation.x=Math.PI/2;
 root.updateMatrixWorld(true);const bounds=new Box3().setFromObject(root,true);
 const handleGap={width:w*(p.handleProfile==='arched'?.32:.62),bottom:handleBase,height:p.handleClearance};
 const anchors={ground:[0,0,0],carry:[0,handleBase+p.handleClearance+band,0]};root.userData.anchors=anchors;
 return {root,config,materials,bounds,dimensions:bounds.getSize(new Vector3()),handleGap,anchors};
}
export type LanternBuild=ReturnType<typeof generateLantern>;
export function disposeLantern(build:LanternBuild){build.root.traverse(o=>{if(o instanceof Mesh)o.geometry.dispose();});for(const m of Object.values(build.materials))m.dispose();}
