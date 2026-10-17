import * as THREE from './three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { createVRMFactory } from './createVRMFactory'
import { PortalAvatars } from './PortalAvatars'
import { Portal } from '../nodes/Portal'
import { Controller } from '../nodes/Controller'
import { Prim } from '../nodes/Prim'
import { RigidBody } from '../nodes/RigidBody'
import { Collider } from '../nodes/Collider'
import { Physics } from '../systems/Physics'
import { ClientGraphics } from '../systems/ClientGraphics'
import { getPortalTransform } from './portalTraversal'

const output = document.querySelector('pre')
const errors = []
window.addEventListener('error', event => errors.push(event.message))
try {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#182232')
  scene.add(new THREE.HemisphereLight(0xffffff, 0x778899, 3))
  const sun = new THREE.DirectionalLight(0xffffff, 3)
  sun.position.set(0, 8, 5)
  scene.add(sun)
  const camera = new THREE.PerspectiveCamera(55, 1.4, 0.05, 100)
  const rig = new THREE.Group()
  rig.add(camera)
  scene.add(rig)
  const world = {
    stage: { scene, dirtyNodes: new Set(), octree: { insert() {}, move() {}, remove() {} } },
    rig,
    camera,
    entities: { players: new Map() },
    setHot() {},
    apps: { worldMethods: { getQueryParam: () => null } },
  }
  const graphics = new ClientGraphics(world)
  world.graphics = graphics
  const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
  renderer.localClippingEnabled = true
  renderer.setSize(560, 400)
  renderer.debug.onShaderError = (gl, program) => errors.push(gl.getProgramInfoLog(program))
  graphics.renderer = renderer
  const source = new Portal({
    portalId: 'top',
    target: 'bottom',
    position: [0, 3, 0],
    rotation: [-Math.PI / 2, 0, 0],
    width: 3,
    height: 3,
    updateRate: 0,
    resolution: 512,
  })
  const destination = new Portal({
    portalId: 'bottom',
    target: 'top',
    position: [10, 3, 0],
    rotation: [Math.PI / 2, 0, 0],
    width: 3,
    height: 3,
    updateRate: 0,
    resolution: 512,
  })
  source.activate({ world })
  destination.activate({ world })

  world.physics = new Physics(world)
  await world.physics.init()
  let destinationSlab
  for (const x of [0, 10]) {
    if (x === 10) {
      // Native Prim physics must receive the same aperture as Collider nodes.
      destinationSlab = new Prim({
        type: 'box',
        size: [8, 0.2, 8],
        physics: 'static',
        position: [x, 3.1, 0],
        opacity: 0,
      })
      destinationSlab.activate({ world })
      continue
    }
    const slab = new RigidBody({ type: 'static', position: [x, 2.9, 0] })
    slab.add(new Collider({ type: 'box', width: 8, height: 0.2, depth: 8 }))
    slab.activate({ world })
  }
  const step = new RigidBody({ type: 'static', position: [10, 0.95, 0] })
  step.add(new Collider({ type: 'box', width: 3, height: 1.9, depth: 3 }))
  step.activate({ world })
  const controller = new Controller({ radius: 0.3, height: 1, position: [0, 3.5, 0], layer: 'player' })
  controller.activate({ world })
  const base = { position: new THREE.Vector3(0, 3.5, 0) }
  const player = {
    base,
    controller,
    crossPortal(transform) {
      base.position.applyMatrix4(transform)
      controller.teleport(base.position)
      crossings.push({
        base: base.position.clone(),
        node: controller.position.clone(),
        collider: new THREE.Vector3().copy(controller.controller.getFootPosition()),
      })
    },
  }
  const crossings = []
  world.entities.player = player
  source.update()
  // Cross the source plane with the actual CCT, then let the destination tread
  // support it. No source-side duplicate collider or second controller exists.
  controller.move(new THREE.Vector3(0, -0.6, 0), 0.02)
  base.position.copy(controller.position)
  source.update()
  if (crossings.length !== 1 || crossings[0].base.distanceTo(crossings[0].collider) > 1e-5) {
    throw new Error(`The native capsule did not follow the feet through the first portal: ${JSON.stringify(crossings)}`)
  }
  if (!world.physics.portalCollisions.replacements.has(destinationSlab)) {
    throw new Error('Native Prim ceiling/floor collision did not receive a portal aperture')
  }
  for (let i = 0; i < 100; i++) {
    controller.move(new THREE.Vector3(0, -0.04, 0), 0.02)
    world.physics.postFixedUpdate(0.02)
  }
  base.position.copy(controller.position)
  const feetY = base.position.y
  if (base.position.x < 9 || feetY < 1.85 || feetY > 2.1)
    throw new Error(`Destination tread did not support feet: ${base.position.toArray()}`)

  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const glb = await loader.loadAsync('/avatar.vrm')
  const factory = createVRMFactory(glb, () => {})
  const matrix = new THREE.Matrix4().makeTranslation(base.position.x, feetY, base.position.z)
  const instance = factory.create(matrix, {
    scene,
    camera,
    loader: { load: async () => ({ toClip: () => new THREE.AnimationClip('fixture', 1, []) }) },
  })
  player.avatar = { instance, getHeight: () => instance.height }
  world.entities.players.set('player', player)
  const copies = new PortalAvatars(world)
  copies.update()
  if (!copies.copies.has(player)) throw new Error('Avatar did not straddle the ceiling opening')
  const copy = copies.copies.get(player)
  const pixels = new Uint8Array(560 * 400 * 4)
  const target = new THREE.WebGLRenderTarget(560, 400)
  const figures = document.querySelector('main')
  function capture(label, x, y, z, lookY) {
    const view = new THREE.PerspectiveCamera(55, 1.4, 0.05, 100)
    view.position.set(x, y, z)
    view.lookAt(x, lookY, 0)
    view.updateMatrixWorld(true)
    renderer.setRenderTarget(target)
    renderer.render(scene, view)
    renderer.readRenderTargetPixels(target, 0, 0, 560, 400, pixels)
    renderer.setRenderTarget(null)
    renderer.render(scene, view)
    const figure = document.createElement('figure')
    const image = document.createElement('img')
    image.src = renderer.domElement.toDataURL()
    const caption = document.createElement('figcaption')
    caption.textContent = label
    figure.append(image, caption)
    figures.append(figure)
  }
  capture('Source: upper body remains above the opening', 0, 4.4, 4, 3.3)
  capture('Destination: feet supported below the opening', 10, 2.4, 4, 2.6)
  const meshCount = copy.meshes.length
  const headAbove = feetY + instance.height > 3
  if (!headAbove) throw new Error('Head was pushed clear of the source')
  rig.position.set(10, feetY + instance.height - 0.15, 0)
  rig.updateMatrixWorld(true)
  const restore = copies.mapCamera()
  const mappedEye = camera.getWorldPosition(new THREE.Vector3()).toArray()
  if (!restore || mappedEye[0] > 1 || mappedEye[1] < 3) throw new Error('Eye did not remain above the source')
  restore()
  // Check that a shared skinned vertex receives exactly the portal transform.
  const skinned = copy.meshes.find(({ mesh }) => mesh.isSkinnedMesh)
  const a = new THREE.Vector3().fromBufferAttribute(skinned.mesh.geometry.attributes.position, 0)
  const b = a.clone()
  skinned.mesh
    .applyBoneTransform(0, a)
    .applyMatrix4(skinned.mesh.matrixWorld)
    .applyMatrix4(getPortalTransform(destination, source))
  skinned.replica.applyBoneTransform(0, b).applyMatrix4(skinned.replica.matrixWorld)
  if (a.distanceTo(b) > 1e-5) throw new Error('Replica skeleton pose diverged')
  copies.destroy()
  // Climb real 30cm treads under the solid ceiling, then onto a tread in the
  // other room. Its transformed collision must support the crossing step.
  for (const [z, top] of [
    [0.4, 2.2],
    [0.7, 2.5],
    [1, 2.8],
  ]) {
    const stair = new RigidBody({ type: 'static', position: [10, top / 2, z] })
    stair.add(new Collider({ type: 'box', width: 2, height: top, depth: 0.3 }))
    stair.activate({ world })
  }
  const landing = new RigidBody({ type: 'static', position: [0, 1.6, -1.3] })
  landing.add(new Collider({ type: 'box', width: 2, height: 3.2, depth: 0.3 }))
  landing.activate({ world })
  for (let i = 0; i < 55; i++) {
    controller.move(new THREE.Vector3(0, -0.02, base.position.x > 5 ? 0.025 : -0.025), 0.02)
    world.physics.postFixedUpdate(0.02)
  }
  const climbed = base.position.toArray()
  if (base.position.x > 1 || base.position.y < 3.15) {
    throw new Error(`Climbing through the ceiling got stuck: ${climbed}`)
  }
  if (crossings.length !== 2 || crossings[1].base.distanceTo(crossings[1].collider) > 1e-5) {
    throw new Error(`The native capsule did not follow the feet back through the portal: ${JSON.stringify(crossings)}`)
  }
  // Keep the same slab solid just outside the aperture.
  controller.teleport(new THREE.Vector3(2.5, 3.5, 0))
  controller.move(new THREE.Vector3(0, -1, 0), 0.02)
  const outsideFeetY = controller.position.y
  if (outsideFeetY < 2.95) throw new Error(`The floor outside the opening was disabled: ${outsideFeetY}`)
  // A remote doorway must not acquire the same-world collision passage.
  source.url = 'https://example.com'
  controller.teleport(new THREE.Vector3(0, 3.5, 0))
  controller.move(new THREE.Vector3(0, -1, 0), 0.02)
  const remoteFeetY = controller.position.y
  if (remoteFeetY < 2.95) throw new Error(`Remote portal unexpectedly cut a passage: ${remoteFeetY}`)
  world.physics.portalCollisions.destroy()
  destinationSlab.deactivate()
  if (errors.length) throw new Error(errors.join('\n'))
  output.textContent = JSON.stringify(
    {
      pass: true,
      feetY,
      headAbove,
      meshCount,
      mappedEye,
      crossings: crossings.map(({ base, collider }) => ({
        base: base.toArray(),
        collider: collider.toArray(),
      })),
      climbed,
      outsideFeetY,
      remoteFeetY,
      errors,
    },
    null,
    2
  )
  document.title = 'PASS: same-world portal traversal'
} catch (error) {
  output.textContent = `${error.stack}\n${errors.join('\n')}`
  document.title = 'FAIL: same-world portal traversal'
}
