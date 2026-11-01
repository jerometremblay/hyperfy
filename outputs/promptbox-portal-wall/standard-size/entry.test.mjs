import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { world, clean, flush, THREE, Controller, destroyWorlds } from '../../upper-office/motion-fix/runtime-harness.mjs'

const directory = new URL('./', import.meta.url)
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const checks = []
test.after(async () => {
  await destroyWorlds()
  await fs.writeFile(new URL('entry-validation.json', directory), JSON.stringify({
    valid: checks.length === 4, actualStandingPhysXController: true,
    radius: .3, totalHeight: 1.6, nativePortalActivationDistance: .3, checks,
  }, null, 2))
})
test('standing avatar reaches portal activation only through an open door', async () => {
  const w = await world({ client: true })
  w.graphics = null
  const executable = w.scripts.evaluate(source)
  const original = w.loader.get
  w.loader.get = (kind, url) => kind === 'script' && url === 'house' ? executable : original(kind, url)
  const app = w.addFurniture('house', [0, 0, 0], [0, 0, 0, 1], [1, 1, 1], { doors: {} })
  await flush(w)
  const player = w.addPlayer('p1')
  const controller = player.controller = new Controller({ radius: .3, height: 1, layer: 'player' })
  controller.activate({ world: w })
  w.bodies.push(controller)
  for (const [id, x] of [['billiards-portal-left', 5.8], ['billiards-portal-right', 7.6]]) {
    for (const open of [false, true]) {
      app.emit('doorState', { id, open })
      for (let frame = 0; frame < 40; frame++) {
        app.update(.02)
        clean(w)
        w.physics.preFixedUpdate(true)
        w.physics.postFixedUpdate(.02)
        w.physics.preUpdate(0)
        clean(w)
      }
      controller.teleport(new THREE.Vector3(x, .12, .1))
      for (let frame = 0; frame < 40; frame++) {
        controller.move(new THREE.Vector3(0, -.01, .05), .02)
        clean(w)
      }
      const distance = 1.34 - controller.position.z
      assert(distance > 0)
      if (open) assert(distance < .3, 'Open door must allow native remote portal activation')
      else assert(distance > .3, 'Closed door must keep the avatar outside native activation')
      checks.push({ id, open, feet: controller.position.toArray(), distanceToPortal: distance })
    }
    app.emit('doorState', { id, open: false })
  }
})
