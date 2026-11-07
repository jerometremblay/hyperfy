export function applyPalette(descriptor, input, id) {
    const palette = descriptor.palettes.find(p => p.id === id);
    if (!palette)
        throw new Error('Unknown palette: ' + id);
    const next = { ...plainRecord(input) };
    if (descriptor.controls.some(c => c.key === 'colorway')) {
        for (const key of Object.keys(next))
            if (key.startsWith('color.'))
                delete next[key];
        next.colorway = id;
        return next;
    }
    if (!palette.parameters)
        throw new Error('Palette requires semantic parameters: ' + id);
    return { ...next, ...palette.parameters };
}
export function paletteMatches(descriptor, applied, id) {
    const palette = descriptor.palettes.find(p => p.id === id);
    if (!palette)
        return false;
    if (descriptor.controls.some(c => c.key === 'colorway'))
        return applied.colorway === id;
    return Boolean(palette.parameters && Object.entries(palette.parameters).every(([key, value]) => applied[key] === value));
}
export class ParameterError extends Error {
    issues;
    constructor(issues) {
        super(issues.map(issue => issue.message).join('; '));
        this.issues = issues;
        this.name = 'ParameterError';
    }
}
export function plainRecord(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input) || ![Object.prototype, null].includes(Object.getPrototypeOf(input)))
        throw new ParameterError([{ code: 'type', keys: [], message: 'Expected plain object' }]);
    return input;
}
export function parseControls(controls, input) {
    const value = plainRecord(input), result = {}, issues = [];
    for (const key of Reflect.ownKeys(value))
        if (typeof key !== 'string' || !controls.some(c => c.key === key))
            issues.push({ code: 'unknown', keys: [String(key)], message: 'Unknown field: ' + String(key) });
    for (const c of controls) {
        const v = Object.hasOwn(value, c.key) ? value[c.key] : c.default;
        let valid = false;
        if (c.kind === 'range' || c.kind === 'integer')
            valid = typeof v === 'number' && Number.isFinite(v) && v >= c.min && v <= c.max && (c.kind !== 'integer' || Number.isInteger(v));
        if (c.kind === 'choice')
            valid = typeof v === 'string' && c.options.some(o => o.value === v);
        if (c.kind === 'toggle')
            valid = typeof v === 'boolean';
        if (c.kind === 'color')
            valid = typeof v === 'string' && /^#[0-9a-f]{6}$/i.test(v);
        if (!valid)
            issues.push({ code: 'domain', keys: [c.key], message: c.key + ' has invalid ' + c.kind + ' value' });
        else
            result[c.key] = c.kind === 'color' ? v.toLowerCase() : v;
    }
    if (issues.length)
        throw new ParameterError(issues);
    return result;
}
export function parameterState(controls, input, relations = () => []) {
    const state = { controls: Object.fromEntries(controls.map(c => [c.key, { enabled: true, ...(c.kind === 'range' || c.kind === 'integer' ? { min: c.min, max: c.max } : {}) }])), issues: [] };
    try {
        state.issues = relations(parseControls(controls, input));
    }
    catch (error) {
        if (error instanceof ParameterError)
            state.issues = error.issues;
        else
            throw error;
    }
    return state;
}
export function controlMetadata(controls) {
    return controls.map(({ unit, inputUnit, ...control }) => ({ ...control, unit, inputUnit: inputUnit ?? (unit === 'cm' ? 'm' : unit === 'count' || unit === 'seed' ? 'integer' : unit === 'ratio' || unit === 'none' && (control.kind === 'range' || control.kind === 'integer') ? 'dimensionless' : unit), displayUnit: unit }));
}
