import {loadConstructionDesign} from '../../../src/engine/construction-migration.ts';
import {load as loadPrior} from '../../../src/recipes/legacy-v1/stone-well.ts';
import { jointGroup } from '../../../src/catalog/semantics.ts';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3, Shape, ExtrudeGeometry, LatheGeometry, Vector2, TorusGeometry, type BufferGeometry } from 'three';
import { profileSolid, profiledBeam, taperedSweep, facetedLoft } from '../../../src/engine/geometry.ts';
import { parseControls, parameterState, plainRecord, ParameterError } from '../../../src/engine/parameters.ts';
import type { Control, Design, Descriptor } from '../../../src/engine/parameters.ts';
import type { AssetBuild } from '../../../src/catalog/types.ts';
import type { Recipe, RecipeCase } from '../../../src/recipes/types.ts';

const colors = {stone:'#898880',coping:'#b2ac96',timber:'#62432e',roof:'#a77342',iron:'#343b3b',rope:'#bca879'};
const controls:Control[] = [
  {key:'diameter',label:'Outside diameter',kind:'range',group:'shape',unit:'m',min:1.8,max:3.2,step:0.05,default:2.2,hint:'Outside masonry diameter. Shaft stays open with 25 cm walls.',affects:['geometry'],targets:['stone','coping','post','windlass','roof-board']},
  {key:'wallHeight',label:'Wall height',kind:'range',group:'shape',unit:'m',min:0.65,max:1.4,step:0.05,default:0.95,hint:'Ground to coping top. Timber and mechanism follow the wall.',affects:['geometry','topology'],targets:['stone','coping','post','windlass','bucket-shell']},
  {key:'roofSize',label:'Roof size',kind:'range',group:'shape',unit:'ratio',ratioBasis:'width',min:1.15,max:1.6,step:0.05,default:1.35,hint:'Roof width as a multiple of well diameter. Depth is 85 percent of width.',affects:['geometry','topology'],targets:['roof-board','rafter','ridge']},
  {key:'roof',label:'Timber roof',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Roof boards, rafters and braces; posts remain with an open top.',affects:['topology'],targets:['roof-board','rafter','ridge','fascia','tie','brace','post']},
  {key:'bucket',label:'Suspended bucket',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Bucket, handle and hanging rope. Requires the windlass.',affects:['topology'],targets:['bucket','hanging-rope']},
  {key:'windlass',label:'Windlass mechanism',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Axle, bearings, crank and rope spool. Remove the bucket before disabling.',affects:['topology'],targets:['windlass','axle-bearing','spool-flange','crank','rope-coil']},
  {key:'bucketDrop',label:'Bucket drop',kind:'range',group:'construction',unit:'m',min:0,max:0.6,step:0.05,default:0,hint:'Lowers the bucket from its default height and lengthens the hanging rope.',affects:['geometry'],targets:['bucket','hanging-rope']},
  ...Object.entries(colors).map(([role,color]):Control=>({key:'color.'+role,label:role,kind:'color',group:'colors',unit:'color',default:color,role,hint:'Color of '+role+' parts.',affects:['material'],targets:[role]})),
];
function relationships(p:Record<string,unknown>) {
  return p.bucket&&!p.windlass?[{code:'relationship',keys:['bucket','windlass'],message:'Suspended bucket requires the windlass. Remove bucket or enable windlass.'}]:[];
}
function parse(input:unknown) {
  const p=parseControls(controls,input),issues=relationships(p);
  if(issues.length)throw new ParameterError(issues);
  return p;
}
function save(input:unknown):Design {const requested={...plainRecord(input)};return {formatVersion:1,family:'stone-well',familyVersion:'1.1.0',requested,applied:parse(requested)};}
function load(input:unknown):Design {
  return loadConstructionDesign(input,'stone-well','1.1.0',['1.0.0'],save,loadPrior);
}

function wedge(inner:number,outer:number,start:number,end:number,height:number,bevel:number) {
  const s=new Shape();
  s.moveTo(outer*Math.cos(start),outer*Math.sin(start));
  for(let i=1;i<=2;i++){const a=start+(end-start)*i/2;s.lineTo(outer*Math.cos(a),outer*Math.sin(a));}
  for(let i=2;i>=0;i--){const a=start+(end-start)*i/2;s.lineTo(inner*Math.cos(a),inner*Math.sin(a));}
  s.closePath();
  const g=new ExtrudeGeometry(s,{depth:height-2*bevel,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:bevel,bevelThickness:bevel,curveSegments:1});
  g.clearGroups();g.rotateX(-Math.PI/2);g.translate(0,bevel,0);return g;
}
function build(input:unknown):AssetBuild {
  const config=save(input),p=config.applied,d=Number(p.diameter),h=Number(p.wallHeight),size=Number(p.roofSize),r=d/2;
  const root=new Group();root.name='stone-well';
  const materials=Object.fromEntries(Object.keys(colors).map(role=>[role,new MeshStandardMaterial({name:role,color:String(p['color.'+role]),roughness:role==='iron'?0.65:0.92,metalness:role==='iron'?0.45:0,flatShading:true})]));
  const anchors={ground:[0,0,0],shaft:[0,h,0],bucket:[0,h+0.15-Number(p.bucketDrop),0.125]};
  root.userData={configuration:config,units:'meters',up:'+Y',forward:'+Z',origin:'ground-center',anchors};
  function add(name:string,role:string,g:BufferGeometry,pos:[number,number,number]=[0,0,0]) {g.normalizeNormals();const m=new Mesh(g,materials[role]);m.name=name;m.userData={materialRole:role};m.position.set(...pos);m.castShadow=true;m.receiveShadow=true;root.add(m);return m;}
  function beam(name:string,a:[number,number,number],b:[number,number,number],w:number,depth=w,role='timber') {return add(name,role,profiledBeam(a,b,w,depth,Math.min(w,depth)*0.08));}
  function rod(name:string,a:[number,number,number],b:[number,number,number],radius:number,role:string,sides=10) {return add(name,role,taperedSweep([{center:a,radius},{center:b,radius}],sides));}
  const courses=Math.max(3,Math.round(h/0.24)),cap=0.17,segments=12;
  const mortarProfile=[[r-0.235,0],[r-0.085,0],[r-0.085,h-cap],[r-0.235,h-cap],[r-0.235,0]].map(([x,y])=>new Vector2(x!,y!));
  add('stone-mortar','stone',new LatheGeometry(mortarProfile,24));
  const rowWeights=Array.from({length:courses},(_,i)=>[1.24,0.78,1.08,0.9][i%4]!),rowTotal=rowWeights.reduce((sum,value)=>sum+value,0),boundaryAmplitude=Math.min(0.024,(h-cap)/courses*0.12);
  function stoneBlock(innerFace:number,outer:number,start:number,end:number,bottom:number,top:number){
    const angle=(start+end)/2,halfAngle=(end-start)/2,innerX=innerFace*Math.tan(halfAngle),outerX=outer*Math.sin(halfAngle),outerZ=outer*Math.cos(halfAngle),faceX=outerX*0.5,faceZ=Math.sqrt(outer*outer-faceX*faceX),center=(innerFace+outerZ)/2;
    const outline:Array<[number,number]>=[[-innerX,innerFace-center],[innerX,innerFace-center],[outerX,outerZ-center],[faceX,faceZ-center],[-faceX,faceZ-center],[-outerX,outerZ-center]];
    const bevel=Math.min(0.035,(top-bottom)*0.2);
    const stations=[{y:bottom,x:0.9,z:0.78},{y:bottom+bevel,x:1,z:1},{y:top-bevel,x:1,z:1},{y:top,x:0.92,z:0.78}].map(s=>({center:[0,s.y,center] as [number,number,number],outline:outline.map(([x,z])=>[x*s.x,z*s.z] as [number,number])}));
    const geometry=facetedLoft(stations);geometry.rotateY(Math.PI/2-angle);return geometry;
  }
  let elevation=0;
  for(let row=0;row<courses;row++){
    const height=(h-cap)*rowWeights[row]!/rowTotal,count=Math.max(9,Math.round(2*Math.PI*(r-0.1)/0.52)+[0,-1,1,0][row%4]!),weights=Array.from({length:count},(_,i)=>[1.28,0.78,1.12,0.82][(i+row*2)%4]!),total=weights.reduce((sum,value)=>sum+value,0);
    let angle=(row%2?0.47:0)*2*Math.PI/count;
    for(let i=0;i<count;i++){
      const span=2*Math.PI*weights[i]!/total,gap=0.005/r,middle=angle+span/2,outer=r-[0.022,0.047,0.014,0.035][(i+row)%4]!,bottom=row?elevation+boundaryAmplitude*Math.sin(3*middle+row*0.7):0,top=row===courses-1?h-cap:elevation+height+boundaryAmplitude*Math.sin(3*middle+(row+1)*0.7);
      add('stone-'+row+'-'+i,'stone',stoneBlock(r-0.25,outer,angle+gap,angle+span-gap,bottom,top));angle+=span;
    }
    elevation+=height;
  }
  for(let i=0;i<segments;i++){const angle=i*2*Math.PI/segments;add('coping-'+i,'coping',wedge(r-0.27+0.018,r-0.018,angle+0.004/r,angle+2*Math.PI/segments-0.004/r,cap,0.018),[0,h-cap,0]);}
  const px=r-0.13,eave=h+1.4,width=d*size,depth=width*0.85,half=depth/2,rise=half*0.58,ridge=eave+rise;
  for(const side of [-1,1]) {
    add('post-'+side,'timber',profileSolid([{y:h-0.08,width:0.22,depth:0.22,chamfer:0.009},{y:h+0.18,width:0.19,depth:0.19,chamfer:0.007},{y:p.roof?ridge-0.035:h+1.25,width:0.17,depth:0.17,chamfer:0.006}]),[side*px,0,0]);
    if(p.roof) {
    beam('tie-'+side,[side*px,eave,-half],[side*px,eave,half],0.12);
    for(const end of [-1,1]){
      beam('rafter-'+side+'-'+end,[side*px,eave,end*half],[side*px,ridge,0],0.12);
      beam('brace-'+side+'-'+end,[side*px,eave-0.48,0],[side*px,eave,end*0.48],0.09);
    }
    }
    if(p.windlass)rod('axle-bearing-'+side,[side*(px-0.11),h+0.95,0],[side*(px+0.11),h+0.95,0],0.155,'iron');
  }
  if(p.roof) {
  beam('ridge',[-width/2,ridge,0],[width/2,ridge,0],0.12);
  const slope=Math.hypot(half,rise),pitch=Math.atan2(rise,half),overlap=0.065,pieces=Math.max(5,Math.round(width/0.42));
  for(const side of [-1,1])for(let course=0;course<2;course++){
    const weights=Array.from({length:pieces},(_,i)=>[1.1,0.88,1.04,0.98][(i+course*2)%4]!),total=weights.reduce((sum,value)=>sum+value,0),length=slope/2+overlap,t=(course+0.5)/2;
    let edge=-width/2;
    for(let panel=0;panel<pieces;panel++){
      const next=edge+width*weights[panel]!/total,left=edge-(panel?0.002:0),right=next+(panel<pieces-1?0.002:0),panelWidth=right-left,x=panelWidth/2,z=length/2,c=0.014,ends=[-0.014,0.012,0.004,-0.006],frontLeft=z+ends[(panel+course)%4]!,frontRight=z+ends[(panel+course+1)%4]!;
      const outline:Array<[number,number]>=[[-x+c,-z],[x-c,-z],[x,-z+c],[x,frontRight-c],[x-c,frontRight],[-x+c,frontLeft],[-x,frontLeft-c],[-x,-z+c]];
      const stations=[{y:-0.023,scale:0.97},{y:-0.014,scale:1},{y:0.014,scale:1},{y:0.023,scale:0.97}].map(s=>({center:[0,s.y,0] as [number,number,number],outline:outline.map(([x,z])=>[x*s.scale,z*s.scale] as [number,number])}));
      const g=facetedLoft(stations),level=[0,0.003,0.001,-0.001][(panel+course)%4]!;
      const m=add('roof-board-'+side+'-'+(course*pieces+panel),'roof',g,[(left+right)/2,eave+rise*t+0.045+course*0.045+level,side*half*(1-t)]);m.rotation.x=side*pitch;edge=next;
    }
  }
  beam('roof-ridge-cover',[-width/2,ridge+0.12,0],[width/2,ridge+0.12,0],0.07,0.16,'roof');
  for(const side of [-1,1])beam('fascia-'+side,[-width/2,eave+0.015,side*half],[width/2,eave+0.015,side*half],0.09);
  }
  const axle=h+0.95;
  if(p.windlass) {
  rod('windlass',[-px-0.24,axle,0],[px+0.24,axle,0],0.105,'timber',12);
  for(const side of [-1,1])rod('spool-flange-'+side,[side*0.18-0.025,axle,0],[side*0.18+0.025,axle,0],0.15,'timber',12);
  for(let i=0;i<11;i++) {const g=new TorusGeometry(0.118,0.012,4,16);g.rotateY(Math.PI/2);add('rope-coil-'+i,'rope',g,[-0.14+i*0.028,axle,0]);}
  rod('crank-arm',[px+0.24,axle,0],[px+0.24,axle-0.27,0],0.035,'iron',8);
  rod('crank-grip',[px+0.22,axle-0.27,0],[px+0.43,axle-0.27,0],0.052,'timber',8);
  }
  if(p.bucket) {
  const bottom=h+0.15-Number(p.bucketDrop),top=bottom+0.32,zc=0.125;
  const profile=[[0.135,0],[0.185,0.32],[0.16,0.32],[0.113,0.025],[0.135,0]].map(([x,y])=>new Vector2(x!,y!));
  add('bucket-shell','roof',new LatheGeometry(profile,10),[0,bottom,zc]);
  rod('bucket-bottom',[0,bottom+0.003,zc],[0,bottom+0.026,zc],0.133,'roof',10);
  for(const level of [0.06,0.26]){const g=new TorusGeometry(0.135+level/0.32*0.05,0.012,4,10);g.rotateZ(Math.PI/2);g.rotateX(Math.PI/2);add('bucket-band-'+level,'iron',g,[0,bottom+level,zc]);}
  const handle=Array.from({length:9},(_,i)=>{const a=i*Math.PI/8;return {center:[0.18*Math.cos(a),top+0.18*Math.sin(a),zc] as [number,number,number],radius:0.012};});
  add('bucket-handle','iron',taperedSweep(handle,6));
  rod('hanging-rope',[0,top+0.18,zc],[0,axle,zc],0.012,'rope',6);
  }
  const joints=[];
  if(p.windlass){
   const pivot:[number,number,number]=[0,axle,0];
   jointGroup(root,'windlass-pivot',pivot,root.children.filter(item=>item.name==='windlass'||item.name.startsWith('spool-flange-')||item.name.startsWith('crank-')));
   joints.push({id:'windlass-pivot',node:'windlass-pivot',kind:'revolute' as const,pivot,axis:[1,0,0] as [number,number,number],angleUnit:'degrees' as const,limits:[-180,180] as [number,number],angle:0});
  }
  root.updateMatrixWorld(true);const bounds=new Box3().setFromObject(root,true);
  return {root,config,materials,anchors,joints,bounds,dimensions:bounds.getSize(new Vector3())};
}
const presets:Descriptor['presets']=[
  {id:'village',name:'Village well',description:'Warm timber above a modest stone shaft.',parameters:{}},
  {id:'courtyard',name:'Courtyard well',description:'Compact open-top well with a lowered suspended bucket.',parameters:{diameter:1.8,wallHeight:0.7,roofSize:1.2,roof:false,bucketDrop:0.35}},
  {id:'market',name:'Market well',description:'Broad sheltered shaft with its bucket removed.',parameters:{diameter:3,wallHeight:1.25,roofSize:1.5,bucket:false}},
];
const boundaries:RecipeCase[]=controls.flatMap(c=>c.kind==='range'?[{id:c.key.toLowerCase()+'-min',name:c.label+' minimum',parameters:{[c.key]:c.min}},{id:c.key.toLowerCase()+'-max',name:c.label+' maximum',parameters:{[c.key]:c.max}}]:[]);
export const stoneWellRecipe:Recipe={
  descriptor:{id:'stone-well',version:'1.1.0',title:'Stone well',description:'Open masonry shaft, timber shelter, windlass and suspended bucket.',controls,defaults:parse({}),presets,palettes:[{id:'warm',label:'Weathered stone and oak',colors:Object.values(colors),parameters:Object.fromEntries(Object.entries(colors).map(([role,color])=>['color.'+role,color]))}],save,state:input=>{
    const state=parameterState(controls,input,relationships);
    try {const p=parseControls(controls,input);state.controls.bucketDrop!.enabled=Boolean(p.bucket&&p.windlass);state.controls.roofSize!.enabled=Boolean(p.roof);} catch {}
    return state;
  }},
  build,load,validationCases:[...presets,...boundaries,{id:'bare-shaft',name:'Open shaft without mechanism',parameters:{roof:false,bucket:false,windlass:false}},{id:'low-bucket',name:'Lowest bucket at minimum wall height',parameters:{diameter:1.8,wallHeight:0.65,bucketDrop:0.6}}],integrationCases:presets,
  constraints:['Static prop in meters. Diameter 1.8–3.2 m; wall 0.65–1.4 m; roof multiplier 1.15–1.6. Open shaft without floor or underground lining. Roof removal retains posts. Bucket needs the windlass; bucket drop lengthens the rope. No collision or animation.'],
  presentation:{category:'Props',order:100,kitIds:[],thumbnails:Object.fromEntries(presets.map(p=>[p.id,'stone-well-'+p.id+'.png']))},source:{entry:'examples/recipes/stone-well/index.ts',exportName:'stoneWellRecipe'},
};
