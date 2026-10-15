import * as THREE from '../extras/three'
import { CSS3DRenderer } from 'three/examples/jsm/renderers/CSS3DRenderer.js'

import { System } from './System'

/**
 * ClientCSS System
 *
 * - Runs on the client
 * - Manages CSS3D rendering for WebView nodes (iframes in 3D space)
 * - Renders behind the WebGL canvas to create the cutout effect
 *
 */
export class ClientCSS extends System {
  constructor(world) {
    super(world)
    this.scene = new THREE.Scene()
    this.renderer = null
    this.elem = null
    this.orderedLayers = new Map()
    this.width = 1
    this.height = 1
  }

  async init({ cssLayer }) {
    if (!cssLayer) return
    this.elem = cssLayer
    this.renderer = new CSS3DRenderer({ element: this.elem })
  }

  start() {
    if (!this.elem) return
    this.world.graphics.on('resize', this.onResize)
    this.world.graphics.on('render', this.onRender)
    this.resize(this.world.graphics.width, this.world.graphics.height)
  }

  onResize = () => {
    this.resize(this.world.graphics.width, this.world.graphics.height)
  }

  onRender = () => {
    this.render()
  }

  resize(width, height) {
    if (!this.renderer) return
    this.width = width
    this.height = height
    this.renderer.setSize(width, height)
    for (const layer of this.orderedLayers.values()) layer.renderer.setSize(width, height)
  }

  add(object3d) {
    if (!object3d.renderOrder || !this.elem) {
      this.scene.add(object3d)
      return
    }
    // A z-index on a plane inside preserve-3d does not override perspective depth.
    // Give explicitly ordered surfaces permanent sibling stacking contexts.
    // Never move their iframe DOM between renderers when priority changes.
    const element = document.createElement('div')
    Object.assign(element.style, { position: 'absolute', inset: '0', pointerEvents: 'none' })
    element.style.zIndex = String(object3d.renderOrder)
    this.elem.appendChild(element)
    const renderer = new CSS3DRenderer({ element })
    renderer.setSize(this.width, this.height)
    const scene = new THREE.Scene()
    scene.add(object3d)
    this.orderedLayers.set(object3d, { element, renderer, scene })
  }

  remove(object3d) {
    const layer = this.orderedLayers.get(object3d)
    if (layer) {
      layer.scene.remove(object3d)
      layer.element.remove()
      this.orderedLayers.delete(object3d)
    } else {
      this.scene.remove(object3d)
    }
  }

  render() {
    if (!this.renderer) return
    this.renderer.render(this.scene, this.world.camera)
    for (const [object, layer] of this.orderedLayers) {
      layer.element.style.zIndex = String(object.renderOrder)
      layer.renderer.render(layer.scene, this.world.camera)
    }
  }

  destroy() {
    for (const object of this.orderedLayers.keys()) this.remove(object)
    if (this.elem) {
      this.world.graphics.off('resize', this.onResize)
      this.world.graphics.off('render', this.onRender)
    }
  }
}
