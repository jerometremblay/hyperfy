import {parseControls,plainRecord,ParameterError} from '../../engine/parameters.ts';
import type {Control,Design,Descriptor,Parameters} from '../../engine/parameters.ts';

const palette = { oak: { wood:'#a86b37', frame:'#343a3e', brass:'#c79535' } };
const ranges = [
  ['width','Width',0.7,1.8,1.2],['depth','Depth',0.45,1,0.7],
  ['bodyHeight','Body height',0.35,0.8,0.58],['lidRise','Lid rise',0.15,0.4,0.28],
  ['bandInset','Band inset',0.15,0.3,0.2],
] as const;
const dimensionControls:Control[]=ranges.map(([key,label,min,max,value]):Control=>({key,label,kind:'range',group:'shape',unit:key==='bandInset'?'none':'m',min,max,step:0.01,default:value,hint:key==='bandInset'?'Fraction of width from each end.':'Outside dimension in meters.',affects:['geometry'],targets:['body','lid','band']}));
const controls: Control[] = [
  ...dimensionControls.slice(0,4),
  {key:'lidAngle',inputUnit:'degrees',label:'Lid opening',kind:'range',group:'construction',unit:'none',min:0,max:110,step:5,default:0,hint:'Static opening in degrees around the rear hinge. Bands and latch follow the lid.',affects:['geometry'],targets:['lid','band-lid','latch','keyhole']},
  {key:'boardCount',label:'Body courses',kind:'integer',group:'construction',unit:'count',min:2,max:6,step:1,default:4,hint:'Body courses preserve the outside height and hollow interior.',affects:['topology'],targets:['body-plank','end-plank']},
  ...dimensionControls.slice(4),
  {key:'latch',label:'Latch',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Adds a front brass latch.',affects:['topology'],targets:['latch']},
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
  return { formatVersion:1, family:'treasure-chest', familyVersion:'1.0.0', requested, applied:parse(requested) };
}

export function load(input: unknown): Design {
  const value = plainRecord(input);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !['formatVersion','family','familyVersion','requested','applied'].includes(key))) throw new Error('Unknown treasure-chest design field');
  if (value.formatVersion !== 1 || value.family !== 'treasure-chest' || value.familyVersion !== '1.0.0') throw new Error('Unsupported treasure-chest design version');
  const design = save(value.requested);
  const applied = plainRecord(value.applied);
  if (Reflect.ownKeys(applied).length !== Object.keys(design.applied).length || Object.entries(design.applied).some(([key, item]) => applied[key] !== item)) throw new Error('Chest applied parameters do not match requested values');
  return design;
}

