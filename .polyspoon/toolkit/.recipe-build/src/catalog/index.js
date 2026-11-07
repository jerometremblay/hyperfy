import { buildRecipeAsset, disposeAsset } from './build.js';
export { disposeAsset } from './build.js';
import { splitAppearance, designInput } from './appearance.js';
import { registry, recipe } from '../recipes/index.js';
export const catalog = registry.descriptors;
export function descriptor(id) {
    return recipe(id).descriptor;
}
export function buildAsset(id = 'work-lantern', input = {}) {
    descriptor(id);
    return buildRecipeAsset(recipe(id), input);
}
export function loadDesign(input) {
    if (!input || typeof input !== 'object' || !('family' in input) || typeof input.family !== 'string')
        throw new Error('Design must identify its family');
    descriptor(input.family);
    const { parameters, appearance } = splitAppearance(input);
    const design = recipe(input.family).load(parameters);
    if (appearance) {
        const checked = buildAsset(design.family, { ...design.requested, appearance });
        disposeAsset(checked);
        design.appearance = appearance;
    }
    return design;
}
export function resolveExport(options, saved) {
    if (saved !== undefined) {
        if (options.preset)
            throw new Error('Choose either preset or config');
        const config = loadDesign(saved);
        if (options.family && options.family !== config.family)
            throw new Error('Family argument conflicts with saved configuration');
        return { family: config.family, input: designInput(config), migration: config.migration };
    }
    const d = descriptor(options.family ?? 'work-lantern');
    const preset = d.presets.find(p => p.id === (options.preset ?? d.presets[0].id));
    if (!preset)
        throw new Error('Unknown preset: ' + options.preset);
    return { family: d.id, input: preset.parameters, migration: undefined };
}
export function validationCases(id) { return recipe(id).validationCases; }
export function formatControl(c, value) {
    if (c.kind !== 'range' && c.kind !== 'integer')
        return String(value);
    if (c.unit === 'cm')
        return (value * 100).toFixed(1) + ' cm';
    if (c.unit === 'm')
        return value.toFixed(2) + ' m';
    if (c.unit === 'ratio')
        return value.toFixed(2) + (c.ratioBasis === 'height' ? ' × height' : c.key === 'lean' ? ' × width' : '');
    return String(value);
}
