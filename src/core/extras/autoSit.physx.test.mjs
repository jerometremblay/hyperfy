import assert from 'node:assert/strict'
import test from 'node:test'
import { mkdtemp, copyFile, readFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { build } from 'esbuild'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'

const temp = await mkdtemp(`${tmpdir()}/auto-sit-physx-`)
await build({
  stdin: {
    contents: `export * as THREE from './src/core/extras/three.js'; export { Physics } from './src/core/systems/Physics.js'; export { RigidBody } from './src/core/nodes/RigidBody.js'; export { Collider } from './src/core/nodes/Collider.js'; export { findFreeSittingSurface, fitFreeSittingPose } from './src/core/extras/autoSit.js'; export { createVRMFactory } from './src/core/extras/createVRMFactory.js'; export { PlayerLocal } from './src/core/entities/PlayerLocal.js'`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: `${temp}/engine.mjs`,
})
await copyFile('src/core/physx-js-webidl.wasm', `${temp}/physx-js-webidl.wasm`)
const {
  THREE,
  Physics,
  RigidBody,
  Collider,
  findFreeSittingSurface,
  fitFreeSittingPose,
  createVRMFactory,
  PlayerLocal,
} = await import(`${temp}/engine.mjs`)

test('fits a real avatar against real PhysX stair colliders', async () => {
  globalThis.self = globalThis
  globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} })
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const bytes = await readFile(process.env.AUTO_SIT_VRM || 'src/world/assets/avatar.vrm')
  const glb = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  glb.scene.traverse(node => {
    if (node.geometry && !node.geometry.computeBoundsTree) node.geometry.computeBoundsTree = () => node.geometry
  })
  const avatar = { factory: createVRMFactory(glb, () => {}), instance: { raw: { scene: glb.scene } } }
  const world = {
    stage: { dirtyNodes: new Set(), scene: new THREE.Scene(), octree: { insert() {}, remove() {}, move() {} } },
    entities: { players: new Map() },
    setHot() {},
  }
  world.physics = new Physics(world)
  await world.physics.init()
  const bodies = []
  for (let i = 0; i < 6; i++) {
    const height = 1.08 - i * 0.18
    const body = new RigidBody({ type: 'static', position: [0, height / 2 - 0.5, (i + 0.5) * 0.3] })
    body.add(new Collider({ type: 'box', width: 2, height: height + 1, depth: 0.3 }))
    body.activate({ world })
    bodies.push(body)
  }
  try {
    const base = new THREE.Object3D()
    base.position.set(0, 0.54, 1)
    const seat = findFreeSittingSurface(world.physics, new THREE.Vector3(0, 2, 0.75), new THREE.Vector3(0, -1, 0), base)
    assert.ok(seat)
    const fitted = fitFreeSittingPose(
      world.physics,
      seat,
      base,
      avatar,
      process.env.AUTO_SIT_VRM ? new THREE.Vector3(0, 0, 1) : null
    )
    assert.ok(fitted?.pose, 'the selected tread has a safe fit')
    assert.ok(fitted.contacts.leftFoot[2] > 0.75 && fitted.contacts.rightFoot[2] > 0.75)
    const clone = avatar.factory.cloneScene(glb.scene)
    for (const detached of clone.detachedRoots || []) if (!detached.parent) clone.scene.add(detached)
    const posed = new THREE.Group()
    posed.position.copy(base.position).add(new THREE.Vector3(...fitted.offset).applyQuaternion(base.quaternion))
    posed.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion(...fitted.rotation))
    clone.scene.matrixAutoUpdate = true
    clone.scene.matrixWorldAutoUpdate = true
    clone.scene.position.set(0, 0, 0)
    clone.scene.quaternion.identity()
    clone.scene.scale.set(1, 1, 1)
    posed.add(clone.scene)
    posed.updateMatrixWorld(true)
    avatar.factory.applyNormalizedPose(clone.scene, fitted.pose)
    clone.scene.updateWorldMatrix(true, true)
    let lowest = Infinity
    clone.scene.traverse(mesh => {
      if (!mesh.isSkinnedMesh) return
      mesh.bindMode = THREE.AttachedBindMode
      mesh.updateMatrixWorld(true)
      mesh.skeleton.update()
      const indices = mesh.geometry.getAttribute('skinIndex'),
        weights = mesh.geometry.getAttribute('skinWeight')
      if (!indices || !weights) return
      const footNames = ['leftFoot', 'rightFoot', 'leftToes', 'rightToes'].map(name =>
        avatar.factory.getRawBoneName(name)
      )
      for (let i = 0; i < indices.count; i++) {
        let weight = 0
        for (let j = 0; j < 4; j++)
          if (footNames.includes(mesh.skeleton.bones[indices.getComponent(i, j)]?.name))
            weight += weights.getComponent(i, j)
        if (weight < 0.75) continue
        const p = mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld)
        const hit = world.physics.raycast(
          p.clone().add(new THREE.Vector3(0, 0.4, 0)),
          new THREE.Vector3(0, -1, 0),
          0.8,
          3
        )
        if (hit) lowest = Math.min(lowest, p.y - hit.point.y)
      }
    })
    assert.ok(Number.isFinite(lowest) && lowest >= -0.005, 'foot mesh stays above surrounding treads')
    for (const side of ['left', 'right']) {
      const toe = clone.scene.getObjectByName(avatar.factory.getRawBoneName(`${side}Toes`))
      assert.ok(toe, `${side} toes exist`)
      const p = toe.getWorldPosition(new THREE.Vector3())
      const hit = world.physics.raycast(p.clone().add(new THREE.Vector3(0, 0.5, 0)), new THREE.Vector3(0, -1, 0), 1, 3)
      assert.ok(!hit || p.y >= hit.point.y + 0.01, `${side} toes must be above the tread`)
    }
  } finally {
    bodies.forEach(body => body.deactivate())
  }
  // The solar clock's physical tray has a 0.935 m radius and a top at 1.211 m.
  // Its visible face sits about 7 cm higher than its physical tray.
  const dial = new RigidBody({ type: 'static', position: [0, 1.166, 0] })
  dial.add(new Collider({ type: 'box', width: 1.87, height: 0.09, depth: 1.87 }))
  dial.activate({ world })
  const column = new RigidBody({ type: 'static', position: [0, 0.5685, 0] })
  column.add(new Collider({ type: 'box', width: 0.52, height: 0.665, depth: 0.52 }))
  column.activate({ world })
  try {
    const base = new THREE.Object3D()
    base.position.set(0, 0, 1.5)
    const seat = findFreeSittingSurface(world.physics, new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0), base)
    const fitted = fitFreeSittingPose(world.physics, seat, base, avatar)
    assert.ok(fitted?.pose, 'can reach the edge of a solar-clock-sized tray from its center')
    assert.equal(fitted.contacts.leftFoot, undefined)
    assert.equal(fitted.contacts.rightFoot, undefined)
    const forward = new THREE.Vector3(0, 0, -1)
      .applyQuaternion(base.quaternion.clone().multiply(new THREE.Quaternion(...fitted.rotation)))
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 8)
    const rotated = fitFreeSittingPose(world.physics, fitted, base, avatar, forward)
    assert.ok(rotated?.pose, 're-fits when rotated on the tray')
    const actualForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      base.quaternion.clone().multiply(new THREE.Quaternion(...rotated.rotation))
    )
    assert.ok(actualForward.distanceTo(forward) < 1e-5, 'uses the requested direction')
    assert.ok(
      new THREE.Vector3(...rotated.offset).distanceTo(new THREE.Vector3(...fitted.offset)) > 0.02,
      'moves the avatar to accommodate the new direction'
    )
    const sent = []
    const player = {
      base,
      avatar,
      data: { id: 'player', effect: { freeSit: fitted, freeze: true, cancellable: true } },
      world: { physics: world.physics, network: { send: (...args) => sent.push(args) } },
      onEffectEnd: () => assert.fail('rotation must not end the sitting effect'),
      applySeatPose() {},
    }
    assert.equal(PlayerLocal.prototype.rotateFreeSit.call(player, Math.PI / 8), true)
    assert.equal(sent[0][0], 'entityModified')
    assert.deepEqual(sent[0][1].ef, player.data.effect)
    assert.ok(player.data.effect.freeSit.pose)
  } finally {
    dial.deactivate()
    column.deactivate()
  }
  const platform = new RigidBody({ type: 'static', position: [0, 0.7, 0] })
  platform.add(new Collider({ type: 'box', width: 2, height: 1.4, depth: 1 }))
  platform.activate({ world })
  const floor = new RigidBody({ type: 'static', position: [0, -0.1, 0] })
  floor.add(new Collider({ type: 'box', width: 20, height: 0.2, depth: 20 }))
  floor.activate({ world })
  try {
    const base = new THREE.Object3D()
    base.position.set(0, 0, 0.9)
    const seat = findFreeSittingSurface(world.physics, new THREE.Vector3(0, 2, 0.4), new THREE.Vector3(0, -1, 0), base)
    assert.ok(seat)
    const fitted = fitFreeSittingPose(world.physics, seat, base, avatar)
    assert.ok(fitted?.pose, 'the high ledge allows legs to hang')
    assert.equal(fitted.contacts.leftFoot, undefined)
    assert.equal(fitted.contacts.rightFoot, undefined)
    const clone = avatar.factory.cloneScene(glb.scene)
    for (const detached of clone.detachedRoots || []) if (!detached.parent) clone.scene.add(detached)
    const group = new THREE.Group()
    group.position.copy(base.position).add(new THREE.Vector3(...fitted.offset).applyQuaternion(base.quaternion))
    group.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion(...fitted.rotation))
    clone.scene.matrixAutoUpdate = true
    clone.scene.matrixWorldAutoUpdate = true
    clone.scene.position.set(0, 0, 0)
    clone.scene.quaternion.identity()
    clone.scene.scale.set(1, 1, 1)
    group.add(clone.scene)
    group.updateMatrixWorld(true)
    avatar.factory.applyNormalizedPose(clone.scene, fitted.pose)
    clone.scene.updateWorldMatrix(true, true)
    const footPositions = {}
    for (const side of ['left', 'right']) {
      const foot = clone.scene
        .getObjectByName(avatar.factory.getRawBoneName(`${side}Foot`))
        .getWorldPosition(new THREE.Vector3())
      footPositions[side] = foot
      assert.ok(foot.y > 0.1 && foot.y < 1.3, `${side} foot hangs below the seat and above the floor`)
      assert.ok(Math.abs(foot.x) > 1 || Math.abs(foot.z) > 0.5, `${side} foot is outside the platform`)
    }
    assert.ok(
      footPositions.right.y < footPositions.left.y - 0.05,
      'the free right leg may extend while the left stays relaxed'
    )
    const middle = findFreeSittingSurface(world.physics, new THREE.Vector3(0, 2, 0), new THREE.Vector3(0, -1, 0), base)
    const edgeFit = fitFreeSittingPose(world.physics, middle, base, avatar)
    assert.ok(edgeFit?.pose, 'moves from the middle of the platform toward an edge')
    const root = new THREE.Vector3(...edgeFit.offset).applyQuaternion(base.quaternion).add(base.position)
    assert.ok(Math.hypot(root.x, root.z) > 0.1, 'places the pelvis closer to an edge')
    assert.equal(edgeFit.contacts.leftFoot, undefined)
    assert.equal(edgeFit.contacts.rightFoot, undefined)
  } finally {
    platform.deactivate()
    floor.deactivate()
  }
  const perch = new RigidBody({ type: 'static', position: [0, 0.325, -0.4] })
  perch.add(new Collider({ type: 'box', width: 2, height: 0.65, depth: 0.8 }))
  perch.activate({ world })
  const ground = new RigidBody({ type: 'static', position: [0, -0.1, 0] })
  ground.add(new Collider({ type: 'box', width: 20, height: 0.2, depth: 20 }))
  ground.activate({ world })
  try {
    const base = new THREE.Object3D()
    base.position.set(0, 0, 0.9)
    const selected = findFreeSittingSurface(
      world.physics,
      new THREE.Vector3(0, 2, -0.03),
      new THREE.Vector3(0, -1, 0),
      base
    )
    const fitted = fitFreeSittingPose(world.physics, selected, base, avatar, new THREE.Vector3(0, 0, 1))
    assert.ok(fitted?.contacts.leftFoot && fitted.contacts.rightFoot)
    const clone = avatar.factory.cloneScene(glb.scene)
    for (const detached of clone.detachedRoots || []) if (!detached.parent) clone.scene.add(detached)
    const group = new THREE.Group()
    group.position.copy(base.position).add(new THREE.Vector3(...fitted.offset).applyQuaternion(base.quaternion))
    group.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion(...fitted.rotation))
    clone.scene.matrixAutoUpdate = true
    clone.scene.matrixWorldAutoUpdate = true
    clone.scene.position.set(0, 0, 0)
    clone.scene.quaternion.identity()
    clone.scene.scale.set(1, 1, 1)
    group.add(clone.scene)
    group.updateMatrixWorld(true)
    avatar.factory.applyNormalizedPose(clone.scene, fitted.pose)
    clone.scene.updateWorldMatrix(true, true)
    for (const side of ['left', 'right']) {
      const hip = clone.scene
        .getObjectByName(avatar.factory.getRawBoneName(`${side}UpperLeg`))
        .getWorldPosition(new THREE.Vector3())
      const knee = clone.scene
        .getObjectByName(avatar.factory.getRawBoneName(`${side}LowerLeg`))
        .getWorldPosition(new THREE.Vector3())
      const d = knee.sub(hip)
      assert.ok(-d.y > Math.hypot(d.x, d.z) * 0.5, `${side} thigh slopes down on a high perch`)
    }
  } finally {
    perch.deactivate()
    ground.deactivate()
  }
  // Only the left side has an intermediate ledge; the right foot must hang.
  const tabletop = new RigidBody({ type: 'static', position: [0, 1.35, 0] })
  tabletop.add(new Collider({ type: 'box', width: 2, height: 0.1, depth: 1 }))
  tabletop.activate({ world })
  const ledge = new RigidBody({ type: 'static', position: [0.12, 0.9, 0.85] })
  ledge.add(new Collider({ type: 'box', width: 0.2, height: 0.15, depth: 0.8 }))
  ledge.activate({ world })
  try {
    const base = new THREE.Object3D()
    base.position.set(0, 0, 1.2)
    const seat = findFreeSittingSurface(world.physics, new THREE.Vector3(0, 2, 0.45), new THREE.Vector3(0, -1, 0), base)
    const fitted = fitFreeSittingPose(world.physics, seat, base, avatar, new THREE.Vector3(0, 0, 1))
    assert.ok(fitted?.pose, 'one foot can use the ledge while the other hangs')
    assert.ok(fitted.contacts.leftFoot, 'left foot uses its own reachable support')
    assert.equal(fitted.contacts.rightFoot, undefined, 'right foot hangs independently')
    const clone = avatar.factory.cloneScene(glb.scene)
    for (const detached of clone.detachedRoots || []) if (!detached.parent) clone.scene.add(detached)
    const root = new THREE.Group()
    root.position.copy(base.position).add(new THREE.Vector3(...fitted.offset).applyQuaternion(base.quaternion))
    root.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion(...fitted.rotation))
    clone.scene.matrixAutoUpdate = true
    clone.scene.matrixWorldAutoUpdate = true
    clone.scene.position.set(0, 0, 0)
    clone.scene.quaternion.identity()
    clone.scene.scale.set(1, 1, 1)
    root.add(clone.scene)
    root.updateMatrixWorld(true)
    avatar.factory.applyNormalizedPose(clone.scene, fitted.pose)
    clone.scene.updateWorldMatrix(true, true)
    const left = clone.scene
      .getObjectByName(avatar.factory.getRawBoneName('leftFoot'))
      .getWorldPosition(new THREE.Vector3())
    const right = clone.scene
      .getObjectByName(avatar.factory.getRawBoneName('rightFoot'))
      .getWorldPosition(new THREE.Vector3())
    assert.ok(right.y < left.y - 0.1, 'the unobstructed right leg extends farther down')
  } finally {
    tabletop.deactivate()
    ledge.deactivate()
  }
  const stool = new RigidBody({ type: 'static', position: [0, 0.375, 0] })
  stool.add(new Collider({ type: 'box', width: 0.5, height: 0.75, depth: 0.5 }))
  stool.activate({ world })
  const table = new RigidBody({ type: 'static', position: [0, 1.02, 0.65] })
  table.add(new Collider({ type: 'box', width: 1.1, height: 0.08, depth: 0.8 }))
  table.activate({ world })
  const floor2 = new RigidBody({ type: 'static', position: [0, -0.1, 0] })
  floor2.add(new Collider({ type: 'box', width: 10, height: 0.2, depth: 10 }))
  floor2.activate({ world })
  try {
    const base = new THREE.Object3D()
    base.position.set(0, 0, -0.6)
    const seat = findFreeSittingSurface(world.physics, new THREE.Vector3(0, 1.8, 0), new THREE.Vector3(0, -1, 0), base)
    const fitted = fitFreeSittingPose(world.physics, seat, base, avatar, new THREE.Vector3(0, 0, 1))
    assert.ok(fitted?.pose, 'a pose is found on the stool')
    assert.ok(fitted.contacts.leftHand, 'left hand finds the tabletop')
    assert.ok(fitted.contacts.rightHand, 'right hand finds the tabletop')
    assert.ok(Math.abs(fitted.contacts.leftHand[1] - 1.06) < 0.02)
    assert.ok(Math.abs(fitted.contacts.rightHand[1] - 1.06) < 0.02)
    const clone = avatar.factory.cloneScene(glb.scene)
    for (const detached of clone.detachedRoots || []) if (!detached.parent) clone.scene.add(detached)
    const root = new THREE.Group()
    root.position.copy(base.position).add(new THREE.Vector3(...fitted.offset).applyQuaternion(base.quaternion))
    root.quaternion.copy(base.quaternion).multiply(new THREE.Quaternion(...fitted.rotation))
    clone.scene.matrixAutoUpdate = true
    clone.scene.matrixWorldAutoUpdate = true
    clone.scene.position.set(0, 0, 0)
    clone.scene.quaternion.identity()
    clone.scene.scale.set(1, 1, 1)
    root.add(clone.scene)
    root.updateMatrixWorld(true)
    avatar.factory.applyNormalizedPose(clone.scene, fitted.pose)
    clone.scene.updateWorldMatrix(true, true)
    for (const side of ['left', 'right']) {
      const hand = clone.scene.getObjectByName(avatar.factory.getRawBoneName(`${side}Hand`))
      const wrist = hand.getWorldPosition(new THREE.Vector3())
      assert.ok(wrist.y >= 1.055 && wrist.y <= 1.2, `${side} hand is near or above the tabletop`)
      let minimumGap = Infinity
      const names = new Set()
      hand.traverse(b => {
        if (b.isBone) names.add(b.name)
      })
      clone.scene.traverse(mesh => {
        if (!mesh.isSkinnedMesh) return
        const ids = mesh.geometry.getAttribute('skinIndex'),
          weights = mesh.geometry.getAttribute('skinWeight')
        if (!ids || !weights) return
        mesh.bindMode = THREE.AttachedBindMode
        mesh.updateMatrixWorld(true)
        mesh.skeleton.update()
        for (let i = 0; i < ids.count; i++) {
          let weight = 0
          for (let j = 0; j < 4; j++)
            if (names.has(mesh.skeleton.bones[ids.getComponent(i, j)]?.name)) weight += weights.getComponent(i, j)
          if (weight < 0.75) continue
          const vertex = mesh.getVertexPosition(i, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld)
          if (Math.abs(vertex.x) <= 0.55 && vertex.z >= 0.25 && vertex.z <= 1.05)
            minimumGap = Math.min(minimumGap, vertex.y - 1.06)
          assert.equal(
            world.physics.overlapSphere(0.001, vertex, 3).length,
            0,
            `${side} hand mesh must not penetrate the table`
          )
        }
      })
      assert.ok(minimumGap <= 0.04, `${side} hand should rest near the table surface`)
    }
    table.deactivate()
    const oneSide = new RigidBody({ type: 'static', position: [0.24, 1.02, 0.65] })
    oneSide.add(new Collider({ type: 'box', width: 0.4, height: 0.08, depth: 0.8 }))
    oneSide.activate({ world })
    try {
      const asymmetric = fitFreeSittingPose(world.physics, seat, base, avatar, new THREE.Vector3(0, 0, 1))
      assert.ok(asymmetric?.contacts.leftHand, 'left hand finds its own support')
      assert.equal(asymmetric.contacts.rightHand, undefined, 'unsupported right hand is not forced onto the table')
    } finally {
      oneSide.deactivate()
    }
  } finally {
    stool.deactivate()
    table.deactivate()
    floor2.deactivate()
  }
})
