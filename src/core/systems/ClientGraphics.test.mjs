import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [new URL('./ClientGraphics.js', import.meta.url).pathname],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientGraphics } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('background commits skip scene rendering and resume when visible, while XR keeps rendering', () => {
  const previousDocument = Object.getOwnPropertyDescriptor(globalThis, 'document')
  const document = { hidden: true }
  Object.defineProperty(globalThis, 'document', { configurable: true, value: document })
  try {
    const graphics = new ClientGraphics({ stage: { scene: new THREE.Scene() }, camera: new THREE.PerspectiveCamera() })
    let renders = 0
    let photos = 0
    graphics.photos.process = () => photos++
    graphics.renderer = {
      shadowMap: { enabled: false },
      xr: { isPresenting: false },
      render() {
        renders++
      },
    }
    graphics.usePostprocessing = false
    graphics.commit()
    assert.equal(renders, 0)
    assert.equal(photos, 1)
    document.hidden = false
    graphics.commit()
    assert.equal(renders, 1)
    document.hidden = true
    graphics.renderer.xr.isPresenting = true
    graphics.commit()
    assert.equal(renders, 2)
  } finally {
    if (previousDocument) Object.defineProperty(globalThis, 'document', previousDocument)
    else delete globalThis.document
  }
})

for (const mode of ['direct', 'composer', 'xr', 'exception']) {
  test(`${mode} rendering applies the shadow budget and restores requested flags and tone mapping`, () => {
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera()
    const material = new THREE.MeshStandardMaterial({ map: new THREE.Texture() })
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material))
    const lights = Array.from({ length: 16 }, () => {
      const light = new THREE.PointLight()
      light.castShadow = true
      scene.add(light)
      return light
    })
    let rendered = false
    const draw = () => {
      assert.equal(lights.filter(light => light.castShadow).length, 15)
      assert.equal(graphics.renderer.autoClear, mode === 'direct' || mode === 'xr')
      rendered = true
      if (mode === 'exception') throw new Error('render failed')
    }
    const graphics = new ClientGraphics({ stage: { scene }, camera })
    graphics.renderer = {
      shadowMap: { enabled: true },
      capabilities: { maxTextures: 16 },
      xr: { isPresenting: mode === 'xr' },
      toneMapping: THREE.NoToneMapping,
      autoClear: false,
      render: draw,
    }
    graphics.usePostprocessing = mode !== 'direct'
    graphics.composer = { render: draw }
    if (mode === 'exception') assert.throws(() => graphics.render(), /render failed/)
    else graphics.render()
    assert.ok(rendered)
    assert.ok(lights.every(light => light.castShadow))
    assert.equal(graphics.renderer.toneMapping, THREE.NoToneMapping)
    assert.equal(graphics.renderer.autoClear, false)
  })
}

test('XR restores composer clearing state even when direct rendering throws', () => {
  const graphics = new ClientGraphics({ stage: { scene: new THREE.Scene() }, camera: new THREE.PerspectiveCamera() })
  graphics.renderer = {
    shadowMap: { enabled: false },
    xr: { isPresenting: true },
    toneMapping: THREE.NoToneMapping,
    autoClear: false,
    render() {
      assert.equal(this.autoClear, true)
      throw new Error('XR draw failed')
    },
  }
  graphics.usePostprocessing = true
  assert.throws(() => graphics.render(), /XR draw failed/)
  assert.equal(graphics.renderer.autoClear, false)
  assert.equal(graphics.renderer.toneMapping, THREE.NoToneMapping)
})

test('a portal switches Spark view buffers to the new destination and disposes an unfinished old view safely', async () => {
  class Spark {
    constructor({ timer }) {
      this.timer = timer
    }
    update() {
      return new Promise(resolve => {
        this.finish = resolve
      })
    }
    dispose() {
      this.disposed = true
    }
  }
  const makeDestination = timer => {
    const spark = new Spark({ timer })
    return {
      matrixWorld: new THREE.Matrix4(),
      world: {
        stage: { scene: new THREE.Scene(), getSparkRenderer: () => spark },
        graphics: { portals: new Set() },
        rig: new THREE.Object3D(),
        camera: new THREE.PerspectiveCamera(),
        environment: { lateUpdate() {}, csm: { update() {} } },
      },
    }
  }
  let destination = makeDestination('first-world')
  const world = { stage: { scene: new THREE.Scene() }, portalPreviews: { get: () => destination } }
  const graphics = new ClientGraphics(world)
  world.graphics = graphics
  let target = null
  graphics.renderer = {
    xr: { enabled: true },
    shadowMap: { autoUpdate: true },
    toneMapping: THREE.ACESFilmicToneMapping,
    getDrawingBufferSize: value => value.set(256, 256),
    getRenderTarget: () => target,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    getCurrentViewport: value => value.set(0, 0, 256, 256),
    setRenderTarget(value) {
      target = value
    },
    state: { buffers: { depth: { setMask() {} } }, viewport() {} },
    clear() {},
    render(scene) {
      assert.equal(scene, destination.world.stage.scene)
    },
  }
  const eye = new THREE.PerspectiveCamera(70, 1, 0.1, 100)
  eye.position.z = 3
  eye.updateMatrixWorld()
  const view = {
    camera: new THREE.PerspectiveCamera(),
    textureMatrix: new THREE.Matrix4(),
    target: new THREE.WebGLRenderTarget(1, 1),
    lastRender: -Infinity,
  }
  const portal = {
    url: 'https://destination.example',
    target: 'exit',
    matrixWorld: new THREE.Matrix4(),
    resolution: 256,
    updateRate: 0,
    mesh: { material: { uniforms: { linked: {}, preview: {}, textureMatrix: {} } } },
    getView: () => view,
  }
  graphics.renderPortal(portal, eye)
  const first = view.spark
  const firstUpdate = view.sparkUpdate
  assert.equal(first.timer, 'first-world')
  destination = makeDestination('second-world')
  graphics.renderPortal(portal, eye)
  const second = view.spark
  const secondUpdate = view.sparkUpdate
  assert.notEqual(first, second)
  assert.equal(second.timer, 'second-world')
  assert.equal(first.disposed, undefined)
  first.finish()
  await firstUpdate
  await Promise.resolve()
  assert.equal(first.disposed, true)
  assert.equal(view.sparkUpdating, true, 'finishing the old view must not clear the new view update')
  second.finish()
  await secondUpdate
  assert.equal(view.sparkUpdating, false)
  assert.equal(second.disposed, undefined)
  destination.world.stage.getSparkRenderer = () => null
  graphics.renderPortal(portal, eye)
  assert.equal(second.disposed, true)
  assert.equal(view.spark, null)
  assert.equal(target, null)
  assert.equal(graphics.renderer.xr.enabled, true)
  assert.equal(graphics.renderer.shadowMap.autoUpdate, true)
  assert.equal(graphics.renderer.toneMapping, THREE.ACESFilmicToneMapping)
  view.target.dispose()
})
