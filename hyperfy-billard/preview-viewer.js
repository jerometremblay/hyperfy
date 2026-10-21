import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
const bytes = Uint8Array.from(atob(window.HYP_BASE64), c => c.charCodeAt(0))
const size = new DataView(bytes.buffer).getUint32(0, true)
const header = JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + size)))
let offset = 4 + size
const assets = new Map()
for (const asset of header.assets) {
  assets.set(asset.url, { ...asset, bytes: bytes.slice(offset, offset + asset.size) })
  offset += asset.size
}
const scene = new THREE.Scene()
scene.background = new THREE.Color('#d8e2e8')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(devicePixelRatio, 2))
document.body.append(renderer.domElement)
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100)
const controls = new OrbitControls(camera, renderer.domElement)
scene.add(new THREE.HemisphereLight(0xffffff, 0x455b69, 2.5))
const sun = new THREE.DirectionalLight(0xffffff, 3)
sun.position.set(3, 5, 2)
scene.add(sun)
const textureLoader = new THREE.TextureLoader()
const textures = new Map()
const create = (kind, data = {}) => {
  let node
  if (kind === 'prim') {
    const s = data.size
    const geometry =
      data.type === 'sphere'
        ? new THREE.SphereGeometry(s[0], 32, 20)
        : data.type === 'cylinder'
          ? new THREE.CylinderGeometry(...s, 32)
          : new THREE.BoxGeometry(...s)
    let map = null
    if (data.texture) {
      if (!textures.has(data.texture)) {
        const image = assets.get(data.texture)
        const texture = textureLoader.load(URL.createObjectURL(new Blob([image.bytes], { type: image.mime })))
        texture.colorSpace = THREE.SRGBColorSpace
        textures.set(data.texture, texture)
      }
      map = textures.get(data.texture)
    }
    node = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: data.color,
        map,
        roughness: data.roughness ?? 0.5,
        transparent: (data.opacity ?? 1) < 1,
        opacity: data.opacity ?? 1,
      })
    )
  } else node = new THREE.Group()
  if (data.position) node.position.fromArray(data.position)
  if (data.rotation) node.rotation.set(...data.rotation)
  if (data.scale) node.scale.fromArray(data.scale)
  Object.defineProperty(node, 'active', {
    get() {
      return this.visible
    },
    set(v) {
      this.visible = v
    },
  })
  return node
}
const app = new THREE.Group()
app.create = create
app.configure = () => {}
app.on = app.off = () => {}
scene.add(app)
if (window.TABLE_HYP_BASE64) {
  const tableBytes = Uint8Array.from(atob(window.TABLE_HYP_BASE64), c => c.charCodeAt(0))
  const length = new DataView(tableBytes.buffer).getUint32(0, true)
  const { blueprint, assets: tableAssets } = JSON.parse(new TextDecoder().decode(tableBytes.slice(4, 4 + length)))
  let start = 4 + length
  for (const asset of tableAssets) {
    if (asset.url === blueprint.model) {
      new GLTFLoader().parse(tableBytes.slice(start, start + asset.size).buffer, '', gltf => {
        gltf.scene.position.y = -0.708
        scene.add(gltf.scene)
      }, console.error)
    }
    start += asset.size
  }
}
const script = new TextDecoder().decode(assets.get(header.blueprint.script).bytes)
new Function('world', 'app', 'props', 'Vector3', 'Quaternion', 'Euler', script)(
  { isPreview: true, isClient: true, isServer: false },
  app,
  { ...header.blueprint.props, ...window.TABLE_GAME_PROPS },
  THREE.Vector3,
  THREE.Quaternion,
  THREE.Euler
)
const views = {
  Front: [0, 0.5, 3.7],
  Back: [0, 0.5, -3.7],
  Left: [-3.7, 0.5, 0],
  Right: [3.7, 0.5, 0],
  Top: [0, 3.7, 0.001],
  Iso: [2.8, 2.8, 2.8],
}
for (const [name, p] of Object.entries(views)) {
  const button = document.createElement('button')
  button.textContent = name
  button.onclick = () => {
    camera.position.set(...p)
    controls.target.set(0, 0, 0)
    controls.update()
  }
  document.querySelector('nav').append(button)
}
camera.position.set(...views.Iso)
controls.update()
const resize = () => {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()
renderer.setAnimationLoop(() => {
  controls.update()
  renderer.render(scene, camera)
})
