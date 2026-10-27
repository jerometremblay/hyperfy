import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const directory = new URL('./', import.meta.url)
const sourceName = process.env.DOOR_ACTION_SOURCE || 'source.js'
const source = await fs.readFile(new URL(sourceName, directory), 'utf8')
const bundled = await build({
  stdin: { contents: `export { executeSource } from './outputs/promptbox-large/runtime-adapter.mjs';
    export { ClientActions } from './src/core/systems/ClientActions.js';`, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { executeSource, ClientActions } = await import('data:text/javascript;base64,' +
  Buffer.from(bundled.outputFiles[0].contents).toString('base64'))
const ids = ['bedroom-1', 'bedroom-2', 'bedroom-3', 'entrance-left', 'entrance-right', 'patio-left']
const cases = []
test.after(async () => {
  if (sourceName === 'source.js') await fs.writeFile(new URL('action-validation.json', directory),
    JSON.stringify({ valid: cases.length === 12, actualNativeClientActions: true,
      actualNativeActionNodes: true, actualGeometryRaycast: true, cases }, null, 2))
})
for (const open of [false, true]) test(`native pointer action targets every ${open ? 'open' : 'closed'} door handle and triggers the right door`, async () => {
  const sends = []
  const runtime = await executeSource(source, '\nreturn { doorRegistry }', {
    state: { doors: Object.fromEntries(ids.map(id => [id, open])) }, onSend: (name, data) => sends.push({ name, data }),
  })
  const entity = runtime.root.ctx.entity
  const keys = Object.fromEntries(['keyE', 'touchB', 'xrLeftTrigger', 'xrRightTrigger', 'xrLeftBtn1'].map(k => [k, { down: false }]))
  const control = { ...keys, pointer: { locked: true, position: new THREE.Vector2() }, mouseLeft: { pressed: false } }
  const w = { xr: { session: null }, builder: { enabled: false }, rig: { position: new THREE.Vector3() },
    controls: { bind: () => control }, entities: { player: { data: { id: 'p1' } } },
    stage: { viewport: {}, scene: new THREE.Scene(), raycastReticle: () => [] } }
  const actions = w.actions = new ClientActions(w)
  actions.start()
  runtime.root.ctx.world.actions = actions
  for (const n of runtime.nodes.filter(n => n.name === 'action')) n.mount()
  const meshes = runtime.visuals.map(v => {
    const mesh = new THREE.Mesh(v.geometry, new THREE.MeshBasicMaterial({ side: THREE.DoubleSide }))
    mesh.matrixWorld.copy(v.matrix); mesh.matrixAutoUpdate = false; mesh.userData.node = v.node
    return mesh
  })
  for (const id of ids) {
    const door = runtime.audit.doorRegistry[id]
    const handles = runtime.nodes.filter(n => n.id?.startsWith('doors:' + id + '-') &&
      (n.id.includes('-handle:') || n.id.includes('-latch:')))
    const handle = handles.find(n => n.position.z > 0) || handles[0]
    const point = new THREE.Vector3().setFromMatrixPosition(handle.matrixWorld)
    const normal = new THREE.Vector3(0, 0, door.face === 'entrance' ? -1 : 1)
      .transformDirection(handle.parent.matrixWorld)
    // At 175 degrees aim at the accessible face away from the wall.
    if (!door.slideDistance && open) {
      if (normal.z * (door.face === 'entrance' ? -1 : 1) < 0) normal.negate()
    }
    w.rig.position.copy(point).addScaledVector(normal, .8)
    const ray = new THREE.Raycaster(w.rig.position, point.clone().sub(w.rig.position).normalize(), .001, 2)
    const hit = ray.intersectObjects(meshes, false)[0]
    assert(hit, id + ' handle must be visible')
    w.stage.raycastReticle = () => [{ point: hit.point, node: hit.object.userData.node, getEntity: () => entity }]
    control.mouseLeft.pressed = false
    actions.update(1 / 60)
    const doorActions = door.actions || [door.action]
    assert(doorActions.includes(actions.current.node?.getProxy()),
      `${id} ${open ? 'open' : 'closed'} handle should target its own moving action`)
    const nativeAction = actions.current.node
    assert.equal(nativeAction.label, door.slideDistance ? (open ? 'Slide closed' : 'Slide open') : (open ? 'Close door' : 'Open door'))
    control.mouseLeft.pressed = true
    actions.update(1 / 60)
    assert.deepEqual(sends.at(-1), { name: 'toggleDoor', data: { id } })
    let panelChecks = 0
    for (const x of [.05, door.width / 2, door.width - .05]) {
      for (const y of [.05, door.height / 2, door.height - .05]) {
        const panelPoint = new THREE.Vector3(door.direction * x, y, 0).applyMatrix4(handle.parent.matrixWorld)
        // Include a third-person camera three metres behind the pointed surface.
        for (const distance of [.8, 3.8]) {
          // A room wall limits the real camera before it reaches that distance.
          const clearance = new THREE.Raycaster(panelPoint.clone().addScaledVector(normal, .2),
            normal, .001, distance).intersectObjects(meshes, false)[0]
          const cameraDistance = clearance ? Math.min(distance, clearance.distance + .05) : distance
          w.rig.position.copy(panelPoint).addScaledVector(normal, cameraDistance)
          const panelRay = new THREE.Raycaster(w.rig.position, panelPoint.clone().sub(w.rig.position).normalize(), .001, cameraDistance + .2)
          const panelHit = panelRay.intersectObjects(meshes, false)[0]
          assert(panelHit, `${id} panel point must be visible`)
          w.stage.raycastReticle = () => [{ point: panelHit.point, node: panelHit.object.userData.node, getEntity: () => entity }]
          control.mouseLeft.pressed = false
          actions.update(1 / 60)
          assert(doorActions.includes(actions.current.node?.getProxy()),
            `${id} ${open ? 'open' : 'closed'} panel ${x},${y} at camera distance ${distance} must select the door`)
          panelChecks++
        }
      }
    }
    cases.push({ id, open, actionOffsetToPointerHit: nativeAction.worldPos.distanceTo(hit.point),
      panelChecks, firstAndThirdPersonRangeCovered: true, targetAndTriggerCorrect: true })
  }
})
