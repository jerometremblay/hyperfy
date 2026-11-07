import {loadConstructionDesign} from '../../../src/engine/construction-migration.ts';
import {load as loadPrior} from '../../../src/recipes/legacy-v1/wheelbarrow.ts';
import { jointGroup } from '../../../src/catalog/semantics.ts';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3, BufferGeometry, CylinderGeometry, LatheGeometry, Vector2, Quaternion } from 'three';
import { profileSolid, profiledBeam, facetedLoft } from '../../../src/engine/geometry.ts';
import { parseControls, parameterState, plainRecord } from '../../../src/engine/parameters.ts';
import type { Control, Design, Descriptor, Parameters } from '../../../src/engine/parameters.ts';
import type { AssetBuild } from '../../../src/catalog/types.ts';
import type { Recipe, RecipeCase } from '../../../src/recipes/types.ts';

const palette = { oak: { wood:'#b58a55',frame:'#725033',iron:'#41464a' }, painted: { wood:'#849782',frame:'#554532',iron:'#343c40' } };
const controls: Control[] = [
  ...([['trayWidth','Tray width',0.5,0.95,0.68],['trayLength','Tray length',0.65,1.3,0.92],['trayDepth','Tray depth',0.2,0.45,0.3],['wheelRadius','Wheel radius',0.16,0.34,0.23]] as const).map(([key,label,min,max,value]):Control=>({key,label,kind:'range',group:'shape',unit:'m',min,max,step:0.01,default:value,hint:label+' in meters. Frame and joints follow the selected dimensions.',affects:['geometry'],targets:['tray','floor','wheel','handle','leg']})),
  {key:'colorway',label:'Palette',kind:'choice',group:'colors',unit:'none',default:'oak',options:[{value:'oak',label:'Oak'},{value:'painted',label:'Sage'}],hint:'Wood and iron palette.',affects:['material'],targets:['wood','frame','iron']},
  {key:'boardCount',label:'Tray courses',kind:'integer',group:'construction',unit:'count',min:2,max:5,step:1,default:3,hint:'Changes wall courses while preserving the floor, rim and outside height.',affects:['topology'],targets:['tray-side','tray-end']},
  {key:'wheelStyle',label:'Wheel construction',kind:'choice',group:'construction',unit:'none',default:'solid',options:[{value:'solid',label:'Braced solid wheel'},{value:'spoked',label:'Open spoked wheel'}],hint:'Solid wooden disks or an open rim with twelve spokes and a hub.',affects:['topology'],targets:['wheel-tread','wheel-wood','wheel-rim','wheel-spoke','wheel-hub']},
  ...(['wood','frame','iron'] as const).map((role):Control=>({key:'color.'+role,label:role,kind:'color',group:'colors',unit:'color',default:palette.oak[role],role,hint:'Color of '+role+' parts.',affects:['material'],targets:[role]})),
];

function parse(input: unknown): Parameters {
  const value = plainRecord(input);
  const checked = parseControls(controls, value);
  const colors = palette[checked.colorway as keyof typeof palette];
  for (const role of ['wood','frame','iron'] as const) if (!Object.hasOwn(value, 'color.' + role)) checked['color.' + role] = colors[role];
  return checked;
}

function save(input: unknown): Design {
  const requested = { ...plainRecord(input) };
  return { formatVersion:1, family:'wheelbarrow', familyVersion:'1.1.0', requested, applied:parse(requested) };
}

function load(input:unknown):Design {
  return loadConstructionDesign(input,'wheelbarrow','1.1.0',['1.0.0'],save,loadPrior);
}

function build(input: unknown): AssetBuild {
  const config=save(input),p=config.applied;
  const w=Number(p.trayWidth),l=Number(p.trayLength),h=Number(p.trayDepth),r=Number(p.wheelRadius);
  const floor=2*r+0.13, wheelZ=l/2+0.16, rear=-l/2-0.68, forkX=w/2-0.075;
  const root=new Group();root.name='wheelbarrow';
  const materials=Object.fromEntries(['wood','frame','iron'].map(role=>[role,new MeshStandardMaterial({name:role,color:String(p['color.'+role]),roughness:role==='iron'?0.72:0.94,metalness:role==='iron'?0.45:0,flatShading:true})]));
  const anchors={ground:[0,0,0],tray:[0,floor+0.05,0],axle:[0,r,wheelZ]};
  root.userData={configuration:config,units:'meters',up:'+Y',forward:'+Z',origin:'ground-center',anchors};
  function mesh(name:string,role:string,geometry:BufferGeometry) {
    const m=new Mesh(geometry,materials[role]);m.name=name;m.userData={materialRole:role};m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
  }
  function box(name:string,role:string,size:[number,number,number],position:[number,number,number]) {
    const [a,b,c]=size;
    const m=mesh(name,role,profileSolid([{y:-b/2,width:a,depth:c,chamfer:Math.min(0.004,a/5,c/5)},{y:b/2,width:a,depth:c,chamfer:Math.min(0.004,a/5,c/5)}]));
    m.position.set(...position);return m;
  }
  function beam(name:string,role:string,a:[number,number,number],b:[number,number,number],width:number,depth:number) {
    return mesh(name,role,profiledBeam(a,b,width,depth,0.004));
  }
  const baseWidth=w*0.68,baseLength=l*0.68,baseZ=-l*0.04,wallThickness=0.033,rimThickness=0.055,rimHeight=0.05,wallHeight=h-rimHeight;
  function section(t:number){return {width:baseWidth+(w-baseWidth)*t,length:baseLength+(l-baseLength)*t,z:baseZ*(1-t)};}
  function outline(width:number,depth:number):Array<[number,number]>{
    const x=width/2,z=depth/2,c=Math.min(0.002,width/6,depth/6);
    return [[-x+c,-z],[x-c,-z],[x,-z+c],[x,z-c],[x-c,z],[-x+c,z],[-x,z-c],[-x,-z+c]];
  }
  function wall(name:string,side:number,end:boolean,lower:number,upper:number){
    const stations=[lower,upper].map(t=>{
      const shape=section(t);
      return {center:[end?0:side*(shape.width/2-wallThickness/2),floor+0.05+wallHeight*t,end?shape.z+side*(shape.length/2-wallThickness/2):shape.z] as [number,number,number],outline:outline(end?shape.width-2*wallThickness:wallThickness,end?wallThickness:shape.length)};
    });
    return mesh(name,'wood',facetedLoft(stations));
  }
  for(let i=0;i<5;i++)box('floor-'+i,'wood',[baseWidth/5-0.0015,0.05,baseLength],[-baseWidth/2+(i+0.5)*baseWidth/5,floor+0.025,baseZ]);
  for(const side of [-1,1]) {
    for(let i=0;i<Number(p.boardCount);i++) {
      const lower=i/Number(p.boardCount)+(i?0.00075/wallHeight:0),upper=(i+1)/Number(p.boardCount)-(i<Number(p.boardCount)-1?0.00075/wallHeight:0);
      wall('tray-side-'+side+'-'+i,side,false,lower,upper);
      wall('tray-end-'+side+'-'+i,side,true,lower,upper);
    }
    box('rim-side-'+side,'frame',[rimThickness,rimHeight,l],[side*(w/2-rimThickness/2),floor+0.05+h-rimHeight/2,0]);
    box('rim-end-'+side,'frame',[w-2*rimThickness,rimHeight,rimThickness],[0,floor+0.05+h-rimHeight/2,side*(l/2-rimThickness/2)]);
    const start=new Vector3(side*forkX,r,wheelZ+0.045),end=new Vector3(side*forkX,floor-0.015,rear),axis=end.clone().sub(start),length=axis.length();
    const rail=profileSolid([{y:0,width:0.055,depth:0.07,chamfer:0.004},{y:length*0.56,width:0.078,depth:0.09,chamfer:0.005},{y:length,width:0.052,depth:0.067,chamfer:0.004}]);
    rail.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),axis.normalize()));rail.translate(...start.toArray());mesh('handle-'+side,'frame',rail);
    const handleY=(z:number)=>r+(floor-0.015-r)*(wheelZ+0.045-z)/(wheelZ+0.045-rear);
    beam('grip-'+side,'wood',[side*forkX,handleY(rear-0.008),rear-0.008],[side*forkX,handleY(rear+0.25),rear+0.25],0.08,0.085);
    for(const end of [-1,1]) {
      const z=end*l*0.26,bottom=handleY(z)+0.02,top=floor-0.045;
      box('tray-riser-'+side+'-'+end,'frame',[0.052,top-bottom,0.07],[side*forkX,(top+bottom)/2,z]);
    }
    box('leg-'+side,'frame',[0.058,floor-0.045,0.078],[side*forkX,(floor-0.045)/2,-l*0.26]);
    beam('leg-brace-'+side,'iron',[side*forkX,0.11,-l*0.26],[side*forkX,handleY(l*0.26),l*0.26],0.022,0.028);
    for(const [index,z] of [-l*0.31,l*0.31].entries())beam('strap-'+side+'-'+z.toFixed(3),'iron',[side*(baseWidth/2+0.004),floor+0.045,baseZ+(index?1:-1)*baseLength*0.31],[side*(w/2+0.004),floor+0.05+wallHeight,z],0.012,0.028).userData.partId='strap-'+side+'-'+index;
    box('under-tray-bearer-'+side,'frame',[2*forkX+0.07,0.075,0.085],[0,floor-0.0375,side*l*0.26]);
  }
  box('leg-crossbar','frame',[2*forkX,0.05,0.052],[0,0.15,-l*0.26]);
  function ring(outer:number,inner:number,width:number) {
    const edge=Math.min(width*0.14,0.012),shoulder=Math.min((outer-inner)*0.18,outer*0.035);
    const g=new LatheGeometry([[inner,-width/2],[outer-shoulder,-width/2],[outer,-width/2+edge],[outer,width/2-edge],[outer-shoulder,width/2],[inner,width/2],[inner,-width/2]].map(([x,y])=>new Vector2(x!,y!)),12);
    g.rotateZ(Math.PI/2);return g;
  }
  mesh('wheel-tread','iron',ring(r,r*0.82,0.14)).position.set(0,r,wheelZ);
  const hubRadius=Math.max(0.047,r*0.2);
  if(p.wheelStyle==='solid')for(const side of [-1,1]) {
    const disk=new CylinderGeometry(r*0.86,r*0.86,0.018,12);disk.rotateZ(Math.PI/2);
    mesh('wheel-wood-'+side,'wood',disk).position.set(side*0.048,r,wheelZ);
    for(let i=0;i<3;i++) {
      const brace=box('wheel-brace-'+side+'-'+i,'frame',[0.016,r*1.53,0.029],[side*0.064,r,wheelZ]);
      brace.rotation.x=i*Math.PI/3;
    }
  }
  else {
    mesh('wheel-rim','wood',ring(r*0.86,r*0.70,0.105)).position.set(0,r,wheelZ);
    for(let i=0;i<12;i++) {
      const angle=i*Math.PI/6;
      beam('wheel-spoke-'+i,'wood',[0,r+Math.cos(angle)*hubRadius*0.82,wheelZ+Math.sin(angle)*hubRadius*0.82],[0,r+Math.cos(angle)*r*0.75,wheelZ+Math.sin(angle)*r*0.75],Math.min(0.032,r*0.14),0.04);
    }
  }
  const hub=new CylinderGeometry(hubRadius,hubRadius,0.19,10);hub.rotateZ(Math.PI/2);mesh('wheel-hub','frame',hub).position.set(0,r,wheelZ);
  const axle=new CylinderGeometry(0.033,0.033,w-0.02,8);axle.rotateZ(Math.PI/2);
  mesh('axle','iron',axle).position.set(0,r,wheelZ);
  const pivot:[number,number,number]=[0,r,wheelZ];
  jointGroup(root,'wheel-axle',pivot,root.children.filter(item=>item.name.startsWith('wheel-')));
  const joints=[{id:'wheel-axle',node:'wheel-axle',kind:'revolute' as const,pivot,axis:[1,0,0] as [number,number,number],angleUnit:'degrees' as const,limits:[-180,180] as [number,number],angle:0}];
  root.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(root,true);
  return {root,config,materials,anchors,joints,bounds,dimensions:bounds.getSize(new Vector3())};
}

const presets: Descriptor['presets'] = [
  {id:'farm',name:'Farm barrow',description:'Warm oak boards and dark iron tread.',parameters:{}},
  {id:'garden',name:'Garden barrow',description:'Compact two-course sage tray and open spoked wheel.',parameters:{trayWidth:0.5,trayLength:0.65,trayDepth:0.2,wheelRadius:0.16,colorway:'painted',boardCount:2,wheelStyle:'spoked'}},
  {id:'heavy',name:'Heavy barrow',description:'Five-course tray and larger braced wheel.',parameters:{trayWidth:0.95,trayLength:1.3,trayDepth:0.45,wheelRadius:0.34,boardCount:5}},
];
const boundaries: RecipeCase[]=controls.flatMap(c=>c.kind==='range'||c.kind==='integer'?[{id:c.key.toLowerCase()+'-min',name:c.label+' minimum',parameters:{[c.key]:c.min}},{id:c.key.toLowerCase()+'-max',name:c.label+' maximum',parameters:{[c.key]:c.max}}]:[]);
export const wheelbarrowRecipe: Recipe = {
  descriptor:{id:'wheelbarrow',version:'1.1.0',title:'Wooden wheelbarrow',description:'Hollow planked tray, a single wooden wheel with iron tread and two carrying handles.',controls,defaults:parse({}),presets,palettes:Object.entries(palette).map(([id,colors])=>({id,label:id,colors:Object.values(colors)})),save,state:input=>parameterState(controls,input)},
  build,load,
  validationCases:[...presets,...boundaries,{id:'narrow-big-wheel',name:'Narrow tray large wheel',parameters:{trayWidth:0.5,trayLength:0.65,wheelRadius:0.34}},{id:'long-small-wheel',name:'Long tray small wheel',parameters:{trayLength:1.3,trayDepth:0.45,wheelRadius:0.16}}],
  integrationCases:[{id:'default',name:'Farm',parameters:{}},{id:'garden',name:'Garden',parameters:presets[1]!.parameters}],
  constraints:['Static game prop in meters. Tray dimensions are outer width, length and wall height above the floor. Floor elevation follows wheel radius. Tray courses preserve outer dimensions; spoked construction opens the wheel between rim and hub. No rig, colliders or texture UV authoring.'],
  presentation:{category:'Props',order:90,kitIds:[],thumbnails:Object.fromEntries(presets.map(p=>[p.id,'wheelbarrow-'+p.id+'.png']))},
  source:{entry:'examples/recipes/wheelbarrow/index.ts',exportName:'wheelbarrowRecipe'},
};
