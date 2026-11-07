import { parseControls, plainRecord, ParameterError, parameterState } from '../engine/parameters.ts';
import type { Control, Parameters as Values, Design } from '../engine/parameters.ts';
export const family = 'work-lantern';
export const familyVersion = '0.2.0';
export const colorways = {
  forest: { label: 'Forest & cream', body: '#526750', enclosure: '#eee1bf', structure: '#303b35', accent: '#d2a449' },
  harbor: { label: 'Harbor & chalk', body: '#3e777b', enclosure: '#e9e4d3', structure: '#293b43', accent: '#d6a351' },
  ember: { label: 'Ember & sand', body: '#ad6149', enclosure: '#f0ddba', structure: '#4b3933', accent: '#d2a75b' },
} as const;
export type Colorway = keyof typeof colorways;
export interface Parameters extends Values { bodyWidth: number; bodyHeight: number; handleClearance: number; colorway: Colorway }
export const defaults: Readonly<Parameters> = Object.freeze({ bodyWidth: 0.32, bodyHeight: 0.26, handleClearance: 0.115, colorway: 'forest' });
export const controls = [
  { key: 'bodyWidth', label: 'Body width', min: 0.22, max: 0.44, step: 0.001, hint: 'Widens the enclosure, hood and base together.' },
  { key: 'bodyHeight', label: 'Body height', min: 0.18, max: 0.36, step: 0.001, hint: 'Enclosure only, excluding the hood and handle.' },
  { key: 'handleClearance', label: 'Handle opening', min: 0.075, max: 0.19, step: 0.001, hint: 'Clear space above the hood, beneath the grip.' },
] as const;
export const presets: ReadonlyArray<{ id: string; name: string; description: string; parameters: Parameters }> = [
  { id: 'field', name: 'Field', description: 'A balanced everyday companion', parameters: { ...defaults } },
  { id: 'harbor', name: 'Harbor', description: 'Broad, low and steady', parameters: { bodyWidth: 0.4, bodyHeight: 0.235, handleClearance: 0.13, colorway: 'harbor' } },
  { id: 'trail', name: 'Trail', description: 'Narrow with a taller enclosure', parameters: { bodyWidth: 0.24, bodyHeight: 0.285, handleClearance: 0.105, colorway: 'ember' } },
];
export interface Configuration extends Design { applied:Parameters }
function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error(`${label} must be an object`);
  return value as Record<string, unknown>;
}
function rejectUnknown(value: Record<string, unknown>, keys: string[]): void {
  for (const key of Object.keys(value)) if (!keys.includes(key)) throw new Error(`Unknown field: ${key}`);
}
function parseLegacyParameters(input: unknown): Parameters {
  const value = record(input, 'Parameters');
  rejectUnknown(value, ['bodyWidth', 'bodyHeight', 'handleClearance', 'colorway']);
  const result = { ...defaults };
  for (const control of controls) {
    if (!Object.hasOwn(value, control.key)) continue;
    const number = value[control.key];
    if (typeof number !== 'number' || !Number.isFinite(number)) throw new Error(`${control.key} must be a finite number`);
    if (number < control.min || number > control.max) throw new Error(`${control.key} must be between ${control.min} and ${control.max} meters`);
    result[control.key] = number;
  }
  if (Object.hasOwn(value, 'colorway')) {
    if (typeof value.colorway !== 'string' || !Object.hasOwn(colorways, value.colorway)) throw new Error('colorway must be forest, harbor or ember');
    result.colorway = value.colorway as Colorway;
  }
  if (result.bodyHeight > result.bodyWidth * 1.35 + 1e-12) throw new Error('bodyHeight must be at most 1.35 × bodyWidth. Widen the body or lower its height.');
  if (result.handleClearance > result.bodyWidth * 0.65 + 1e-12) throw new Error('handleClearance must be at most 0.65 × bodyWidth. Widen the body or lower the handle.');
  return result;
}
function saveLegacyConfiguration(input: unknown): Configuration {
  const applied = parseLegacyParameters(input);
  const requested: Partial<Parameters> = {};
  const value = input as Partial<Parameters>;
  for (const key of ['bodyWidth', 'bodyHeight', 'handleClearance', 'colorway'] as const) {
    if (Object.hasOwn(value, key)) Object.assign(requested, { [key]: value[key] });
  }
  return { formatVersion: 1, family, familyVersion, requested, applied };
}
function loadLegacyConfiguration(input: unknown): Configuration {
  const value = record(input, 'Configuration');
  rejectUnknown(value, ['formatVersion', 'family', 'familyVersion', 'requested', 'applied']);
  if (value.formatVersion !== 1 || value.family !== family || value.familyVersion !== '1.0.0') throw new Error('Unsupported configuration family or version');
  const saved = saveLegacyConfiguration(value.requested);
  const applied = record(value.applied, 'applied');
  if (Object.keys(applied).length !== 4 || JSON.stringify(parseLegacyParameters(applied)) !== JSON.stringify(saved.applied)) throw new Error('Saved applied parameters do not match requested parameters');
  return saved;
}

export function lanternControls(input:unknown={}):Control[] {
  const raw=plainRecord(input),way=typeof raw.colorway==='string'&&Object.hasOwn(colorways,raw.colorway)?raw.colorway as Colorway:'forest';
  const all:Control[]=controls.map(c=>({...c,kind:'range',default:defaults[c.key],group:'shape',unit:'cm',affects:['geometry'],targets:['enclosure','hood','base','handle']}));
  for(const [key,label,value,options] of [
    ['frameWeight','Frame weight','heavy',['light','heavy']],
    ['guardLayout','Guard layout','sparse',['sparse','crossbar']],
    ['detail','Detail','inspection',['scene','inspection']],
    ['colorway','Colorway','forest',['forest','harbor','ember']],
  ] as const)all.push({kind:'choice',key,label,default:value,options:options.map(value=>({value,label:value})),group:key==='colorway'?'colors':'construction',unit:'none',hint:'Select '+label.toLowerCase()+'.',affects:key==='colorway'?['material']:['geometry','topology'],targets:[key]});
  for(const role of ['body','enclosure','structure','accent'] as const)all.push({kind:'color',key:'color.'+role,label:role,role,default:colorways[way][role],group:'colors',unit:'color',hint:'Changes only '+role+' color.',affects:['material'],targets:[role]});
  return all;
}
function relationships(p:Values) {
  const issues=[];
  if(Number(p.bodyHeight)>Number(p.bodyWidth)*1.35+1e-12)issues.push({code:'relationship',keys:['bodyHeight','bodyWidth'],message:'bodyHeight must be at most 1.35 × bodyWidth. Widen the body or lower its height.'});
  if(Number(p.handleClearance)>Number(p.bodyWidth)*0.65+1e-12)issues.push({code:'relationship',keys:['handleClearance','bodyWidth'],message:'handleClearance must be at most 0.65 × bodyWidth. Widen the body or lower the handle.'});
  return issues;
}
export function parseParameters(input:unknown):Parameters {
  const p=parseControls(lanternControls(input),input) as Parameters,issues=relationships(p);
  if(issues.length)throw new ParameterError(issues);return p;
}
export function saveConfiguration(input:unknown):Configuration {
  return {formatVersion:1,family,familyVersion,requested:{...plainRecord(input)},applied:parseParameters(input)};
}
export function lanternState(input:unknown) {
  const state=parameterState(lanternControls(input),input,relationships);
  const raw=plainRecord(input),w=typeof raw.bodyWidth==='number'?raw.bodyWidth:defaults.bodyWidth;
  state.controls.bodyHeight!.max=Math.min(0.36,w*1.35);
  state.controls.handleClearance!.max=Math.min(0.19,w*0.65);
  return state;
}
export function loadConfiguration(input:unknown):Configuration {
  const value=plainRecord(input);
  if(value.familyVersion==='1.0.0') {
    const old=loadLegacyConfiguration(input),next=saveConfiguration(old.applied);
    return {...next,migration:{fromVersion:'1.0.0',toVersion:familyVersion,notice:'Construction upgraded; original geometry is not reproduced.'}};
  }
  if(value.formatVersion!==1||value.family!==family||value.familyVersion!==familyVersion)throw new Error('Unsupported configuration family or version');
  for(const key of Object.keys(value))if(!['formatVersion','family','familyVersion','requested','applied','migration'].includes(key))throw new Error('Unknown configuration field');
  const next=saveConfiguration(value.requested);
  const applied=plainRecord(value.applied);
  if(Reflect.ownKeys(applied).length!==Object.keys(next.applied).length||Object.entries(next.applied).some(([key,value])=>!Object.hasOwn(applied,key)||applied[key]!==value))throw new Error('Saved applied parameters do not match requested parameters');
  if(value.migration!==undefined) {
    const m=plainRecord(value.migration);
    if(m.fromVersion!=='1.0.0'||m.toVersion!==familyVersion||m.notice!=='Construction upgraded; original geometry is not reproduced.'||Object.keys(m).length!==3)throw new Error('Invalid migration notice');
    next.migration=m as unknown as NonNullable<Configuration['migration']>;
  }
  return next;
}
