import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { world, clean, flush, THREE, hotCallbacks, destroyWorlds } from '../upper-office/motion-fix/runtime-harness.mjs'
import { Layers } from '../../src/core/extras/Layers.js'

const directory = new URL('./', import.meta.url)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const plan = JSON.parse(await fs.readFile(new URL('plan.json', directory)))
const checks = []
test.after(async () => {
  await destroyWorlds()
  await fs.writeFile(new URL('physics-validation.json', directory), JSON.stringify({
    valid: checks.length === 6, actualPhysXWasm: true, actualFullHouseScript: true, checks,
  }, null, 2))
})
test('blind recesses retain backing collision and unobstructed approaches under native app transforms', async () => {
  for (const client of [false, true]) for (const transform of [
    { position: [0, 0, 0], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] },
    { position: [30, 1, 10], quaternion: [0, Math.sin(.65), 0, Math.cos(.65)], scale: [1.4, 1.4, 1.4] },
    { position: [-20, 1, 12], quaternion: [0, Math.sin(-.45), 0, Math.cos(-.45)], scale: [1.2, .9, 1.4] },
  ]) {
    const w = await world({ client })
    w.graphics = null
    const executable = w.scripts.evaluate(source)
    const original = w.loader.get
    w.loader.get = (kind, url) => kind === 'script' && url === 'house' ? executable : original(kind, url)
    const app = w.addFurniture('house', transform.position, transform.quaternion, transform.scale,
      { doors: {}, lighting: {} })
    await flush(w)
    clean(w)
    assert.equal(app.scriptError, null)
    assert.equal(hotCallbacks(app), 0)
    assert.equal(app.worldNodes.size, 0)
    const matrix = new THREE.Matrix4().compose(
      new THREE.Vector3().fromArray(transform.position),
      new THREE.Quaternion().fromArray(transform.quaternion),
      new THREE.Vector3().fromArray(transform.scale),
    )
    const rotation = new THREE.Quaternion().fromArray(transform.quaternion)
    for (const portal of plan.portals) {
      const [x, floor, z] = portal.houseLocal
      const forward = new THREE.Vector3(0, 0, 1).applyQuaternion(rotation)
      const fromFront = new THREE.Vector3(x, floor + 1.2, z - .8).applyMatrix4(matrix)
      const hit = w.physics.raycast(fromFront, forward, 3 * transform.scale[2], Layers.environment.group)
      assert(hit, 'Each doorway must end at a solid wall')
      const local = hit.point.clone().applyMatrix4(matrix.clone().invert())
      assert(Math.abs(local.z - 1.9) < .01, 'The approach must be clear until the backing wall')
      assert(Math.abs(local.x - x) < .01)
      const fromBack = new THREE.Vector3(x, floor + 1.2, 2.7).applyMatrix4(matrix)
      const backHit = w.physics.raycast(fromBack, forward.clone().negate(), 2 * transform.scale[2],
        Layers.environment.group)
      assert(backHit)
      const backLocal = backHit.point.clone().applyMatrix4(matrix.clone().invert())
      assert(Math.abs(backLocal.z - 2.02) < .01, 'The rear must remain closed')
    }
    checks.push({ client, transform, twoClearApproaches: true, solidFrontAndBack: true, idleCallbacks: 0 })
  }
})
