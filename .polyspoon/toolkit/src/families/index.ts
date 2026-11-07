import { cottage } from './cottage.ts';
import { tree } from './tree.ts';
import { fence } from './fence.ts';
import { crate } from './crate.ts';
import { boulder } from './boulder.ts';
import { saveFamilyConfiguration } from './config.ts';
import type { Family } from './config.ts';
export { families, palettes, fixtures, saveFamilyConfiguration, loadFamilyConfiguration } from './config.ts';
export type { Family, Configuration, Parameters, Role } from './config.ts';
export { disposeFamily } from './assembly.ts';
export type { FamilyBuild } from './assembly.ts';
const builders = { cottage, tree, fence, crate, boulder };
export function buildFamily(family: Family, input: unknown = {}) {
  const config = saveFamilyConfiguration(family, input);
  return builders[family](config);
}
