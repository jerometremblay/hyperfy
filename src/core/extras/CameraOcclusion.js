import * as THREE from './three'
import { getAvatarEyePosition } from './avatarFocus'

const CHECK_INTERVAL = 0.1
const RESTORE_DELAY = 0.2
const TARGET_MARGIN = 0.08
const HEADROOM = 0.25

// Geometry stays in the Stage's octree and physics world. Only the local
// player's main draw is cut above their head; other cameras see the original scene.
export class CameraOcclusion {
  constructor(world) {
    this.world = world
    this.obstructions = new Map()
    this.contents = new Set()
    this.materials = new Map()
    this.cssNodes = new Set()
    this.cssRestores = []
    this.plane = new THREE.Plane(new THREE.Vector3(0, -1, 0), 0)
    this.restores = []
    this.nextCheck = 0
    this.raycaster = new THREE.Raycaster()
    this.head = new THREE.Vector3()
    this.point = new THREE.Vector3()
    this.screen = new THREE.Vector2()
    this.projected = new THREE.Vector3()
    this.right = new THREE.Vector3()
    this.bounds = new THREE.Box3()
    this.matrix = new THREE.Matrix4()
    this.center = new THREE.Vector3()
  }

  update(enabled = true, now = this.world.time ?? performance.now() / 1000) {
    const { camera, entities, builder } = this.world
    const player = entities?.player
    if (!enabled || !camera.isOrthographicCamera || builder?.enabled || player?.isXR || !player?.base) {
      this.clear()
      return
    }
    const feet = player.base.position
    const avatarHeight = player.avatar?.getHeight?.() || player.capsuleHeight || 1.6
    if (!getAvatarEyePosition(player.avatar, this.head)) {
      this.head.copy(feet)
      this.head.y += avatarHeight
    }
    // Standing height is fixed; animated eye/head bones bob during walking.
    this.plane.constant = feet.y + avatarHeight + HEADROOM
    if (now < this.nextCheck) return
    this.nextCheck = now + CHECK_INTERVAL
    camera.updateWorldMatrix(true, false)
    const height = Math.max(0.3, this.head.y - feet.y)
    const radius = player.capsuleRadius || 0.3
    this.right.setFromMatrixColumn(camera.matrixWorld, 0)
    // Head, chest, shoulders and lower torso catch partial obstructions without
    // testing the ground beneath the player's feet.
    const samples = [
      [0, 0],
      [0, -height * 0.3],
      [-radius, -height * 0.2],
      [radius, -height * 0.2],
      [0, -height * 0.65],
    ]
    for (const [x, y] of samples) {
      this.point.copy(this.head).addScaledVector(this.right, x)
      this.point.y += y
      this.projected.copy(this.point).project(camera)
      if (Math.abs(this.projected.x) > 1 || Math.abs(this.projected.y) > 1) continue
      this.screen.set(this.projected.x, this.projected.y)
      this.raycaster.setFromCamera(this.screen, camera)
      const { origin, direction } = this.raycaster.ray
      const distance = this.projected.copy(this.point).sub(origin).dot(direction) - TARGET_MARGIN
      if (distance <= camera.near) continue
      const hits = this.world.stage.raycast(origin, direction, undefined, camera.near, distance)
      for (const hit of hits) {
        const node = hit.node
        if (!node || node.visible === false || node.opacity === 0 || node.ctx?.entity?.isPlayer) continue
        if (!node.handle?.clipForCamera && !node.mesh && !node.obj) continue
        const rawMaterial = node.mesh?.material || hit.object?.material
        const material = Array.isArray(rawMaterial) ? rawMaterial[hit.face?.materialIndex || 0] : rawMaterial
        const opaque = node.handle?.occludesCamera ?? (material && !material.transparent && material.opacity > 0)
        let group = node
        let explicit = false
        let excluded = false
        for (let ancestor = node; ancestor; ancestor = ancestor.parent) {
          if (ancestor.cameraOcclusion === false) {
            excluded = true
            break
          }
          if (ancestor.cameraOcclusion === true) {
            group = ancestor
            explicit = true
          }
        }
        const app = node.ctx?.entity
        if (app?.root?.cameraOcclusion === false) excluded = true
        if (!excluded && (explicit || opaque)) this.obstructions.set(app?.isApp && app.root ? app : group, now)
      }
    }
    for (const [target, lastHit] of this.obstructions) {
      const root = target.isApp ? target.root : target
      if (!root.mounted || now - lastHit >= RESTORE_DELAY) this.obstructions.delete(target)
    }
    this.updateContents()
  }

  updateContents() {
    this.contents.clear()
    const buildings = [...this.obstructions.keys()].filter(target => target.isApp)
    if (!buildings.length) return
    const apps = new Map()
    const include = (app, geometry, matrix) => {
      if (!app?.isApp || !app.root?.mounted || app.blueprint?.scene || app.root.cameraOcclusion === false) return
      let entry = apps.get(app)
      if (!entry) {
        if (Math.abs(app.root.matrixWorld.determinant()) < 1e-12) return
        entry = { inverse: app.root.matrixWorld.clone().invert(), bounds: new THREE.Box3() }
        apps.set(app, entry)
      }
      if (!geometry.boundingBox) geometry.computeBoundingBox()
      if (geometry.boundingBox.isEmpty()) return
      this.matrix.multiplyMatrices(entry.inverse, matrix)
      this.bounds.copy(geometry.boundingBox).applyMatrix4(this.matrix)
      entry.bounds.union(this.bounds)
    }
    // Reuse the mounted geometry and ownership used by picking and the object profiler.
    const visit = octant => {
      for (const item of octant.items) {
        if (item.node?.visible === false || item.node?.opacity === 0 || this.excluded(item.node)) continue
        include(item.getEntity(), item.geometry, item.matrix)
      }
      for (const child of octant.children) visit(child)
    }
    visit(this.world.stage.octree.root)
    for (const app of this.world.entities.items?.values() || []) {
      if (!app.isApp || !app.root?.mounted || app.root.cameraOcclusion === false) continue
      const inspect = node => {
        if (this.excluded(node)) return
        const inspectObject = object => {
          if (object.isMesh && object.visible) include(app, object.geometry, object.matrixWorld)
        }
        node.mesh?.traverse(inspectObject)
        node.obj?.traverse(inspectObject)
        node.instance?.raw?.scene?.traverse(inspectObject)
      }
      app.root.traverse(inspect)
      for (const node of app.worldNodes || []) node.traverse(inspect)
    }
    for (const building of buildings) {
      const envelope = apps.get(building)
      if (!envelope || envelope.bounds.isEmpty()) continue
      for (const [app, entry] of apps) {
        if (app === building || entry.bounds.isEmpty()) continue
        this.matrix.multiplyMatrices(envelope.inverse, app.root.matrixWorld)
        this.bounds.copy(entry.bounds).applyMatrix4(this.matrix)
        if (envelope.bounds.containsBox(this.bounds)) this.contents.add(app)
      }
    }
  }

  excluded(node) {
    if (node?.ctx?.entity?.isPlayer) return true
    for (let ancestor = node; ancestor; ancestor = ancestor.parent) {
      if (ancestor.cameraOcclusion === false) return true
    }
    return false
  }

  clipObject(object) {
    if (!object.isMesh || !object.visible) return
    object.updateWorldMatrix(true, false)
    if (object.isSkinnedMesh) object.computeBoundingBox()
    else if (!object.geometry.boundingBox) object.geometry.computeBoundingBox()
    this.bounds.copy(object.boundingBox || object.geometry.boundingBox).applyMatrix4(object.matrixWorld)
    if (!this.bounds.intersectsPlane(this.plane)) {
      if (this.plane.distanceToPoint(this.bounds.getCenter(this.center)) >= 0) return
      object.visible = false
      this.restores.push(() => {
        object.visible = true
      })
      return
    }
    const source = object.material
    const cutMaterial = material => {
      let entry = this.materials.get(material)
      if (!entry) {
        const clone = this.world.stage.createMaterial({ raw: material })
        const dispose = () => {
          clone.dispose()
          material.removeEventListener('dispose', dispose)
          this.materials.delete(material)
        }
        entry = { clone, version: material.version, dispose }
        material.addEventListener('dispose', dispose)
        this.materials.set(material, entry)
      }
      const raw = entry.clone.raw
      if (entry.version !== material.version) {
        raw.copy(material)
        entry.version = material.version
        raw.needsUpdate = true
      }
      // Portal/video uniforms continue to update while their material is replaced.
      if (material.isShaderMaterial) raw.uniforms = material.uniforms
      if (material.color) raw.color.copy(material.color)
      if (material.emissive) raw.emissive.copy(material.emissive)
      raw.emissiveIntensity = material.emissiveIntensity
      for (const key of ['map', 'emissiveMap', 'normalMap', 'bumpMap', 'roughnessMap', 'metalnessMap']) {
        raw[key] = material[key]
      }
      raw.clippingPlanes = [...(material.clippingPlanes || []), this.plane]
      raw.clipShadows = true
      raw.clipping = true
      return raw
    }
    object.material = Array.isArray(source) ? source.map(cutMaterial) : cutMaterial(source)
    this.restores.push(() => {
      object.material = source
    })
  }

  apply() {
    if (this.restores.length) return
    this.cssNodes.clear()
    const seen = new Set()
    const clip = node => {
      if (!node.mounted || this.excluded(node)) return
      const handle = node.handle
      if (node.visible !== false && node.opacity !== 0 && handle?.clipForCamera && !seen.has(handle)) {
        seen.add(handle)
        const restore = handle.clipForCamera(this.plane)
        if (restore) this.restores.push(restore)
      }
      const inspect = object => {
        if (seen.has(object)) return
        seen.add(object)
        this.clipObject(object)
      }
      node.mesh?.traverse(inspect)
      node.obj?.traverse(inspect)
      node.instance?.raw?.scene?.traverse(inspect)
      if (node.objectCSS) this.cssNodes.add(node)
      const light = node.light
      if (light?.visible && this.plane.distanceToPoint(light.position) < 0) {
        light.visible = false
        this.restores.push(() => {
          light.visible = true
        })
      }
      for (const child of node.children) clip(child)
    }
    for (const target of new Set([...this.obstructions.keys(), ...this.contents])) {
      const node = target.isApp ? target.root : target
      if (node.mounted && !this.excluded(node)) {
        clip(node)
        if (target.isApp) {
          for (const worldNode of target.worldNodes || []) clip(worldNode)
        }
      }
    }
  }

  updateCSS() {
    for (const restore of this.cssRestores) restore()
    this.cssRestores.length = 0
    for (const node of this.cssNodes) {
      if (!node.mounted || this.excluded(node) || !node.objectCSS) continue
      const object = node.objectCSS
      const element = object.element
      const width = Number.parseFloat(element.style.width)
      const height = Number.parseFloat(element.style.height)
      if (!(width > 0 && height > 0)) continue
      object.updateWorldMatrix(true, false)
      const plane = this.plane.clone().applyMatrix4(object.matrixWorld.clone().invert())
      const corners = [
        [0, 0],
        [width, 0],
        [width, height],
        [0, height],
      ]
      const distance = ([x, y]) => plane.distanceToPoint(this.point.set(x - width / 2, height / 2 - y, 0))
      const polygon = []
      for (let i = 0; i < corners.length; i++) {
        const a = corners[i]
        const b = corners[(i + 1) % corners.length]
        const da = distance(a)
        const db = distance(b)
        if (da >= 0) polygon.push(a)
        if (da >= 0 !== db >= 0) {
          const t = da / (da - db)
          polygon.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t])
        }
      }
      if (corners.every(corner => distance(corner) >= 0)) continue
      const previous = element.style.clipPath
      element.style.clipPath = polygon.length
        ? `polygon(${polygon.map(([x, y]) => `${x}px ${y}px`).join(',')})`
        : 'inset(100%)'
      this.cssRestores.push(() => {
        element.style.clipPath = previous
      })
    }
  }

  restore() {
    for (const restore of this.restores.reverse()) restore()
    this.restores.length = 0
  }

  suspend() {
    if (!this.restores.length) return
    this.restore()
    return () => this.apply()
  }

  clear() {
    this.restore()
    this.obstructions.clear()
    this.contents.clear()
    this.cssNodes.clear()
    for (const restore of this.cssRestores) restore()
    this.cssRestores.length = 0
    for (const entry of [...this.materials.values()]) entry.dispose()
    this.nextCheck = 0
  }
}
