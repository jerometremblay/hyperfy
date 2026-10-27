import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'

const bytes = Uint8Array.from(atob(window.DARTS_HYP), c => c.charCodeAt(0))
const length = new DataView(bytes.buffer).getUint32(0, true)
const header = JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + length)))
const assets = new Map()
let offset = 4 + length
for (const a of header.assets) {
  assets.set(a.url, bytes.slice(offset, offset + a.size))
  offset += a.size
}
const scene = new THREE.Scene()
scene.background = new THREE.Color('#273c38')
const renderer = new THREE.WebGLRenderer({ antialias: true })
renderer.setPixelRatio(Math.min(2, devicePixelRatio))
document.body.append(renderer.domElement)
const camera = new THREE.PerspectiveCamera(40, 1, 0.01, 50)
const orbit = new OrbitControls(camera, renderer.domElement)
scene.add(new THREE.HemisphereLight(0xffffff, 0x38463a, 2.5))
const lamp = new THREE.DirectionalLight(0xffffff, 3)
lamp.position.set(2, 4, 3)
scene.add(lamp)
const textures = new Map()
const create = (kind, data = {}) => {
  let node
  if (kind === 'prim') {
    const s = data.size
    const geometry =
      data.type === 'box'
        ? new THREE.BoxGeometry(...s)
        : data.type === 'plane'
          ? new THREE.PlaneGeometry(...s)
          : data.type === 'cone'
            ? new THREE.ConeGeometry(...s, 20)
            : data.type === 'cylinder'
              ? new THREE.CylinderGeometry(...s, 20)
              : new THREE.SphereGeometry(...s)
    let map = null
    if (data.texture) {
      if (!textures.has(data.texture)) {
        const texture = new THREE.TextureLoader().load(
          URL.createObjectURL(new Blob([assets.get(data.texture)], { type: 'image/png' }))
        )
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
        emissive: data.emissive || '#000000',
        emissiveIntensity: data.emissiveIntensity ?? 1,
        metalness: data.metalness || 0,
        roughness: data.roughness ?? 0.6,
        side: data.doubleside ? THREE.DoubleSide : THREE.FrontSide,
      })
    )
  } else if (kind === 'ui') {
    const canvas = document.createElement('canvas')
    canvas.width = data.width * 2
    canvas.height = data.height * 2
    const context = canvas.getContext('2d')
    context.fillStyle = data.backgroundColor
    context.fillRect(0, 0, canvas.width, canvas.height)
    const texture = new THREE.CanvasTexture(canvas)
    texture.colorSpace = THREE.SRGBColorSpace
    node = new THREE.Mesh(
      new THREE.PlaneGeometry(data.width * data.size, data.height * data.size),
      new THREE.MeshBasicMaterial({ map: texture })
    )
    const rows = []
    const redraw = () => {
      context.fillStyle = data.backgroundColor
      context.fillRect(0, 0, canvas.width, canvas.height)
      const border = (data.borderWidth || 0) * 2
      if (border) {
        context.strokeStyle = data.borderColor
        context.lineWidth = border
        context.strokeRect(border / 2, border / 2, canvas.width - border, canvas.height - border)
      }
      const visible = rows.filter(child => child.display !== 'none')
      const gap = (data.gap || 0) * 2
      const height =
        visible.reduce((sum, child) => sum + child.data.fontSize * (child.data.lineHeight || 1.2) * 2, 0) +
        Math.max(0, visible.length - 1) * gap
      const padding = (data.padding || 0) * 2
      let y = data.justifyContent === 'center' ? (canvas.height - height) / 2 : padding + border
      context.textBaseline = 'top'
      for (const child of visible) {
        context.fillStyle = child.data.color
        context.font = `${child.data.fontSize * 2}px sans-serif`
        context.textAlign = child.data.textAlign || 'left'
        context.fillText(child.value, context.textAlign === 'center' ? canvas.width / 2 : padding + border, y)
        y += child.data.fontSize * (child.data.lineHeight || 1.2) * 2 + gap
      }
      texture.needsUpdate = true
    }
    node.add = child => {
      rows.push(child)
      child.redraw = redraw
      redraw()
      return node
    }
  } else if (kind === 'light') {
    node = new THREE.PointLight(data.color, data.intensity, data.distance, data.decay)
  } else node = new THREE.Group()
  node.data = data
  if (kind === 'uitext') {
    let value = data.value,
      display = data.display
    Object.defineProperty(node, 'value', {
      get: () => value,
      set(v) {
        value = v
        node.redraw?.()
      },
    })
    Object.defineProperty(node, 'display', {
      get: () => display,
      set(v) {
        display = v
        node.redraw?.()
      },
    })
  }
  if (data.position) node.position.fromArray(data.position)
  if (data.rotation) node.rotation.set(...data.rotation)
  Object.defineProperty(node, 'active', {
    get() {
      return this.visible
    },
    set(value) {
      this.visible = value
    },
  })
  return node
}
const app = new THREE.Group()
Object.assign(app, { create, configure() {}, on() {}, off() {} })
scene.add(app)
const script = new TextDecoder().decode(assets.get(header.blueprint.script))
new Function('app', 'world', 'props', 'Vector3', 'Quaternion', script)(
  app,
  { isPreview: true, isClient: true },
  header.blueprint.props,
  THREE.Vector3,
  THREE.Quaternion
)
const bounds = new THREE.Box3().setFromObject(app)
const center = bounds.getCenter(new THREE.Vector3())
const distance = (bounds.getSize(new THREE.Vector3()).length() / (2 * Math.tan((camera.fov * Math.PI) / 360))) * 1.15
const views = {
  Front: [0, 0, 1],
  Back: [0, 0, -1],
  Left: [-1, 0, 0],
  Right: [1, 0, 0],
  Top: [0, 1, 0.001],
  Iso: [1, 0.7, 1.4],
  Board: null,
}
const view = label => {
  if (label === 'Board') {
    camera.position.set(0, 1.73, 0.7)
    orbit.target.set(0, 1.73, 0)
  } else {
    camera.position.copy(new THREE.Vector3(...views[label]).normalize().multiplyScalar(distance).add(center))
    orbit.target.copy(center)
  }
  orbit.update()
}
for (const label of Object.keys(views)) {
  const button = document.createElement('button')
  button.textContent = label
  button.onclick = () => view(label)
  document.querySelector('nav').append(button)
}
view('Iso')
const resize = () => {
  renderer.setSize(innerWidth, innerHeight)
  camera.aspect = innerWidth / innerHeight
  camera.updateProjectionMatrix()
}
addEventListener('resize', resize)
resize()
renderer.setAnimationLoop(() => {
  orbit.update()
  renderer.render(scene, camera)
})
