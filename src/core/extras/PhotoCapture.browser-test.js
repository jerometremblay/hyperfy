import * as THREE from './three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { VRMLoaderPlugin } from '@pixiv/three-vrm'
import { createVRMFactory } from './createVRMFactory'
import { PhotoCapture, renderPhoto, photoOptions } from './PhotoCapture'
import { Apps } from '../systems/Apps'

const report = document.createElement('pre')
document.body.append(report)
const check = (condition, message) => {
  if (!condition) throw new Error(message)
}
const show = (label, url) => {
  const figure = document.createElement('figure')
  const image = document.createElement('img')
  image.src = url
  const caption = document.createElement('figcaption')
  caption.textContent = label
  figure.append(image, caption)
  document.body.append(figure)
}
try {
  const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true })
  renderer.setSize(256, 256)
  renderer.setClearColor('#223344', 1)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#223344')
  scene.add(new THREE.HemisphereLight(0xffffff, 0x888888, 3))
  const light = new THREE.DirectionalLight(0xffffff, 3)
  light.position.set(2, 4, 3)
  scene.add(light)
  const loader = new GLTFLoader()
  loader.register(parser => new VRMLoaderPlugin(parser))
  const glb = await loader.loadAsync('/avatar.vrm')
  const factory = createVRMFactory(glb, () => {})
  const camera = new THREE.PerspectiveCamera(50, 1, 0.05, 50)
  const instance = factory.create(new THREE.Matrix4(), {
    scene,
    camera,
    loader: { load: async () => ({ toClip: () => new THREE.AnimationClip('idle', 1, []) }) },
  })
  camera.position.set(0, instance.height * 0.6, 2.8)
  camera.lookAt(0, instance.height * 0.6, 0)
  camera.updateMatrixWorld(true)
  const avatar = {
    instance,
    _firstPerson: false,
    setFirstPerson(value) {
      this._firstPerson = value
      instance.setFirstPerson(value)
    },
  }
  const uploaded = new Map()
  const cached = new Map()
  const world = {
    camera,
    stage: { scene },
    entities: { player: { avatar }, players: new Map() },
    environment: { renderExposure: 1.15 },
    network: {
      isClient: true,
      async upload(file) {
        uploaded.set(file.name, file)
      },
    },
    loader: {
      insert(type, url, file) {
        check(type === 'image', 'wrong cache type')
        cached.set(url, file)
      },
    },
  }
  const graphics = { world, renderer, renderingPortal: false }
  graphics.photos = new PhotoCapture(graphics)
  world.graphics = graphics
  // A calibrated material must match the direct viewport, catching double sRGB
  // conversion and missing exposure/tone mapping in the offscreen pipeline.
  const calibration = new THREE.Scene()
  const patch = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), new THREE.MeshBasicMaterial({ color: '#a04020' }))
  patch.position.set(0, camera.position.y, 0)
  calibration.add(patch)
  renderer.render(calibration, camera)
  const screenPixel = new Uint8Array(4)
  const gl = renderer.getContext()
  gl.readPixels(128, 128, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, screenPixel)
  const calibrated = renderPhoto(
    { ...graphics, world: { ...world, stage: { scene: calibration } } },
    {
      ...photoOptions({}, { position: camera.position, quaternion: camera.quaternion, width: 256, height: 256 }),
    }
  )
  const offset = (128 * 256 + 128) * 4
  const colorError = Math.max(...[0, 1, 2].map(i => Math.abs(calibrated[offset + i] - screenPixel[i])))
  check(colorError <= 2, `Tone mapping/sRGB mismatch: ${colorError}`)
  patch.geometry.dispose()
  patch.material.dispose()
  const apps = new Apps(world)
  const entity = { getDeadHook: () => ({ dead: false }) }
  const options = { position: camera.position, quaternion: camera.quaternion, width: 256, height: 256 }
  const normalized = { ...photoOptions(entity, options), entity }
  // Real VRM with first-person disabled is the expected third-person geometry.
  const thirdPerson = renderPhoto(graphics, normalized)
  renderer.render(scene, camera)
  const screenBefore = renderer.domElement.toDataURL()
  show('Third-person screen reference', screenBefore)
  avatar.setFirstPerson(true)
  renderer.render(scene, camera)
  const before = renderer.domElement.toDataURL()
  show('Scene while first-person geometry is active', before)
  const firstPersonPhoto = renderPhoto(graphics, normalized)
  check(
    thirdPerson.every((value, index) => value === firstPersonPhoto[index]),
    'First-person capture differs from full avatar'
  )
  check(avatar._firstPerson, 'First-person flag not restored')
  check(renderer.domElement.toDataURL() === before, 'Photo modified the visible canvas')
  const one = apps.worldMethods.capturePhoto(entity, options)
  const two = apps.worldMethods.capturePhoto(entity, {
    ...options,
    position: camera.position.clone().add(new THREE.Vector3(0.4, 0, 0)),
  })
  await Promise.resolve()
  graphics.photos.process()
  check(graphics.photos.queue.length === 1, 'More than one request rendered in a frame')
  const first = await one
  graphics.photos.process()
  const second = await two
  check(first.url !== second.url, 'Camera poses must produce distinct photos')
  check(/^asset:\/\/[0-9a-f]{64}\.jpg$/.test(first.url), 'Invalid asset URL')
  check(cached.has(first.url) && uploaded.has(first.url.slice(8)), 'Upload or cache insertion missing')
  show('JPEG captured while first-person mode is active', URL.createObjectURL(cached.get(first.url)))
  show('Second queued camera pose', URL.createObjectURL(cached.get(second.url)))
  const failureNode = {
    ctx: { entity },
    mesh: new THREE.Mesh(),
    traverse(fn) {
      fn(this)
    },
  }
  const originalRender = renderer.render
  renderer.render = () => {
    throw new Error('Expected render failure')
  }
  try {
    renderPhoto(graphics, { ...normalized, hide: [failureNode] })
  } catch (err) {
    check(err.message === 'Expected render failure', err.message)
  }
  renderer.render = originalRender
  check(
    failureNode.mesh.visible && avatar._firstPerson && renderer.getRenderTarget() === null,
    'Failure restoration incomplete'
  )
  check(renderer.domElement.toDataURL() === before, 'Queued photo changed the visible canvas')
  document.title = 'PASS: photo capture'
  report.textContent = JSON.stringify(
    {
      pass: true,
      realVRM: true,
      colorError,
      fullHead: true,
      canvasUnchanged: true,
      restoredAfterFailure: true,
      photos: [first, second],
      renderer: renderer.getContext().getParameter(renderer.getContext().VERSION),
    },
    null,
    2
  )
} catch (err) {
  document.title = 'FAIL: photo capture'
  report.textContent = err.stack
}
