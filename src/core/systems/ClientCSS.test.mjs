import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'

const bundle = await build({
  stdin: {
    contents: `export { ClientCSS } from './src/core/systems/ClientCSS.js';
      export { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';
      export { PerspectiveCamera } from 'three';`,
    resolveDir: fileURLToPath(new URL('../../../', import.meta.url)),
  },
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { ClientCSS, CSS3DObject, PerspectiveCamera } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

class Element {
  constructor() {
    this.style = {}
    this.children = []
    this.ownerDocument = { defaultView: { Element } }
    this.attachments = 0
  }
  setAttribute() {}
  appendChild(child) {
    child.remove()
    this.children.push(child)
    child.parentNode = this
    child.attachments++
  }
  remove() {
    if (!this.parentNode) return
    this.parentNode.children.splice(this.parentNode.children.indexOf(this), 1)
    this.parentNode = null
  }
}
globalThis.document = { createElement: () => new Element() }

test('ordered WebViews keep independent CSS contexts and never reattach when priority or camera distance changes', async () => {
  const camera = new PerspectiveCamera(70, 1, 0.2, 1200)
  const css = new ClientCSS({ camera })
  const root = new Element()
  await css.init({ cssLayer: root })
  css.resize(800, 600)
  const under = new CSS3DObject(new Element())
  const turning = new CSS3DObject(new Element())
  under.renderOrder = 1
  turning.renderOrder = 1
  css.add(under)
  css.add(turning)
  css.render()
  const layer = css.orderedLayers.get(turning)
  const parent = turning.element.parentNode
  assert.notEqual(parent, under.element.parentNode)
  assert.equal(turning.element.attachments, 1)
  for (const distance of [0.5, 0.9, 2, 4]) {
    camera.position.z = distance
    turning.renderOrder = 100
    css.render()
    assert.equal(layer.element.style.zIndex, '100')
    assert.equal(css.orderedLayers.get(under).element.style.zIndex, '1')
    assert.equal(turning.element.parentNode, parent)
    assert.equal(turning.element.attachments, 1)
  }
  turning.renderOrder = 1
  css.render()
  assert.equal(layer.element.style.zIndex, '1')
  css.resize(1200, 900)
  assert.deepEqual(layer.renderer.getSize(), { width: 1200, height: 900 })
  css.remove(turning)
  assert.equal(css.orderedLayers.has(turning), false)
  assert.equal(layer.element.parentNode, null)
})

test('ordinary WebViews keep the shared renderer', async () => {
  const css = new ClientCSS({ camera: new PerspectiveCamera() })
  await css.init({ cssLayer: new Element() })
  const object = new CSS3DObject(new Element())
  css.add(object)
  assert.equal(object.parent, css.scene)
  assert.equal(css.orderedLayers.size, 0)
  css.remove(object)
  assert.equal(object.parent, null)
})
