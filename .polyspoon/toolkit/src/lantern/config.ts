import {loadConfiguration as loadPrior} from './revision4-config.ts';
import {loadConstructionDesign} from '../engine/construction-migration.ts';
import { parseControls, plainRecord, ParameterError, parameterState } from '../engine/parameters.ts';
import type { Control, Parameters as Values, Design } from '../engine/parameters.ts';
export const family = 'work-lantern';
export const familyVersion = '0.6.0';
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
export const presets: ReadonlyArray<{id:string;name:string;description:string;parameters:Parameters}>=[
 {id:'field',name:'Rustic field lantern',description:'Octagonal oil vessel, oval hoop and raised cap',parameters:{...defaults,construction:'rustic',hoodRise:1.1,carryHoop:'oval',guardCount:4}},
 {id:'harbor',name:'Harbor utility lamp',description:'Broad utility housing and square carry band',parameters:{bodyWidth:.4,bodyHeight:.235,handleClearance:.13,colorway:'harbor',construction:'utility',enclosureProfile:'square',hoodFlare:.22,handleProfile:'square',guardCount:4}},
 {id:'trail',name:'Tall trail oil lantern',description:'Narrow reservoir and tall carry hoop',parameters:{bodyWidth:.24,bodyHeight:.285,handleClearance:.14,colorway:'ember',construction:'rustic',enclosureProfile:'octagonal',hoodFlare:.1,hoodRise:1.2,carryHoop:'tall',guardCount:6,frameWeight:'light'}}
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
  return [...all,...additionalControls.map(c=>({...c,...constructionHelp[c.key]})),
    {kind:'choice',key:'construction',label:'Lantern construction',default:'rustic',options:[{value:'rustic',label:'Rustic oil lantern'},{value:'utility',label:'Utility lamp'}],group:'construction',unit:'none',hint:'Rebuilds reservoir, vessel and ventilated cap as a connected construction.',affects:['geometry','topology'],targets:['oil-reservoir','enclosure','hood','handle']},
    {kind:'range',key:'hoodRise',label:'Cap rise',default:1,min:.75,max:1.25,step:.05,group:'construction',unit:'ratio',ratioBasis:'normalized',hint:'Raises the cap, vents and carry seats together.',affects:['geometry'],targets:['hood','vented-cap','handle']},
    {kind:'choice',key:'carryHoop',label:'Rustic carry hoop',default:'oval',options:[{value:'oval',label:'Oval'},{value:'round',label:'Round'},{value:'tall',label:'Tall oval'}],group:'construction',unit:'none',hint:'Changes the rustic hoop aspect while retaining its mountings.',affects:['geometry'],targets:['handle']}
  ];
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
  const construction=raw.construction??'rustic';
  if(construction==='utility'){
    state.controls.carryHoop={enabled:false,hint:'Rustic construction exposes the oval carry hoop.'};
    state.controls.hoodRise={enabled:false,hint:'Rustic construction exposes raised cap height.'};
  }else state.controls.handleProfile={enabled:false,hint:'Utility construction exposes the arched or square handle; use Carry hoop for rustic lanterns.'};
  return state;
}
export function loadConfiguration(input:unknown):Configuration {
  return loadConstructionDesign(input,family,familyVersion,['1.0.0','0.2.0','0.4.0','0.5.0'],saveConfiguration,loadPrior);
}
