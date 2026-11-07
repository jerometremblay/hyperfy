import * as lantern from '../lantern/config.ts';
import { generateLantern } from '../lantern/generator.ts';
import { families, palettes, buildFamily, loadFamilyConfiguration, saveFamilyConfiguration, fixtures } from '../families/index.ts';
import type { Family } from '../families/index.ts';
import { familyControls, familyState, familyVersion } from '../families/config.ts';
import type { Descriptor, Design } from '../engine/parameters.ts';
import type { AssetBuild } from '../catalog/types.ts';
import type { Recipe, RecipeCase } from './types.ts';

const descriptions:Record<Family,string>={cottage:'A timber workshop with a deep entrance and working bay.',tree:'Broad crowns and a supported branching silhouette.',fence:'An open wooden boundary.',crate:'Timber storage with open slats or closed sides.',boulder:'A grounded faceted stone.'};
const builtinDescriptors: Descriptor[] = [{
  id:lantern.family,version:lantern.familyVersion,title:'Work lantern',description:'A rustic vessel or utility light with adjustable hood and carry hoop.',
  controls:lantern.lanternControls(),defaults:lantern.parseParameters({}),
  presets:lantern.presets.map(p=>({...p,parameters:{...p.parameters}})),
  palettes:Object.entries(lantern.colorways).map(([id,p])=>({id,label:p.label,colors:[p.body,p.enclosure,p.structure]})),
  save:lantern.saveConfiguration,state:lantern.lanternState,
},...Object.entries(families).map(([id,d]):Descriptor=>({
  id,version:familyVersion(id as Family),title:d.label,description:descriptions[id as Family],
  controls:familyControls(id as Family),defaults:saveFamilyConfiguration(id as Family,{}).applied,
  presets:d.presets.map(p=>({...p,description:p.name+' proportions'})),
  palettes:Object.entries(palettes).map(([way])=>({id:way,label:way[0]!.toUpperCase()+way.slice(1),colors:d.paletteRoles.map(role=>String(saveFamilyConfiguration(id as Family,{colorway:way}).applied['color.'+role]))})),
  save:input=>saveFamilyConfiguration(id as Family,input),state:input=>familyState(id as Family,input),
}))];
function builtinCases(id: string) {
  const d = builtinDescriptors.find(d => d.id === id)!;
  if (id !== 'work-lantern') return [...fixtures(id as Family),...(id==='cottage'?[
    {id:'left-open',name:'Left bay / no shutters',parameters:{workBay:'left',shutters:false}},
    {id:'plain-scene',name:'No bay or chimney / scene',parameters:{workBay:'none',chimney:false,detail:'scene',beamWeight:'light'}},
    {id:'profile-max',name:'Maximum roof profile / overhang',parameters:{roofCharacter:1,eaveOverhang:0.55,width:3.6,roofRise:1.44}},
  ]:[])];
  return [...d.presets,{id:'heavy-crossbar',name:'Heavy crossbar',parameters:{frameWeight:'heavy',guardLayout:'crossbar'}},{id:'light-scene',name:'Light scene',parameters:{frameWeight:'light',detail:'scene'}}, { id: 'wide-low', name: 'Wide low', parameters: { bodyWidth: 0.44, bodyHeight: 0.18, handleClearance: 0.075 } }, { id: 'narrow-tall', name: 'Narrow tall', parameters: { bodyWidth: 0.22, bodyHeight: 0.297, handleClearance: 0.143 } }];
}

const categories: Record<string,string> = {'work-lantern':'Props',cottage:'Buildings',tree:'Nature',fence:'Structures',crate:'Props',boulder:'Nature'};
const order = ['cottage','tree','work-lantern','fence','crate','boulder'];

function builtin(id: string, exportName: string): Recipe {
  const descriptor = builtinDescriptors.find(d => d.id === id)!;
  const integrationCases: RecipeCase[] = id === 'work-lantern' ? [] : [{id:'default',name:'Default',parameters:{}}];
  if (id === 'fence') integrationCases.push({id:'longest',name:'Longest fence',parameters:{length:6,bays:3}});
  if (id === 'cottage') integrationCases.push({id:'widest',name:'Widest cottage',parameters:{width:7.2}});
  return {
    descriptor,
    build: input => (id === 'work-lantern' ? generateLantern(input) : buildFamily(id as Family,input)) as unknown as AssetBuild,
    load: input => (id === 'work-lantern' ? lantern.loadConfiguration(input) : loadFamilyConfiguration(input)) as unknown as Design,
    validationCases:builtinCases(id),integrationCases,
    constraints:[id === 'work-lantern' ? 'bodyHeight <= 1.35 × bodyWidth; handleClearance <= 0.65 × bodyWidth' : families[id as Family].relationshipMessage],
    presentation:{category:categories[id]!,order:order.indexOf(id)*10,kitIds:['woodland-workshop'],thumbnails:Object.fromEntries(descriptor.presets.map(p => [p.id,id+'-'+p.id+'.png']))},
    source:{entry:'src/recipes/builtins.ts',exportName},
  };
}

export const lanternRecipe = builtin('work-lantern','lanternRecipe');
export const cottageRecipe = builtin('cottage','cottageRecipe');
export const treeRecipe = builtin('tree','treeRecipe');
export const fenceRecipe = builtin('fence','fenceRecipe');
export const crateRecipe = builtin('crate','crateRecipe');
export const boulderRecipe = builtin('boulder','boulderRecipe');
