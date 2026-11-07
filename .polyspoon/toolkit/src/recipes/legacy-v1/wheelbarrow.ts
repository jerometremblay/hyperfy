import {parseControls,plainRecord,ParameterError} from '../../engine/parameters.ts';
import type {Control,Design,Descriptor,Parameters} from '../../engine/parameters.ts';

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
  return { formatVersion:1, family:'wheelbarrow', familyVersion:'1.0.0', requested, applied:parse(requested) };
}

export function load(input: unknown): Design {
  const value = plainRecord(input);
  if (Reflect.ownKeys(value).some(key => typeof key !== 'string' || !['formatVersion','family','familyVersion','requested','applied'].includes(key))) throw new Error('Unknown wheelbarrow design field');
  if (value.formatVersion !== 1 || value.family !== 'wheelbarrow' || value.familyVersion !== '1.0.0') throw new Error('Unsupported wheelbarrow design version');
  const design = save(value.requested);
  const applied = plainRecord(value.applied);
  if (Reflect.ownKeys(applied).length !== Object.keys(design.applied).length || Object.entries(design.applied).some(([key, item]) => applied[key] !== item)) throw new Error('Wheelbarrow applied parameters do not match requested values');
  return design;
}

