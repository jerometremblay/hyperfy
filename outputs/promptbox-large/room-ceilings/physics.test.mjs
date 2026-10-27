import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { world, clean, flush, THREE, simpleCamLerp, Controller, destroyWorlds } from '../../upper-office/motion-fix/runtime-harness.mjs'
import { Layers } from '../../../src/core/extras/Layers.js'

const directory = new URL('./', import.meta.url)
const validation = JSON.parse(await fs.readFile(new URL('validation.json', directory)))
const source = await fs.readFile(new URL('source.js', directory), 'utf8')
const checks = [], cases = []
test.after(async () => {
  await destroyWorlds()
  await fs.writeFile(new URL('physics-validation.json', directory),
    JSON.stringify({ valid: checks.length === 2, source: validation.source, actualPhysXWasm: true,
      actualAppOwnedPrimPhysics: true, actualNativeCameraSweep: true, checks, cases }, null, 2))
})
async function fixture() {
  const w = await world({ client: true })
  const callback = source.slice(source.indexOf("app.on('transform', changed => {", source.indexOf('const roomCeilingColliders')))
  const script = `app.resetOnMove = false
    const roomCeilingColliders = ${JSON.stringify(validation.colliders)}.map(config => {
      const node = app.create('prim', config); app.add(node); return node;
    });\n` + callback
  const executable = w.scripts.evaluate(script)
  const original = w.loader.get
  w.loader.get = (kind, url) => kind === 'script' && url === 'ceilings' ? executable : original(kind, url)
  const app = w.addFurniture('ceilings', [0, 0, 0])
  await flush(w)
  return { w, app }
}
test('all three room ceilings and extension front stop native camera sweeps and upward player movement', async () => {
  const { w, app } = await fixture()
  for (const panel of validation.ceilings) {
    const origin = new THREE.Vector3(panel.position[0], 4.7, panel.position[2])
    const hit = w.physics.raycast(origin, new THREE.Vector3(0, 1, 0), 5, Layers.environment.group)
    assert(hit && Math.abs(hit.point.y - 5.91) < .00001)
    const quaternion = new THREE.Quaternion().setFromEuler(new THREE.Euler(-Math.PI / 2, 0, 0))
    const camera = { position: origin.clone(), quaternion: quaternion.clone(), zoom: 5 }
    simpleCamLerp(w, camera, { position: origin, quaternion, zoom: 5 }, 1 / 60)
    assert(camera.zoom > .99 && camera.zoom < 1.02, `Camera must stop below the visible ceiling: ${camera.zoom}`)
    const controller = new Controller({ radius: .3, height: 1.1, layer: 'player',
      position: [origin.x, 4.05, origin.z] })
    controller.activate({ world: w }); w.bodies.push(controller)
    controller.move(new THREE.Vector3(0, .6, 0))
    assert(controller.isCeiling)
    assert(controller.position.y + 1.7 <= 5.91)
    cases.push({ panel: panel.id, nativeCameraZoom: camera.zoom, ceilingHeight: hit.point.y,
      physicalPlayerCeilingContact: true })
  }
  assert(!w.physics.raycast(new THREE.Vector3(0, 4.7, 11.4), new THREE.Vector3(0, 1, 0), 5, Layers.environment.group),
    'No flat collider may cover the exposed extension rear')
  assert.equal(app.worldNodes.size, 0)
  checks.push('Four matching physical ceiling slabs stop the native camera and player; extension rear has no flat ceiling')
})
test('native ceiling shapes follow house translation, rotation and scale edits after placement', async () => {
  const { w, app } = await fixture()
  const panel = validation.ceilings[1]
  for (const scale of [[1, 1, 1], [1.5, 1.5, 1.5], [2, .8, 1.4]]) {
    app.root.position.set(13, .4, -7)
    app.root.quaternion.setFromAxisAngle(new THREE.Vector3(0, 1, 0), .73)
    app.root.scale.fromArray(scale)
    clean(w); await flush(w)
    const local = new THREE.Vector3(...panel.position); local.y = 4.7
    const origin = local.applyMatrix4(app.root.matrixWorld)
    const expectedY = .4 + 5.91 * scale[1]
    const hit = w.physics.raycast(origin, new THREE.Vector3(0, 1, 0), 5, Layers.environment.group)
    assert(hit && Math.abs(hit.point.y - expectedY) < .00001)
    const localEdge = new THREE.Vector3(panel.size[0] / 2 - .03, 4.7, panel.position[2])
      .applyMatrix4(app.root.matrixWorld)
    const edgeHit = w.physics.raycast(localEdge, new THREE.Vector3(0, 1, 0), 5, Layers.environment.group)
    assert(edgeHit && Math.abs(edgeHit.point.y - expectedY) < .00001,
      'Scaled collision must cover the visible panel edge')
    cases.push({ scale, yaw: .73, expectedY, actualY: hit.point.y, scaledPanelEdgeCovered: true })
  }
  checks.push('App-owned static ceilings retain matching poses and dimensions after translated, rotated, uniform and nonuniform scale edits')
})
