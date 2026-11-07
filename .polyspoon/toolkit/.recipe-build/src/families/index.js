import { cottage } from './cottage.js';
import { tree } from './tree.js';
import { fence } from './fence.js';
import { crate } from './crate.js';
import { boulder } from './boulder.js';
import { saveFamilyConfiguration } from './config.js';
export { families, palettes, fixtures, saveFamilyConfiguration, loadFamilyConfiguration } from './config.js';
export { disposeFamily } from './assembly.js';
const builders = { cottage, tree, fence, crate, boulder };
export function buildFamily(family, input = {}) {
    const config = saveFamilyConfiguration(family, input);
    return builders[family](config);
}
