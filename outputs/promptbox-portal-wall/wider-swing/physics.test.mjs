import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { world, clean, flush, THREE, hotCallbacks, destroyWorlds } from '../../upper-office/motion-fix/runtime-harness.mjs'
import { Layers } from '../../../src/core/extras/Layers.js'

const directory = new URL('./', import.meta.url)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const ids = ['billiards-portal-left', 'billiards-portal-right']
const checks = []
test.after(async () => {
  await destroyWorlds()
  await fs.writeFile(new URL('physics-validation.json', directory), JSON.stringify({
    valid: checks.length === 6, actualPhysXWasm: true, actualFullHouseScript: true, checks,
  }, null, 2))
})
test('each matching door opens, blocks entry when closed, and settles without idle updates', async () => {
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
    const direction = new THREE.Vector3(0, 0, 1)
      .applyQuaternion(new THREE.Quaternion().fromArray(transform.quaternion))
    const open = [false, false]
    function checkDoorways() {
      for (const [i, x] of [5.8, 7.6].entries()) {
        const origin = new THREE.Vector3(x, 1.32, .5).applyMatrix4(matrix)
        const hit = w.physics.raycast(origin, direction, 3 * transform.scale[2], Layers.environment.group)
        assert(hit)
        const local = hit.point.clone().applyMatrix4(matrix.clone().invert())
        assert(Math.abs(local.z - (open[i] ? 1.505 : 1.2975)) < .01,
          `${ids[i]} should hit ${open[i] ? 'continuous timber wall' : 'closed leaf'}; got ${local.z}`)
        if (!open[i]) assert(local.z < 1.34, 'Closed leaf stops entry before the native portal plane')
      }
    }
    checkDoorways()
    for (const i of [0, 1, 0, 1]) {
      open[i] = !open[i]
      app.emit(client ? 'doorState' : 'toggleDoor',
        client ? { id: ids[i], open: open[i] } : { id: ids[i] }, 'p1')
      assert(hotCallbacks(app) > 0)
      for (let frame = 0; frame < 60; frame++) {
        app.update(.02)
        clean(w)
        w.physics.preFixedUpdate(true)
        w.physics.postFixedUpdate(.02)
        w.physics.preUpdate(0)
        clean(w)
      }
      assert.equal(hotCallbacks(app), 0)
      checkDoorways()
      if (!client) assert.equal(app.data.state.doors[ids[i]], open[i])
    }
    checks.push({ client, transform, independentOpenAndClose: true,
      closedLeafBeforePortal: true, openApproachClear: true, idleCallbacks: 0 })
  }
})
