import {loadConfiguration as loadRevision2} from './revision2-config.ts';
import { parseControls, plainRecord, ParameterError, parameterState } from '../engine/parameters.ts';
import type { Control, Parameters as Values, Design } from '../engine/parameters.ts';
export const family = 'work-lantern';
export const familyVersion = '0.4.0';
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
  { id: 'field', name: 'Field', description: 'A balanced everyday companion', parameters: { ...defaults,enclosureProfile:'octagonal',handleProfile:'arched',hoodFlare:.18,guardCount:4 } },
  { id: 'harbor', name: 'Harbor', description: 'Broad, low and steady', parameters: { bodyWidth: 0.4, bodyHeight: 0.235, handleClearance: 0.13, colorway: 'harbor',enclosureProfile:'square',hoodFlare:.3,handleProfile:'arched',guardCount:3 } },
  { id: 'trail', name: 'Trail', description: 'Narrow with a taller enclosure', parameters: { bodyWidth: 0.24, bodyHeight: 0.285, handleClearance: 0.105, colorway: 'ember',enclosureProfile:'octagonal',hoodFlare:.1,handleProfile:'square',guardCount:6 } },
];
export interface Configuration extends Design { applied:Parameters }
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
  return [...all,...additionalControls.map(c=>({...c,...constructionHelp[c.key]}))];
}
const additionalControls:Control[]=[{"kind": "choice", "default": "octagonal", "options": [{"value": "square", "label": "Square"}, {"value": "octagonal", "label": "Octagonal"}], "key": "enclosureProfile", "label": "Enclosure profile", "group": "construction", "hint": "Changes enclosureProfile with fitted enclosure construction.", "affects": ["geometry", "topology"], "targets": ["enclosure", "hood", "handle"], "unit": "none"}, {"kind": "range", "unit": "ratio", "ratioBasis": "width", "default": 0.18, "min": 0.08, "max": 0.3, "step": 0.01, "key": "hoodFlare", "label": "Hood flare", "group": "construction", "hint": "Changes hoodFlare with fitted enclosure construction.", "affects": ["geometry", "topology"], "targets": ["enclosure", "hood", "handle"]}, {"kind": "choice", "default": "arched", "options": [{"value": "arched", "label": "Arched"}, {"value": "square", "label": "Square"}], "key": "handleProfile", "label": "Carry handle", "group": "construction", "hint": "Changes handleProfile with fitted enclosure construction.", "affects": ["geometry", "topology"], "targets": ["enclosure", "hood", "handle"], "unit": "none"}, {"kind": "integer", "default": 4, "min": 3, "max": 6, "key": "guardCount", "label": "Guard count", "group": "construction", "hint": "Changes guardCount with fitted enclosure construction.", "affects": ["geometry", "topology"], "targets": ["enclosure", "hood", "handle"], "unit": "count", "step": 1}];
const constructionHelp:Record<string,{hint:string;targets:string[]}>={
 enclosureProfile:{hint:'Changes the light housing and retaining frames to square or eight-sided sections; guards follow the profile.',targets:['enclosure','lower-frame','upper-frame','guard-upright-*']},
 hoodFlare:{hint:'Adds this fraction of body width to each hood side; the top collar stays fitted.',targets:['hood']},
 handleProfile:{hint:'Chooses a curved tubular carry hoop or a square band while keeping the requested clear height.',targets:['handle']},
 guardCount:{hint:'Distributes three to six tapered vertical guards around the enclosure.',targets:['guard-upright-*']},
};
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
  if(value.familyVersion!==familyVersion) {
    const old=loadRevision2(input),next=saveConfiguration(old.applied);
    return {...next,migration:{fromVersion:String(value.familyVersion),toVersion:familyVersion,notice:'Construction redesigned for revision 3; prior geometry is not reproduced.'}};
  }
  if(value.formatVersion!==1||value.family!==family||value.familyVersion!==familyVersion)throw new Error('Unsupported configuration family or version');
  for(const key of Reflect.ownKeys(value))if(typeof key!=='string'||!['formatVersion','family','familyVersion','requested','applied','migration'].includes(key))throw new Error('Unknown configuration field');
  const next=saveConfiguration(value.requested);
  const applied=plainRecord(value.applied);
  if(Reflect.ownKeys(applied).length!==Object.keys(next.applied).length||Object.entries(next.applied).some(([key,value])=>!Object.hasOwn(applied,key)||applied[key]!==value))throw new Error('Saved applied parameters do not match requested parameters');
  if(value.migration!==undefined) {
    const m=plainRecord(value.migration);
    if(typeof m.fromVersion!=='string'||!['1.0.0','0.2.0'].includes(m.fromVersion)||m.toVersion!==familyVersion||m.notice!=='Construction redesigned for revision 3; prior geometry is not reproduced.'||Object.keys(m).length!==3)throw new Error('Invalid migration notice');
    next.migration=m as unknown as NonNullable<Configuration['migration']>;
  }
  return next;
}
