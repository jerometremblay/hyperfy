import {loadFamilyConfiguration as loadRevision2} from './revision3-config.ts';
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
export interface Preset { id: string; name: string; parameters: Record<string, number | string | boolean> }
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
families.cottage.presets=[{"id":"workshop","name":"Weathered thatch workshop","parameters":{"roofCover":"thatch","roofThickness":0.28,"ridgeSag":1.1,"roofCharacter":0.6,"beamSection":1.15,"weathering":0.55,"timberTone":0.3}},{"id":"compact","name":"Clean shingle cottage","parameters":{"width":3.6,"depth":3.2,"wallHeight":2.5,"roofRise":1.15,"roofCover":"shingle","roofThickness":0.16,"windowLayout":"workshop","framingStyle":"upright","workBay":"none","roofCharacter":0.1,"ridgeSag":0.4,"beamSection":0.85,"weathering":0.1,"timberTone":0.5}},{"id":"longhouse","name":"Deep sheltered longhouse","parameters":{"width":7.2,"depth":4.6,"wallHeight":2.8,"roofRise":1.65,"roofCover":"thatch","roofThickness":0.34,"windowLayout":"sparse","framingStyle":"diagonal","workBay":"none","roofCharacter":0.7,"ridgeSag":1.1,"beamSection":1.25,"weathering":0.7,"timberTone":0.25}}];
families.tree.presets=[{"id":"orchard","name":"Spring orchard","parameters":{"season":"spring","branchCount":3,"canopyFullness":0.96,"forkHeight":0.3,"trunkGirth":0.2}},{"id":"young","name":"Slender summer sapling","parameters":{"height":3,"spread":2.4,"growth":"young","architecture":"upright","branchCount":2,"canopyFullness":0.86,"forkHeight":0.4,"trunkGirth":0.15,"lean":0.025,"season":"summer","seed":18}},{"id":"shelter","name":"Autumn shelter crown","parameters":{"height":5.3,"spread":5.4,"growth":"mature","architecture":"spreading","branchCount":4,"canopyFullness":1.05,"forkHeight":0.26,"trunkGirth":0.28,"lean":-0.035,"season":"autumn","seed":91}}];
families.fence.presets=[{"id":"garden","name":"Peaked garden pickets","parameters":{"length":2.4,"height":0.95,"bays":2,"infill":"pickets","railCount":2,"picketSpacing":0.13,"postHead":"peaked","weathering":0.15,"timberTone":0.55}},{"id":"boundary","name":"Four-rail boundary","parameters":{"length":4.8,"height":1.4,"bays":3,"railStyle":"cross-braced","railCount":4,"memberWeight":"stout","weathering":0.65,"timberTone":0.25,"toneVariation":0.09}},{"id":"low-run","name":"Light pasture rails","parameters":{"length":5.6,"height":0.8,"bays":4,"railCount":2,"memberWeight":"light","postHead":"flat","weathering":0.4,"timberTone":0.65}}];
families.crate.presets=[{"id":"supply","name":"Closed shipping chest","parameters":{"lid":"closed","brace":"diagonal","weathering":0.15,"timberTone":0.25,"slatGap":0.01}},{"id":"shallow","name":"Golden produce crate","parameters":{"width":1.1,"height":0.5,"depth":0.75,"lid":"open-top","brace":"plain","plankCourses":4,"slatGap":0.035,"frameWeight":"stout","weathering":0.35,"timberTone":0.6}},{"id":"tall","name":"Weathered tall storage","parameters":{"width":0.8,"height":1.15,"depth":0.8,"plankCourses":6,"slatGap":0.024,"lid":"open-top","brace":"diagonal","weathering":0.8,"timberTone":0.35,"toneVariation":0.1}}];
families.boulder.presets=[{"id":"field","name":"Buried mossy field stone","parameters":{"form":"field","facetGrade":0,"burialDepth":0.25,"mossCoverage":0.75,"angularity":0.45}},{"id":"slab","name":"Low weathered shelf","parameters":{"width":2.6,"height":0.65,"depth":1.8,"form":"slab","angularity":0.6,"crest":-0.24,"shoulderHeight":0.48,"moss":"top","mossCoverage":0.75,"burialDepth":0.08}},{"id":"standing","name":"Dry standing fracture","parameters":{"width":1.4,"height":1.7,"depth":1.4,"form":"standing","angularity":0.95,"crest":0.16,"shoulderHeight":0.77,"lean":0.16,"moss":"none","burialDepth":0}}];
families.boulder.defaults.height=.95;
export type Family = keyof typeof families;
export interface Configuration extends Design { family: Family; applied: Parameters }
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
export const familyVersion=(_family:Family)=>'0.5.0';
const revision3Controls:Partial<Record<Family,TypedControl[]>>={
  "cottage": [
    {
      "key": "roofCover",
      "label": "Roof covering",
      "kind": "choice",
      "unit": "none",
      "default": "thatch",
      "options": [
        {
          "value": "thatch",
          "label": "Thatch"
        },
        {
          "value": "shingle",
          "label": "Shingle"
        }
      ],
      "group": "construction",
      "hint": "Roof covering reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "cottage"
      ]
    },
    {
      "key": "roofThickness",
      "label": "Roof thickness",
      "kind": "range",
      "default": 0.24,
      "min": 0.14,
      "max": 0.38,
      "step": 0.01,
      "unit": "m",
      "group": "construction",
      "hint": "Roof thickness reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "cottage"
      ]
    },
    {
      "key": "framingStyle",
      "label": "Facade framing",
      "kind": "choice",
      "unit": "none",
      "default": "diagonal",
      "options": [
        {
          "value": "diagonal",
          "label": "Diagonal"
        },
        {
          "value": "upright",
          "label": "Upright"
        }
      ],
      "group": "construction",
      "hint": "Facade framing reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "cottage"
      ]
    },
    {
      "key": "windowLayout",
      "label": "Window grouping",
      "kind": "choice",
      "unit": "none",
      "default": "paired",
      "options": [
        {
          "value": "paired",
          "label": "Paired"
        },
        {
          "value": "workshop",
          "label": "Workshop"
        },
        {
          "value": "sparse",
          "label": "Sparse"
        }
      ],
      "group": "construction",
      "hint": "Window grouping reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "cottage"
      ]
    },
    {
      "key": "bayDepth",
      "label": "Work bay depth",
      "kind": "range",
      "default": 1.65,
      "min": 1.1,
      "max": 2.3,
      "step": 0.05,
      "unit": "m",
      "group": "construction",
      "hint": "Work bay depth reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "cottage"
      ]
    }
  ],
  "tree": [
    {
      "key": "forkHeight",
      "label": "Fork height",
      "kind": "range",
      "default": 0.31,
      "min": 0.23,
      "max": 0.43,
      "step": 0.01,
      "unit": "ratio",
      "ratioBasis": "height",
      "group": "construction",
      "hint": "Fork height reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "tree"
      ]
    },
    {
      "key": "canopyFullness",
      "label": "Canopy fullness",
      "kind": "range",
      "default": 0.85,
      "min": 0.65,
      "max": 1.05,
      "step": 0.01,
      "unit": "ratio",
      "ratioBasis": "normalized",
      "group": "construction",
      "hint": "Canopy fullness reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "tree"
      ]
    },
    {
      "key": "trunkGirth",
      "label": "Trunk radius",
      "kind": "range",
      "default": 0.32,
      "min": 0.22,
      "max": 0.48,
      "step": 0.01,
      "unit": "m",
      "group": "construction",
      "hint": "Trunk radius in meters before taper; mature base flare is 1.45 times this radius and root wedges extend farther. Young growth uses 0.82 times this radius.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "tree"
      ]
    },
    {
      "key": "branchCount",
      "label": "Crown branches",
      "kind": "integer",
      "default": 6,
      "min": 5,
      "max": 8,
      "step": 1,
      "unit": "count",
      "group": "construction",
      "hint": "Crown branches reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "tree"
      ]
    },
    {
      "key": "architecture",
      "label": "Crown architecture",
      "kind": "choice",
      "unit": "none",
      "default": "spreading",
      "options": [
        {
          "value": "spreading",
          "label": "Spreading"
        },
        {
          "value": "upright",
          "label": "Upright"
        }
      ],
      "group": "construction",
      "hint": "Crown architecture reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "tree"
      ]
    }
  ],
  "boulder": [
    {
      "key": "angularity",
      "label": "Plane angularity",
      "kind": "range",
      "default": 0.7,
      "min": 0.3,
      "max": 1,
      "step": 0.05,
      "unit": "ratio",
      "ratioBasis": "normalized",
      "group": "construction",
      "hint": "Higher angularity narrows the clipped corner transition faces; major stone planes remain broad.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "boulder"
      ]
    },
    {
      "key": "crest",
      "label": "Crest bias",
      "kind": "range",
      "default": -0.12,
      "min": -0.28,
      "max": 0.24,
      "step": 0.02,
      "unit": "ratio",
      "ratioBasis": "normalized",
      "group": "construction",
      "hint": "Biases top-plane tilt and the upper stone position within the footprint; total height is preserved.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "boulder"
      ]
    },
    {
      "key": "shoulderHeight",
      "label": "Shoulder height",
      "kind": "range",
      "default": 0.66,
      "min": 0.45,
      "max": 0.8,
      "step": 0.01,
      "unit": "ratio",
      "ratioBasis": "height",
      "group": "construction",
      "hint": "Sets the relative shoulder cutting level; the final solid is normalized to the requested total height.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "boulder"
      ]
    },
    {
      "key": "moss",
      "label": "Moss region",
      "kind": "choice",
      "unit": "none",
      "default": "top",
      "options": [
        {
          "value": "none",
          "label": "None"
        },
        {
          "value": "top",
          "label": "Top"
        }
      ],
      "group": "construction",
      "hint": "Moss region reshapes connected construction.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "boulder"
      ]
    },
    {
      "key": "mossCoverage",
      "label": "Moss coverage",
      "kind": "range",
      "default": 0.48,
      "min": 0.2,
      "max": 0.8,
      "step": 0.05,
      "unit": "ratio",
      "ratioBasis": "normalized",
      "group": "construction",
      "hint": "Expands bounded patches inside upper surface polygons; larger coverage may use a second supporting face.",
      "affects": [
        "geometry",
        "topology"
      ],
      "targets": [
        "boulder"
      ]
    }
  ]
};
revision3Controls.fence=[{"kind": "integer", "default": 2, "min": 2, "max": 4, "key": "railCount", "label": "Rail count", "group": "construction", "hint": "Changes railCount through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["fence"], "unit": "count", "step": 1}, {"kind": "choice", "default": "stout", "options": [{"value": "light", "label": "Light"}, {"value": "stout", "label": "Stout"}], "key": "memberWeight", "label": "Member section", "group": "construction", "hint": "Changes memberWeight through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["fence"], "unit": "none"}, {"kind": "choice", "default": "open", "options": [{"value": "open", "label": "Open"}, {"value": "pickets", "label": "Pickets"}], "key": "infill", "label": "Infill", "group": "construction", "hint": "Changes infill through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["fence"], "unit": "none"}, {"kind": "range", "unit": "m", "default": 0.16, "min": 0.1, "max": 0.25, "step": 0.01, "key": "picketSpacing", "label": "Picket spacing", "group": "construction", "hint": "Changes picketSpacing through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["fence"]}];
revision3Controls.crate=[{"kind": "integer", "default": 4, "min": 3, "max": 6, "key": "plankCourses", "label": "Plank courses", "group": "construction", "hint": "Changes plankCourses through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["crate"], "unit": "count", "step": 1}, {"kind": "range", "unit": "m", "default": 0.018, "min": 0.008, "max": 0.055, "step": 0.001, "key": "slatGap", "label": "Slat gap", "group": "construction", "hint": "Changes slatGap through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["crate"]}, {"kind": "choice", "default": "stout", "options": [{"value": "light", "label": "Light"}, {"value": "stout", "label": "Stout"}], "key": "frameWeight", "label": "Frame section", "group": "construction", "hint": "Changes frameWeight through the connected assembly.", "affects": ["geometry", "topology"], "targets": ["crate"], "unit": "none"}, {"kind": "range", "unit": "ratio", "ratioBasis": "normalized", "default": 0.06, "min": 0, "max": 0.12, "step": 0.01, "key": "toneVariation", "label": "Board tone variation", "group": "construction", "hint": "Changes toneVariation through the connected assembly.", "affects": ["material"], "targets": ["crate"]}];
const constructionHelp:Record<string,{hint:string;targets:string[]}>={
 railCount:{hint:'Places two to four supported horizontal rails in each bay.',targets:['rail-*','joint-peg-*']},
 memberWeight:{hint:'Changes post, rail and picket sections together while preserving the run length.',targets:['post-*','post-cap-*','rail-*','picket-*','brace-*']},
 infill:{hint:'Adds pointed timber pickets between the posts.',targets:['picket-*']},
 picketSpacing:{hint:'Target picket center spacing in meters; each bay fits a whole number with at least 20 mm between boards.',targets:['picket-*']},
 plankCourses:{hint:'Fits this many horizontal wall boards between the bottom support and top rim.',targets:['front-plank-*','side-plank-*']},
 slatGap:{hint:'Clear vertical gaps between wall boards; floor and lid gaps are capped for support.',targets:['front-plank-*','side-plank-*','floor-board-*','lid-plank-*']},
 frameWeight:{hint:'Changes corner and rim sections and refits the boards to their inner span.',targets:['corner-*','face-rim-*','side-rim-*','front-plank-*','side-plank-*','diagonal-*']},
 toneVariation:{hint:'Adds restrained repeating light and dark board tones derived from the Boards color; shape stays unchanged.',targets:['wood-tone-*']},
};
export function familyControls(family:Family,input:unknown={}):TypedControl[] {
  const raw=plainRecord(input),d=families[family],palette=typeof raw.colorway==='string'&&Object.hasOwn(palettes,raw.colorway)?raw.colorway as Colorway:'forest';
  const roles:Record<string,string>=family==='cottage'?{...palettes[palette],roof:raw.roofCover==='shingle'?palettes[palette].roof:palette==='harbor'?'#b0a078':palette==='ember'?'#b79558':'#b7a16b',hardware:'#b99247'}:{...palettes[palette]};
  if(family==='fence'){roles.timber='#896039';roles.wood='#b68747';}
  if(family==='crate'){roles.timber='#a57c48';roles.wood='#bd9458';}
  if(family==='cottage')roles.timber='#49382c';
  if(family==='tree'){
    const season=String(raw.season??'summer');
    const colors:Record<string,[string,string,string]>={spring:['#78994e','#577a40','#96ad60'],summer:['#587b42','#426337','#759050'],autumn:['#b6863e','#8c6736','#c8a450'],winter:['#768275','#5d6b61','#97a295']};
    [roles.foliage,roles.foliageShade,roles.foliageLight]=colors[season]??colors.summer!;
  }
  const used:Record<Family,string[]>={cottage:['plaster','roof','timber','wood','recess','stone','hardware'],tree:['timber','foliage','foliageShade','foliageLight'],fence:['timber','wood'],crate:['wood','timber'],boulder:['stone']};
  const controls:TypedControl[]=d.controls.map(c=>({kind:c.integer?'integer':'range',key:c.key,label:c.label,default:Number(d.defaults[c.key]),min:c.min,max:c.max,step:c.step,group:'shape',...(family==='boulder'&&c.key==='lean'?{ratioBasis:'width' as const}:{}),unit:c.key==='seed'?'seed':c.integer?'count':c.key==='lean'?'ratio':'m',hint:d.relationshipMessage,affects:['geometry'],targets:[family]}));
  if(family==='cottage') controls.push(toggle('chimney','Chimney',true),choice('beamWeight','Beam section','stout',['light','stout']),numeric('eaveOverhang','Eave overhang',0.4,0.25,0.55,0.01),choice('workBay','Work bay','right',['none','left','right']),toggle('shutters','Window shutters',true),{...numeric('roofCharacter','Roof profile',0.45,0,1,0.05),unit:'ratio',ratioBasis:'normalized'},choice('detail','Detail','inspection',['scene','inspection']));
  if(family!=='cottage')controls.push(...remainingControls[family].map(c=>({...c})));
  controls.push(...(revision3Controls[family]??[]).map(c=>constructionHelp[c.key]?{...c,...constructionHelp[c.key]}:c));
  const setDefault=(key:string,value:number|string|boolean)=>{const c=controls.find(c=>c.key===key);if(c)Object.assign(c,{default:value});};
  const ratio=(key:string,label:string,value:number,min:number,max:number,affects:TypedControl['affects']=['geometry']):TypedControl=>({...numeric(key,label,value,min,max,.05),unit:'ratio',ratioBasis:'normalized',affects,targets:[family]});
  if(['cottage','fence','crate'].includes(family)){
    controls.push(ratio('weathering','Timber weathering',.3,0,1,['geometry','material']),ratio('timberTone','Timber tone',.35,0,1,['material']));
    if(family!=='crate')controls.push(ratio('toneVariation','Timber tone variation',.06,0,.12,['material']));
  }
  if(family==='cottage')controls.push(ratio('beamSection','Beam section multiplier',1,.7,1.4),ratio('ridgeSag','Ridge sag multiplier',1,.25,1.15));
  if(family==='crate'){setDefault('lid','open-top');setDefault('brace','plain');setDefault('slatGap',.035);}
  if(family==='tree'){
    setDefault('branchCount',3);setDefault('canopyFullness',1);
    const branches=controls.find(c=>c.key==='branchCount');if(branches&&'min' in branches)branches.min=2;
    const fullness=controls.find(c=>c.key==='canopyFullness');if(fullness&&'max' in fullness)fullness.max=1.16;
    const girth=controls.find(c=>c.key==='trunkGirth');if(girth&&'min' in girth)girth.min=.12;
    controls.push(choice('season','Crown season','summer',['spring','summer','autumn','winter'],'colors'));
  }
  if(family==='fence'){
    const head=controls.find(c=>c.key==='postHead');if(head?.kind==='choice')head.options=[...head.options,{value:'peaked',label:'Peaked'}];
  }
  if(family==='boulder'){
    const form=controls.find(c=>c.key==='form');if(form?.kind==='choice'){form.default='field';form.options=[...form.options,{value:'field',label:'Field boulder'}];}
    controls.push({...numeric('facetGrade','Facet grade',1,0,2,1),kind:'integer',unit:'count'},
      ratio('burialDepth','Buried fraction',.12,0,.4));
  }
  if(family==='tree'){
    const inferred={...families.tree.defaults,canopyFullness:1,...raw} as TypedParameters;
    const index=controls.findIndex(c=>c.key==='trunkGirth'),radius=controls[index];
    const limit=treeRadiusLimit(inferred);
    if(radius&&(radius.kind==='range'||radius.kind==='integer')&&Number.isFinite(limit))controls[index]={...radius,default:Math.min(.22,limit)};
  }
  controls.push(choice('colorway','Colorway','forest',['forest','harbor','ember'],'colors'));
  for(const role of used[family])controls.push({kind:'color',key:'color.'+role,label:roleLabels[family]?.[role]??role,role,default:roles[role]!,group:'colors',unit:'color',hint:'Changes only '+role+' color.',affects:['material'],targets:[role]});
  if(family==='boulder')controls.push({kind:'color',key:'color.moss',label:'Moss',role:'moss',default:'#66724b',group:'colors',unit:'color',hint:'Changes the coherent upper moss region.',affects:['material'],targets:['moss-region']});
  return controls;
}
function treeRadiusLimit(p:TypedParameters) {return Math.min(.48,Number(p.height)*.11,Number(p.spread)*Number(p.canopyFullness)*.15);}
function constructionIssues(family:Family,p:TypedParameters) {
  if(family==='tree'&&Number(p.trunkGirth)>treeRadiusLimit(p)+1e-9)return [{code:'construction',keys:['trunkGirth','height','spread','canopyFullness'],message:'Trunk radius exceeds the supported crown/height relationship. Reduce radius to '+treeRadiusLimit(p).toFixed(3)+' m, or increase tree height, canopy spread or fullness.'}];
  if(family!=='crate')return [];
  const size=Math.min(Number(p.width),Number(p.height),Number(p.depth)),frame=size*(p.frameWeight==='light'?.085:.13);
  const plank=Math.min(.045,Math.max(.022,size*.065)),usable=Number(p.height)-frame*1.34-plank;
  return (usable-Number(p.slatGap)*(Number(p.plankCourses)-1))/Number(p.plankCourses)<.018
    ? [{code:'construction',keys:['slatGap','plankCourses','height'],message:'Reduce slat gaps or plank courses, or increase crate height to retain 18 mm boards.'}]:[];
}
export function saveFamilyConfiguration(family:Family,input:unknown):Configuration {
  if(!Object.hasOwn(families,family))throw new Error('Unknown family');
  const applied=parseControls(familyControls(family,input),input) as Parameters;
  if(!families[family].relationship(applied))throw new ParameterError([{code:'relationship',keys:families[family].controls.map(c=>c.key),message:family+' dimension relationship: '+families[family].relationshipMessage}]);
  const construction=constructionIssues(family,applied);if(construction.length)throw new ParameterError(construction);
  return {formatVersion:1,family,familyVersion:familyVersion(family),requested:{...plainRecord(input)},applied};
}
export function familyState(family:Family,input:unknown):ParameterState {
  let controls:TypedControl[];try{controls=familyControls(family,input);}catch(error){return {controls:{},issues:error instanceof ParameterError?error.issues:[]};}
  const state=parameterState(controls,input,p=>families[family].relationship(p as Parameters)?[]:[{code:'relationship',keys:families[family].controls.map(c=>c.key),message:families[family].relationshipMessage}]);
  const p={...Object.fromEntries(controls.map(c=>[c.key,c.default])),...(input&&typeof input==='object'?input:{})} as Parameters;
  state.issues.push(...constructionIssues(family,p));
  if(family==='tree'){state.controls.trunkGirth!.max=treeRadiusLimit(p);state.controls.trunkGirth!.hint='Radius limit follows height and canopy size; unsupported requests are rejected, never clamped.';}
  if(family==='cottage'&&typeof p.width==='number')state.controls.roofRise!.max=Math.min(2,p.width*0.4);

  if(family==='boulder'&&p.form!=='field')state.controls.facetGrade={enabled:false,hint:'Facet grade applies to field boulders; slab and standing use authored fracture planes.'};
  if(family==='boulder'&&p.moss==='none'){state.controls['color.moss']={enabled:false,hint:'Enable top moss to edit its color.'};state.controls.mossCoverage={enabled:false,hint:'Enable top moss to edit its coverage.'};}
  if(family==='cottage'&&p.workBay==='none')state.controls.bayDepth={enabled:false,hint:'Add a work bay to edit its depth.'};
  if(family==='fence'&&p.infill==='open')state.controls.picketSpacing={enabled:false,hint:'Choose picket infill to set spacing.'};
  if(family==='crate'){
    const size=Math.min(Number(p.width),Number(p.height),Number(p.depth)),frame=size*(p.frameWeight==='light'?.085:.13),plank=Math.min(.045,Math.max(.022,size*.065));
    state.controls.slatGap!.max=Math.min(.055,(Number(p.height)-frame*1.34-plank-Number(p.plankCourses)*.018)/(Number(p.plankCourses)-1));
  }
  return state;
}
export function loadFamilyConfiguration(input:unknown):Configuration {
  const value=plainRecord(input);
  if(typeof value.family!=='string'||!Object.hasOwn(families,value.family))throw new Error('Unsupported family');
  const family=value.family as Family;
  const version=familyVersion(family);
  if(value.familyVersion!==version) {
    const old=loadRevision2(input),next=saveFamilyConfiguration(family,old.applied);
    return {...next,migration:{fromVersion:String(value.familyVersion),toVersion:version,notice:'Construction redesigned for revision 4; prior geometry is not reproduced.'}};
  }
  if(value.formatVersion!==1||value.familyVersion!==version)throw new Error('Unsupported family/version');
  for(const key of Reflect.ownKeys(value))if(typeof key!=='string'||!['formatVersion','family','familyVersion','requested','applied','migration'].includes(key))throw new Error('Unknown configuration field');
  const next=saveFamilyConfiguration(family,value.requested);
  const applied=plainRecord(value.applied);
  if(Reflect.ownKeys(applied).length!==Object.keys(next.applied).length||Object.entries(next.applied).some(([key,value])=>!Object.hasOwn(applied,key)||applied[key]!==value)) {
    throw new Error('Applied parameters mismatch');
  }
  if(value.migration!==undefined) {
    const m=plainRecord(value.migration);
    const supportedFrom=family==='cottage'?['0.1.0','0.2.0','0.4.0']:['0.1.0','0.2.0','0.3.0','0.4.0'];
    if(typeof m.fromVersion!=='string'||!supportedFrom.includes(m.fromVersion)||m.toVersion!==version||m.notice!=='Construction redesigned for revision 4; prior geometry is not reproduced.'||Reflect.ownKeys(m).length!==3)throw new Error('Invalid migration notice');
    next.migration=m as unknown as NonNullable<Configuration['migration']>;
  }
  return next;
}
