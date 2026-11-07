import {loadConstructionDesign} from '../../../src/engine/construction-migration.ts';
import {load as loadPrior} from '../../../src/recipes/legacy-v1/conifer.ts';
import { Box3, BufferGeometry, Group, Mesh, MeshStandardMaterial, Matrix4, Vector3 } from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { facetedLoft, taperedSweep } from '../../../src/engine/geometry.ts';
import { parseControls, parameterState, plainRecord } from '../../../src/engine/parameters.ts';
import type { Control, Design, Descriptor } from '../../../src/engine/parameters.ts';
import type { AssetBuild } from '../../../src/catalog/types.ts';
import type { Recipe } from '../../../src/recipes/types.ts';

const controls: Control[] = [
  {key:'height',label:'Height',kind:'range',group:'shape',unit:'m',min:2,max:12,step:0.1,default:6,hint:'Ground to highest needle.',affects:['geometry'],targets:['trunk','branch','foliage']},
  {key:'crownSpread',label:'Crown spread',kind:'range',group:'shape',unit:'m',min:1,max:7,step:0.1,default:3.8,hint:'Larger horizontal bounding-box dimension.',affects:['geometry'],targets:['trunk','branch','foliage']},
  {key:'seed',label:'Variation seed',kind:'integer',group:'construction',unit:'seed',min:0,max:65535,step:1,default:317,hint:'Repeatable trunk bends, branch spacing and foliage variation.',affects:['geometry'],targets:['trunk','branch','foliage']},
  {key:'tierCount',label:'Crown tiers',kind:'integer',group:'construction',unit:'count',min:5,max:10,step:1,default:8,hint:'Redistributes five to ten connected branch tiers through the same crown envelope, with fewer branches and smaller lobes toward the leader.',affects:['topology','geometry'],targets:['branch','foliage']},
  ...Object.entries({bark:'#70523a',needles:'#365c43',tips:'#55754c',shade:'#284c3c'}).map(([role,color]):Control=>({key:'color.'+role,label:role,kind:'color',group:'colors',unit:'color',default:color,role,hint:'Opaque faceted '+role+' material.',affects:['material'],targets:[role]})),
];
const parse=(input:unknown)=>parseControls(controls,plainRecord(input));
function save(input:unknown):Design {
  const requested={...plainRecord(input)};
  return {formatVersion:1,family:'conifer',familyVersion:'1.1.0',requested,applied:parse(requested)};
}
function load(input:unknown):Design {
  return loadConstructionDesign(input,'conifer','1.1.0',['1.0.0'],save,loadPrior);
}

function build(input:unknown):AssetBuild {
  const config=save(input),p=config.applied;
  let state=Number(p.seed)>>>0;
  const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  const root=new Group();root.name='conifer';
  const materials=Object.fromEntries(['bark','needles','tips','shade'].map(role=>[role,new MeshStandardMaterial({name:role,color:String(p['color.'+role]),roughness:0.95,flatShading:true})]));
  function add(name:string,role:string,g:BufferGeometry,connectedTo?:string) {
    const m=new Mesh(g,materials[role]);m.name=name;m.userData={materialRole:role,...(connectedTo?{connectedTo}:{})};m.castShadow=true;m.receiveShadow=true;root.add(m);return m;
  }
  const spine=Array.from({length:8},(_,i)=>new Vector3(i===0?0:(random()-.5)*.12,i*6/7,i===0?0:(random()-.5)*.12));
  spine[7]!.set(spine[6]!.x,5.48,spine[6]!.z);
  const centerAt=(y:number)=>{
    const index=Math.min(6,Math.floor(y/6*7));
    return spine[index]!.clone().lerp(spine[index+1]!,y/6*7-index);
  };
  add('trunk','bark',taperedSweep(spine.map((v,i)=>({center:v.toArray(),radius:.14*(1-i/8)**1.3+.008})),7));
  function spray(name:string,start:Vector3,end:Vector3,width:number,depth:number,role:string,parent:string) {
    const axis=end.clone().sub(start),length=axis.length();axis.normalize();
    const side=new Vector3(axis.z,0,-axis.x);
    if(side.lengthSq()<1e-8)side.set(0,0,1);else side.normalize();
    const needle=(from:Vector3,to:Vector3,w:number,d:number)=>{
      const direction=to.clone().sub(from),run=direction.length();direction.normalize();
      const up=direction.clone().cross(side).normalize(),cross=up.clone().cross(direction).normalize();
      const outline=Array.from({length:6},(_,i):[number,number]=>[Math.cos(i*Math.PI/3)*d,Math.sin(i*Math.PI/3)*w]);
      const g=facetedLoft([[0,.45],[.22,1],[1,.008]].map(([t,r])=>({center:[0,run*t!,0] as [number,number,number],outline:outline.map(([x,z]):[number,number]=>[x*r!,z*r!])})));
      g.applyMatrix4(new Matrix4().makeBasis(up,direction,cross));g.translate(from.x,from.y,from.z);return g;
    };
    const pieces=[needle(start,end,width,depth)];
    for(const direction of [-1,1]){
      const fork=start.clone().addScaledVector(axis,length*(direction<0?.24:.34));
      const tip=start.clone().addScaledVector(axis,length*(direction<0?.76:.86)).addScaledVector(side,length*.28*direction);
      pieces.push(needle(fork,tip,width*.58,depth*.72));
    }
    const geometry=mergeGeometries(pieces);
    for(const piece of pieces)piece.dispose();
    add(name,role,geometry,parent);
  }
  const phase=random()*Math.PI*2;
  for(let tier=0;tier<Number(p.tierCount);tier++){
    const t=tier/(Number(p.tierCount)-1),levelIndex=t*7;
    const y=1.3+3.85*(1-(1-t)**1.3)+Math.sin(t*Math.PI*2+phase)*Math.sin(t*Math.PI)*.13;
    const n=levelIndex<3?5:4,tierPhase=phase+tier*1.37;
    for(let j=0;j<n;j++){
      const angle=tierPhase+j*Math.PI*2/n+(random()-.5)*.22;
      const level=y+(random()-.5)*.16;
      const start=centerAt(level),length=(1.6*(1-t)**.65+.32)*(.91+random()*.18);
      const dir=new Vector3(Math.cos(angle),0,Math.sin(angle));
      const pointAt=(distance:number)=>start.clone().addScaledVector(dir,length*distance).add(new Vector3(0,-length*.24*distance,0));
      const elbow=pointAt(.52),tip=pointAt(1);
      const branchName='branch-'+tier+'-'+j;
      add(branchName,'bark',taperedSweep([{center:start.toArray(),radius:.052*(1-levelIndex*.09)},{center:elbow.toArray(),radius:.032*(1-levelIndex*.09)},{center:tip.toArray(),radius:.008}],5),'trunk');
      const depth=(.13+.26*t)*(.55+.45*length);
      spray('foliage-'+tier+'-'+j+'-0',pointAt(.08),pointAt(.84),length*(.15+.015*Math.sin(angle)),depth,t<.18?'shade':'needles',branchName);
      spray('foliage-'+tier+'-'+j+'-1',pointAt(.53),pointAt(1.20),length*(.12+.012*Math.cos(angle)),depth*.78,t>.62?'tips':'needles',branchName);
    }
  }
  for(let i=0;i<3;i++){
    const start=spine[7]!.clone();start.y=5.0+i*.18;
    const end=start.clone().add(new Vector3(Math.cos(phase+i*2.4)*(.08-i*.02),.80-i*.13,Math.sin(phase+i*2.4)*(.08-i*.02)));
    spray('foliage-leader-'+i,start,end,.19-i*.045,.17-i*.04,'needles','trunk');
  }
  root.updateMatrixWorld(true);
  const raw=new Box3().setFromObject(root,true),size=raw.getSize(new Vector3());
  const sx=Number(p.crownSpread)/Math.max(size.x,size.z),sy=Number(p.height)/size.y;
  root.traverse(o=>{if(o instanceof Mesh){o.geometry.translate(0,-raw.min.y,0);o.geometry.scale(sx,sy,sx);}});
  const anchors={ground:[0,0,0],tip:[spine[7]!.x*sx,Number(p.height),spine[7]!.z*sx]};
  root.userData={configuration:config,units:'meters',up:'+Y',forward:'+Z',origin:'ground-center',anchors};
  root.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(root,true);
  return {root,config,materials,anchors,bounds,dimensions:bounds.getSize(new Vector3())};
}
const presets:Descriptor['presets']=[
  {id:'woodland',name:'Woodland pine',description:'Uneven open crown with exposed branch joints.',parameters:{}},
  {id:'slender',name:'Slender pine',description:'Tall narrow silhouette with ten close-set tiers.',parameters:{height:9,crownSpread:3,seed:901,tierCount:10}},
  {id:'windswept',name:'Broad pine',description:'Short broad crown with five open tiers.',parameters:{height:4.5,crownSpread:4.7,seed:42,tierCount:5}},
];
export const coniferRecipe:Recipe={
  descriptor:{id:'conifer',version:'1.1.0',title:'Wild pine',description:'Faceted pine with irregular branch tiers and visible connected woody structure.',controls,defaults:parse({}),presets,palettes:[{id:'forest',label:'Forest',colors:['#70523a','#365c43','#55754c','#284c3c'],parameters:{'color.bark':'#70523a','color.needles':'#365c43','color.tips':'#55754c','color.shade':'#284c3c'}}],save,state:input=>parameterState(controls,input)},
  build,load,
  validationCases:[...presets,...controls.flatMap(c=>c.kind==='range'||c.kind==='integer'?[{id:c.key.toLowerCase()+'-min',name:c.label+' minimum',parameters:{[c.key]:c.min}},{id:c.key.toLowerCase()+'-max',name:c.label+' maximum',parameters:{[c.key]:c.max}}]:[]),{id:'short-wide',name:'Short wide boundary',parameters:{height:2,crownSpread:7,seed:0}},{id:'tall-narrow',name:'Tall narrow boundary',parameters:{height:12,crownSpread:1,seed:65535}}],
  integrationCases:[{id:'default',name:'Default pine',parameters:{}},{id:'slender',name:'Slender pine',parameters:presets[1]!.parameters}],
  constraints:['Height is ground to highest geometry; crown spread is max X/Z span. Five to ten tiers share the original crown envelope and taper; eight tiers retain the default construction. Extreme aspect ratios are supported but stylized. Branch meshes intersect the trunk and foliage; they are not welded. No wind, collision or LOD.'],
  presentation:{category:'Nature',order:110,kitIds:[],thumbnails:Object.fromEntries(presets.map(p=>[p.id,'conifer-'+p.id+'.png']))},
  source:{entry:'examples/recipes/conifer/index.ts',exportName:'coniferRecipe'},
};
