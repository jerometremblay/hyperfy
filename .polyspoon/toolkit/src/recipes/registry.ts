import { parseControls, plainRecord } from '../engine/parameters.ts';
import type { Descriptor } from '../engine/parameters.ts';
import type { Recipe, RecipeCase } from './types.ts';

const identifier = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;
const sourcePath = /^(?:src|examples)\/(?:[a-zA-Z0-9_-]+\/)*[a-zA-Z0-9_-]+\.ts$/;

function unique(values: string[], label: string): void {
  if (new Set(values).size !== values.length) throw new Error('Duplicate ' + label);
}

function validateCases(cases: RecipeCase[], label: string, descriptor: Descriptor): void {
  unique(cases.map(c => c.id), label);
  for (const c of cases) {
    if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(c.id) || !c.name.trim()) throw new Error('Invalid ' + label);
    descriptor.save(c.parameters);
  }
}

export function validateRecipe(recipe: Recipe): void {
  const d = recipe.descriptor;
  if (!identifier.test(d.id) || !/^\d+\.\d+\.\d+$/.test(d.version)) throw new Error('Invalid recipe identity');
  if (!d.title.trim() || !d.description.trim()) throw new Error('Missing recipe description');
  if (typeof recipe.build !== 'function' || typeof recipe.load !== 'function' || typeof d.save !== 'function' || typeof d.state !== 'function') throw new Error('Missing recipe operation');
  if (!sourcePath.test(recipe.source.entry) || !/^[A-Za-z_$][\w$]*$/.test(recipe.source.exportName)) throw new Error('Invalid recipe source entry');
  if (!recipe.presentation.category.trim() || !Number.isFinite(recipe.presentation.order)) throw new Error('Invalid recipe presentation');
  unique(recipe.presentation.kitIds, 'kit id');
  if (recipe.presentation.kitIds.some(id => !identifier.test(id))) throw new Error('Invalid kit id');
  if (!recipe.constraints.every(value => typeof value === 'string' && value.trim())) throw new Error('Invalid constraints');
  unique(d.controls.map(c => c.key), 'control key');
  for (const c of d.controls) {
    if (!c.key || ['__proto__', 'constructor', 'prototype'].includes(c.key)) throw new Error('Invalid control key');
    if (!c.label.trim() || !c.targets.length || !c.affects.length) throw new Error('Incomplete control: ' + c.key);
    if (c.kind === 'range' || c.kind === 'integer') {
      if (![c.min, c.max, c.step].every(Number.isFinite) || c.min > c.max || c.step <= 0) throw new Error('Invalid control bounds: ' + c.key);
      if (c.kind === 'integer' && ![c.min,c.max,c.step].every(Number.isInteger)) throw new Error('Invalid integer control: ' + c.key);
    }
    if (c.kind === 'choice') {
      unique(c.options.map(o => o.value), 'choice value');
      if (!c.options.length) throw new Error('Empty choice: ' + c.key);
    }
  }
  parseControls(d.controls, {});
  parseControls(d.controls, d.defaults);
  const saved = d.save(d.defaults);
  if (saved.family !== d.id || saved.familyVersion !== d.version) throw new Error('Defaults identify a different recipe');
  if (Object.keys(d.defaults).length !== Object.keys(saved.applied).length || Object.entries(d.defaults).some(([key,value]) => saved.applied[key] !== value)) throw new Error('Defaults differ from applied parameters');
  if (!d.presets.length || !recipe.validationCases.length) throw new Error('Recipe needs presets and validation cases');
  validateCases(d.presets, 'preset id', d);
  validateCases(recipe.validationCases, 'validation case id', d);
  validateCases(recipe.integrationCases, 'integration case id', d);
  unique(d.palettes.map(p => p.id), 'palette id');
  for(const palette of d.palettes) {
    if(!d.controls.some(c=>c.key==='colorway')&&palette.parameters===undefined)throw new Error('Palette requires semantic parameters: '+palette.id);
    if(palette.parameters!==undefined) {
      try {
        const patch=plainRecord(palette.parameters),keys=Reflect.ownKeys(patch);
        if(!keys.length||keys.some(key=>typeof key!=='string'||!d.controls.some(c=>c.key===key&&c.kind==='color')))throw new Error('Expected semantic color parameters');
        parseControls(d.controls,patch);
      } catch {throw new Error('Invalid palette parameters: '+palette.id);}
    }
  }
  if (recipe.presentation.thumbnails) {
    const thumbnails = plainRecord(recipe.presentation.thumbnails);
    for (const [id, path] of Object.entries(thumbnails)) {
      if (!d.presets.some(p => p.id === id) || typeof path !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9_-]*\.png$/.test(path)) throw new Error('Invalid thumbnail');
    }
  }
}

export class RecipeRegistry {
  readonly descriptors: Descriptor[] = [];
  readonly #recipes = new Map<string, Recipe>();

  register(recipe: Recipe): void {
    if (this.#recipes.has(recipe.descriptor.id)) throw new Error('Duplicate recipe: ' + recipe.descriptor.id);
    validateRecipe(recipe);
    this.#recipes.set(recipe.descriptor.id, recipe);
    this.descriptors.push(recipe.descriptor);
  }

  get(id: string): Recipe {
    const result = this.#recipes.get(id);
    if (!result) throw new Error('Unknown family: ' + id);
    return result;
  }
}
