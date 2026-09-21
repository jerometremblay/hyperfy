import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import * as THREE from 'three'

const editorBundle = await build({
  entryPoints: [fileURLToPath(new URL('./ClientPoseEditor.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientPoseEditor } = await import(
  `data:text/javascript;base64,${Buffer.from(editorBundle.outputFiles[0].contents).toString('base64')}`
)

function createFixture({ pointerLocked = false, profileId = null } = {}) {
  const scene = new THREE.Scene()
  const viewport = {
    style: {},
    addEventListener() {},
    removeEventListener() {},
    getBoundingClientRect: () => ({ left: 0, top: 0, width: 100, height: 100 }),
  }
  const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
  camera.position.z = 3
  const rig = new THREE.Object3D()
  rig.position.set(1, 2, 3)
  const boundCameraPosition = new THREE.Vector3().copy(rig.position)
  const boundCameraQuaternion = new THREE.Quaternion().copy(rig.quaternion)
  const boundCameraRotation = {
    x: 0,
    y: 0,
    z: 0,
    set(x, y, z) {
      this.x = x
      this.y = y
      this.z = z
      boundCameraQuaternion.setFromEuler(new THREE.Euler(x, y, z, 'YXZ'))
    },
  }
  const boundCamera = {
    position: boundCameraPosition,
    quaternion: boundCameraQuaternion,
    rotation: boundCameraRotation,
    zoom: 3,
    write: false,
  }
  const keys = [
    'escape',
    'keyW',
    'keyA',
    'keyS',
    'keyD',
    'arrowUp',
    'arrowDown',
    'arrowLeft',
    'arrowRight',
    'space',
    'keyC',
    'shiftLeft',
    'shiftRight',
    'keyZ',
    'keyE',
  ]
  const control = {
    camera: boundCamera,
    mouseLeft: { down: false, pressed: false, released: false, capture: false },
    mouseRight: { down: false, pressed: false, released: false, capture: false },
    scrollDelta: { value: 0, capture: false },
    pointer: { delta: new THREE.Vector3(), coords: new THREE.Vector2(0.5, 0.5), unlock() {} },
    hideReticle() {},
    release() {},
  }
  for (const key of keys) control[key] = { capture: false, down: false, onPress: null }

  const networkMessages = []
  const events = []
  const anchor = new THREE.Matrix4().compose(
    new THREE.Vector3(4, 0, -3),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.35),
    new THREE.Vector3(1, 1, 1)
  )
  const sourceScene = new THREE.Group()
  sourceScene.matrixAutoUpdate = false
  sourceScene.matrix.copy(anchor)
  const hips = new THREE.Bone()
  hips.name = 'hips'
  hips.rotation.x = 0.25
  sourceScene.add(hips)
  const head = new THREE.Bone()
  head.name = 'head'
  head.position.y = 1.6
  sourceScene.add(head)
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.8, 0.3), new THREE.MeshBasicMaterial())
  mesh.position.y = 0.9
  sourceScene.add(mesh)
  sourceScene.updateMatrixWorld(true)

  const avatar = {
    visible: true,
    instance: { raw: { scene: sourceScene } },
    factory: {
      cloneScene(source) {
        return { scene: source.clone(true), detachedRoots: [] }
      },
      getNormalizedBoneNames() {
        return ['hips', 'head']
      },
      getRawBoneName(name) {
        return name
      },
      getNormalizedPose(scene) {
        const bone = scene.getObjectByName('hips')
        const headBone = scene.getObjectByName('head')
        return {
          hips: {
            rotation: bone.quaternion.toArray(),
            position: bone.position.toArray(),
          },
          head: { rotation: headBone.quaternion.toArray() },
        }
      },
      applyNormalizedPose(scene, pose) {
        const bone = scene.getObjectByName('hips')
        if (pose.hips?.rotation) bone.quaternion.fromArray(pose.hips.rotation)
        if (pose.hips?.position) bone.position.fromArray(pose.hips.position)
        bone.updateMatrix()
        bone.updateMatrixWorld(true)
        const headBone = scene.getObjectByName('head')
        if (pose.head?.rotation) headBone.quaternion.fromArray(pose.head.rotation)
        headBone.updateMatrix()
        headBone.updateMatrixWorld(true)
      },
    },
    getHeight: () => 1.8,
  }
  const playerControlCamera = {
    position: new THREE.Vector3(1, 2, 3),
    quaternion: new THREE.Quaternion(),
    zoom: 2.4,
    write: true,
  }
  const player = {
    isLocal: true,
    isXR: false,
    data: { id: 'local-player', owner: 'local-client', avatar: 'asset://test.vrm', effect: { anchorId: 'seat-1' } },
    avatar,
    base: new THREE.Object3D(),
    cam: {
      position: new THREE.Vector3(1, 2, 3),
      quaternion: new THREE.Quaternion(),
      zoom: 2.4,
    },
    aura: { active: true },
    control: {
      camera: playerControlCamera,
      pointer: { lock() {} },
    },
    getAnchorMatrix: () => anchor,
  }

  const controls = {
    pointer: { locked: pointerLocked },
    bind() {
      return control
    },
  }
  const entities = { player, items: new Map([[player.data.id, player]]) }
  const engineWorld = {
    network: { isClient: true, id: 'local-client', send: (...args) => networkMessages.push(args) },
    anchors: { getProfileId: () => profileId },
    xr: { session: null },
    entities,
    controls,
    graphics: { viewport },
    rig,
    camera,
    stage: { scene },
    emit: (...args) => events.push(args),
  }
  const editor = new ClientPoseEditor(engineWorld)
  editor.start()

  return { anchor, control, editor, engineWorld, events, head, hips, networkMessages, player, scene, sourceScene }
}

function syncEditorCamera(world, control) {
  world.camera.position.copy(control.camera.position)
  world.camera.quaternion.copy(control.camera.quaternion)
  world.camera.updateMatrixWorld(true)
}

function pointerCoordsAt(world, point) {
  const projected = point.clone().project(world.camera)
  return new THREE.Vector2((projected.x + 1) / 2, (1 - projected.y) / 2)
}

test('opens a local duplicate of the seated avatar without submitting pose changes', () => {
  const { editor, hips, networkMessages, player, scene, sourceScene } = createFixture()

  assert.equal(editor.open(player), true)

  const preview = scene.children.find(child => child.name === 'avatar-pose-preview')
  assert.ok(preview)
  assert.notEqual(preview, sourceScene)
  assert.notEqual(preview.getObjectByName('hips'), hips)
  assert.equal(preview.getObjectByName('hips').rotation.x, hips.rotation.x)
  assert.equal(player.poseEditorActive, true)
  assert.equal(player.avatar.visible, false)
  assert.equal(player.aura.active, false)
  assert.equal(player.data.effect.anchorId, 'seat-1')
  assert.deepEqual(networkMessages, [['playerSeatPoseStyles', { action: 'list' }]])

  editor.close()
  assert.equal(player.poseEditorActive, false)
  assert.equal(player.avatar.visible, true)
  assert.equal(player.aura.active, true)
  assert.equal(scene.children.includes(preview), false)
  assert.equal(
    networkMessages.some(([type]) => type === 'playerSeatPose'),
    false
  )
})

test('only opens while the local player is attached to a seat anchor', () => {
  const { editor, player, scene } = createFixture()
  player.getAnchorMatrix = () => null

  assert.equal(editor.open(player), false)
  assert.equal(scene.children.length, 0)
  assert.equal(player.avatar.visible, true)
})

test('orbits and zooms the preview, then Escape restores the original camera state', () => {
  const { control, editor, engineWorld, player } = createFixture({ pointerLocked: true })
  const initialPosition = engineWorld.rig.position.clone()
  const initialZoom = engineWorld.camera.position.z

  assert.equal(editor.open(player), true)
  const initialCameraRotation = control.camera.quaternion.clone()
  const initialOrbitDistance = editor.session.orbit.distance
  control.mouseRight.down = true
  control.pointer.delta.set(80, 20, 0)
  control.scrollDelta.value = 80
  editor.update(1 / 60)

  assert.ok(control.camera.quaternion.angleTo(initialCameraRotation) > 0)
  assert.notEqual(editor.session.orbit.distance, initialOrbitDistance)
  assert.equal(control.escape.onPress(), true)
  assert.equal(editor.session, null)
  assert.ok(engineWorld.rig.position.distanceTo(initialPosition) < 1e-8)
  assert.equal(engineWorld.camera.position.z, initialZoom)
  assert.equal(player.poseEditorActive, false)
})

test('dragging the preview moves it in the seat-local ground plane', () => {
  const { control, editor, engineWorld, player } = createFixture()
  assert.equal(editor.open(player), true)
  syncEditorCamera(engineWorld, control)

  const start = editor.session.placementPosition.clone()
  control.pointer.coords.copy(pointerCoordsAt(engineWorld, new THREE.Vector3(4, 0.9, -3)))
  control.mouseLeft.down = true
  control.mouseLeft.pressed = true
  editor.update(1 / 60)
  assert.ok(editor.session.drag)

  control.mouseLeft.pressed = false
  control.pointer.coords.x += 0.08
  syncEditorCamera(engineWorld, control)
  editor.update(1 / 60)

  assert.ok(editor.session.placementPosition.distanceTo(start) > 0.05)
  assert.ok(Math.abs(editor.session.placementPosition.y - start.y) < 1e-6)

  control.mouseLeft.down = false
  control.mouseLeft.released = true
  editor.update(1 / 60)
  assert.equal(editor.session.drag, null)
  const moved = editor.session.placementPosition.clone()
  assert.equal(editor.session.history.length, 2)
  assert.equal(editor.undo(), true)
  assert.ok(editor.session.placementPosition.distanceTo(start) < 1e-6)
  assert.equal(editor.redo(), true)
  assert.ok(editor.session.placementPosition.distanceTo(moved) < 1e-6)
  editor.close()
})

test('shift-dragging the preview adjusts seat-local height', () => {
  const { control, editor, engineWorld, player } = createFixture()
  assert.equal(editor.open(player), true)
  syncEditorCamera(engineWorld, control)

  const start = editor.session.placementPosition.clone()
  control.pointer.coords.copy(pointerCoordsAt(engineWorld, new THREE.Vector3(4, 0.9, -3)))
  control.shiftLeft.down = true
  control.mouseLeft.down = true
  control.mouseLeft.pressed = true
  editor.update(1 / 60)

  control.mouseLeft.pressed = false
  control.pointer.coords.y -= 0.1
  editor.update(1 / 60)

  assert.ok(editor.session.placementPosition.y > start.y + 0.1)
  assert.equal(editor.session.placementPosition.x, start.x)
  assert.equal(editor.session.placementPosition.z, start.z)
  editor.close()
})

test('clicking a joint marker selects its normalized humanoid bone', () => {
  const { control, editor, engineWorld, player } = createFixture()
  assert.equal(editor.open(player), true)
  editor.setMode('posture')
  syncEditorCamera(engineWorld, control)

  const headPosition = editor.getBone('head').getWorldPosition(new THREE.Vector3())
  control.pointer.coords.copy(pointerCoordsAt(engineWorld, headPosition))
  control.mouseLeft.down = true
  control.mouseLeft.pressed = true
  editor.update(1 / 60)

  assert.equal(editor.session.selectedBone, 'head')
  assert.equal(editor.session.selectedMarker.userData.poseBoneName, 'head')
  editor.close()
})

test('rotating the joint gizmo updates the selected normalized bone pose', () => {
  const { editor, player, scene } = createFixture()
  assert.equal(editor.open(player), true)
  editor.setMode('posture')
  editor.setSelectedBone('head')

  assert.equal(editor.gizmo.object, editor.gizmoTarget)
  assert.equal(editor.gizmo.mode, 'rotate')
  assert.equal(editor.gizmo.space, 'local')
  assert.equal(editor.gizmoHelper.visible, true)
  const helper = editor.gizmoHelper

  const sceneRotation = editor.session.previewScene.getWorldQuaternion(new THREE.Quaternion())
  const expectedRotation = new THREE.Quaternion().setFromEuler(new THREE.Euler(25 * THREE.MathUtils.DEG2RAD, 0, 0))
  editor.gizmoTarget.quaternion.copy(sceneRotation.clone().multiply(expectedRotation))
  editor.gizmo.dispatchEvent({ type: 'objectChange' })

  const actualRotation = new THREE.Quaternion().fromArray(editor.session.pose.head.rotation)
  assert.ok(actualRotation.angleTo(expectedRotation) < 1e-6)
  assert.ok(editor.getBone('head').quaternion.angleTo(expectedRotation) < 1e-6)

  editor.setMode('placement')
  assert.equal(editor.gizmo.object, undefined)
  assert.equal(editor.gizmoHelper.visible, false)
  editor.close()
  assert.equal(editor.gizmo, null)
  assert.equal(scene.children.includes(helper), false)
})

test('undo and redo restore pose and seat-local placement edits', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)

  const initialPose = structuredClone(editor.session.pose)
  editor.setPlacementAxis('x', 0.35)
  editor.setSelectedRotation('y', 25)

  assert.equal(editor.getViewState().canUndo, true)
  assert.equal(editor.undo(), true)
  assert.deepEqual(editor.session.pose, initialPose)
  assert.equal(editor.session.placementPosition.x, 0.35)

  assert.equal(editor.undo(), true)
  assert.equal(editor.session.placementPosition.x, 0)
  assert.equal(editor.getViewState().canUndo, false)

  assert.equal(editor.redo(), true)
  assert.equal(editor.session.placementPosition.x, 0.35)
  assert.equal(editor.redo(), true)
  assert.notDeepEqual(editor.session.pose, initialPose)
  assert.equal(editor.getViewState().canRedo, false)
  editor.close()
})

test('reset selected joint clears its rotation and hips offset without moving the avatar root', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)
  editor.setPlacementAxis('x', 0.4)
  editor.setHipsTranslation('y', 0.2)
  editor.setSelectedRotation('z', 30)

  assert.equal(editor.resetSelectedJoint(), true)

  assert.deepEqual(editor.session.pose.hips.position, [0, 0, 0])
  assert.deepEqual(editor.session.pose.hips.rotation, [0, 0, 0, 1])
  assert.equal(editor.session.placementPosition.x, 0.4)
  editor.close()
})

test('T-pose resets normalized joint rotations and hips offset but preserves seat placement', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)
  editor.setPlacementAxis('x', 0.25)
  editor.setSelectedRotation('z', 20)
  editor.setHipsTranslation('y', 0.1)

  assert.equal(editor.setTPose(), true)

  for (const name of editor.session.boneNames) {
    assert.deepEqual(editor.session.pose[name].rotation, [0, 0, 0, 1])
  }
  assert.deepEqual(editor.session.pose.hips.position, [0, 0, 0])
  assert.equal(editor.session.placementPosition.x, 0.25)
  assert.equal(editor.undo(), true)
  assert.equal(editor.session.pose.hips.position[1], 0.1)
  editor.close()
})

test('relaxed-standing and sitting presets use the Hyperfy default arm posture and captured seat pose', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)
  const session = editor.session
  session.boneNames.push('leftUpperArm', 'rightUpperArm')
  session.pose.leftUpperArm = { rotation: [0, 0, 0, 1] }
  session.pose.rightUpperArm = { rotation: [0, 0, 0, 1] }
  session.initialPose = {
    hips: { rotation: [0, 0, 0, 1], position: [0.03, -0.04, 0.02] },
    head: { rotation: [0.1, 0, 0, 0.995] },
  }

  assert.equal(editor.setPosePreset('relaxedStanding'), true)
  const leftArm = new THREE.Quaternion().fromArray(session.pose.leftUpperArm.rotation)
  const expectedLeftArm = new THREE.Quaternion().setFromAxisAngle(
    new THREE.Vector3(0, 0, 1),
    75 * THREE.MathUtils.DEG2RAD
  )
  assert.ok(leftArm.angleTo(expectedLeftArm) < 1e-6)
  assert.deepEqual(session.pose.hips.position, [0, 0, 0])

  editor.setPlacementAxis('z', -0.2)
  assert.equal(editor.setPosePreset('sitting'), true)
  assert.deepEqual(session.pose, session.initialPose)
  assert.equal(session.placementPosition.z, -0.2)
  editor.close()
})

test('rotate-joint and move-hips tools keep skeletal rotation separate from hip translation', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)
  editor.setMode('posture')
  editor.setSelectedBone('head')
  assert.equal(editor.gizmo.object, editor.gizmoTarget)

  editor.setPostureTool('moveHips')
  assert.equal(editor.session.selectedBone, 'hips')
  assert.equal(editor.session.selectedMarker.visible, false)
  assert.equal(editor.gizmo.object, undefined)
  editor.setSelectedBone('head')
  assert.equal(editor.session.selectedBone, 'hips')

  editor.setHipsTranslation('y', 0.12)
  assert.equal(editor.session.pose.hips.position[1], 0.12)
  assert.equal(editor.session.pose.hips.rotation[1], 0)
  editor.close()
})

test('mirror-to-other-side copies the selected joint rotation with mirrored axes', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)
  const session = editor.session
  session.boneNames.push('leftUpperArm', 'rightUpperArm')
  const source = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.2, 0.3, -0.4))
  session.pose.leftUpperArm = { rotation: source.toArray() }
  session.pose.rightUpperArm = { rotation: [0, 0, 0, 1] }
  editor.setSelectedBone('leftUpperArm')

  assert.equal(editor.getViewState().mirrorTargetAvailable, true)
  assert.equal(editor.mirrorSelectedJoint(), true)
  const actual = new THREE.Quaternion().fromArray(session.pose.rightUpperArm.rotation)
  const expected = new THREE.Quaternion(source.x, -source.y, -source.z, source.w).normalize()
  assert.ok(actual.angleTo(expected) < 1e-6)
  editor.close()
})

test('previews another normalized avatar locally and requires switching back before Apply', async () => {
  const { editor, engineWorld, networkMessages, player, sourceScene } = createFixture()
  assert.equal(editor.open(player), true)

  const alternateScene = new THREE.Group()
  const alternateHips = new THREE.Bone()
  alternateHips.name = 'hips'
  const alternateHead = new THREE.Bone()
  alternateHead.name = 'head'
  alternateHead.position.y = 1.7
  alternateScene.add(alternateHips, alternateHead)
  const alternateFactory = {
    cloneScene(scene = alternateScene) {
      return { scene: scene.clone(true), detachedRoots: [] }
    },
    getNormalizedBoneNames() {
      return ['hips', 'head']
    },
    getRawBoneName(name) {
      return name
    },
    getNormalizedPose(scene = alternateScene) {
      return {
        hips: { rotation: scene.getObjectByName('hips').quaternion.toArray(), position: [0, 0, 0] },
        head: { rotation: scene.getObjectByName('head').quaternion.toArray() },
      }
    },
    applyNormalizedPose(scene, pose) {
      const hips = scene.getObjectByName('hips')
      const head = scene.getObjectByName('head')
      if (pose.hips?.rotation) hips.quaternion.fromArray(pose.hips.rotation)
      if (pose.hips?.position) hips.position.fromArray(pose.hips.position)
      if (pose.head?.rotation) head.quaternion.fromArray(pose.head.rotation)
      hips.updateMatrixWorld(true)
      head.updateMatrixWorld(true)
    },
  }
  engineWorld.loader = {
    async load(type, url) {
      assert.equal(type, 'avatar')
      assert.equal(url, 'asset://alternate.vrm')
      return { factory: alternateFactory }
    },
  }

  const originalPreview = editor.session.previewScene
  const loading = editor.setPreviewAvatar('asset://alternate.vrm')
  assert.equal(editor.getViewState().previewLoading, true)
  assert.equal(await loading, true)
  assert.notEqual(editor.session.previewScene, originalPreview)
  assert.equal(editor.session.factory, alternateFactory)
  assert.equal(editor.getViewState().previewingAnotherAvatar, true)
  assert.equal(editor.apply(), false)
  assert.equal(
    networkMessages.some(([type]) => type === 'playerSeatPose'),
    false
  )

  assert.equal(await editor.setPreviewAvatar('asset://test.vrm'), true)
  assert.equal(editor.getViewState().previewingAnotherAvatar, false)
  assert.equal(editor.session.factory, editor.session.playerFactory)
  assert.equal(editor.session.sourceScene, sourceScene)
  editor.close()
})

test('switching back to the player avatar cancels an in-flight preview load', async () => {
  const { editor, engineWorld, player } = createFixture()
  assert.equal(editor.open(player), true)
  let resolveLoad
  engineWorld.loader = {
    load: () =>
      new Promise(resolve => {
        resolveLoad = resolve
      }),
  }

  const pendingPreview = editor.setPreviewAvatar('asset://slow.vrm')
  assert.equal(editor.getViewState().previewLoading, true)
  assert.equal(await editor.setPreviewAvatar(player.data.avatar), true)
  resolveLoad({ factory: editor.session.playerFactory })

  assert.equal(await pendingPreview, false)
  assert.equal(editor.getViewState().previewLoading, false)
  assert.equal(editor.getViewState().previewingAnotherAvatar, false)
  editor.close()
})

test('skeleton visibility, opacity, marker size, and camera presets update the preview', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)

  assert.equal(editor.getViewState().skeletonVisible, true)
  editor.setSkeletonVisible(false)
  editor.setSkeletonOpacity(0.35)
  editor.setMarkerSize(1.5)
  assert.equal(editor.session.skeletonHelper.visible, false)
  assert.equal(editor.session.skeletonHelper.material.opacity, 0.35)
  assert.equal(editor.session.jointMarkers.get('head').scale.x, 1.5)
  assert.equal(editor.getViewState().skeletonOpacity, 0.35)
  assert.equal(editor.getViewState().markerSize, 1.5)

  const homeYaw = editor.session.orbit.homeYaw
  editor.setCameraView('left')
  assert.ok(Math.abs(editor.session.orbit.yaw - (homeYaw + Math.PI / 2)) < 1e-8)
  editor.setCameraView('back')
  assert.ok(Math.abs(editor.session.orbit.yaw - (homeYaw + Math.PI)) < 1e-8)
  assert.equal(editor.getViewState().cameraView, 'back')
  editor.close()
})

test('draws a seat-aligned floor guide and removes it with the preview', () => {
  const { anchor, editor, player, scene } = createFixture()
  assert.equal(editor.open(player, { guides: { floorY: 0 } }), true)

  const guide = scene.children.find(child => child.name === 'avatar-pose-floor-guide')
  assert.ok(guide)
  editor.setFloorY(0.5)
  const expectedPosition = new THREE.Vector3(0, 0.5, 0).applyMatrix4(anchor)
  assert.ok(guide.position.distanceTo(expectedPosition) < 1e-6)

  editor.close()
  assert.equal(scene.children.includes(guide), false)
})

test('edits placement and normalized pose locally, then submits only on Apply', () => {
  const { editor, hips, networkMessages, player } = createFixture()

  assert.equal(editor.open(player), true)
  editor.setMode('posture')
  editor.setSelectedRotation('y', 30)
  editor.setHipsTranslation('y', 0.15)
  editor.setPlacementAxis('x', 0.25)

  assert.equal(hips.rotation.y, 0)
  assert.equal(editor.session.pose.hips.position[1], 0.15)
  assert.equal(editor.session.placementPosition.x, 0.25)
  assert.equal(
    networkMessages.some(([type]) => type === 'playerSeatPose'),
    false
  )

  assert.equal(editor.apply(), true)
  const [, request] = networkMessages.at(-1)
  assert.equal(networkMessages.at(-1)[0], 'playerSeatPose')
  assert.deepEqual(request.offset, [0.25, 0, 0])
  assert.deepEqual(request.pose.hips.position, [0, 0.15, 0])
  assert.equal(editor.session.applying, true)

  editor.onApplyResult({ ok: true })
  assert.equal(editor.session, null)
  assert.equal(player.poseEditorActive, false)
})

test('applying a partial style preserves the avatar baseline for omitted transforms', () => {
  const { editor, player } = createFixture()
  assert.equal(editor.open(player), true)

  editor.session.initialPose = {
    hips: { rotation: [0, 0, 0, 1], position: [0.02, 0.03, 0.04] },
    spine: { rotation: [0, 0.1, 0, 0.995] },
  }
  editor.setHipsTranslation('x', 0.5)
  editor.setStyles([{ name: 'Relaxed', pose: { hips: { rotation: [0, 0.2, 0, 0.98] } } }])

  assert.equal(editor.applyStyle('Relaxed'), true)
  const actualRotation = new THREE.Quaternion().fromArray(editor.session.pose.hips.rotation)
  const expectedRotation = new THREE.Quaternion().fromArray([0, 0.2, 0, 0.98]).normalize()
  assert.ok(actualRotation.angleTo(expectedRotation) < 1e-6)
  assert.deepEqual(editor.session.pose.hips.position, [0.02, 0.03, 0.04])
  assert.deepEqual(editor.session.pose.spine, { rotation: [0, 0.1, 0, 0.995] })
  editor.close()
})

test('applies a profile-scoped calibration only when explicitly requested', () => {
  const profileId = 'modular-couch-v1:middle'
  const { editor, networkMessages, player } = createFixture({ profileId })
  assert.equal(editor.open(player), true)
  assert.equal(editor.session.profileId, profileId)

  assert.equal(editor.apply(true), true)
  const [type, request] = networkMessages.at(-1)
  assert.equal(type, 'playerSeatPose')
  assert.equal(request.profileId, profileId)
  assert.equal(request.saveToProfile, true)

  editor.close()
})

test('automatically exits when the seat anchor disappears', () => {
  const { editor, player, scene } = createFixture()
  assert.equal(editor.open(player), true)
  player.getAnchorMatrix = () => null

  editor.update(1 / 60)

  assert.equal(editor.session, null)
  assert.equal(player.avatar.visible, true)
  assert.equal(
    scene.children.some(child => child.name === 'avatar-pose-preview'),
    false
  )
})
