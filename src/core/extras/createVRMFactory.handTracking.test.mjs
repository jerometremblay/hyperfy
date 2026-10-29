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
  stdin: {
    contents: `export { createVRMFactory } from './createVRMFactory.js'
      export { clampBoneRotation } from './poseEditorMath.js'`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { createVRMFactory, clampBoneRotation } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function loadAvatar(path = new URL('../../world/assets/avatar.vrm', import.meta.url)) {
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const bytes = fs.readFileSync(path)
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

async function createInstance(matrix = new THREE.Matrix4(), changeRestAxes = false, avatarPath, world) {
  const glb = await loadAvatar(avatarPath)
  if (changeRestAxes) {
    const humanoid = glb.userData.vrm.humanoid
    for (const [name, { node }] of Object.entries(humanoid.humanBones)) {
      if (!/UpperArm|LowerArm|Hand|Index|Middle|Ring|Little|Thumb/.test(name)) continue
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
    { ctx: { entity: null, world } }
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

test('predicted pose roots update rendered eyes immediately without moving the physical transform', async () => {
  const physical = new THREE.Matrix4()
  const instance = await createInstance(physical)
  const eyes = bonePosition(instance, 'leftEye')
  const position = new THREE.Vector3(4, 0, -1)
  const quaternion = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.5)
  instance.setScriptedPose({
    bones: { hips: { rotation: [0, 0, 0, 1] } },
    root: { position: position.toArray(), quaternion: quaternion.toArray() },
  })
  const expected = eyes.clone().applyQuaternion(quaternion).add(position)
  assert.ok(bonePosition(instance, 'leftEye').distanceTo(expected) < 1e-7, 'render prediction must not wait for an animation or network tick')
  assert.ok(physical.equals(new THREE.Matrix4()), 'prediction must leave the physical matrix untouched')
  const corrected = new THREE.Matrix4().makeTranslation(-2, 0, 3)
  instance.move(corrected)
  assert.ok(bonePosition(instance, 'leftEye').distanceTo(expected) < 1e-7, 'an old authoritative transform must not pull back the predicted view')
  assert.ok(physical.equals(corrected))
  instance.setScriptedPose(null, 0.45)
  assert.ok(bonePosition(instance, 'leftEye').distanceTo(expected) < 1e-7, 'release starts at the rendered eyes')
  for (let i = 0; i < 28; i++) instance.update(1 / 60)
  assert.equal(instance.raw.scene.matrixWorld, physical, 'release restores the physical root')
})

test('head-only first person removes head triangles while retaining arms and eye transforms', async () => {
  const instance = await createInstance()
  const meshes = []
  instance.raw.scene.traverse(mesh => { if (mesh.isSkinnedMesh) meshes.push(mesh) })
  const originals = meshes.map(mesh => mesh.geometry)
  const eyes = ['leftEye', 'rightEye'].map(name => bonePosition(instance, name))
  const headNames = new Set()
  instance.raw.userData.vrm.humanoid.getRawBoneNode('head').traverse(bone => headNames.add(bone.name))
  instance.setFirstPerson(true, true)
  let bodyTriangles = 0, armVertices = 0
  for (const mesh of meshes.filter(mesh => mesh.visible)) {
    const indices = mesh.geometry.getIndex()
    const skinIndex = mesh.geometry.getAttribute('skinIndex')
    const weights = mesh.geometry.getAttribute('skinWeight')
    bodyTriangles += indices.count / 3
    for (let i = 0; i < indices.count; i++) {
      const vertex = indices.getX(i)
      let headWeight = 0, armWeight = 0
      for (let slot = 0; slot < weights.itemSize; slot++) {
        const bone = mesh.skeleton.bones[skinIndex.getComponent(vertex, slot)]
        const weight = weights.getComponent(vertex, slot)
        if (headNames.has(bone.name)) headWeight += weight
        if (/UpperArm|LowerArm/.test(bone.name)) armWeight += weight
      }
      assert.ok(headWeight <= 0.5, 'a head-dominated vertex is still rendered')
      if (armWeight > 0.5) armVertices++
    }
  }
  assert.ok(armVertices > 100, 'the arms must remain attached and visible')
  for (const [index, name] of ['leftEye', 'rightEye'].entries())
    assert.ok(bonePosition(instance, name).distanceTo(eyes[index]) < 1e-9, 'hiding the head moved the camera bones')
  instance.setFirstPerson(true)
  const appendageTriangles = meshes.filter(mesh => mesh.visible)
    .reduce((count, mesh) => count + mesh.geometry.getIndex().count / 3, 0)
  assert.ok(bodyTriangles > appendageTriangles * 2, 'head-only mode must retain the body')
  instance.setFirstPerson(false)
  for (const [index, mesh] of meshes.entries()) {
    assert.equal(mesh.geometry, originals[index], 'third person must restore the original mesh')
    assert.equal(mesh.visible, true)
  }
})

test('arms-only view retains both full arms and fingers without rendering the head or torso', async () => {
  const paths = [undefined, ...(process.env.JAY_VRM_PATH ? [process.env.JAY_VRM_PATH] : [])]
  for (const path of paths) {
    const instance = await createInstance(new THREE.Matrix4(), false, path)
    const meshes = []
    instance.raw.scene.traverse(mesh => { if (mesh.isMesh) meshes.push(mesh) })
    const originals = meshes.map(mesh => mesh.geometry)
    const humanoid = instance.raw.userData.vrm.humanoid
    const armNames = new Set()
    for (const side of ['left', 'right'])
      humanoid.getRawBoneNode(`${side}UpperArm`).traverse(bone => armNames.add(bone.name))
    const parts = ['leftUpperArm', 'rightUpperArm', 'leftLowerArm', 'rightLowerArm', 'leftHand', 'rightHand']
    const partNames = Object.fromEntries(parts.map(part => {
      const bone = humanoid.getRawBoneNode(part)
      const names = new Set([bone.name])
      if (part.endsWith('Hand')) bone.traverse(child => names.add(child.name))
      return [part, names]
    }))
    const counts = Object.fromEntries(parts.map(part => [part, 0]))
    const head = bonePosition(instance, 'head')
    instance.setFirstPerson(true, false, true)
    for (const mesh of meshes.filter(mesh => mesh.visible)) {
      assert.ok(mesh.isSkinnedMesh, 'unweighted accessories must not remain visible')
      const indices = mesh.geometry.getIndex()
      const skinIndex = mesh.geometry.getAttribute('skinIndex')
      const weights = mesh.geometry.getAttribute('skinWeight')
      for (let i = 0; i < indices.count; i++) {
        const vertex = indices.getX(i)
        let armWeight = 0, otherWeight = 0
        for (let slot = 0; slot < weights.itemSize; slot++) {
          const name = mesh.skeleton.bones[skinIndex.getComponent(vertex, slot)].name
          const weight = weights.getComponent(vertex, slot)
          if (armNames.has(name)) armWeight += weight
          else otherWeight += weight
          for (const part of parts) {
            if (partNames[part].has(name) && weight > 0.5) counts[part]++
          }
        }
        assert.ok(armWeight > 0 && armWeight >= otherWeight, 'a torso, head or leg vertex is still rendered')
      }
    }
    for (const part of parts) assert.ok(counts[part] > 30, `${part} was removed by the mask`)
    assert.ok(bonePosition(instance, 'head').distanceTo(head) < 1e-9, 'the mask must not move bones')
    instance.setVisible(false)
    assert.ok(meshes.every(mesh => !mesh.visible))
    instance.setVisible(true)
    instance.setFirstPerson(false)
    for (const [index, mesh] of meshes.entries()) {
      assert.equal(mesh.geometry, originals[index])
      assert.equal(mesh.visible, true)
    }
    instance.destroy()
  }
})

test('VR arms respect posture-editor limits for close, crossed, overhead and distant reaches', async () => {
  const avatarMatrix = new THREE.Matrix4().makeRotationY(0.7).setPosition(3, 0.2, -2)
  const instance = await createInstance(avatarMatrix)
  const inverse = avatarMatrix.clone().invert()
  const shoulders = {}
  for (const side of ['left', 'right'])
    shoulders[side] = bonePosition(instance, side + 'UpperArm').applyMatrix4(inverse)
  for (const kind of ['hand', 'controller']) {
    for (const offset of [
      [0, 0, -0.02],
      [0, 0.4, -0.1],
      [0.4, -0.1, -0.2],
      [0, -0.7, 0.01],
      [0, 0, -2],
    ]) {
      const pose = {}
      for (const side of ['left', 'right']) {
        const direction = new THREE.Vector3(...offset)
        if (side === 'right') direction.x *= -1
        pose[side] = { ...trackedHand(side, Math.PI / 3), kind, p: shoulders[side].clone().add(direction).toArray() }
      }
      settle(instance, pose)
      const normalized = instance.getNormalizedPose()
      for (const side of ['left', 'right']) {
        for (const segment of ['UpperArm', 'LowerArm']) {
          const name = side + segment
          const actual = new THREE.Quaternion().fromArray(normalized[name].rotation)
          const limited = new THREE.Quaternion().fromArray(clampBoneRotation(name, actual.toArray()))
          assert.ok(actual.angleTo(limited) < 1e-6, `${kind} ${name} exceeds posture-editor limits at ${offset}`)
        }
      }
    }
  }
})

test('elbows stay below the shoulders without flipping as wrists cross shoulder height', async () => {
  const instance = await createInstance()
  for (const side of ['left', 'right']) {
    const shoulder = bonePosition(instance, side + 'UpperArm')
    let previous
    for (const height of [0.01, 0, -0.01]) {
      const hand = trackedHand(side, 0)
      hand.p = shoulder
        .clone()
        .add(new THREE.Vector3(0, height, -0.3))
        .toArray()
      settle(instance, { [side]: hand })
      const elbow = bonePosition(instance, side + 'LowerArm')
      assert.ok(elbow.y < shoulder.y, `${side} elbow points upward with wrist at shoulder height`)
      if (previous) assert.ok(elbow.distanceTo(previous) < 0.03, `${side} elbow flipped across shoulder height`)
      previous = elbow
    }
  }
})

test('elbows remain continuous when wrists cross the downward elbow pole', async () => {
  for (const avatarMatrix of [new THREE.Matrix4(), new THREE.Matrix4().makeRotationY(1.2).setPosition(-2, 0.3, 4)]) {
    const instance = await createInstance(avatarMatrix)
    for (const side of ['left', 'right']) {
      const shoulder = bonePosition(instance, side + 'UpperArm').applyMatrix4(avatarMatrix.clone().invert())
      const direction = new THREE.Vector3(side === 'left' ? -0.5 : 0.5, -1, 0).normalize().multiplyScalar(0.3)
      let previous
      for (const depth of [-0.02, -0.01, 0, 0.01, 0.02]) {
        const hand = trackedHand(side, 0)
        hand.p = shoulder
          .clone()
          .add(direction)
          .add(new THREE.Vector3(0, 0, depth))
          .toArray()
        settle(instance, { [side]: hand })
        const elbow = bonePosition(instance, side + 'LowerArm')
        if (previous) assert.ok(elbow.distanceTo(previous) < 0.03, `${side} elbow flipped across its pole at ${depth}`)
        previous = elbow
      }
    }
  }
})

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

test('constrained reaches preserve absolute wrist and finger orientations', async () => {
  const instance = await createInstance(new THREE.Matrix4(), true)
  const wrist = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.7, -0.4, 1.2))
  const hand = trackedHand('left', Math.PI / 3, wrist)
  settle(instance, { left: hand })
  const names = ['leftHand', 'leftIndexProximal', 'leftIndexIntermediate', 'leftIndexDistal']
  const rotations = names.map(name => new THREE.Quaternion().setFromRotationMatrix(instance.getBoneTransform(name)))
  const shoulder = bonePosition(instance, 'leftUpperArm')
  for (const offset of [
    [0, 0, -0.02],
    [0, 0.6, -0.1],
    [0.4, 0, 0],
  ]) {
    settle(instance, {
      left: {
        ...hand,
        p: shoulder
          .clone()
          .add(new THREE.Vector3(...offset))
          .toArray(),
      },
    })
    for (let i = 0; i < names.length; i++) {
      const rotation = new THREE.Quaternion().setFromRotationMatrix(instance.getBoneTransform(names[i]))
      assert.ok(rotation.angleTo(rotations[i]) < 1e-6, `${names[i]} changed orientation when an arm limit was reached`)
    }
  }
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

test('loaded VRM factory isolates expressions across player instances', async () => {
  const glb = await loadAvatar()
  glb.scene.traverse(node => {
    if (node.geometry && !node.geometry.computeBoundsTree) node.geometry.computeBoundsTree = () => node.geometry
  })
  const scene = new THREE.Scene()
  const camera = new THREE.Object3D()
  camera.updateMatrixWorld(true)
  const factory = createVRMFactory(glb, () => {})
  const hooks = {
    camera,
    scene,
    loader: { load: () => Promise.resolve({ toClip: () => new THREE.AnimationClip('test', 0, []) }) },
  }
  const a = factory.create(new THREE.Matrix4(), hooks)
  const b = factory.create(new THREE.Matrix4(), hooks)
  a.disableRateCheck()
  b.disableRateCheck()
  const manager = a.raw.userData.vrm.expressionManager
  assert.ok(manager.expressions.length > 0)
  const expression = manager.expressions.find(expression => expression.binds.some(bind => bind.primitives?.length))
  assert.ok(expression)
  a.setExpression(expression.expressionName, 1)
  a.update(0.016)
  b.update(0.016)
  const bind = expression.binds.find(bind => bind.primitives?.length)
  assert.ok(bind.primitives.some(mesh => mesh.morphTargetInfluences[bind.index] > 0))
  const other = b.raw.userData.vrm.expressionManager.getExpression(expression.expressionName)
  assert.equal(other.weight, 0)
  assert.notEqual(bind.primitives[0], other.binds.find(bind => bind.primitives?.length).primitives[0])
  a.destroy()
  b.destroy()
})

test('scripted body and grip targets follow the native skeleton and restore it after cleanup', async () => {
  for (const changedAxes of [false, true]) {
    const matrix = new THREE.Matrix4().makeRotationY(0.7).setPosition(3, 0.2, -2)
    const instance = await createInstance(matrix, changedAxes)
    const rest = instance.getNormalizedPose()
    const beforeHead = bonePosition(instance, 'head')
    const lengths = side => [
      bonePosition(instance, side + 'UpperArm').distanceTo(bonePosition(instance, side + 'LowerArm')),
      bonePosition(instance, side + 'LowerArm').distanceTo(bonePosition(instance, side + 'Hand')),
    ]
    const originalLengths = lengths('right')
    const target = new THREE.Vector3(0.3, 1.15, -0.35)
    const pose = {
      bones: { hips: { rotation: [-0.24740396, 0, 0, 0.96891242], position: [0, -0.05, 0] } },
      hands: { right: { ...trackedHand('right', 0.5), p: target.toArray(), pole: [0.3, 1, 0] } },
    }
    instance.setScriptedPose(pose)
    instance.update(1 / 60)
    const expected = target.applyMatrix4(matrix)
    assert.ok(bonePosition(instance, 'rightHand').distanceTo(expected) < 0.01)
    assert.ok(bonePosition(instance, 'head').distanceTo(beforeHead) > 0.1)
    for (let i = 0; i < originalLengths.length; i++)
      assert.ok(Math.abs(lengths('right')[i] - originalLengths[i]) < 1e-6)
    const raisedElbow = bonePosition(instance, 'rightLowerArm')
    instance.setScriptedPose({ ...pose, hands: { right: { ...pose.hands.right, pole: [0.3, -1, 0] } } })
    instance.update(1 / 60)
    assert.ok(bonePosition(instance, 'rightLowerArm').y < raisedElbow.y - 0.1, 'explicit pole change retained the old bend side')
    instance.setScriptedPose(null)
    instance.update(1 / 60)
    assert.ok(bonePosition(instance, 'head').distanceTo(beforeHead) < 1e-6)
    const restored = instance.getNormalizedPose()
    for (const bone of ['hips', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightIndexProximal']) {
      const a = new THREE.Quaternion().fromArray(rest[bone].rotation)
      const b = new THREE.Quaternion().fromArray(restored[bone].rotation)
      assert.ok(a.angleTo(b) < 1e-6, `${bone} retained its scripted pose`)
    }
    instance.destroy()
  }
})

test('scripted release eases the solved body, arms and fingers into normal animation without snapping', async () => {
  for (const changedAxes of [false, true]) {
    const instance = await createInstance(new THREE.Matrix4().makeTranslation(30, 0, 0), changedAxes)
    const rest = instance.getNormalizedPose()
    const pose = {
      bones: { hips: { rotation: [-0.24740396, 0, 0, 0.96891242], position: [0, -0.1, 0] } },
      hands: { right: { ...trackedHand('right', 0.8), p: [0.3, 1.15, -0.35], pole: [0, 1, 0] } },
    }
    instance.setScriptedPose(pose)
    instance.update(1 / 60)
    const from = instance.getNormalizedPose()
    instance.setScriptedPose(null, 0.45)
    assert.deepEqual(instance.getNormalizedPose(), from, 'starting release must retain the current rendered pose')
    let previous = from
    for (let frame = 1; frame <= 27; frame++) {
      instance.update(1 / 60)
      const current = instance.getNormalizedPose()
      for (const name of ['hips', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightIndexProximal']) {
        const a = new THREE.Quaternion().fromArray(previous[name].rotation)
        const b = new THREE.Quaternion().fromArray(current[name].rotation)
        assert.ok(a.angleTo(b) < 0.2, `${name} jumped during release at frame ${frame}`)
      }
      if (frame === 1) {
        assert.ok(Math.abs(current.hips.position[1] - from.hips.position[1]) < 0.002)
      }
      if (frame === 13) {
        assert.ok(current.hips.position[1] > from.hips.position[1] + 0.03)
        assert.ok(current.hips.position[1] < rest.hips.position[1] - 0.03)
      }
      previous = current
    }
    instance.update(0.01)
    const standing = instance.getNormalizedPose()
    for (const name of ['hips', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightIndexProximal']) {
      assert.ok(new THREE.Quaternion().fromArray(rest[name].rotation)
        .angleTo(new THREE.Quaternion().fromArray(standing[name].rotation)) < 1e-6)
    }
    assert.ok(Math.abs(standing.hips.position[1] - rest.hips.position[1]) < 1e-8)
    instance.destroy()
  }
})

test('scripted entry blends the solved body, arms, fingers and predicted root without restarting on updates', async () => {
  for (const changedAxes of [false, true]) {
    const physical = new THREE.Matrix4()
    const instance = await createInstance(physical, changedAxes)
    const target = await createInstance(new THREE.Matrix4(), changedAxes)
    const from = instance.getNormalizedPose()
    const pose = {
      bones: { hips: { rotation: [-0.24740396, 0, 0, 0.96891242], position: [0, -0.1, 0] } },
      hands: { right: { ...trackedHand('right', 0.8), p: [0.3, 1.15, -0.35], pole: [0, 1, 0] } },
      root: { position: [2, 0, -1], quaternion: [0, Math.sin(.25), 0, Math.cos(.25)] },
    }
    target.setScriptedPose(pose)
    const to = target.getNormalizedPose()
    instance.setScriptedPose(pose, 1)
    const initial = instance.getNormalizedPose()
    for (const [name, bone] of Object.entries(from)) {
      assert.ok(new THREE.Quaternion().fromArray(bone.rotation)
        .angleTo(new THREE.Quaternion().fromArray(initial[name].rotation)) < 1e-6,
        'entry starts at the rendered standing pose')
      if (bone.position) assert.ok(new THREE.Vector3(...bone.position)
        .distanceTo(new THREE.Vector3(...initial[name].position)) < 1e-8)
    }
    assert.ok(bonePosition(instance, 'leftEye').distanceTo(bonePosition(target, 'leftEye')) > .5)
    const eyeTarget = target.getBoneTransform('leftEye').clone()
    for (let frame = 1; frame <= 60; frame++) {
      instance.setScriptedPose(pose)
      instance.update(1 / 60)
      const t = Math.min(1, frame / 60), blend = t * t * (3 - 2 * t)
      const current = instance.getNormalizedPose()
      const renderedRoot = instance.raw.scene.matrixWorld.clone()
      const destination = instance.getBoneTransform('leftEye', { targetPose: true }).clone()
      assert.ok(destination.elements.every((value, i) => Math.abs(value - eyeTarget.elements[i]) < 1e-6),
        'the camera destination stays at the fully solved eye while the body lowers')
      assert.ok(instance.raw.scene.matrixWorld.equals(renderedRoot), 'target reads never move the rendered root')
      assert.deepEqual(instance.getNormalizedPose(), current, 'target reads never change the rendered body')
      for (const name of ['hips', 'rightUpperArm', 'rightLowerArm', 'rightHand', 'rightIndexProximal']) {
        const expected = new THREE.Quaternion().fromArray(from[name].rotation)
          .slerp(new THREE.Quaternion().fromArray(to[name].rotation), blend)
        assert.ok(expected.angleTo(new THREE.Quaternion().fromArray(current[name].rotation)) < 1e-6,
          `${name} must blend from standing to the solved aiming pose`)
      }
      const root = new THREE.Vector3().setFromMatrixPosition(instance.raw.scene.matrixWorld)
      assert.ok(root.distanceTo(new THREE.Vector3(2, 0, -1).multiplyScalar(blend)) < 1e-8)
      const orientation = new THREE.Quaternion().setFromRotationMatrix(instance.raw.scene.matrixWorld)
      assert.ok(orientation.angleTo(new THREE.Quaternion()
        .slerp(new THREE.Quaternion().fromArray(pose.root.quaternion), blend)) < 1e-6,
        'predicted root rotation must also ease without a final snap')
      assert.ok(physical.equals(new THREE.Matrix4()), 'entry never moves the physical player')
    }
    assert.ok(bonePosition(instance, 'rightHand').distanceTo(bonePosition(target, 'rightHand')) < 1e-6,
      'entry finishes at the exact IK target')
    instance.destroy()
    target.destroy()
  }
})

test('scripted entry uses visual time at low FPS and an interrupted entry releases from its rendered root', async () => {
  const world = { time: 0 }
  const physical = new THREE.Matrix4()
  const instance = await createInstance(physical, false, undefined, world)
  const pose = { bones: { hips: { position: [0, -.1, 0] } },
    root: { position: [2, 0, -1], quaternion: [0, 0, 0, 1] } }
  instance.setScriptedPose(pose, 1)
  for (let frame = 1; frame <= 6; frame++) {
    world.time = frame / 12
    instance.setScriptedPose(pose)
    instance.update(1 / 30)
  }
  assert.ok(Math.abs(instance.getNormalizedPose().hips.position[1] + .05) < 1e-8,
    'the physics delta cap must not slow the entry animation')
  const rendered = instance.raw.scene.matrixWorld.clone()
  instance.setScriptedPose(null, .5)
  assert.ok(instance.raw.scene.matrixWorld.equals(rendered), 'cancelling entry retains its current root')
  for (let frame = 1; frame <= 6; frame++) {
    world.time = .5 + frame / 12
    instance.update(1 / 30)
  }
  assert.equal(instance.raw.scene.matrixWorld, physical)
  instance.destroy()
})

test('a new shooting pose cancels release, and release targets the current normal pose', async () => {
  const instance = await createInstance()
  const pose = { bones: { hips: { position: [0, -0.1, 0] } } }
  instance.setScriptedPose(pose)
  instance.update(1 / 60)
  instance.setScriptedPose(null, 0.45)
  instance.update(0.2)
  instance.setScriptedPose(pose)
  instance.update(1 / 60)
  assert.ok(Math.abs(instance.getNormalizedPose().hips.position[1] + 0.1) < 1e-8)
  instance.setScriptedPose(null, 0.45)
  instance.setPoseOverride({ hips: { position: [0, 0.05, 0] } })
  instance.update(0.5)
  assert.ok(Math.abs(instance.getNormalizedPose().hips.position[1] - 0.05) < 1e-8,
    'release must target the current animation/override rather than stale standing bones')
  instance.destroy()
})
