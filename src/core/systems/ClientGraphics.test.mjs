import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents: "export { ClientGraphics } from './ClientGraphics.js'; export { Light } from '../nodes/Light.js'",
    resolveDir: new URL('.', import.meta.url).pathname,
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { ClientGraphics, Light } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function lightCompilationContext({ postprocessing = true, parallel = true, pipeline = false } = {}) {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const graphics = new ClientGraphics({ stage: { scene }, camera })
  const light = new THREE.SpotLight()
  scene.add(light)
  const programs = []
  const compilations = []
  const frames = []
  const draws = []
  const properties = new WeakMap()
  const viewport = new THREE.Vector4(0, 0, 96, 64)
  let target = null
  graphics.usePostprocessing = postprocessing
  graphics.renderer = {
    extensions: { has: () => parallel },
    info: { programs },
    shadowMap: { enabled: false },
    xr: { isPresenting: false },
    toneMapping: THREE.NoToneMapping,
    getRenderTarget: () => target,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget(value) {
      target = value
      viewport.set(0, 0, 96, 64)
    },
    compile() {},
    compileAsync() {
      const program = {
        id: programs.length,
        ready: false,
        initialized: false,
        isReady() {
          return this.ready
        },
        getUniforms() {
          assert.ok(this.ready)
          this.initialized = true
        },
      }
      programs.push(program)
      scene.traverse(object => {
        if (!object.material) return
        for (const material of [object.material].flat()) {
          if (!properties.has(material)) properties.set(material, {})
          properties.get(material).currentProgram = program
        }
      })
      compilations.push({
        program,
        target,
        toneMapping: this.toneMapping,
        lights: scene.children.filter(object => object.isLight && object.visible),
      })
      // Rendering the old configuration changes Three's currentProgram. Its
      // promise can resolve before the newly compiled program is actually ready.
      return Promise.resolve()
    },
    render() {
      frames.push(scene.children.filter(object => object.isLight && object.visible))
    },
  }
  if (pipeline) {
    graphics.renderer.properties = {
      get(material) {
        if (!properties.has(material)) properties.set(material, {})
        return properties.get(material)
      },
    }
    graphics.renderer.getCurrentViewport = value => value.copy(viewport)
    graphics.renderer.state = {
      viewport(value) {
        viewport.copy(value)
      },
      scissor() {},
      setScissorTest() {},
    }
    graphics.renderer.renderBufferDirect = (camera, scene, geometry, material, object) => {
      const program = properties.get(material).currentProgram
      assert.ok(program.ready && program.initialized)
      assert.deepEqual(viewport.toArray(), [0, 0, 1, 1])
      draws.push({
        target,
        object,
        material,
        side: material.side,
        lights: scene.children.filter(o => o.isLight && o.visible),
      })
    }
  }
  graphics.composer = { inputBuffer: new THREE.WebGLRenderTarget(1, 1), render: () => graphics.renderer.render() }
  return { graphics, scene, light, compilations, frames, draws, viewport }
}

test('light removal keeps rendering the old configuration until its shaders are ready', async () => {
  const { graphics, light, compilations, frames } = lightCompilationContext()
  light.intensity = 0
  graphics.setLightVisibility(light, false)
  graphics.render()
  assert.equal(light.intensity, 0)
  assert.equal(light.visible, true)
  assert.deepEqual(compilations[0].lights, [])
  assert.deepEqual(frames[0], [light])
  await new Promise(setImmediate)
  graphics.render()
  assert.equal(light.visible, true, 'compileAsync alone can finish before the target program is ready')
  compilations[0].program.ready = true
  graphics.render()
  assert.equal(light.visible, false)
  assert.deepEqual(frames.at(-1), [])
  assert.equal(compilations.length, 1)
})

test('circuit changes compile together and superseded batches never apply partially', async () => {
  const { graphics, scene, light, compilations } = lightCompilationContext()
  const second = new THREE.PointLight()
  scene.add(second)
  graphics.setLightVisibility(light, false)
  graphics.setLightVisibility(second, false)
  graphics.render()
  assert.equal(compilations.length, 1)
  assert.deepEqual(compilations[0].lights, [])
  graphics.setLightVisibility(second, true)
  await new Promise(setImmediate)
  compilations[0].program.ready = true
  graphics.render()
  assert.equal(light.visible, true, 'the remaining off request needs a different shader configuration')
  assert.equal(second.visible, true)
  assert.equal(compilations.length, 2)
  assert.deepEqual(compilations[1].lights, [second])
  await new Promise(setImmediate)
  compilations[1].program.ready = true
  graphics.render()
  assert.equal(light.visible, false)
  assert.equal(second.visible, true)
})

test('cancelled and unmounted lights cannot be applied after compilation', async () => {
  const { graphics, scene, light, compilations } = lightCompilationContext()
  graphics.setLightVisibility(light, false)
  graphics.render()
  graphics.setLightVisibility(light, true)
  await new Promise(setImmediate)
  compilations[0].program.ready = true
  graphics.render()
  assert.equal(light.visible, true)
  assert.equal(compilations.length, 1)
  graphics.setLightVisibility(light, false)
  graphics.render()
  scene.remove(light)
  await new Promise(setImmediate)
  compilations[1].program.ready = true
  graphics.render()
  assert.equal(light.parent, null)
  assert.equal(light.visible, true)
  assert.equal(graphics.lightVisibility.size, 0)
})

for (const postprocessing of [true, false]) {
  test(`light preparation uses the ${postprocessing ? 'composer' : 'direct'} shader output and restores renderer state`, async () => {
    const { graphics, light, compilations } = lightCompilationContext({ postprocessing })
    graphics.setLightVisibility(light, false)
    graphics.render()
    assert.equal(compilations[0].target, postprocessing ? graphics.composer.inputBuffer : null)
    assert.equal(compilations[0].toneMapping, postprocessing ? THREE.NoToneMapping : THREE.ACESFilmicToneMapping)
    assert.equal(graphics.renderer.getRenderTarget(), null)
    assert.equal(graphics.renderer.toneMapping, THREE.NoToneMapping)
    graphics.usePostprocessing = !postprocessing
    await new Promise(setImmediate)
    compilations[0].program.ready = true
    graphics.render()
    assert.equal(light.visible, true, 'changing output mode must prepare its shader variant before applying')
    assert.equal(compilations.length, 2)
  })
}

test('lights still switch immediately when parallel shader compilation is unavailable', () => {
  const { graphics, light, compilations } = lightCompilationContext({ parallel: false })
  graphics.setLightVisibility(light, false)
  assert.equal(light.visible, false)
  graphics.setLightVisibility(light, true)
  assert.equal(light.visible, true)
  assert.equal(compilations.length, 0)
})

test('point, spot and directional node setters use the same asynchronous circuit preparation', async () => {
  const { graphics, scene, light, compilations } = lightCompilationContext()
  scene.remove(light)
  graphics.world.network = { isServer: false }
  graphics.world.stage.dirtyNodes = new Set()
  const nodes = ['point', 'spot', 'directional'].map(type => {
    const node = new Light({ type, intensity: 3, castShadow: true })
    node.activate({ world: graphics.world })
    return node
  })
  graphics.world.graphics = graphics
  const originals = nodes.map(node => node.light)
  for (const node of nodes) node.getProxy().intensity = 0
  assert.ok(nodes.every(node => node.light.intensity === 0 && node.light.visible))
  graphics.render()
  assert.equal(compilations.length, 1)
  assert.deepEqual(compilations[0].lights, [])
  await new Promise(setImmediate)
  compilations[0].program.ready = true
  graphics.render()
  assert.ok(nodes.every(node => !node.light.visible && node.light.castShadow))
  for (const node of nodes) node.getProxy().intensity = 3
  graphics.render()
  assert.equal(compilations.length, 2)
  assert.ok(nodes.every(node => !node.light.visible))
  await new Promise(setImmediate)
  compilations[1].program.ready = true
  graphics.render()
  assert.ok(nodes.every((node, index) => node.light === originals[index] && node.light.visible))
  for (const node of nodes) node.deactivate()
})

test('shader preparation uses the shadow budget and restores authored shadow flags', () => {
  const { graphics, scene, light, compilations } = lightCompilationContext()
  scene.remove(light)
  const lights = Array.from({ length: 3 }, () => new THREE.PointLight())
  for (const light of lights) {
    light.castShadow = true
    scene.add(light)
  }
  graphics.renderer.shadowMap.enabled = true
  graphics.renderer.capabilities = { maxTextures: 1 }
  const compile = graphics.renderer.compileAsync
  graphics.renderer.compileAsync = function () {
    assert.equal(lights.filter(light => light.visible && light.castShadow).length, 1)
    return compile.call(this)
  }
  graphics.setLightVisibility(lights[0], false)
  graphics.render()
  assert.equal(compilations.length, 1)
  assert.ok(lights.every(light => light.castShadow))
})

test('direct output also prepares the linear shaders used by portals', async () => {
  const { graphics, light, compilations } = lightCompilationContext({ postprocessing: false })
  graphics.portals.add({})
  graphics.setLightVisibility(light, false)
  graphics.render()
  assert.equal(compilations.length, 2)
  assert.equal(compilations[0].target, null)
  assert.equal(compilations[1].target, graphics.composer.inputBuffer)
  assert.equal(compilations[1].toneMapping, THREE.NoToneMapping)
  await new Promise(setImmediate)
  compilations[0].program.ready = true
  graphics.render()
  assert.equal(light.visible, true)
  compilations[1].program.ready = true
  graphics.render()
  assert.equal(light.visible, false)
})

test('cold native pipelines warm one layout per frame while the old light configuration keeps rendering', async () => {
  const { graphics, scene, light, compilations, frames, draws, viewport } = lightCompilationContext({ pipeline: true })
  const material = new THREE.MeshStandardMaterial()
  const packed = new THREE.PlaneGeometry()
  packed.setAttribute(
    'uv',
    new THREE.BufferAttribute(
      Uint16Array.from(packed.attributes.uv.array, value => Math.round(value * 65535)),
      2,
      true
    )
  )
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material), new THREE.Mesh(packed, material))
  graphics.setLightVisibility(light, false)
  graphics.render()
  await new Promise(setImmediate)
  assert.equal(draws.length, 0)
  compilations[0].program.ready = true
  graphics.render()
  assert.equal(draws.length, 1)
  assert.equal(light.visible, true)
  assert.deepEqual(frames.at(-1), [light])
  graphics.render()
  assert.equal(draws.length, 2)
  assert.equal(light.visible, true)
  assert.deepEqual(
    draws.map(draw => draw.lights),
    [[], []]
  )
  assert.ok(draws.every(draw => draw.target === graphics.composer.inputBuffer))
  graphics.render()
  assert.equal(light.visible, false)
  assert.deepEqual(viewport.toArray(), [0, 0, 96, 64])
  assert.equal(graphics.renderer.getRenderTarget(), null)
})

test('GPU preparation covers both faces and shadow materials, then disposes only its temporary resources', async () => {
  const { graphics, scene, light, compilations, draws } = lightCompilationContext({ pipeline: true })
  const material = new THREE.MeshStandardMaterial({
    transparent: true,
    side: THREE.DoubleSide,
    map: new THREE.Texture(),
  })
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), material)
  mesh.castShadow = true
  scene.add(mesh)
  light.castShadow = true
  const point = new THREE.PointLight()
  point.castShadow = true
  scene.add(point)
  const directional = new THREE.DirectionalLight()
  directional.castShadow = true
  scene.add(directional)
  graphics.renderer.shadowMap.enabled = true
  graphics.renderer.shadowMap.type = THREE.PCFShadowMap
  graphics.renderer.capabilities = { maxTextures: 16 }
  graphics.setLightVisibility(light, false)
  graphics.render()
  assert.equal(mesh.material, material)
  assert.equal(compilations.length, 3, 'main, depth and point-distance variants must all be prepared')
  const temporary = [...graphics.lightCompilation.materials]
  assert.ok(temporary.length)
  let disposed = 0
  let originalDisposed = false
  for (const material of temporary) material.addEventListener('dispose', () => disposed++)
  material.addEventListener('dispose', () => {
    originalDisposed = true
  })
  await new Promise(setImmediate)
  for (const compilation of compilations) compilation.program.ready = true
  while (graphics.lightCompilation) graphics.render()
  assert.ok(draws.some(draw => draw.material === material && draw.side === THREE.BackSide))
  assert.ok(draws.some(draw => draw.material === material && draw.side === THREE.FrontSide))
  const shadow = draws.find(draw => draw.material.isMeshDepthMaterial)
  assert.ok(shadow)
  assert.equal(shadow.target.width, 1)
  const distance = draws.find(draw => draw.material.isMeshDistanceMaterial)
  assert.ok(distance)
  assert.equal(graphics.renderer.properties.get(distance.material).light, point)
  assert.equal(material.side, THREE.DoubleSide)
  assert.equal(mesh.material, material)
  assert.equal(light.visible, false)
  assert.equal(point.visible, true)
  assert.equal(disposed, 0, 'shadow shaders must survive the two frames needed to update Three light state')
  graphics.render()
  graphics.render()
  graphics.render()
  assert.equal(disposed, temporary.length)
  assert.equal(originalDisposed, false)
})

test('disposing a material during preparation cannot leave all light switches waiting forever', async () => {
  const { graphics, light, compilations } = lightCompilationContext()
  graphics.setLightVisibility(light, false)
  graphics.render()
  await new Promise(setImmediate)
  graphics.renderer.info.programs.splice(0)
  assert.equal(compilations[0].program.ready, false)
  graphics.render()
  assert.equal(light.visible, false)
  assert.equal(graphics.lightVisibility.size, 0)
})

test('cancelling a partly warmed shader still prepares its remaining vertex layouts on retry', async () => {
  const { graphics, scene, light, compilations, draws } = lightCompilationContext({ pipeline: true })
  const material = new THREE.MeshStandardMaterial()
  const packed = new THREE.PlaneGeometry()
  packed.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(8), 2, true))
  scene.add(new THREE.Mesh(new THREE.BoxGeometry(), material), new THREE.Mesh(packed, material))
  graphics.setLightVisibility(light, false)
  graphics.render()
  await new Promise(setImmediate)
  compilations[0].program.ready = true
  graphics.render()
  assert.equal(draws.length, 1)
  graphics.setLightVisibility(light, true)
  graphics.render()
  assert.equal(light.visible, true)
  // Three retains linked programs when a requested lighting change is cancelled.
  graphics.renderer.compileAsync = () => Promise.resolve()
  graphics.setLightVisibility(light, false)
  graphics.render()
  await new Promise(setImmediate)
  graphics.render()
  assert.equal(draws.length, 2, 'the first layout must not mark the whole shader as warmed')
  graphics.render()
  assert.equal(light.visible, false)
})

for (const mode of ['direct', 'xr']) {
  test(`${mode} GPU preparation restores renderer output and continues the old view`, async () => {
    const { graphics, scene, light, compilations, draws } = lightCompilationContext({
      pipeline: true,
      postprocessing: mode === 'xr',
    })
    graphics.renderer.xr.isPresenting = mode === 'xr'
    scene.add(new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()))
    graphics.setLightVisibility(light, false)
    graphics.render()
    await new Promise(setImmediate)
    compilations[0].program.ready = true
    graphics.render()
    assert.equal(light.visible, true)
    assert.equal(draws.length, 1)
    assert.equal(draws[0].target, null)
    assert.equal(graphics.renderer.toneMapping, THREE.NoToneMapping)
    graphics.render()
    assert.equal(light.visible, false)
  })
}

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
  await new Promise(setImmediate)
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
