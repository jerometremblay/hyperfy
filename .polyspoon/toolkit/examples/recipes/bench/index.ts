import {loadConstructionDesign} from '../../../src/engine/construction-migration.ts';
import {load as loadPrior} from '../../../src/recipes/legacy-v1/bench.ts';
import { Box3, Group, Mesh, MeshStandardMaterial, Vector3 } from 'three';
import { profileSolid } from '../../../src/engine/geometry.ts';
import { parseControls, parameterState, plainRecord } from '../../../src/engine/parameters.ts';
import type { Control, Design, Descriptor, Parameters } from '../../../src/engine/parameters.ts';
import type { AssetBuild } from '../../../src/catalog/types.ts';
import type { Recipe, RecipeCase } from '../../../src/recipes/types.ts';

const palette = {
  oak: { wood: '#b88654', frame: '#604532' },
  painted: { wood: '#8ca58b', frame: '#384a42' },
};
const controls: Control[] = [
  { key:'width',label:'Seat width',kind:'range',group:'shape',unit:'m',min:0.9,max:2.4,step:0.05,default:1.6,hint:'Outside seat width.',affects:['geometry'],targets:['seat-slat','apron','leg','seat-support','back-post','back-slat'] },
  { key:'depth',label:'Seat depth',kind:'range',group:'shape',unit:'m',min:0.32,max:0.65,step:0.01,default:0.45,hint:'Outside seat depth.',affects:['geometry'],targets:['seat-slat','leg','seat-support','apron','back-post','back-slat'] },
  { key:'seatHeight',label:'Seat height',kind:'range',group:'shape',unit:'m',min:0.35,max:0.55,step:0.01,default:0.45,hint:'Ground to seat top.',affects:['geometry'],targets:['seat-slat','leg','apron','seat-support','back-post','back-slat'] },
  { key:'slatCount',label:'Seat slats',kind:'integer',group:'construction',unit:'count',min:3,max:6,step:1,default:4,hint:'Changes the number and width of seat boards.',affects:['topology'],targets:['seat-slat'] },
  { key:'backrest',label:'Backrest',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Adds two supported back boards.',affects:['topology'],targets:['back-post','back-slat'] },
  { key:'backHeight',label:'Back height',kind:'range',group:'shape',unit:'m',min:0.25,max:0.55,step:0.01,default:0.35,hint:'Seat top to back top. Used only with a backrest.',affects:['geometry'],targets:['back-post','back-slat'] },
  { key:'colorway',label:'Palette',kind:'choice',group:'colors',unit:'none',default:'oak',options:[{value:'oak',label:'Oak'},{value:'painted',label:'Painted'}],hint:'Starting colors; individual roles can override them.',affects:['material'],targets:['wood','frame'] },
  { key:'color.wood',label:'Boards',kind:'color',group:'colors',unit:'color',default:palette.oak.wood,role:'wood',hint:'Seat and back boards.',affects:['material'],targets:['seat-slat','back-slat'] },
  { key:'color.frame',label:'Frame',kind:'color',group:'colors',unit:'color',default:palette.oak.frame,role:'frame',hint:'Legs, supports and aprons.',affects:['material'],targets:['leg','apron','seat-support','back-post'] },
];

function parse(input: unknown): Parameters {
  const value = plainRecord(input);
  const checked = parseControls(controls, value);
  const colors = palette[checked.colorway as keyof typeof palette];
  for (const role of ['wood','frame'] as const) if (!Object.hasOwn(value, 'color.' + role)) checked['color.' + role] = colors[role];
  return checked;
}

function save(input: unknown): Design {
  const requested = { ...plainRecord(input) };
  return { formatVersion:1, family:'bench', familyVersion:'1.1.0', requested, applied:parse(requested) };
}

function load(input:unknown):Design {
  return loadConstructionDesign(input,'bench','1.1.0',['1.0.0'],save,loadPrior);
}

function build(input: unknown): AssetBuild {
  const config = save(input), p = config.applied;
  const width = Number(p.width), depth = Number(p.depth), height = Number(p.seatHeight), count = Number(p.slatCount);
  const root = new Group(); root.name = 'bench';
  const materials = Object.fromEntries(['wood','frame'].map(role => [role, new MeshStandardMaterial({ name:role, color:String(p['color.' + role]), roughness:0.9, flatShading:true })]));
  const anchors = { ground:[0,0,0], seat:[0,height,0] };
  root.userData = { configuration:config, units:'meters', up:'+Y', forward:'+Z', origin:'ground-center', anchors };
  function part(name: string, role: string, size: [number,number,number], position: [number,number,number], shape: 'board'|'leg'|'back' = 'board') {
    const [w,h,d] = size, ease = Math.min(0.003,w*0.08,h*0.1,d*0.08);
    const stations = shape === 'leg' ? [
      {y:-h/2,width:0.065,depth:0.065,chamfer:0.005},
      {y:h*0.10,width:0.073,depth:0.073,chamfer:0.005},
      {y:h*0.32,width:w,depth:d,chamfer:0.006},
      {y:h/2,width:w,depth:d,chamfer:0.006},
    ] : [
      {y:-h/2,width:w-2*ease,depth:d-2*ease,chamfer:ease},
      {y:-h/2+ease,width:w,depth:d,chamfer:ease},
      {y:h/2-ease,width:w,depth:d,chamfer:ease},
      {y:h/2,width:w-2*ease,depth:d-2*ease,chamfer:ease},
    ];
    const geometry = profileSolid(stations);
    if (shape === 'back') {
      const vertices = geometry.getAttribute('position');
      for (let i=0;i<vertices.count;i++) vertices.setZ(i,vertices.getZ(i)-0.085*(vertices.getY(i)+position[1]-height));
      geometry.computeVertexNormals();
    }
    const mesh = new Mesh(geometry, materials[role]);
    mesh.name = name; mesh.userData = { materialRole:role };
    mesh.position.set(...position); mesh.castShadow = true; mesh.receiveShadow = true; root.add(mesh);
  }
  const legX = width/2 - 0.12, legZ = depth/2 - 0.075, seatBottom = height - 0.055;
  for (const side of [-1,1]) {
    for (const end of [-1,1]) part('leg-' + side + '-' + end, 'frame', [0.09,seatBottom,0.085], [side*legX,seatBottom/2,end*legZ], 'leg');
    part('seat-support-' + side, 'frame', [0.105,0.075,depth-0.04], [side*legX,seatBottom-0.0355,0]);
    part('apron-' + side, 'frame', [2*legX,0.085,0.05], [0,seatBottom-0.0505,side*legZ]);
  }
  const gap = 0.012, slatDepth = (depth-gap*(count-1))/count;
  for (let i=0;i<count;i++) part('seat-slat-' + i, 'wood', [width,0.055,slatDepth], [0,height-0.0275,-depth/2+slatDepth/2+i*(slatDepth+gap)]);
  if (p.backrest) {
    const backHeight = Number(p.backHeight), top = height+backHeight, bottom = seatBottom-0.075, z = -legZ;
    for (const side of [-1,1]) part('back-post-' + side, 'frame', [0.07,top-bottom,0.065], [side*legX,(top+bottom)/2,z], 'back');
    for (let i=0;i<2;i++) {
      const boardHeight = backHeight*0.3;
      part('back-slat-' + i, 'wood', [width,boardHeight,0.045], [0,top-boardHeight/2-i*(boardHeight+0.025),z+0.047], 'back');
    }
  }
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root,true);
  return { root, config, materials, anchors, bounds, dimensions:bounds.getSize(new Vector3()) };
}

const presets: Descriptor['presets'] = [
  { id:'garden',name:'Garden bench',description:'Four oak seat boards with a backrest.',parameters:{} },
  { id:'low-seat',name:'Low seat',description:'A short three-board seat without a backrest.',parameters:{width:1.1,seatHeight:0.35,slatCount:3,backrest:false} },
  { id:'park',name:'Park bench',description:'A wider painted bench with a taller back.',parameters:{width:2.2,depth:0.55,slatCount:5,backHeight:0.48,colorway:'painted'} },
];
const boundaries: RecipeCase[] = controls.flatMap(c => c.kind === 'range' || c.kind === 'integer' ? [
  {id:c.key.toLowerCase()+'-min',name:c.label+' minimum',parameters:{[c.key]:c.min}},
  {id:c.key.toLowerCase()+'-max',name:c.label+' maximum',parameters:{[c.key]:c.max}},
] : []);
export const benchRecipe: Recipe = {
  descriptor: {
    id:'bench',version:'1.1.0',title:'Slatted bench',description:'An original contributor example with supported seat boards and an optional backrest.',
    controls,defaults:parse({}),presets,
    palettes:Object.entries(palette).map(([id,colors]) => ({id,label:id === 'oak' ? 'Oak' : 'Painted',colors:Object.values(colors)})),
    save,
    state(input) {
      const state = parameterState(controls,input);
      try { state.controls.backHeight!.enabled = Boolean(parse(input).backrest); } catch {}
      return state;
    },
  },
  build,load,
  validationCases:[...presets,...boundaries,{id:'smallest',name:'Smallest supported bench',parameters:{width:0.9,depth:0.32,seatHeight:0.35,slatCount:6,backHeight:0.25}},{id:'largest',name:'Largest supported bench',parameters:{width:2.4,depth:0.65,seatHeight:0.55,slatCount:6,backHeight:0.55}}],
  integrationCases:[{id:'default',name:'Default bench',parameters:{}},{id:'low-seat',name:'Backless low seat',parameters:presets[1]!.parameters}],
  constraints:['Dimensions are meters; the seat anchor is at the center of the upper seat surface. Back height only affects geometry when the backrest is enabled.'],
  presentation:{category:'Props',order:60,kitIds:[],thumbnails:Object.fromEntries(presets.map(p=>[p.id,'bench-'+p.id+'.png']))},
  source:{entry:'examples/recipes/bench/index.ts',exportName:'benchRecipe'},
};
