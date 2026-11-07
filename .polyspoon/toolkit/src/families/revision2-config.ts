import { loadTypedLegacyConfiguration } from './legacy-typed-config.ts';
import { legacyFamilies, legacyColorways } from './legacy-config.ts';
import { parseControls, plainRecord, parameterState, ParameterError } from '../engine/parameters.ts';
import type { Control as TypedControl, Parameters as TypedParameters, Design, ParameterState } from '../engine/parameters.ts';
export const palettes = {
  forest: { plaster: '#e2d6b8', roof: '#a75f49', timber: '#594739', wood: '#966c48', recess: '#34433e', stone: '#7d8279', foliage: '#728456', foliageShade: '#536c48', foliageLight: '#899863' },
  harbor: { plaster: '#e4dfcb', roof: '#526d73', timber: '#49524c', wood: '#958568', recess: '#293b43', stone: '#778487', foliage: '#587769', foliageShade: '#405f56', foliageLight: '#799681' },
  ember: { plaster: '#dfc69a', roof: '#824b3e', timber: '#604234', wood: '#a1784d', recess: '#443831', stone: '#928071', foliage: '#a0894c', foliageShade: '#79693f', foliageLight: '#b7a364' },
} as const;
export type Colorway = keyof typeof palettes;
export type Role = keyof typeof palettes.forest;
export type Parameters = TypedParameters & { colorway: Colorway };
export interface Control { key: string; label: string; min: number; max: number; step: number; integer?: boolean }
export interface Preset { id: string; name: string; parameters: Record<string, number | string> }
export interface Definition {
  paletteRoles: Role[]; relationshipMessage: string;
  label: string; defaults: Parameters; controls: Control[]; presets: Preset[]; extremes: Preset[];
  boundaryOverrides?: Record<string, Record<string, number>>;
  relationship: (p: Parameters) => boolean;
}
const control = (key: string, label: string, min: number, max: number, step = 0.05, integer = false): Control => ({ key, label, min, max, step, integer });
export const families: Record<'cottage' | 'tree' | 'fence' | 'crate' | 'boulder', Definition> = {
  cottage: {
    paletteRoles: ["plaster", "roof", "timber"], relationshipMessage: "Roof rise must be at most 0.4 \u00d7 footprint width. Widen the footprint or lower roof rise.",
    label: 'Workshop cottage',
    defaults: { width: 5, depth: 4, wallHeight: 2.8, roofRise: 1.4, colorway: 'forest' },
    controls: [control('width', 'Footprint width', 3.6, 7.2), control('depth', 'Footprint depth', 3, 5.5), control('wallHeight', 'Wall height', 2.5, 3.4), control('roofRise', 'Roof rise', 1, 2)],
    relationship: p => Number(p.roofRise) <= Number(p.width) * 0.4 + 1e-9,
    presets: [
      { id: 'workshop', name: 'Workshop', parameters: {} },
      { id: 'compact', name: 'Compact', parameters: { width: 3.6, depth: 3.2, wallHeight: 2.5, roofRise: 1.15, colorway: 'harbor' } },
      { id: 'longhouse', name: 'Longhouse', parameters: { width: 7.2, depth: 4.6, wallHeight: 2.8, roofRise: 1.65, colorway: 'ember' } },
    ],
    extremes: [
      { id: 'low-wide', name: 'Wide / low roof', parameters: { width: 7.2, depth: 3, wallHeight: 2.5, roofRise: 1 } },
      { id: 'tall-compact', name: 'Tall / compact', parameters: { width: 3.6, depth: 3, wallHeight: 3.4, roofRise: 1.44 } },
      { id: 'deep-steep', name: 'Deep / steep', parameters: { width: 5, depth: 5.5, wallHeight: 3.4, roofRise: 2 } },
    ],
  },
  tree: {
    paletteRoles: ["foliage", "foliageShade", "timber"], relationshipMessage: "Canopy spread must be 0.55\u20131.25 \u00d7 tree height. Increase spread or reduce height for a narrow crown; reduce spread or increase height for a broad crown.",
    label: 'Broadleaf tree',
    defaults: { height: 4.5, spread: 3.8, seed: 7, colorway: 'forest' },
    controls: [control('height', 'Tree height', 3, 6), control('spread', 'Canopy spread', 2.4, 5.4), control('seed', 'Growth seed', 0, 65535, 1, true)],
    relationship: p => Number(p.spread) >= Number(p.height) * 0.55 - 1e-9 && Number(p.spread) <= Number(p.height) * 1.25 + 1e-9,
    boundaryOverrides: { 'height-min': { spread: 3.6 }, 'spread-min': { height: 4.3 } },
    presets: [
      { id: 'orchard', name: 'Orchard', parameters: {} },
      { id: 'young', name: 'Young', parameters: { height: 3, spread: 2.4, seed: 18, colorway: 'harbor', growth: 'young', lean: 0.025 } },
      { id: 'shelter', name: 'Shelter', parameters: { height: 5.3, spread: 5.4, seed: 91, colorway: 'ember' } },
    ],
    extremes: [
      { id: 'broad-low', name: 'Broad / low', parameters: { height: 3, spread: 3.75, seed: 0 } },
      { id: 'slender-tall', name: 'Slender / tall', parameters: { height: 6, spread: 3.3, seed: 65535 } },
      { id: 'largest', name: 'Full envelope', parameters: { height: 6, spread: 5.4, seed: 46 } },
    ],
  },
  fence: {
    paletteRoles: ["timber", "wood"], relationshipMessage: "Post-center length divided by rail bays must be 0.6\u20132 m. Increase bays or reduce length above 2 m; reduce bays or increase length below 0.6 m.",
    label: 'Wooden fence',
    defaults: { length: 3, height: 1.1, bays: 2, colorway: 'forest' },
    controls: [control('length', 'Post center length', 1.2, 6), control('height', 'Post height', 0.7, 1.5), control('bays', 'Rail bays', 1, 4, 1, true)],
    relationship: p => Number(p.length) / Number(p.bays) >= 0.6 - 1e-9 && Number(p.length) / Number(p.bays) <= 2 + 1e-9,
    boundaryOverrides: { 'length-max': { bays: 3 }, 'bays-min': { length: 2 } },
    presets: [
      { id: 'garden', name: 'Garden', parameters: {} },
      { id: 'boundary', name: 'Boundary', parameters: { length: 4.8, height: 1.5, bays: 3, colorway: 'harbor' } },
      { id: 'low-run', name: 'Low run', parameters: { length: 5.6, height: 0.75, bays: 4, colorway: 'ember' } },
    ],
    extremes: [
      { id: 'short-high', name: 'Shortest / tall', parameters: { length: 1.2, height: 1.5, bays: 1 } },
      { id: 'long-low', name: 'Longest / low', parameters: { length: 6, height: 0.7, bays: 3 } },
      { id: 'dense', name: 'Minimum bay spacing', parameters: { length: 2.4, height: 1.1, bays: 4 } },
    ],
  },
  crate: {
    paletteRoles: ["wood", "timber"], relationshipMessage: "Height must be at most 1.6 \u00d7 the smaller of width and depth. Lower height or increase the smaller footprint dimension.",
    label: 'Supply crate',
    defaults: { width: 0.9, height: 0.7, depth: 0.7, colorway: 'forest' },
    controls: [control('width', 'Width', 0.45, 1.5), control('height', 'Height', 0.35, 1.2), control('depth', 'Depth', 0.4, 1.2)],
    relationship: p => Number(p.height) <= Math.min(Number(p.width), Number(p.depth)) * 1.6 + 1e-9,
    boundaryOverrides: { 'depth-min': { height: 0.6 }, 'height-max': { depth: 0.8 } },
    presets: [
      { id: 'supply', name: 'Supply', parameters: {} },
      { id: 'shallow', name: 'Shallow', parameters: { width: 1.3, height: 0.4, depth: 0.8, colorway: 'harbor' } },
      { id: 'tall', name: 'Tall', parameters: { width: 0.8, height: 1.15, depth: 0.8, colorway: 'ember' } },
    ],
    extremes: [
      { id: 'small', name: 'Small footprint', parameters: { width: 0.45, height: 0.35, depth: 0.4 } },
      { id: 'wide-flat', name: 'Wide / shallow', parameters: { width: 1.5, height: 0.35, depth: 1.2 } },
      { id: 'tall-limit', name: 'Tall limit', parameters: { width: 0.75, depth: 0.75, height: 1.2 } },
    ],
  },
  boulder: {
    paletteRoles: ["stone"], relationshipMessage: "Height must be at most 1.3 \u00d7 the smaller of width and depth. Lower height or increase the smaller footprint dimension.",
    label: 'Field boulder',
    defaults: { width: 1.6, height: 1, depth: 1.2, lean: 0.08, colorway: 'forest' },
    controls: [control('width', 'Width', 0.6, 2.8), control('height', 'Height', 0.35, 1.8), control('depth', 'Depth', 0.5, 2.4), control('lean', 'Shoulder lean', -0.18, 0.18, 0.01)],
    relationship: p => Number(p.height) <= Math.min(Number(p.width), Number(p.depth)) * 1.3 + 1e-9,
    boundaryOverrides: { 'width-min': { height: 0.7 }, 'depth-min': { height: 0.6 }, 'height-max': { depth: 1.5 } },
    presets: [
      { id: 'field', name: 'Field', parameters: {} },
      { id: 'slab', name: 'Slab', parameters: { width: 2.6, height: 0.65, depth: 1.8, lean: -0.14, colorway: 'harbor' } },
      { id: 'standing', name: 'Standing', parameters: { width: 1.4, height: 1.7, depth: 1.4, lean: 0.16, colorway: 'ember', form: 'standing' } },
    ],
    extremes: [
      { id: 'small-flat', name: 'Small / flat', parameters: { width: 0.6, depth: 0.5, height: 0.35, lean: -0.18 } },
      { id: 'broad-flat', name: 'Broad / flat', parameters: { width: 2.8, depth: 2.4, height: 0.35, lean: 0.18 } },
      { id: 'tall-limit', name: 'Tall limit', parameters: { width: 1.4, depth: 1.4, height: 1.8, lean: -0.18 } },
    ],
  },
};
export type Family = keyof typeof families;
export interface Configuration extends Design { family: Family; applied: Parameters }
function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value) || ![Object.prototype, null].includes(Object.getPrototypeOf(value))) throw new Error('Expected plain object');
  return value as Record<string, unknown>;
}
function saveLegacyConfiguration(family: Family, input: unknown): Configuration {
  if (!Object.hasOwn(families, family)) throw new Error('Unknown family');
  const definition = legacyFamilies[family], value = record(input), applied = { ...definition.defaults };
  const allowed = ['colorway', ...definition.controls.map(c => c.key)];
  for (const key of Reflect.ownKeys(value)) if (typeof key !== 'string' || !allowed.includes(key)) throw new Error('Unknown field: ' + String(key));
  for (const c of definition.controls) {
    if (!Object.hasOwn(value, c.key)) continue;
    const n = value[c.key];
    if (typeof n !== 'number' || !Number.isFinite(n)) throw new Error(c.key + ' must be finite number');
    if (n < c.min || n > c.max || (c.integer && !Number.isInteger(n))) throw new Error(c.key + ' outside allowed range or integer constraint');
    applied[c.key] = n;
  }
  if (Object.hasOwn(value, 'colorway')) {
    if (typeof value.colorway !== 'string' || !legacyColorways.includes(value.colorway)) throw new Error('Unsupported colorway');
    applied.colorway = value.colorway as Colorway;
  }
  if (!definition.relationship(applied)) throw new Error(family + ' dimension relationship: ' + definition.relationshipMessage);
  return { formatVersion: 1, family, familyVersion: '0.1.0', requested: { ...value }, applied };
}
function loadLegacyConfiguration(input: unknown): Configuration {
  const value = record(input);
  for (const key of Reflect.ownKeys(value)) if (!['formatVersion', 'family', 'familyVersion', 'requested', 'applied'].includes(String(key))) throw new Error('Unknown configuration field');
  if (value.formatVersion !== 1 || value.familyVersion !== '0.1.0' || typeof value.family !== 'string' || !Object.hasOwn(families, value.family)) throw new Error('Unsupported family/version');
  const saved = saveLegacyConfiguration(value.family as Family, value.requested);
  const applied = record(value.applied);
  if (Reflect.ownKeys(applied).length !== Object.keys(saved.applied).length || JSON.stringify(saveLegacyConfiguration(saved.family, applied).applied) !== JSON.stringify(saved.applied)) throw new Error('Applied parameters mismatch');
  return saved;
}
export function fixtures(family: Family): Preset[] {
  const d = families[family];
  return [
    ...d.presets, ...d.extremes,
    ...d.controls.flatMap(c => (['min', 'max'] as const).map(end => ({
      id: c.key + '-' + end, name: c.label + ' ' + end,
      parameters: { ...d.boundaryOverrides?.[c.key + '-' + end], [c.key]: c[end] },
    }))),
  ];
}

const numeric=(key:string,label:string,value:number,min:number,max:number,step:number,group:'shape'|'construction'='construction'):Extract<TypedControl,{kind:'range'|'integer'}>=>({kind:'range',key,label,default:value,min,max,step,group,unit:'m',hint:label+' adjusts connected construction.',affects:['geometry'],targets:[key]});
const choice=(key:string,label:string,value:string,options:string[],group:'construction'|'colors'='construction'):TypedControl=>({kind:'choice',key,label,default:value,options:options.map(value=>({value,label:value[0]!.toUpperCase()+value.slice(1)})),group,unit:'none',hint:'Select '+label.toLowerCase()+'.',affects:group==='colors'?['material']:['geometry','topology'],targets:[key]});
const toggle=(key:string,label:string,value:boolean):TypedControl=>({kind:'toggle',key,label,default:value,group:'construction',unit:'none',hint:'Include '+label.toLowerCase()+'.',affects:['topology'],targets:[key]});
export const cottageRoles={...palettes.forest,hardware:'#b99247'};

const remainingControls:Record<Exclude<Family,'cottage'>,TypedControl[]>={
  "tree": [
    {
      "key": "growth",
      "kind": "choice",
      "group": "construction",
      "label": "Growth form",
      "default": "mature",
      "options": [
        {
          "value": "young",
          "label": "Young branching"
        },
        {
          "value": "mature",
          "label": "Mature branching"
        }
      ],
      "hint": "Changes the trunk forks and crown organization at the same height.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "trunk",
        "trunk-elbow",
        "crown-main"
      ]
    },
    {
      "key": "lean",
      "kind": "range",
      "group": "shape",
      "label": "Trunk lean",
      "default": 0.055,
      "min": -0.1,
      "max": 0.1,
      "step": 0.005,
      "unit": "ratio",
      "ratioBasis": "height",
      "hint": "Crown displacement as a fraction of height; trunk and branches follow together.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "trunk",
        "trunk-elbow",
        "crown-main"
      ]
    }
  ],
  "fence": [
    {
      "key": "railStyle",
      "kind": "choice",
      "group": "construction",
      "label": "Rail construction",
      "default": "two-rail",
      "options": [
        {
          "value": "two-rail",
          "label": "Two rails"
        },
        {
          "value": "cross-braced",
          "label": "Cross braced"
        }
      ],
      "hint": "Adds a supported diagonal brace inside each rail bay.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "post-*",
        "rail-*",
        "brace-*"
      ]
    },
    {
      "key": "postHead",
      "kind": "choice",
      "group": "construction",
      "label": "Post head",
      "default": "chamfered",
      "options": [
        {
          "value": "flat",
          "label": "Flat cut"
        },
        {
          "value": "chamfered",
          "label": "Chamfered head"
        }
      ],
      "hint": "Changes the top profile while keeping post height and modular endpoints.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "post-*",
        "rail-*",
        "brace-*"
      ]
    },
    {
      "key": "detail",
      "kind": "choice",
      "group": "construction",
      "label": "Detail",
      "default": "inspection",
      "options": [
        {
          "value": "scene",
          "label": "Scene"
        },
        {
          "value": "inspection",
          "label": "Inspection"
        }
      ],
      "hint": "Inspection adds joint pegs; structural rails and supports remain in both tiers.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "post-*",
        "rail-*",
        "brace-*"
      ]
    }
  ],
  "crate": [
    {
      "key": "lid",
      "kind": "choice",
      "group": "construction",
      "label": "Lid",
      "default": "closed",
      "options": [
        {
          "value": "closed",
          "label": "Closed lid"
        },
        {
          "value": "open-top",
          "label": "Open top"
        }
      ],
      "hint": "Removes the lid to expose the real floor and interior.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "lid-*",
        "corner-*",
        "brace-*"
      ]
    },
    {
      "key": "brace",
      "kind": "choice",
      "group": "construction",
      "label": "Side brace",
      "default": "diagonal",
      "options": [
        {
          "value": "plain",
          "label": "Plain"
        },
        {
          "value": "diagonal",
          "label": "Diagonal brace"
        }
      ],
      "hint": "Adds a seated diagonal brace between frame members.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "lid-*",
        "corner-*",
        "brace-*"
      ]
    },
    {
      "key": "detail",
      "kind": "choice",
      "group": "construction",
      "label": "Detail",
      "default": "inspection",
      "options": [
        {
          "value": "scene",
          "label": "Scene"
        },
        {
          "value": "inspection",
          "label": "Inspection"
        }
      ],
      "hint": "Inspection adds selected joint hardware; boards and frame stay intact.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "lid-*",
        "corner-*",
        "brace-*"
      ]
    }
  ],
  "boulder": [
    {
      "key": "form",
      "kind": "choice",
      "group": "construction",
      "label": "Stone form",
      "default": "slab",
      "options": [
        {
          "value": "slab",
          "label": "Layered slab"
        },
        {
          "value": "standing",
          "label": "Standing fracture"
        }
      ],
      "hint": "Selects a distinct major-plane and shoulder construction.",
      "unit": "none",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "stone-mass"
      ]
    },
    {
      "key": "seed",
      "kind": "integer",
      "group": "shape",
      "label": "Fracture seed",
      "default": 17,
      "min": 0,
      "max": 65535,
      "step": 1,
      "unit": "seed",
      "hint": "Changes coherent shoulders and fracture planes within the selected form.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "stone-mass"
      ]
    }
  ]
};
const roleLabels:Record<string,Record<string,string>>={"tree":{"timber":"Bark","foliage":"Main foliage","foliageShade":"Shaded foliage","foliageLight":"Upper foliage"},"fence":{"timber":"Posts","wood":"Rails"},"crate":{"timber":"Frame","wood":"Boards"},"boulder":{"stone":"Stone"}};
export const familyVersion=(family:Family)=>family==='cottage'?'0.2.0':'0.3.0';
export function familyControls(family:Family,input:unknown={}):TypedControl[] {
  const raw=plainRecord(input),d=families[family],palette=typeof raw.colorway==='string'&&Object.hasOwn(palettes,raw.colorway)?raw.colorway as Colorway:'forest';
  const roles:Record<string,string>=family==='cottage'?{...palettes[palette],hardware:'#b99247'}:palettes[palette];
  const used:Record<Family,string[]>={cottage:['plaster','roof','timber','wood','recess','stone','hardware'],tree:['timber','foliage','foliageShade','foliageLight'],fence:['timber','wood'],crate:['wood','timber'],boulder:['stone']};
  const controls:TypedControl[]=d.controls.map(c=>({kind:c.integer?'integer':'range',key:c.key,label:c.label,default:Number(d.defaults[c.key]),min:c.min,max:c.max,step:c.step,group:'shape',...(family==='boulder'&&c.key==='lean'?{ratioBasis:'width' as const}:{}),unit:c.key==='seed'?'seed':c.integer?'count':c.key==='lean'?'ratio':'m',hint:d.relationshipMessage,affects:['geometry'],targets:[family]}));
  if(family==='cottage') controls.push(toggle('chimney','Chimney',true),choice('beamWeight','Beam section','stout',['light','stout']),numeric('eaveOverhang','Eave overhang',0.4,0.25,0.55,0.01),choice('workBay','Work bay','right',['none','left','right']),toggle('shutters','Window shutters',true),{...numeric('roofCharacter','Roof profile',0.45,0,1,0.05),unit:'ratio',ratioBasis:'normalized'},choice('detail','Detail','inspection',['scene','inspection']));
  if(family!=='cottage')controls.push(...remainingControls[family]);
  controls.push(choice('colorway','Colorway','forest',['forest','harbor','ember'],'colors'));
  for(const role of used[family])controls.push({kind:'color',key:'color.'+role,label:roleLabels[family]?.[role]??role,role,default:roles[role]!,group:'colors',unit:'color',hint:'Changes only '+role+' color.',affects:['material'],targets:[role]});
  return controls;
}
export function saveFamilyConfiguration(family:Family,input:unknown):Configuration {
  if(!Object.hasOwn(families,family))throw new Error('Unknown family');
  const applied=parseControls(familyControls(family,input),input) as Parameters;
  if(!families[family].relationship(applied))throw new ParameterError([{code:'relationship',keys:families[family].controls.map(c=>c.key),message:family+' dimension relationship: '+families[family].relationshipMessage}]);
  return {formatVersion:1,family,familyVersion:familyVersion(family),requested:{...plainRecord(input)},applied};
}
export function familyState(family:Family,input:unknown):ParameterState {
  let controls:TypedControl[];try{controls=familyControls(family,input);}catch(error){return {controls:{},issues:error instanceof ParameterError?error.issues:[]};}
  const state=parameterState(controls,input,p=>families[family].relationship(p as Parameters)?[]:[{code:'relationship',keys:families[family].controls.map(c=>c.key),message:families[family].relationshipMessage}]);
  const p={...families[family].defaults,...(input&&typeof input==='object'?input:{})} as Parameters;
  if(family==='cottage'&&typeof p.width==='number')state.controls.roofRise!.max=Math.min(2,p.width*0.4);
  if(family==='tree'&&p.growth==='young')state.controls['color.foliageLight']={enabled:false,hint:'Upper foliage is used by the mature crown only.'};
  return state;
}
export function loadFamilyConfiguration(input:unknown):Configuration {
  const value=plainRecord(input);
  if(typeof value.family!=='string'||!Object.hasOwn(families,value.family))throw new Error('Unsupported family');
  const family=value.family as Family;
  const version=familyVersion(family);
  if(value.familyVersion==='0.1.0'||(family!=='cottage'&&value.familyVersion==='0.2.0')) {
    const old=value.familyVersion==='0.1.0'?loadLegacyConfiguration(input):loadTypedLegacyConfiguration(input),next=saveFamilyConfiguration(family,old.applied);
    return {...next,migration:{fromVersion:old.familyVersion,toVersion:version,notice:'Design upgraded to typed controls; construction may differ. Original geometry replay is not guaranteed.'}};
  }
  if(value.formatVersion!==1||value.familyVersion!==version)throw new Error('Unsupported family/version');
  for(const key of Object.keys(value))if(!['formatVersion','family','familyVersion','requested','applied','migration'].includes(key))throw new Error('Unknown configuration field');
  const next=saveFamilyConfiguration(family,value.requested);
  const applied=plainRecord(value.applied);
  if(Reflect.ownKeys(applied).length!==Object.keys(next.applied).length||Object.entries(next.applied).some(([key,value])=>!Object.hasOwn(applied,key)||applied[key]!==value)) {
    throw new Error('Applied parameters mismatch');
  }
  if(value.migration!==undefined) {
    const m=plainRecord(value.migration);
    if(!(m.fromVersion==='0.1.0'||(family!=='cottage'&&m.fromVersion==='0.2.0'))||m.toVersion!==version||m.notice!=='Design upgraded to typed controls; construction may differ. Original geometry replay is not guaranteed.'||Object.keys(m).length!==3)throw new Error('Invalid migration notice');
    next.migration=m as unknown as NonNullable<Configuration['migration']>;
  }
  return next;
}
