import {parseControls,plainRecord,ParameterError} from '../../engine/parameters.ts';
import type {Control,Design,Descriptor,Parameters} from '../../engine/parameters.ts';

const palette = {
  oak: { wood: '#b88654', frame: '#604532' },
  painted: { wood: '#8ca58b', frame: '#384a42' },
};
const controls: Control[] = [
  { key:'width',label:'Seat width',kind:'range',group:'shape',unit:'m',min:0.9,max:2.4,step:0.05,default:1.6,hint:'Outside seat width.',affects:['geometry'],targets:['seat-slat','apron','leg','back-slat'] },
  { key:'depth',label:'Seat depth',kind:'range',group:'shape',unit:'m',min:0.32,max:0.65,step:0.01,default:0.45,hint:'Outside seat depth.',affects:['geometry'],targets:['seat-slat','leg','seat-support'] },
  { key:'seatHeight',label:'Seat height',kind:'range',group:'shape',unit:'m',min:0.35,max:0.55,step:0.01,default:0.45,hint:'Ground to seat top.',affects:['geometry'],targets:['seat-slat','leg','apron','back-post','back-slat'] },
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
  return { formatVersion:1, family:'bench', familyVersion:'1.0.0', requested, applied:parse(requested) };
}

export function load(input: unknown): Design {
  const value = plainRecord(input);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !['formatVersion','family','familyVersion','requested','applied'].includes(key))) throw new Error('Unknown bench design field');
  if (value.formatVersion !== 1 || value.family !== 'bench' || value.familyVersion !== '1.0.0') throw new Error('Unsupported bench design version');
  const design = save(value.requested);
  const applied = plainRecord(value.applied);
  if (Reflect.ownKeys(applied).length !== Object.keys(design.applied).length || Object.entries(design.applied).some(([key, item]) => applied[key] !== item)) throw new Error('Bench applied parameters do not match requested values');
  return design;
}

