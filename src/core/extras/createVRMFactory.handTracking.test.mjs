import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { build } from 'esbuild'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { cloneHandTrackingPose } from './handTracking.js'

globalThis.self = globalThis
globalThis.createImageBitmap = async () => ({
  width: 1,
  height: 1,
  close() {},
})

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./createVRMFactory.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { createVRMFactory } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function loadAvatar() {
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const bytes = fs.readFileSync(new URL('../../world/assets/avatar.vrm', import.meta.url))
  return new Promise((resolve, reject) => {
    loader.parse(bytes.buffer, '', resolve, reject)
  })
}

test('retargets an arm toward a wrist target in front of the avatar', async () => {
  const glb = await loadAvatar()
  glb.scene.traverse(node => {
    if (node.geometry && !node.geometry.computeBoundsTree) {
      node.geometry.computeBoundsTree = () => node.geometry
    }
  })

  const scene = new THREE.Scene()
  scene.updateMatrixWorld(true)
  const camera = new THREE.Object3D()
  camera.updateMatrixWorld(true)
  const clip = { toClip: () => new THREE.AnimationClip('test', 0, []) }
  const factory = createVRMFactory(glb, () => {})
  const instance = factory.create(
    new THREE.Matrix4(),
    {
      camera,
      loader: { load: () => Promise.resolve(clip) },
      scene,
    },
    { ctx: { entity: null } }
  )
  instance.updateRate()

  const targets = {
    left: new THREE.Vector3(-0.3, 1.35, -0.35),
    right: new THREE.Vector3(0.3, 1.35, -0.35),
  }
  instance.setHandTrackingPose({
    left: { kind: 'hand', p: targets.left.toArray(), w: [0, 0, 0, 1], f: {} },
    right: { kind: 'hand', p: targets.right.toArray(), w: [0, 0, 0, 1], f: {} },
  })
  for (let i = 0; i < 20; i++) instance.update(1 / 60)

  for (const side of ['left', 'right']) {
    const handMatrix = instance.getBoneTransform(`${side}Hand`)
    const handPosition = new THREE.Vector3().setFromMatrixPosition(handMatrix)
    assert.ok(
      handPosition.distanceTo(targets[side]) < 0.02,
      `${side} hand stayed ${handPosition.distanceTo(targets[side]).toFixed(3)}m from the wrist target`
    )
  }

  const verticalFlip = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
  instance.setHandTrackingPose({
    left: { kind: 'hand', p: targets.left.toArray(), w: verticalFlip.toArray(), f: {} },
  })
  for (let i = 0; i < 20; i++) instance.update(1 / 60)

  const fingerDirection = bonePosition(instance, 'leftIndexIntermediate')
    .sub(bonePosition(instance, 'leftIndexProximal'))
    .normalize()
  assert.ok(fingerDirection.z < -0.8, `vertical flip turned fingers sideways: ${fingerDirection.toArray()}`)
})

async function createInstance(matrix = new THREE.Matrix4(), changeRestAxes = false) {
  const glb = await loadAvatar()
  if (changeRestAxes) {
    const humanoid = glb.userData.vrm.humanoid
    for (const [name, { node }] of Object.entries(humanoid.humanBones)) {
      if (!/Hand|Index|Middle|Ring|Little|Thumb/.test(name)) continue
      const rotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.35, -0.6, 0.25))
      const inverse = rotation.clone().invert()
      node.quaternion.multiply(rotation)
      for (const child of node.children) {
        child.position.applyQuaternion(inverse)
        child.quaternion.premultiply(inverse)
      }
    }
    for (const [name, { node }] of Object.entries(humanoid.humanBones)) {
      humanoid.rawRestPose[name].rotation = node.quaternion.toArray()
      humanoid.rawRestPose[name].position = node.position.toArray()
    }
    glb.scene.updateMatrixWorld(true)
  }

  glb.scene.traverse(node => {
    if (node.geometry && !node.geometry.computeBoundsTree) node.geometry.computeBoundsTree = () => node.geometry
  })
  const scene = new THREE.Scene()
  const camera = new THREE.Object3D()
  const clip = { toClip: () => new THREE.AnimationClip('test', 0, []) }
  const factory = createVRMFactory(glb, () => {})
  const instance = factory.create(
    matrix,
    { camera, loader: { load: () => Promise.resolve(clip) }, scene },
    { ctx: { entity: null } }
  )
  instance.updateRate()
  return instance
}

function trackedHand(side, curl, wrist = new THREE.Quaternion()) {
  const f = {}
  for (const finger of ['Index', 'Middle', 'Ring', 'Little']) {
    for (const [segment, angle] of [
      ['Proximal', curl],
      ['Intermediate', curl * 2],
      ['Distal', curl * 2.5],
    ]) {
      f[finger + segment] = wrist
        .clone()
        .multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -angle))
        .toArray()
    }
  }
  return { kind: 'hand', p: [side === 'left' ? -0.3 : 0.3, 1.35, -0.35], w: wrist.toArray(), f }
}

function settle(instance, pose) {
  instance.setHandTrackingPose(pose)
  for (let i = 0; i < 40; i++) instance.update(1 / 60)
}

function bonePosition(instance, name) {
  return new THREE.Vector3().setFromMatrixPosition(instance.getBoneTransform(name))
}

test('a fist on the first tracked frame curls both index fingers toward the palm', async () => {
  const instance = await createInstance()
  settle(instance, { left: trackedHand('left', Math.PI / 3), right: trackedHand('right', Math.PI / 3) })
  for (const side of ['left', 'right']) {
    const proximal = bonePosition(instance, side + 'IndexProximal')
    const intermediate = bonePosition(instance, side + 'IndexIntermediate')
    const direction = intermediate.sub(proximal).normalize()
    assert.ok(direction.y < -0.8, `${side} index curls away from palm: ${direction.toArray()}`)
    assert.ok(direction.z < -0.35, `${side} index curls sideways: ${direction.toArray()}`)
  }
})

test('absolute wrist orientation stays fixed as the arm target moves', async () => {
  const instance = await createInstance()
  const hand = trackedHand('left', 0)
  settle(instance, { left: hand })
  const before = new THREE.Quaternion().setFromRotationMatrix(instance.getBoneTransform('leftHand'))
  settle(instance, { left: { ...hand, p: [-0.4, 1.1, -0.2] } })
  const after = new THREE.Quaternion().setFromRotationMatrix(instance.getBoneTransform('leftHand'))
  assert.ok(before.angleTo(after) < 0.01, 'moving the wrist position changed its measured orientation')
})

test('wrist flips preserve curl and work under a translated, rotated avatar root', async () => {
  const avatarMatrix = new THREE.Matrix4().makeRotationY(0.7).setPosition(3, 0.2, -2)
  const instance = await createInstance(avatarMatrix)
  const wrist = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 0, 1), Math.PI)
  settle(instance, { left: trackedHand('left', Math.PI / 3, wrist), right: trackedHand('right', Math.PI / 3, wrist) })
  const expectedPalm = new THREE.Vector3(0, -1, 0).applyQuaternion(wrist).transformDirection(avatarMatrix)
  for (const side of ['left', 'right']) {
    const direction = bonePosition(instance, side + 'IndexIntermediate')
      .sub(bonePosition(instance, side + 'IndexProximal'))
      .normalize()
    assert.ok(direction.dot(expectedPalm) > 0.8, `${side} wrist flip reversed finger curl`)
  }
})

test('terminal finger bones follow tracking even without fingertip children', async () => {
  const instance = await createInstance()
  const terminalDirections = {}
  for (const side of ['left', 'right']) {
    let distal
    instance.raw.scene.traverse(mesh => {
      if (mesh.isSkinnedMesh) distal = mesh.skeleton.getBoneByName(`J_Bip_${side === 'left' ? 'L' : 'R'}_Index3`)
    })
    assert.equal(distal.children.length, 0)
    terminalDirections[side] = distal
      .getWorldPosition(new THREE.Vector3())
      .sub(distal.parent.getWorldPosition(new THREE.Vector3()))
      .normalize()
      .applyQuaternion(distal.getWorldQuaternion(new THREE.Quaternion()).invert())
  }
  settle(instance, { left: trackedHand('left', Math.PI / 3), right: trackedHand('right', Math.PI / 3) })
  for (const side of ['left', 'right']) {
    const direction = terminalDirections[side].applyQuaternion(
      new THREE.Quaternion().setFromRotationMatrix(instance.getBoneTransform(side + 'IndexDistal'))
    )
    assert.ok(
      direction.y < -0.45 && direction.z > 0.8,
      `${side} terminal segment stayed straight: ${direction.toArray()}`
    )
  }
})

test('different raw bone rest axes produce the same anatomical fist', async () => {
  const instance = await createInstance(new THREE.Matrix4(), true)
  settle(instance, { left: trackedHand('left', Math.PI / 3), right: trackedHand('right', Math.PI / 3) })
  for (const side of ['left', 'right']) {
    const direction = bonePosition(instance, side + 'IndexIntermediate')
      .sub(bonePosition(instance, side + 'IndexProximal'))
      .normalize()
    assert.ok(direction.y < -0.8 && direction.z < -0.35, `${side} rest axes changed curl: ${direction.toArray()}`)
  }
})

test('controller holding uses grip axes and a closed pose on both hands', async () => {
  const instance = await createInstance()
  const controller = side => ({
    kind: 'controller',
    p: [side === 'left' ? -0.3 : 0.3, 1.25, -0.35],
    w: [0, 0, 0, 1],
    f: {},
  })
  settle(instance, { left: controller('left'), right: controller('right') })
  for (const side of ['left', 'right']) {
    const hand = bonePosition(instance, side + 'Hand')
    assert.ok(hand.y > 1.3, `${side} wrist was placed at the grip centroid`)
    const direction = bonePosition(instance, side + 'MiddleIntermediate')
      .sub(bonePosition(instance, side + 'MiddleProximal'))
      .normalize()
    assert.ok(direction.x * (side === 'left' ? 1 : -1) > 0.5, `${side} grip fingers curl away from handle`)
  }
  settle(instance, { left: trackedHand('left', Math.PI / 3) })
  const direction = bonePosition(instance, 'leftIndexIntermediate')
    .sub(bonePosition(instance, 'leftIndexProximal'))
    .normalize()
  assert.ok(direction.y < -0.8, 'controller-to-hand switch reused a controller calibration')
})

test('thumb segments follow a pinching direction with their rolled skin frame', async () => {
  const instance = await createInstance()
  const pose = {}
  const expected = {}
  for (const side of ['left', 'right']) {
    const direction = new THREE.Vector3(side === 'left' ? -0.6 : 0.6, -0.35, -0.72).normalize()
    expected[side] = direction
    // Known XR anatomical frame: -Z points along the segment, -Y out of its skin.
    const z = direction.clone().negate()
    const y = new THREE.Vector3(0, 1, 0)
      .cross(direction)
      .multiplyScalar(side === 'left' ? 1 : -1)
      .normalize()
    const x = y.clone().cross(z).normalize()
    const orientation = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
    pose[side] = trackedHand(side, 0)
    for (const segment of ['Metacarpal', 'Proximal', 'Distal']) pose[side].f['Thumb' + segment] = orientation.toArray()
  }
  settle(instance, pose)
  for (const side of ['left', 'right']) {
    const direction = bonePosition(instance, side + 'ThumbProximal')
      .sub(bonePosition(instance, side + 'ThumbMetacarpal'))
      .normalize()
    assert.ok(direction.dot(expected[side]) > 0.99, `${side} thumb twisted away from pinch: ${direction.toArray()}`)
  }
})

test('server-cloned poses and late joiners reproduce a fist after a seated override', async () => {
  const local = await createInstance()
  const remote = await createInstance()
  remote.setPoseOverride({ leftIndexProximal: { rotation: [0.3, 0, 0, Math.sqrt(0.91)] } })
  const pose = { left: trackedHand('left', Math.PI / 3), right: trackedHand('right', Math.PI / 3) }
  settle(local, pose)
  settle(remote, cloneHandTrackingPose(pose))
  for (const side of ['left', 'right']) {
    for (const bone of ['Hand', 'IndexProximal', 'IndexIntermediate', 'IndexDistal']) {
      const localMatrix = local.getBoneTransform(side + bone)
      const remoteMatrix = remote.getBoneTransform(side + bone)
      const localQ = new THREE.Quaternion().setFromRotationMatrix(localMatrix)
      const remoteQ = new THREE.Quaternion().setFromRotationMatrix(remoteMatrix)
      assert.ok(localQ.angleTo(remoteQ) < 0.01, `${side + bone} differs for late joiner`)
    }
  }
})

test('lost finger segments and tracking exit restore animation instead of retaining the fist', async () => {
  const instance = await createInstance()
  const pose = { left: trackedHand('left', Math.PI / 3) }
  settle(instance, pose)
  settle(instance, { left: { ...pose.left, f: {} } })
  const direction = bonePosition(instance, 'leftIndexIntermediate')
    .sub(bonePosition(instance, 'leftIndexProximal'))
    .normalize()
  assert.ok(direction.z < -0.99, 'missing index segment stayed curled')
  instance.setHandTrackingPose(null)
  instance.update(1 / 60)
  assert.ok(instance.getBoneTransform('leftHand').elements.every(Number.isFinite))
})
