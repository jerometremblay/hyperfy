export type ParameterValue = number | string | boolean;
export type Parameters = Record<string, ParameterValue>;
export type ControlGroup = 'shape' | 'construction' | 'colors';
export type Unit = 'm' | 'cm' | 'count' | 'seed' | 'ratio' | 'none' | 'color';
export type InputUnit = 'm' | 'integer' | 'dimensionless' | 'degrees' | 'none' | 'color';
export interface ControlBase {
  inputUnit?:InputUnit;
  key: string;
  label: string;
  group: ControlGroup;
  unit: Unit;
  hint: string;
  affects: Array<'geometry' | 'topology' | 'material'>;
  targets: string[];
}
export interface NumericControl extends ControlBase {
  kind: 'range' | 'integer';
  default: number;
  min: number;
  max: number;
  step: number;
  ratioBasis?: 'width' | 'height' | 'normalized';
}
export interface ChoiceControl extends ControlBase {
  kind: 'choice';
  default: string;
  options: Array<{ value: string; label: string }>;
}
export interface ToggleControl extends ControlBase {
  kind: 'toggle';
  default: boolean;
}
export interface ColorControl extends ControlBase {
  kind: 'color';
  default: string;
  role: string;
}
export type Control = NumericControl | ChoiceControl | ToggleControl | ColorControl;
export interface ParameterIssue { code: string; keys: string[]; message: string }
export interface ControlState { min?: number; max?: number; enabled: boolean; hint?: string }
export interface ParameterState { controls: Record<string, ControlState>; issues: ParameterIssue[] }
export interface MigrationNotice { fromVersion: string; toVersion: string; notice: string }
export interface Appearance {
  version: 1;
  palette: 'None' | 'Reduced4' | 'GameBoy' | 'PICO8' | 'CGA' | 'Mono';
  shading: 'None' | 'Toon3bands' | 'Flat';
  partColors: Record<string,string>;
}
export interface Design {
  formatVersion: 1;
  family: string;
  familyVersion: string;
  requested: Record<string, unknown>;
  applied: Parameters;
  migration?: MigrationNotice;
  appearance?: Appearance;
}
export interface Preset { id: string; name: string; description: string; parameters: Parameters }
export interface Palette { id: string; label: string; colors: string[]; parameters?: Parameters }
export interface Descriptor {
  id: string;
  version: string;
  title: string;
  description: string;
  controls: Control[];
  defaults: Parameters;
  presets: Preset[];
  palettes: Palette[];
  save(input: unknown): Design;
  state(input: unknown): ParameterState;
}

export function applyPalette(descriptor:Descriptor,input:unknown,id:string):Record<string,unknown> {
  const palette=descriptor.palettes.find(p=>p.id===id);
  if(!palette)throw new Error('Unknown palette: '+id);
  const next={...plainRecord(input)};
  if(descriptor.controls.some(c=>c.key==='colorway')) {
    for(const key of Object.keys(next))if(key.startsWith('color.'))delete next[key];
    next.colorway=id;
    return next;
  }
  if(!palette.parameters)throw new Error('Palette requires semantic parameters: '+id);
  return {...next,...palette.parameters};
}

export function paletteMatches(descriptor:Descriptor,applied:Parameters,id:string):boolean {
  const palette=descriptor.palettes.find(p=>p.id===id);
  if(!palette)return false;
  if(descriptor.controls.some(c=>c.key==='colorway'))return applied.colorway===id;
  return Boolean(palette.parameters&&Object.entries(palette.parameters).every(([key,value])=>applied[key]===value));
}

export class ParameterError extends Error {
  constructor(readonly issues: ParameterIssue[]) { super(issues.map(issue => issue.message).join('; ')); this.name = 'ParameterError'; }
}
export function plainRecord(input: unknown): Record<string, unknown> {
  if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input))) throw new ParameterError([{code:'type',keys:[],message:'Expected plain object'}]);
  return input as Record<string, unknown>;
}
export function parseControls(controls: Control[], input: unknown): Parameters {
  const value=plainRecord(input), result:Parameters={}, issues:ParameterIssue[]=[];
  for(const key of Reflect.ownKeys(value)) if(typeof key!=='string'||!controls.some(c=>c.key===key)) issues.push({code:'unknown',keys:[String(key)],message:'Unknown field: '+String(key)});
  for(const c of controls) {
    const v=Object.hasOwn(value,c.key)?value[c.key]:c.default;
    let valid=false;
    if(c.kind==='range'||c.kind==='integer') valid=typeof v==='number'&&Number.isFinite(v)&&v>=c.min&&v<=c.max&&(c.kind!=='integer'||Number.isInteger(v));
    if(c.kind==='choice') valid=typeof v==='string'&&c.options.some(o=>o.value===v);
    if(c.kind==='toggle') valid=typeof v==='boolean';
    if(c.kind==='color') valid=typeof v==='string'&&/^#[0-9a-f]{6}$/i.test(v);
    if(!valid) issues.push({code:'domain',keys:[c.key],message:c.key+' has invalid '+c.kind+' value'});
    else result[c.key]=c.kind==='color'?(v as string).toLowerCase():v as ParameterValue;
  }
  if(issues.length) throw new ParameterError(issues);
  return result;
}
export function parameterState(controls:Control[],input:unknown,relations:(p:Parameters)=>ParameterIssue[]=()=>[]):ParameterState {
  const state:ParameterState={controls:Object.fromEntries(controls.map(c=>[c.key,{enabled:true,...(c.kind==='range'||c.kind==='integer'?{min:c.min,max:c.max}:{})}])),issues:[]};
  try{state.issues=relations(parseControls(controls,input));}catch(error){if(error instanceof ParameterError)state.issues=error.issues;else throw error;}
  return state;
}

export function controlMetadata(controls:Control[]){
 return controls.map(({unit,inputUnit,...control})=>({...control,unit,inputUnit:inputUnit??(unit==='cm'?'m':unit==='count'||unit==='seed'?'integer':unit==='ratio'||unit==='none'&&(control.kind==='range'||control.kind==='integer')?'dimensionless':unit),displayUnit:unit}));
}
