import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { build } from 'esbuild'

const result = await build({
  stdin: {
    contents: `export { findFreeSittingSurface, fitFreeSittingPose, getFreeSittingPose } from './src/core/extras/autoSit.js'; export { sanitizePlayerSelfModify } from './src/core/extras/entityModifyPolicy.js'`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { findFreeSittingSurface, fitFreeSittingPose, getFreeSittingPose, sanitizePlayerSelfModify } = await import(
  `data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`
)

function rig() {
  const scene = new THREE.Group()
  const add = (parent, name, x, y, z) => {
    const bone = new THREE.Bone()
    bone.name = name
    bone.position.set(x, y, z)
    parent.add(bone)
    return bone
  }
  const hips = add(scene, 'hips', 0, 0.9, 0)
  const spine = add(hips, 'spine', 0, 0.2, 0)
  add(spine, 'chest', 0, 0.2, 0)
  for (const [side, x] of [
    ['left', -0.1],
    ['right', 0.1],
  ]) {
    const upper = add(hips, `${side}UpperLeg`, x, 0, 0)
    const lower = add(upper, `${side}LowerLeg`, 0, -0.43, 0)
    add(lower, `${side}Foot`, 0, -0.43, 0)
    const arm = add(spine, `${side}UpperArm`, x * 2, 0.18, 0)
    const elbow = add(arm, `${side}LowerArm`, x, -0.25, 0)
    add(elbow, `${side}Hand`, 0, -0.24, 0)
  }
  const names = []
  scene.traverse(n => {
    if (n.isBone) names.push(n.name)
  })
  const factory = {
    cloneScene: () => ({ scene: scene.clone(true), detachedRoots: [] }),
    getRawBoneName: n => n,
    applyNormalizedPose(root, pose) {
      for (const name of names) {
        const b = root.getObjectByName(name)
        const p = pose[name]
        if (p?.rotation) b.quaternion.fromArray(p.rotation)
        if (name === 'hips' && p?.position) b.position.set(0, 0.9, 0).add(new THREE.Vector3(...p.position))
      }
      root.updateMatrixWorld(true)
    },
    getNormalizedPose(root) {
      return Object.fromEntries(
        names.map(name => {
          const b = root.getObjectByName(name)
          return [
            name,
            {
              rotation: b.quaternion.toArray(),
              ...(name === 'hips' ? { position: [b.position.x, b.position.y - 0.9, b.position.z] } : {}),
            },
          ]
        })
      )
    },
  }
  return { factory, instance: { raw: { scene } } }
}

// Descending treads: 0.3 m deep and 0.18 m rise. A raycaster matching the
// Physics contract exposes the top surfaces and risers of each step.
function stairs() {
  const boxes = []
  for (let i = 0; i < 6; i++)
    boxes.push(new THREE.Box3(new THREE.Vector3(-1, -1, i * 0.3), new THREE.Vector3(1, 1.08 - i * 0.18, (i + 1) * 0.3)))
  return {
    raycast(origin, direction, max) {
      const ray = new THREE.Ray(origin, direction)
      let best = null
      for (const box of boxes) {
        const point = ray.intersectBox(box, new THREE.Vector3())
        if (!point) continue
        const distance = point.distanceTo(origin)
        if (distance > max || (best && best.distance < distance)) continue
        let normal = new THREE.Vector3(0, 1, 0)
        if (Math.abs(point.y - box.max.y) > 1e-5) normal = new THREE.Vector3(0, 0, direction.z > 0 ? -1 : 1)
        best = { point, distance, normal }
      }
      return best
    },
  }
}

test('fits both legs to lower stair treads and keeps leg segments outside the steps', () => {
  const physics = stairs()
  const base = new THREE.Object3D()
  base.position.set(0, 0.54, 1)
  const hit = findFreeSittingSurface(physics, new THREE.Vector3(0, 2, 0.75), new THREE.Vector3(0, -1, 0), base)
  assert.ok(hit)
  const fitted = fitFreeSittingPose(physics, hit, base, rig())
  assert.ok(fitted?.pose, 'computes a geometry-fitted pose for the selected tread')
  assert.ok(fitted.contacts.leftFoot && fitted.contacts.rightFoot)
  assert.ok(fitted.contacts.leftFoot[2] > 0.75 && fitted.contacts.rightFoot[2] > 0.75, 'feet face downhill')
  assert.ok(fitted.contacts.leftFoot[1] < 0.9 && fitted.contacts.rightFoot[1] < 0.9)
})

test('rejects a ledge when there are no reachable foot contacts', () => {
  const base = new THREE.Object3D()
  const seat = { offset: [0, 1, 0], target: [0, 1, 0], kind: 'seat' }
  assert.equal(fitFreeSittingPose({ raycast: () => null }, seat, base, rig()), null)
})

test('fits the bundled VRM skeleton on the same stairs', async () => {
  globalThis.self = globalThis
  globalThis.createImageBitmap = async () => ({ width: 1, height: 1, close() {} })
  const { readFile } = await import('node:fs/promises')
  const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js')
  const { VRMLoaderPlugin } = await import('@pixiv/three-vrm')
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const bytes = await readFile('src/world/assets/avatar.vrm')
  const glb = await loader.parseAsync(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength), '')
  glb.scene.traverse(node => {
    if (node.geometry && !node.geometry.computeBoundsTree) node.geometry.computeBoundsTree = () => node.geometry
  })
  const b = await build({
    stdin: {
      contents: `export { createVRMFactory } from './src/core/extras/createVRMFactory.js'`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  })
  const { createVRMFactory } = await import(
    `data:text/javascript;base64,${Buffer.from(b.outputFiles[0].contents).toString('base64')}`
  )
  const avatar = { factory: createVRMFactory(glb, () => {}), instance: { raw: { scene: glb.scene } } }
  const physics = stairs()
  const base = new THREE.Object3D()
  base.position.set(0, 0.54, 1)
  const seat = findFreeSittingSurface(physics, new THREE.Vector3(0, 2, 0.75), new THREE.Vector3(0, -1, 0), base)
  const fitted = fitFreeSittingPose(physics, seat, base, avatar)
  assert.ok(fitted?.pose, 'the real avatar can be solved on the tread')
  assert.ok(JSON.stringify({ freeSit: fitted, freeze: true, cancellable: true }).length < 8192)
  const networkEffect = sanitizePlayerSelfModify(
    { ef: { freeSit: fitted, freeze: true, cancellable: true } },
    'player'
  )?.ef
  assert.ok(networkEffect, 'the fitted pose passes the player effect network policy')
  assert.ok(getFreeSittingPose(networkEffect)?.pose, 'a remote client accepts the fitted pose')
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
    const foot = clone.scene
      .getObjectByName(avatar.factory.getRawBoneName(`${side}Foot`))
      .getWorldPosition(new THREE.Vector3())
    const contact = new THREE.Vector3(...fitted.contacts[`${side}Foot`])
    assert.ok(Math.hypot(foot.x - contact.x, foot.z - contact.z) < 0.05, `${side} foot remains above the contact`)
    assert.ok(foot.y >= contact.y && foot.y - contact.y < 0.22, `${side} ankle remains close to the contact`)
  }
})

test('allows legs to hang off a high platform without requiring a ground contact', () => {
  const platform = new THREE.Box3(new THREE.Vector3(-1, 0, -0.5), new THREE.Vector3(1, 1.4, 0.5))
  const floor = new THREE.Box3(new THREE.Vector3(-10, -0.2, -10), new THREE.Vector3(10, 0, 10))
  const physics = {
    raycast(origin, direction, max) {
      let best = null
      for (const box of [platform, floor]) {
        const point = new THREE.Ray(origin, direction).intersectBox(box, new THREE.Vector3())
        if (!point) continue
        const distance = point.distanceTo(origin)
        if (distance > max || (best && best.distance < distance)) continue
        const normal = Math.abs(point.y - box.max.y) < 1e-5 ? new THREE.Vector3(0, 1, 0) : new THREE.Vector3(0, 0, 1)
        best = { point, distance, normal }
      }
      return best
    },
  }
  const base = new THREE.Object3D()
  base.position.set(0, 0, 0.9)
  const seat = findFreeSittingSurface(physics, new THREE.Vector3(0, 2, 0.4), new THREE.Vector3(0, -1, 0), base)
  const fitted = fitFreeSittingPose(physics, seat, base, rig())
  assert.ok(fitted?.pose, 'accepts the ledge with feet above the ground')
  assert.equal(fitted.contacts.leftFoot, undefined)
  assert.equal(fitted.contacts.rightFoot, undefined)
})
