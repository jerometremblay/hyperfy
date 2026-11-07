import { Box3, Group, Mesh, Vector3 } from 'three';
import { loadConstructionDesign } from '../../../src/engine/construction-migration.ts';
import { parameterState, parseControls, plainRecord } from '../../../src/engine/parameters.ts';
import type { Control, Design, Descriptor } from '../../../src/engine/parameters.ts';
import type { AssetBuild } from '../../../src/catalog/types.ts';
import type { Recipe, RecipeCase } from '../../../src/recipes/types.ts';
import { createAsset, metadata } from './sofa.ts';

// The toolkit's unit enum has no "mm". The label carries the unit, while the
// numeric values remain integer millimetres for the Hyperfy-compatible recipe.
const controls = metadata.controls.map(control =>
  control.unit === 'mm' ? { ...control, unit: 'none' } : control
) as Control[];

function save(input: unknown): Design {
  const requested = { ...plainRecord(input) };
  return {
    formatVersion: 1,
    family: metadata.id,
    familyVersion: metadata.version,
    requested,
    applied: parseControls(controls, requested),
  };
}

function load(input: unknown): Design {
  return loadConstructionDesign(input, metadata.id, metadata.version, [], save, () => {
    throw new Error('No prior sofa versions are supported');
  });
}

function build(input: unknown): AssetBuild {
  const config = save(input);
  const model = createAsset(config.applied);
  // The Hyperfy sofa faces -Z; Polyspoon's semantic coordinate contract faces +Z.
  const root = new Group();
  root.name = metadata.id;
  model.rotation.y = Math.PI;
  root.add(model);
  const materials: AssetBuild['materials'] = {};
  let staticIndex = 0;
  root.traverse(object => {
    if (!(object instanceof Mesh)) return;
    const parentName = object.parent?.name || '';
    const cushion = /^(seat|back)-cushion-\d+$/.test(parentName);
    const index = cushion ? object.parent!.children.indexOf(object) : staticIndex++;
    object.name = cushion ? `${parentName}-part-${index}` : `sofa-part-${index}`;
    object.userData.partId = object.name;
    const material = object.material;
    if (Array.isArray(material)) throw new Error('Sofa part requires one material');
    material.name = `${object.userData.materialRole}-${object.name}`;
    materials[material.name] = material;
  });
  root.updateMatrixWorld(true);
  const seat = root.getObjectByName('seat-cushion-1-part-0');
  if (!seat) throw new Error('Missing seat cushion');
  const anchors = { ground: [0, 0, 0], seat: [0, new Box3().setFromObject(seat, true).max.y, 0.085] };
  root.userData = { configuration: config, units: 'meters', up: '+Y', forward: '+Z', origin: 'ground-center', anchors };
  root.updateMatrixWorld(true);
  const bounds = new Box3().setFromObject(root, true);
  return { root, config, materials, anchors, bounds, dimensions: bounds.getSize(new Vector3()) };
}

const descriptor: Descriptor = {
  id: metadata.id, version: metadata.version, title: metadata.title,
  description: metadata.description, controls,
  defaults: parseControls(controls, {}), presets: metadata.presets, palettes: [],
  save, state: input => parameterState(controls, input),
};

const boundaries: RecipeCase[] = controls.flatMap(control =>
  control.kind === 'range' || control.kind === 'integer' ? [
    { id: `${control.key}-min`, name: `${control.label} minimum`, parameters: { [control.key]: control.min } },
    { id: `${control.key}-max`, name: `${control.label} maximum`, parameters: { [control.key]: control.max } },
  ] : []
);

export const cognacLeatherSofaRecipe: Recipe = {
  descriptor, build, load,
  validationCases: [
    { id: 'default', name: 'Default three-seat sofa', parameters: {} },
    ...boundaries,
  ],
  integrationCases: [
    { id: 'default', name: 'Default three-seat sofa', parameters: {} },
    { id: 'two-seats', name: 'Two seats with blue leather', parameters: { seatCount: 2, 'color.leather': '#2478bd' } },
  ],
  constraints: [
    'Rounded extrusion profiles and bevels are parameterized; sitting interactions are not exported.',
    'Bevel dimensions are integer millimetres. The other dimensions are in metres.',
  ],
  presentation: { category: 'Furniture', order: 100, kitIds: [] },
  source: { entry: 'examples/recipes/cognac-leather-sofa/index.ts', exportName: 'cognacLeatherSofaRecipe' },
};
