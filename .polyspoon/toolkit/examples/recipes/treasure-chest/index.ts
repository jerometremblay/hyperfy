import {loadConstructionDesign} from '../../../src/engine/construction-migration.ts';
import {load as loadPrior} from '../../../src/recipes/legacy-v1/treasure-chest.ts';
import { jointGroup } from '../../../src/catalog/semantics.ts';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3, Shape, ExtrudeGeometry, BufferGeometry, Float32BufferAttribute, CylinderGeometry, LatheGeometry, Vector2 } from 'three';
import { profileSolid, facetedLoft } from '../../../src/engine/geometry.ts';
import { parseControls, parameterState, plainRecord } from '../../../src/engine/parameters.ts';
import type { Control, Design, Descriptor, Parameters } from '../../../src/engine/parameters.ts';
import type { AssetBuild } from '../../../src/catalog/types.ts';
import type { Recipe, RecipeCase } from '../../../src/recipes/types.ts';

const palette = { oak: { wood:'#a86b37', frame:'#343a3e', brass:'#c79535' } };
const ranges = [
  ['width','Width',0.7,1.8,1.2],['depth','Depth',0.45,1,0.7],
  ['bodyHeight','Body height',0.35,0.8,0.58],['lidRise','Lid rise',0.15,0.4,0.28],
  ['bandInset','Band inset',0.15,0.3,0.2],
] as const;
const dimensionControls:Control[]=ranges.map(([key,label,min,max,value]):Control=>({key,label,kind:'range',group:'shape',unit:key==='bandInset'?'none':'m',min,max,step:0.01,default:value,hint:key==='bandInset'?'Fraction of width from each end.':'Outside dimension in meters.',affects:['geometry'],targets:({width:['base','foot','body','end-plank','lid','band','hinge'],depth:['base','foot','body','end-plank','lid','band','hinge','latch','keyhole'],bodyHeight:['body','end-plank','lid','band','hinge','latch','keyhole'],lidRise:['lid','band-lid'],bandInset:['band','hinge','lid-hinge-collar']} satisfies Record<typeof key,string[]>)[key]}));
const controls: Control[] = [
  ...dimensionControls.slice(0,4),
  {key:'lidAngle',inputUnit:'degrees',label:'Lid opening',kind:'range',group:'construction',unit:'none',min:0,max:110,step:5,default:0,hint:'Static opening in degrees around the rear hinge. Bands and latch follow the lid.',affects:['geometry'],targets:['lid','band-lid','latch','keyhole']},
  {key:'boardCount',label:'Body courses',kind:'integer',group:'construction',unit:'count',min:2,max:6,step:1,default:4,hint:'Body courses preserve the outside height and hollow interior.',affects:['topology'],targets:['body-plank','end-plank']},
  ...dimensionControls.slice(4),
  {key:'latch',label:'Latch',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Adds a front brass latch.',affects:['topology'],targets:['latch','keyhole']},
  ...Object.entries(palette.oak).map(([role,color]):Control=>({key:'color.'+role,label:role,kind:'color',group:'colors',unit:'color',default:color,role,hint:'Material color.',affects:['material'],targets:[role]})),
];

function parse(input: unknown): Parameters {
  const value = plainRecord(input);
  const checked = parseControls(controls, value);
  const colors = palette.oak;
  for (const role of ['wood','frame','brass'] as const) if (!Object.hasOwn(value, 'color.' + role)) checked['color.' + role] = colors[role];
  return checked;
}

function save(input: unknown): Design {
  const requested = { ...plainRecord(input) };
  return { formatVersion:1, family:'treasure-chest', familyVersion:'1.1.0', requested, applied:parse(requested) };
}

function load(input:unknown):Design {
  return loadConstructionDesign(input,'treasure-chest','1.1.0',['1.0.0'],save,loadPrior);
}

function build(input: unknown): AssetBuild {
  const config=save(input),p=config.applied;
  const w=Number(p.width),d=Number(p.depth),h=Number(p.bodyHeight),r=Number(p.lidRise);
  const root=new Group();root.name='treasure-chest';
  const materials=Object.fromEntries(['wood','frame','brass'].map(role=>[role,new MeshStandardMaterial({name:role,color:String(p['color.'+role]),roughness:role==='wood'?0.9:0.55,metalness:role==='wood'?0:0.65,flatShading:true})]));
  const anchors={ground:[0,0,0],lid:[0,h,0]};
  root.userData={configuration:config,units:'meters',up:'+Y',forward:'+Z',origin:'ground-center',anchors};
  function mesh(name:string,role:string,geometry:BufferGeometry,position:[number,number,number]=[0,0,0]) {
    const item=new Mesh(geometry,materials[role]);item.name=name;item.userData={materialRole:role};item.position.set(...position);item.castShadow=true;item.receiveShadow=true;root.add(item);return item;
  }
  function box(name:string,role:string,size:[number,number,number],position:[number,number,number]) {
    const [width,height,depth]=size;
    const edge=Math.min(0.004,width*0.07,depth*0.12,height*0.15),chamfer=Math.min(0.002,(width-2*edge)/6,(depth-2*edge)/6);
    return mesh(name,role,profileSolid([{y:-height/2,width:width-2*edge,depth:depth-2*edge,chamfer},{y:-height/2+edge,width,depth,chamfer},{y:height/2-edge,width,depth,chamfer},{y:height/2,width:width-2*edge,depth:depth-2*edge,chamfer}]),position);
  }
  const floor=0.05;
  box('base','wood',[w,0.05,d],[0,floor+0.025,0]);
  for(const x of [-1,1])for(const z of [-1,1])box('foot-'+x+'-'+z,'frame',[0.08,floor,0.08],[x*(w/2-0.07),floor/2,z*(d/2-0.07)]);
  for(let i=0;i<Number(p.boardCount);i++) {
    const board=(h-floor)/Number(p.boardCount);
    for(const z of [-1,1])box('body-plank-'+z+'-'+i,'wood',[w,board-0.003,0.035],[0,floor+board*(i+0.5),z*(d/2-0.0175)]);
    for(const x of [-1,1])box('end-plank-'+x+'-'+i,'wood',[0.035,board-0.003,d-0.07],[x*(w/2-0.0175),floor+board*(i+0.5),0]);
  }
  for(const side of [-1,1]){
    box('body-rim-front-'+side,'wood',[w,0.04,0.045],[0,h-0.016,side*(d/2-0.0225)]);
    box('body-rim-side-'+side,'wood',[0.045,0.04,d-0.09],[side*(w/2-0.0225),h-0.016,0]);
  }
  const curve=Array.from({length:7},(_,i)=>({z:-d/2+d*i/6,y:h+0.012+r*Math.sin(Math.PI*i/6)}));
  function extrude(shape:Shape,width:number,left:number){
    const geometry=new ExtrudeGeometry(shape,{depth:width,steps:1,bevelEnabled:false,curveSegments:1});geometry.rotateY(Math.PI/2);geometry.translate(left,0,0);geometry.clearGroups();return geometry;
  }
  const cheek=0.032,positions:number[]=[];
  for(let i=0;i<6;i++){
    const a=curve[i]!,b=curve[i+1]!,gap=0.0015,from=a.z+(i?gap:0),to=b.z-(i<5?gap:0),top=(z:number)=>a.y+(b.y-a.y)*(z-a.z)/(b.z-a.z),thickness=(z:number)=>0.008+0.027*Math.sin(Math.PI*(z+d/2)/d),ease=Math.min(0.003,(to-from)*0.08),shape=new Shape();
    shape.moveTo(from,top(from)-0.002);shape.lineTo(from+ease,top(from+ease));shape.lineTo(to-ease,top(to-ease));shape.lineTo(to,top(to)-0.002);shape.lineTo(to,top(to)-thickness(to));shape.lineTo(from,top(from)-thickness(from));shape.closePath();
    const geometry=extrude(shape,w-2*cheek,-w/2+cheek);positions.push(...geometry.getAttribute('position').array);geometry.dispose();
  }
  const lid=new BufferGeometry();lid.setAttribute('position',new Float32BufferAttribute(positions,3));lid.computeVertexNormals();mesh('lid','wood',lid);
  for(const side of [-1,1]){
    const shape=new Shape();shape.moveTo(-d/2,h+0.004);for(const point of curve)shape.lineTo(point.z,point.y);shape.lineTo(d/2,h+0.004);shape.closePath();
    mesh('lid-cheek-'+side,'wood',extrude(shape,cheek,side<0?-w/2:w/2-cheek));
    box(side>0?'lid-front-rail':'lid-rear-rail','wood',[w-2*cheek,0.026,0.034],[0,h+0.017,side*(d/2-0.017)]);
  }
  const normals=curve.slice(0,-1).map((point,i)=>new Vector2(-(curve[i+1]!.y-point.y),curve[i+1]!.z-point.z).normalize());
  const offsets=curve.map((_,i)=>{
    if(!i)return normals[0]!.clone();if(i===6)return normals[5]!.clone();const average=normals[i-1]!.clone().add(normals[i]!).normalize();return average.multiplyScalar(1/average.dot(normals[i]!));
  });
  for(const sign of [-1,1]) {
    const x=sign*(w/2-w*Number(p.bandInset));
    for(const z of [-1,1])box('band-body-'+sign+'-'+z,'frame',[0.055,h-floor,0.012],[x,(h+floor)/2,z*(d/2+0.004)]);
    for(let i=0;i<6;i++) {
      const a=curve[i]!,b=curve[i+1]!,na=offsets[i]!,nb=offsets[i+1]!,shape=new Shape();
      shape.moveTo(a.z-na.x*0.002,a.y-na.y*0.002);shape.lineTo(b.z-nb.x*0.002,b.y-nb.y*0.002);shape.lineTo(b.z+nb.x*0.014,b.y+nb.y*0.014);shape.lineTo(a.z+na.x*0.014,a.y+na.y*0.014);shape.closePath();
      mesh('band-lid-'+sign+'-'+i,'frame',extrude(shape,0.055,x-0.0275));
    }
    box('hinge-'+sign,'frame',[0.085,0.085,0.016],[x,h-0.0475,-d/2-0.006]);
    const barrel=new CylinderGeometry(0.022,0.022,0.09,12);barrel.rotateZ(Math.PI/2);mesh('hinge-barrel-'+sign,'frame',barrel,[x,h,-d/2]);
    const collar=new LatheGeometry([[0.0225,-0.022],[0.032,-0.022],[0.032,0.022],[0.0225,0.022],[0.0225,-0.022]].map(([radius,along])=>new Vector2(radius!,along!)),12);collar.rotateZ(Math.PI/2);mesh('lid-hinge-collar-'+sign,'frame',collar,[x,h,-d/2]);
  }
  if(p.latch) {
    const outline=(width:number,depth:number):Array<[number,number]>=>{const x=width/2,z=depth/2,c=0.002;return [[-x+c,-z],[x-c,-z],[x,-z+c],[x,z-c],[x-c,z],[-x+c,z],[-x,z-c],[-x,-z+c]];};
    const hasp=facetedLoft([{center:[0,h-0.1,d/2+0.012],outline:outline(0.055,0.014)},{center:[0,h-0.04,d/2+0.012],outline:outline(0.085,0.014)},{center:[0,h+0.018,d/2+0.006],outline:outline(0.08,0.016)}]);mesh('latch','brass',hasp);
    box('keyhole','frame',[0.014,0.028,0.006],[0,h-0.068,d/2+0.02]);
    box('latch-receiver','frame',[0.1,0.06,0.008],[0,h-0.075,d/2+0.002]);
  }
  const pivotPoint:[number,number,number]=[0,h,-d/2];
  const pivot=jointGroup(root,'lid-pivot',pivotPoint,root.children.filter(item=>item.name==='lid'||item.name.startsWith('lid-')||item.name.startsWith('band-lid-')||item.name==='latch'||item.name==='keyhole'));
  pivot.rotation.x=-Number(p.lidAngle)*Math.PI/180;
  const joints=[{id:'lid-pivot',node:'lid-pivot',kind:'revolute' as const,pivot:pivotPoint,axis:[-1,0,0] as [number,number,number],angleUnit:'degrees' as const,limits:[0,110] as [number,number],angle:Number(p.lidAngle),parameter:'lidAngle'}];
  root.updateMatrixWorld(true);const bounds=new Box3().setFromObject(root,true);
  return {root,config,materials,anchors,joints,bounds,dimensions:bounds.getSize(new Vector3())};
}

const presets: Descriptor['presets'] = [
  {id:'oak',name:'Oak treasure chest',description:'Iron-bound oak chest with brass latch.',parameters:{}},
  {id:'small',name:'Open coffer',description:'Compact three-course coffer with its lid raised.',parameters:{width:0.7,depth:0.45,bodyHeight:0.35,lidRise:0.15,boardCount:3,lidAngle:85}},
  {id:'large',name:'Storage chest',description:'Broad six-course storage chest without a latch.',parameters:{width:1.8,depth:1,bodyHeight:0.8,lidRise:0.4,boardCount:6,latch:false}},
];
const boundaries: RecipeCase[] = controls.flatMap(c => c.kind === 'range' || c.kind === 'integer' ? [
  {id:c.key.toLowerCase()+'-min',name:c.label+' minimum',parameters:{[c.key]:c.min}},
  {id:c.key.toLowerCase()+'-max',name:c.label+' maximum',parameters:{[c.key]:c.max}},
] : []);
export const treasureChestRecipe: Recipe = {
  descriptor: {
    id:'treasure-chest',version:'1.1.0',title:'Wooden treasure chest',description:'A hollow oak chest with an opening faceted lid, iron bands and brass latch.',
    controls,defaults:parse({}),presets,
    palettes:Object.entries(palette).map(([id,colors]) => ({id,label:id === 'oak' ? 'Oak' : 'Painted',colors:Object.values(colors),parameters:Object.fromEntries(Object.entries(colors).map(([role,color])=>['color.'+role,color]))})),
    save,
    state(input) {return parameterState(controls,input);},
  },
  build,load,
  validationCases:[...presets,...boundaries,{id:'unlatched',name:'No latch',parameters:{latch:false}},{id:'small-open',name:'Small fully open coffer',parameters:{width:0.7,depth:0.45,bodyHeight:0.35,lidRise:0.4,boardCount:6,lidAngle:110}}],
  integrationCases:[{id:'default',name:'Default chest',parameters:{}},{id:'open',name:'Open coffer',parameters:presets[1]!.parameters}],
  constraints:['Static geometry in meters; lid opening is degrees, not animation. Body is hollow with a floor; lid is a closed solid with an underside. Bands and latch rotate around the rear hinge. Band inset is a fraction of width.'],
  presentation:{category:'Props',order:80,kitIds:[],thumbnails:Object.fromEntries(presets.map(p=>[p.id,'treasure-chest-'+p.id+'.png']))},
  source:{entry:'examples/recipes/treasure-chest/index.ts',exportName:'treasureChestRecipe'},
};
