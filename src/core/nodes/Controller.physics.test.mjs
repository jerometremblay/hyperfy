import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

// Exercise the shipped WASM and the complete local-player movement loop.
const temp = await mkdtemp(`${tmpdir()}/hyperfy-controller-`)
const core = fileURLToPath(new URL('../', import.meta.url))
await build({
  stdin: {
    contents: `export * as THREE from './extras/three.js';
      export { Physics } from './systems/Physics.js';
      export { Controller } from './nodes/Controller.js';
      export { Collider } from './nodes/Collider.js';
      export { RigidBody } from './nodes/RigidBody.js';
      export { PlayerLocal } from './entities/PlayerLocal.js';
      export { Portal } from './nodes/Portal.js';`,
    resolveDir: core,
  },
  bundle: true, platform: 'node', format: 'esm', outfile: `${temp}/engine.mjs`,
})
await copyFile(`${core}physx-js-webidl.wasm`, `${temp}/physx-js-webidl.wasm`)
const { THREE, Physics, Controller, Collider, RigidBody, PlayerLocal, Portal } = await import(`${temp}/engine.mjs`)
const world = { stage: { dirtyNodes: new Set(), scene: new THREE.Scene(), octree: { insert() {}, remove() {}, move() {} } }, graphics: { portals: new Set() }, entities: { players: new Map() }, setHot() {} }
world.physics = new Physics(world)
await world.physics.init()
function box(size, position, rotation) {
  const body = new RigidBody({ type: 'static', position, rotation })
  body.add(new Collider({ type: 'box', width: size[0], height: size[1], depth: size[2] }))
  body.activate({ world })
  return body
}
box([100, 0.2, 100], [0, -0.1, 0])
const controller = new Controller({ radius: 0.3, height: 1, visible: true, layer: 'player' })
controller.activate({ world })
function playerAt(start, direction) {
  controller.teleport(new THREE.Vector3(...start))
  const base = new THREE.Object3D()
  base.updateTransform = () => base.updateMatrixWorld(true)
  return {
    world, controller, base, data: {}, getAnchorMatrix: () => null,
    velocity: new THREE.Vector3(), moveDir: new THREE.Vector3(...direction).normalize(),
    groundSweepGeometry: new PHYSX.PxSphereGeometry(0.29), groundSweepRadius: 0.29,
    groundNormal: new THREE.Vector3(0, 1, 0), grounded: false,
    platform: { actor: null, prevTransform: new THREE.Matrix4() },
    mass: 1, effectiveGravity: 20, jumpHeight: 1.5, moving: true,
  }
}
function walk(player, frames = 120, delta = 1 / 60) {
  let maxY = -Infinity
  for (let i = 0; i < frames; i++) {
    PlayerLocal.prototype.fixedUpdate.call(player, delta)
    maxY = Math.max(maxY, controller.position.y)
  }
  return maxY
}

test('glancing past furniture edges does not perch on the rounded capsule', () => {
  for (const height of [0.7, 0.76, 1]) {
    const obstacle = box([2.72, height, 1.53], [0, height / 2, 0])
    try {
      for (const delta of [1 / 30, 1 / 60, 1 / 120]) {
        for (const [start, direction] of [
          [[2, 0, 1.4], [-1, 0, -1]],
          [[2, 0, 0.99], [-1, 0, 0]],
          [[-2, 0, -1.4], [1, 0, 1]],
        ]) {
          const player = playerAt(start, direction)
          try {
            const rise = walk(player, 2 / delta, delta)
            assert.ok(rise < 0.01, `height ${height}, dt ${delta}: lifted ${rise}m`)
          } finally { PHYSX.destroy(player.groundSweepGeometry) }
        }
      }
    } finally { obstacle.deactivate() }
  }
})

test('a low sofa base cannot lift the player against its obstructing backrest', () => {
  const parts = [
    box([2.568, 0.31, 0.79], [0, 0.30, 0.03]),
    box([2.216, 0.42, 0.26], [0, 0.78, 0.23], [0.14, 0, 0]),
    ...[-1.1815, 1.1815].map(x => box([0.2256, 0.65, 0.82], [x, 0.56, 0.015])),
  ]
  try {
    for (const [start, direction] of [[[0, 0, 1.5], [0, 0, -1]], [[1, 0, 1.5], [-0.3, 0, -1]], [[1.7, 0, 1], [-1, 0, -1]]]) {
      const player = playerAt(start, direction)
      try { assert.ok(walk(player) < 0.01, 'blocked sofa step lifted the player') }
      finally { PHYSX.destroy(player.groundSweepGeometry) }
    }
  } finally { parts.forEach(body => body.deactivate()) }
})

test('normal stairs still climb with the existing 0.5m step offset', () => {
  const stairs = Array.from({ length: 4 }, (_, i) => box([0.8, (i + 1) * 0.2, 2], [i * 0.8, (i + 1) * 0.1, 0]))
  const player = playerAt([-1, 0, 0], [1, 0, 0])
  try {
    assert.ok(walk(player, 70) > 0.79)
    assert.equal(controller.controller.getStepOffset(), 0.5)
  } finally {
    stairs.forEach(s => s.deactivate())
    PHYSX.destroy(player.groundSweepGeometry)
  }
})

test('a walkable ramp supports an idle player without sliding', () => {
  const ramp = box([6, 0.2, 3], [0, 1.6, 0], [0, 0, Math.PI / 6])
  const player = playerAt([0, 1.72, 0], [0, 0, 0])
  player.moving = false
  try {
    walk(player, 30)
    const position = controller.position.clone()
    walk(player, 120)
    assert.ok(controller.position.distanceTo(position) < 0.01, `ramp drift: ${controller.position.distanceTo(position)}m`)
    assert.ok(controller.position.y > 1)
    player.moving = true
    player.moveDir.set(1, 0, 0)
    const startY = controller.position.y
    walk(player, 20)
    assert.ok(controller.position.x > position.x + 0.5)
    assert.ok(controller.position.y > startY + 0.3)
  } finally { ramp.deactivate(); PHYSX.destroy(player.groundSweepGeometry) }
})

test('climbs the cabin staircase with thin, overlapping open treads', () => {
  const rise = 1.59 / 9
  const stairs = Array.from({ length: 15 }, (_, i) =>
    box([0.345, 0.085, 1.35], [i * 0.32, (i + 1) * rise - 0.0425, 0]))
  const player = playerAt([-0.8, 0, 0], [1, 0, 0])
  try {
    const height = walk(player, 180)
    assert.ok(height > 2.5, `stuck on open treads at ${height}m, position ${controller.position.toArray()}`)
  } finally { stairs.forEach(s => s.deactivate()); PHYSX.destroy(player.groundSweepGeometry) }
})

test('a reachable step under a low ceiling retains available headroom', () => {
  const step = box([2, 0.2, 2], [0, 0.1, 0])
  const ceiling = box([8, 0.1, 4], [0, 2.05, 0])
  const player = playerAt([-2, 0, 0], [1, 0, 0])
  try { assert.ok(walk(player, 50) > 0.19) }
  finally { step.deactivate(); ceiling.deactivate(); PHYSX.destroy(player.groundSweepGeometry) }
})

test('the cabin portal keeps its last tread and reaches the landing beyond the aperture', () => {
  const source = new Portal({ portalId: 'ceiling', target: 'roof', position: [-7.74, 2.785, 4.48], rotation: [Math.PI / 2, 0, 0], width: 1.5, height: 5.02 })
  const destination = new Portal({ portalId: 'roof', target: 'ceiling', position: [-7.05, 8.33, 4.16], rotation: [-Math.PI / 2, Math.PI, 0], width: 1.5, height: 5.02 })
  source.activate({ world }); destination.activate({ world })
  const stairs = Array.from({ length: 15 }, (_, i) => box([1.35, 0.085, 0.345], [-7.74, 0.12 + (i + 1) * (3.18 / 18) - 0.0425, 2.08 + (i + 0.5) * 0.32]))
  const deck = [[-8.9, -7.8, 0.15, 8.3], [-6.3, -4.2, 0.15, 8.3], [-7.8, -6.3, 0.15, 1.65], [-7.8, -6.3, 6.67, 8.3]].map(([x0, x1, z0, z1]) => box([x1 - x0, 0.15, z1 - z0], [(x0 + x1) / 2, 8.295, (z0 + z1) / 2]))
  const floor = box([30, 0.12, 30], [0, 0.06, 0])
  const player = playerAt([-7.74, 0.12, 1.5], [0, 0, 1])
  player.base.position.copy(controller.position)
  let crossings = 0
  player.crossPortal = transform => {
    player.base.position.applyMatrix4(transform)
    player.moveDir.transformDirection(transform)
    controller.teleport(new THREE.Vector3().copy(player.base.position))
    crossings++
  }
  world.entities.player = player
  try {
    for (let i = 0; i < 145; i++) {
      PlayerLocal.prototype.fixedUpdate.call(player, 1 / 60)
      world.physics.postFixedUpdate(1 / 60)
    }
    assert.equal(crossings, 1)
    assert.ok(controller.position.y > 8.3, `landing position ${controller.position.toArray()}`)
  } finally {
    world.entities.player = null
    world.physics.portalCollisions.clear()
    source.deactivate(); destination.deactivate()
    for (const body of [...stairs, ...deck, floor]) body.deactivate()
    PHYSX.destroy(player.groundSweepGeometry)
  }
})

test('debug capsule belongs to the stage scene and is removed on unmount', () => {
  assert.ok(world.stage.scene.children.includes(controller.mesh))
  const mesh = controller.mesh
  controller.deactivate()
  assert.ok(!world.stage.scene.children.includes(mesh))
})
