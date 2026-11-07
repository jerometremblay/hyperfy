import '../scripts/node-platform.ts';
import test from 'node:test';
import assert from 'node:assert/strict';
import { Mesh } from 'three';
import { validateBytes } from 'gltf-validator';
import { buildAsset, descriptor, disposeAsset, loadDesign, validationCases } from '../src/catalog/index.ts';
import { exportDeliverable } from '../src/catalog/delivery.ts';
import { readSemantics } from '../src/catalog/semantics.ts';
import { inspectGeometry } from '../src/lantern/inspect.ts';

const family = 'cognac-leather-sofa';

test('sofa construction cases have valid geometry, semantics and saved designs', async () => {
  for (const item of validationCases(family)) {
    const build = buildAsset(family, item.parameters);
    try {
      assert.deepEqual(inspectGeometry(build.root).errors, [], item.id);
      assert.deepEqual(loadDesign(JSON.parse(JSON.stringify(build.config))), build.config, item.id);
      assert.ok(readSemantics(build.root).parts.length, item.id);
      const bytes = await exportDeliverable(build);
      const result = await validateBytes(bytes, { maxIssues: 100 });
      assert.equal(result.issues.numErrors, 0, item.id);
      assert.equal(result.issues.numWarnings, 0, item.id);
    } finally { disposeAsset(build); }
  }
  assert.throws(() => buildAsset(family, { seatCount: 6 }));
  assert.throws(() => buildAsset(family, { unexpected: true }));
});

test('all seat and back cushions use the selected leather and preserve their names', () => {
  const two = buildAsset(family, { seatCount: 2, 'color.leather': '#2478bd' });
  const five = buildAsset(family, { seatCount: 5, 'color.leather': '#abcdef' });
  try {
    const names = new Set(readSemantics(five.root).parts.map(part => part.id));
    for (const part of readSemantics(two.root).parts) assert.ok(names.has(part.id), part.id);
    for (const [build, count, color] of [[two, 2, '#2478bd'], [five, 5, '#abcdef']] as const) {
      for (let i = 1; i <= count; i++) for (const kind of ['seat', 'back']) {
        const mesh = build.root.getObjectByName(`${kind}-cushion-${i}-part-0`);
        assert.ok(mesh instanceof Mesh);
        assert.equal(mesh.userData.materialRole, 'leather');
        assert.ok(!Array.isArray(mesh.material));
        assert.ok('color' in mesh.material);
        assert.equal(`#${mesh.material.color.getHexString()}`, color);
      }
    }
    assert.ok(descriptor(family).controls.some(control => control.key === 'seatRadius'));
    assert.ok(descriptor(family).controls.some(control => control.key === 'bevelThickness'));
  } finally { disposeAsset(two); disposeAsset(five); }
});
