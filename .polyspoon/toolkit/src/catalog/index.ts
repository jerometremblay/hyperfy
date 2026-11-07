import { buildRecipeAsset, disposeAsset } from './build.ts';
export { disposeAsset } from './build.ts';
import { splitAppearance, designInput } from './appearance.ts';
import { registry, recipe } from '../recipes/index.ts';
import type { Design, Control, Descriptor } from '../engine/parameters.ts';
import type { SemanticAssetBuild } from './types.ts';
export type { Design, Control, Descriptor, ParameterValue } from '../engine/parameters.ts';
export type { AssetBuild, SemanticAssetBuild, Preview } from './types.ts';
export const catalog = registry.descriptors;

export function descriptor(id: string): Descriptor {
  return recipe(id).descriptor;
}
export function buildAsset(id = 'work-lantern', input: unknown = {}): SemanticAssetBuild {
  descriptor(id);
  return buildRecipeAsset(recipe(id),input);
}
export function loadDesign(input: unknown): Design {
  if (!input || typeof input !== 'object' || !('family' in input) || typeof input.family !== 'string') throw new Error('Design must identify its family');
  descriptor(input.family);
  const {parameters,appearance}=splitAppearance(input);
  const design=recipe(input.family).load(parameters);
  if(appearance){const checked=buildAsset(design.family,{...design.requested,appearance});disposeAsset(checked);design.appearance=appearance;}
  return design;
}
export function resolveExport(options: { family?: string; preset?: string }, saved?: unknown) {
  if (saved !== undefined) {
    if (options.preset) throw new Error('Choose either preset or config');
    const config = loadDesign(saved);
    if (options.family && options.family !== config.family) throw new Error('Family argument conflicts with saved configuration');
    return { family: config.family, input: designInput(config), migration: config.migration };
  }
  const d = descriptor(options.family ?? 'work-lantern');
  const preset = d.presets.find(p => p.id === (options.preset ?? d.presets[0]!.id));
  if (!preset) throw new Error('Unknown preset: ' + options.preset);
  return { family: d.id, input: preset.parameters, migration: undefined };
}
export function validationCases(id: string) { return recipe(id).validationCases; }
export function formatControl(c: Control, value: number): string {
  if (c.kind !== 'range' && c.kind !== 'integer') return String(value);
  if (c.unit === 'cm') return (value * 100).toFixed(1) + ' cm';
  if (c.unit === 'm') return value.toFixed(2) + ' m';
  if (c.unit === 'ratio') return value.toFixed(2) + (c.ratioBasis==='height' ? ' × height' : c.key==='lean' ? ' × width' : '');
  return String(value);
}
