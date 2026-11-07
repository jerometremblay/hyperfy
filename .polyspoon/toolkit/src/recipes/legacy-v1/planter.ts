import {parseControls,plainRecord,ParameterError} from '../../engine/parameters.ts';
import type {Control,Design,Descriptor,Parameters} from '../../engine/parameters.ts';

const palette = {
  oak: { wood: '#b88654', frame: '#604532' },
  painted: { wood: '#8ca58b', frame: '#384a42' },
};
const controls: Control[] = [
  ...(['width','depth','height'] as const).map(key => ({key,label:key,kind:'range' as const,group:'shape' as const,unit:'m' as const,min:key==='width'?0.6:key==='depth'?0.3:0.25,max:key==='width'?1.8:key==='depth'?0.8:0.85,step:0.05,default:key==='width'?1.1:key==='depth'?0.5:0.5,hint:'Outside '+key+' in meters.',affects:['geometry' as const],targets:['wall','post','floor']})),
  {key:'boardCount',label:'Wall boards',kind:'integer',group:'construction',unit:'count',min:2,max:5,step:1,default:3,hint:'Horizontal board courses with small gaps.',affects:['topology'],targets:['wall']},
  {key:'feet',label:'Raised feet',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Adds four ground-supported feet below the floor.',affects:['topology'],targets:['foot']},
  {key:'colorway',label:'Palette',kind:'choice',group:'colors',unit:'none',default:'oak',options:[{value:'oak',label:'Oak'},{value:'painted',label:'Painted'}],hint:'Board and post colors.',affects:['material'],targets:['wood','frame']},
  {key:'color.wood',label:'Boards',kind:'color',group:'colors',unit:'color',default:palette.oak.wood,role:'wood',hint:'Walls and floor.',affects:['material'],targets:['wall','floor']},
  {key:'color.frame',label:'Posts',kind:'color',group:'colors',unit:'color',default:palette.oak.frame,role:'frame',hint:'Posts and feet.',affects:['material'],targets:['post','foot']},
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
  return { formatVersion:1, family:"planter", familyVersion:'1.0.0', requested, applied:parse(requested) };
}

export function load(input: unknown): Design {
  const value = plainRecord(input);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !['formatVersion','family','familyVersion','requested','applied'].includes(key))) throw new Error('Unknown planter design field');
  if (value.formatVersion !== 1 || value.family !== "planter" || value.familyVersion !== '1.0.0') throw new Error('Unsupported planter design version');
  const design = save(value.requested);
  const applied = plainRecord(value.applied);
  if (Reflect.ownKeys(applied).length !== Object.keys(design.applied).length || Object.entries(design.applied).some(([key, item]) => applied[key] !== item)) throw new Error('Planter applied parameters do not match requested values');
  return design;
}

