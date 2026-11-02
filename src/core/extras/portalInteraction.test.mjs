import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: `export * as THREE from './three.js';
      export { Stage } from '../systems/Stage.js';
      export { ClientPointer } from '../systems/ClientPointer.js';
      export { ClientActions } from '../systems/ClientActions.js';
      export { Portal } from '../nodes/Portal.js';
      export { Node } from '../nodes/Node.js';
      export { Action } from '../nodes/Action.js';
      export { resolvePortalHit } from './portalInteraction.js';`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { THREE, Stage, ClientPointer, ClientActions, Portal, Node, Action, resolvePortalHit } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function fixture({ locked = false, script = false } = {}) {
  const events = []
  const control = {
    pointer: { locked, position: new THREE.Vector2(50, 50) },
    mouseLeft: { pressed: false, released: false },
    mouseRight: { pressed: false, released: false },
    keyE: { down: false },
    touchB: { down: false },
    xrLeftTrigger: { value: 0, down: false },
    xrRightTrigger: { value: 0, down: false },
    xrLeftBtn1: { down: false },
  }
  const world = {
    rig: new THREE.Group(),
    camera: new THREE.PerspectiveCamera(60, 1, 0.05, 1000),
    graphics: { portals: new Set() },
    entities: { player: { data: { id: 'player' } } },
    builder: { enabled: false },
    xr: { session: null },
    controls: { bind: () => control },
    setHot() {},
  }
  world.rig.position.set(0, 0, 2)
  world.camera.position.set(0, 1.2, 0)
  world.rig.add(world.camera)
  world.rig.updateMatrixWorld(true)
  world.stage = new Stage(world)
  world.stage.init({
    viewport: { getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }) },
  })
  world.actions = new ClientActions(world)
  world.actions.start()
  const pointer = new ClientPointer(world)
  pointer.start()
  const source = new Portal({ portalId: 'source', target: 'exit', position: [0, 1.2, 0] })
  const destination = new Portal({ portalId: 'exit', position: [100, 1.2, 0] })
  source.activate({ world })
  destination.activate({ world })
  const entity = { data: { id: 'house' } }
  const door = new Node({
    position: [100, 1.2, 0.5],
    onPointerDown: script ? event => events.push(['down', event.button, event.uv]) : undefined,
    onPointerUp: script ? event => events.push(['up', event.button]) : undefined,
  })
  door.activate({ world, entity })
  const item = {
    matrix: door.matrixWorld,
    geometry: new THREE.BoxGeometry(1.5, 2.2, 0.1),
    material: new THREE.MeshBasicMaterial(),
    node: door,
    getEntity: () => entity,
  }
  world.stage.octree.insert(item)
  const action = new Action({
    label: 'Open door',
    position: [100, 1.2, 0.5],
    distance: 3,
    onTrigger: event => events.push(['open', event.playerId]),
  })
  action.activate({ world, entity })
  return { world, control, pointer, source, destination, door, item, action, events }
}

function interactionHit(f) {
  return resolvePortalHit(f.world, f.world.stage.raycastReticle()[0])
}

function moveDoor(f, position) {
  f.door.position.fromArray(position)
  f.world.stage.clean()
  f.world.stage.octree.move(f.item)
}

for (const locked of [false, true]) {
  test(`${locked ? 'reticle' : 'cursor'} dispatches ordinary pointer events to the door through a same-world portal`, () => {
    const f = fixture({ locked, script: true })
    assert.equal(f.pointer.captureScriptClick(), true, 'capture the door click before pointer lock')
    f.control.mouseLeft.pressed = true
    f.pointer.update(0)
    f.control.mouseLeft.pressed = false
    f.control.mouseLeft.released = true
    f.pointer.update(0)
    assert.equal(f.events[0][0], 'down')
    assert.equal(f.events[0][1], 'left')
    assert.ok(Math.abs(f.events[0][2].x - 0.5) < 1e-6)
    assert.deepEqual(f.events[1], ['up', 'left'])
  })

  test(`${locked ? 'reticle' : 'cursor'} opens a native door action through the portal and preserves its range`, () => {
    const f = fixture({ locked })
    assert.ok(f.action.worldPos.distanceTo(f.world.rig.position) > 90)
    f.control.mouseLeft.pressed = true
    f.world.actions.update(1 / 60)
    assert.ok(f.world.actions.current.node === f.action, 'the native door action must be selected')
    assert.deepEqual(f.events, [['open', 'player']])
    f.control.mouseLeft.pressed = false
    f.world.rig.position.z = 5
    f.world.rig.updateMatrixWorld(true)
    f.world.actions.update(1 / 60)
    assert.equal(f.world.actions.current.node, null, 'walking away still exceeds the normal action range')
  })
}

test('source occlusion, editor selection and camera queries keep their ordinary ray', () => {
  const f = fixture({ script: true })
  assert.ok(f.world.stage.raycastReticle()[0]?.node === f.source, 'raw stage queries still hit the portal')
  f.world.builder.enabled = true
  f.control.mouseLeft.pressed = true
  f.pointer.update(0)
  f.world.actions.update(0)
  assert.equal(f.events.length, 0)
  f.world.builder.enabled = false
  moveDoor(f, [0, 1.2, 1])
  assert.ok(interactionHit(f)?.node === f.door, 'an object in front of the source blocks the portal')
  f.world.rig.position.x = 2
  f.world.rig.updateMatrixWorld(true)
  assert.equal(interactionHit(f), undefined, 'the ray must intersect the aperture')
})

test('a disabled front preview stops pointer forwarding without disabling the destination preview', () => {
  const f = fixture({ locked: true, script: true })
  f.source.previewFront = false
  assert.equal(interactionHit(f)?.node, f.source)
  f.control.mouseLeft.pressed = true
  f.pointer.update(0)
  f.world.actions.update(0)
  assert.equal(f.events.length, 0)
  assert.equal(f.destination.previewFront, true)
  f.source.previewFront = true
  assert.equal(interactionHit(f)?.node, f.door)
})

test('destination clipping skips hidden near-side geometry and portal surfaces without following another link', () => {
  const f = fixture()
  const hidden = {
    geometry: f.item.geometry,
    material: f.item.material,
    matrix: new THREE.Matrix4().makeTranslation(100, 1.2, -0.5),
    node: new Node(),
  }
  f.world.stage.octree.insert(hidden)
  const hit = interactionHit(f)
  assert.ok(hit?.node === f.door, 'the hidden wall and exit portal cannot steal the door click')
  assert.ok(Math.abs(hit.point.z - 0.45) < 1e-6)
  assert.ok(hit.direction.z > 0.99)
  assert.ok(Math.abs(hit.distance - 2.45) < 1e-6)
  assert.ok(Math.abs(f.world.stage.raycaster.ray.origin.x) < 1e-6)
  assert.ok(f.world.stage.raycaster.ray.direction.z < -0.99, 'restore the original query ray')
  f.world.stage.octree.remove(f.item)
  assert.equal(interactionHit(f), null, 'empty destination space never clicks geometry behind the source')
})

test('finite ray distance applies across both sides of the portal, including differently scaled exits', () => {
  const f = fixture()
  const origin = f.world.camera.getWorldPosition(new THREE.Vector3())
  const direction = new THREE.Vector3(0, 0, -1)
  let raw = f.world.stage.raycast(origin, direction, undefined, 0, 2.3)[0]
  assert.ok(raw?.node === f.source)
  assert.equal(resolvePortalHit(f.world, raw), null)
  f.destination.scale.setScalar(2)
  f.world.stage.clean()
  moveDoor(f, [100, 1.2, 0.8])
  raw = f.world.stage.raycast(origin, direction, undefined, 0, 2.5)[0]
  assert.ok(resolvePortalHit(f.world, raw)?.node === f.door)
  assert.equal(f.world.stage.raycaster.far, 2.5)
})

test('remote, missing and moving endpoints retain the original portal hit', () => {
  for (const configure of [
    f => {
      f.source.url = 'https://example.com'
    },
    f => {
      f.source.target = 'missing'
    },
    f => {
      f.source.ctx.moving = true
    },
    f => {
      f.destination.ctx.moving = true
    },
  ]) {
    const f = fixture()
    configure(f)
    assert.ok(interactionHit(f)?.node === f.source)
  }
})

test('one-sided back is inactive and a two-sided back redirects clicks into the opposite exit side', () => {
  const f = fixture({ script: true })
  f.world.rig.position.z = -2
  f.world.camera.rotation.y = Math.PI
  f.world.rig.updateMatrixWorld(true)
  moveDoor(f, [100, 1.2, -0.5])
  assert.ok(interactionHit(f)?.node === f.source)
  assert.equal(f.pointer.captureScriptClick(), false)
  f.source.doubleside = true
  f.world.stage.clean()
  assert.ok(interactionHit(f)?.node === f.door)
  assert.equal(f.pointer.captureScriptClick(), true)
})

test('rotated portals preserve off-center targeting and use the current destination transform', () => {
  const f = fixture()
  f.destination.rotation.y = Math.PI / 2
  f.door.rotation.y = Math.PI / 2
  f.world.stage.clean()
  f.world.rig.position.x = 0.3
  f.world.rig.updateMatrixWorld(true)
  moveDoor(f, [100.5, 1.2, 0.3])
  assert.ok(interactionHit(f)?.node === f.door)
  f.destination.position.z = 10
  f.world.stage.clean()
  moveDoor(f, [100.5, 1.2, 10.3])
  assert.ok(interactionHit(f)?.node === f.door, 'moving an endpoint cannot leave a stale click mapping')
})

test('temporary traversal return links use the same destination as the rendered view', () => {
  const f = fixture()
  f.source.target = ''
  f.source.getTraversalReturn = () => f.destination
  assert.ok(interactionHit(f)?.node === f.door)
})

test('a visible latch opens a closed door whose panel overlaps the destination clipping plane', () => {
  const f = fixture()
  moveDoor(f, [100, 1.2, -0.01])
  const latch = new Node({ position: [0.55, 0, 0.11] })
  f.door.add(latch)
  f.world.stage.clean()
  f.world.stage.octree.insert({
    matrix: latch.matrixWorld,
    geometry: new THREE.BoxGeometry(0.08, 0.2, 0.06),
    material: new THREE.MeshBasicMaterial(),
    node: latch,
    getEntity: f.item.getEntity,
  })
  f.world.rig.position.x = -0.55
  f.world.rig.updateMatrixWorld(true)
  assert.ok(interactionHit(f)?.node === latch)
  f.control.mouseLeft.pressed = true
  f.world.actions.update(0)
  assert.ok(f.world.actions.current.node === f.action)
  assert.deepEqual(f.events, [['open', 'player']])
})

test('an XR controller ray dispatches script clicks through a same-world portal', () => {
  const f = fixture({ script: true })
  f.control.xrRightRayPose = {
    position: new THREE.Vector3(0, 1.2, 2),
    quaternion: new THREE.Quaternion(),
  }
  f.control.xrRightTrigger = { value: 1, pressed: true }
  f.pointer.update(0)
  assert.equal(f.events[0]?.[0], 'down')
  assert.equal(f.events[0]?.[1], 'left')
})

for (const hand of ['left', 'right']) {
  test(`the ${hand} XR ray selects the native door action through the portal`, () => {
    const f = fixture()
    f.world.xr.session = {}
    f.control[`xr${hand === 'left' ? 'Left' : 'Right'}RayPose`] = {
      valid: true,
      position: new THREE.Vector3(0, 1.2, 2),
      quaternion: new THREE.Quaternion(),
    }
    f.control[`xr${hand === 'left' ? 'Left' : 'Right'}Trigger`].value = 1
    f.world.actions.action = { start() {}, update() {}, stop() {} }
    f.world.actions.update(0)
    assert.ok(f.world.actions.current.node === f.action)
    f.world.rig.position.z = 5
    f.world.rig.updateMatrixWorld(true)
    f.world.actions.update(0)
    assert.equal(f.world.actions.current.node, null)
  })
}
