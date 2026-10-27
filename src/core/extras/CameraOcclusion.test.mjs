import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: {
    contents: `
      export { CameraOcclusion } from './CameraOcclusion.js'
      export { Stage } from '../systems/Stage.js'
      export { Mesh } from '../nodes/Mesh.js'
      export { Group } from '../nodes/Group.js'
      export { Prim } from '../nodes/Prim.js'
      export { Light } from '../nodes/Light.js'
      export { SkinnedMesh } from '../nodes/SkinnedMesh.js'
      export { ClientGraphics } from '../systems/ClientGraphics.js'
      export { glbToNodes } from './glbToNodes.js'
      export * as THREE from './three.js'
    `,
    resolveDir: new URL('.', import.meta.url).pathname,
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { CameraOcclusion, Stage, Mesh, Group, Prim, Light, SkinnedMesh, ClientGraphics, glbToNodes, THREE } =
  await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

function fixture() {
  const world = {
    time: 0,
    setupMaterial() {},
    network: { isServer: false },
    rig: new THREE.Group(),
    camera: new THREE.OrthographicCamera(-8, 8, 6, -6, 0.2, 100),
    builder: { enabled: false },
    entities: {
      player: { base: { position: new THREE.Vector3() }, capsuleHeight: 1.6, capsuleRadius: 0.3 },
    },
  }
  world.camera.position.set(12, 13, 12)
  world.camera.lookAt(0, 1, 0)
  world.stage = new Stage(world)
  world.stage.init({ viewport: {} })
  const material = new THREE.MeshStandardMaterial()
  const entity = { isApp: true }
  const root = new Group()
  root.activate({ world, entity })
  const add = (position, size, options = {}, parent = root) => {
    const node = new Mesh({
      type: 'geometry',
      geometry: new THREE.BoxGeometry(...size),
      material,
      linked: true,
      position,
      ...options,
    })
    parent.add(node)
    world.stage.clean()
    world.stage.update()
    return node
  }
  const occlusion = new CameraOcclusion(world)
  return { world, root, add, occlusion }
}

function cameraDraw(world, node) {
  const model = [...world.stage.models.values()].find(model => model.items.some(item => item.node === node))
  const item = model.items.find(item => item.node === node)
  return item.cameraMesh
}

function isClipped(world, node) {
  const model = [...world.stage.models.values()].find(model => model.items.some(item => item.node === node))
  return model?.items.find(item => item.node === node).cameraHidden === true
}

test('an obstructing app cuts its entire upstairs, detached script nodes and separate interior apps', () => {
  const { world, root, add, occlusion } = fixture()
  const house = root.ctx.entity
  house.root = root
  house.worldNodes = new Set()
  world.entities.items = new Map([['house', house]])
  const roof = add([0, 6, 0], [12, 0.2, 12])
  const floor = add([0, 0, 0], [12, 0.2, 12])
  const room = add([-3, 4, 0], [1, 2, 2])
  const glazing = add([-3, 4, -3], [1, 2, 0.1], {
    material: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.3 }),
  })
  const detached = new Group()
  detached.activate(root.ctx)
  house.worldNodes.add(detached)
  const trim = add([3, 5, -3], [1, 0.2, 1], {}, detached)
  const inside = { isApp: true, root: new Group(), worldNodes: new Set() }
  inside.root.activate({ world, entity: inside })
  world.entities.items.set('furniture', inside)
  const furniture = add([-2, 4, -2], [0.5, 0.5, 0.5], {}, inside.root)
  const outside = { isApp: true, root: new Group(), worldNodes: new Set() }
  outside.root.activate({ world, entity: outside })
  world.entities.items.set('outside', outside)
  const neighbor = add([-12, 4, -2], [0.5, 0.5, 0.5], {}, outside.root)
  const light = new Light({ position: [-3, 4, -2] })
  root.add(light)
  const count = world.stage.octree.getCount()
  occlusion.update()
  occlusion.apply()
  for (const node of [roof, room, glazing, trim, furniture]) {
    assert.ok(isClipped(world, node), `${node === room ? 'unhit upstairs room' : 'app content'} must share the cut`)
  }
  assert.equal(isClipped(world, neighbor), false)
  assert.equal(light.light.visible, false)
  assert.equal(floor.mounted, true)
  assert.equal(world.stage.octree.getCount(), count)
  const resume = occlusion.suspend()
  assert.equal(light.light.visible, true)
  assert.equal(isClipped(world, room), false)
  resume()
  assert.ok(isClipped(world, room))
  occlusion.restore()
  assert.equal(light.light.visible, true)
  assert.equal(isClipped(world, furniture), false)
})

test('cuts preserve shared animated-model materials and include world-space HTML content', () => {
  const { world, root, add, occlusion } = fixture()
  const app = root.ctx.entity
  app.root = root
  app.worldNodes = new Set()
  world.entities.items = new Map([['house', app]])
  add([0, 3, 0], [8, 0.2, 8])
  add([0, 0, 0], [8, 0.2, 8])
  const shared = new THREE.MeshStandardMaterial()
  const model = new THREE.Group()
  model.add(new THREE.Mesh(new THREE.BoxGeometry(1, 4, 1).translate(0, 1.5, 0), shared))
  const statue = new SkinnedMesh({ object3d: model, position: [-2, 0, 0], animations: [] })
  root.add(statue)
  const neighbor = new SkinnedMesh({ object3d: model, position: [-20, 0, 0], animations: [] })
  const outside = { isApp: true, root: new Group(), worldNodes: new Set() }
  outside.root.activate({ world, entity: outside })
  outside.root.add(neighbor)
  world.entities.items.set('outside', outside)
  const surface = new Group()
  surface.objectCSS = new THREE.Object3D()
  surface.objectCSS.element = { style: { width: '100px', height: '200px', clipPath: '' } }
  surface.objectCSS.scale.setScalar(0.01)
  surface.objectCSS.position.y = 1
  root.add(surface)
  occlusion.update()
  occlusion.apply()
  const material = statue.obj.children[0].material
  assert.notEqual(material, shared)
  assert.equal(material.clippingPlanes[0], occlusion.plane)
  assert.equal(neighbor.obj.children[0].material, shared)
  assert.equal(shared.clippingPlanes, null)
  occlusion.restore()
  assert.equal(statue.obj.children[0].material, shared)
  occlusion.updateCSS()
  const ys = [...surface.objectCSS.element.style.clipPath.matchAll(/[-\d.]+px ([-\d.]+)px/g)].map(match =>
    Number(match[1])
  )
  assert.ok(Math.abs(Math.min(...ys) - 15) < 1e-6, 'HTML above the same world-space plane is cut')
  surface.objectCSS.position.y = 4
  occlusion.updateCSS()
  assert.equal(surface.objectCSS.element.style.clipPath, 'inset(100%)')
  let disposed = false
  material.addEventListener('dispose', () => {
    disposed = true
  })
  occlusion.clear()
  assert.equal(disposed, true)
  assert.equal(surface.objectCSS.element.style.clipPath, '')
})

test('interior containment follows a rotated building, and opt-outs and exterior copies stay intact', () => {
  const { world, root, add, occlusion } = fixture()
  const house = root.ctx.entity
  house.root = root
  house.worldNodes = new Set()
  root.rotation.y = Math.PI / 4
  add([0, 5, 0], [12, 0.2, 4])
  add([0, 0, 0], [12, 0.2, 4])
  const inside = { isApp: true, root: new Group(), worldNodes: new Set() }
  inside.root.activate({ world, entity: inside })
  const location = new THREE.Vector3(4, 3, 0).applyMatrix4(root.matrixWorld)
  const furniture = add(location.toArray(), [0.5, 0.5, 0.5], {}, inside.root)
  const outside = { isApp: true, root: new Group(), worldNodes: new Set() }
  outside.root.activate({ world, entity: outside })
  const neighbor = add([0, 3, 4], [0.5, 0.5, 0.5], {}, outside.root)
  world.entities.items = new Map([
    ['house', house],
    ['inside', inside],
    ['outside', outside],
  ])
  // Isolate containment from the visibility-ray direction; the obstructing app is already known.
  occlusion.obstructions.set(house, 0)
  occlusion.plane.constant = 1.85
  occlusion.updateContents()
  occlusion.apply()
  assert.ok(isClipped(world, furniture))
  assert.equal(isClipped(world, neighbor), false, 'outside the rotated footprint')
  occlusion.restore()
  inside.root.cameraOcclusion = false
  occlusion.updateContents()
  occlusion.apply()
  assert.equal(isClipped(world, furniture), false)
  occlusion.restore()
  furniture.position.set(20, 3, 0)
  world.stage.clean()
  inside.root.cameraOcclusion = null
  occlusion.updateContents()
  occlusion.apply()
  assert.equal(isClipped(world, furniture), false, 'moved contents restore without changing app ownership')
  occlusion.restore()
})

test('models clip only for the main draw; floors, nodes and geometry queries stay intact', () => {
  const { world, add, occlusion } = fixture()
  const roof = add([0, 1.85, 0], [6, 0.2, 6])
  const floor = add([0, -0.2, 0], [20, 0.2, 20])
  const background = add([-4, 0.8, -4], [1, 1, 1])
  occlusion.update()
  assert.ok(occlusion.obstructions.has(roof))
  assert.equal(occlusion.obstructions.has(floor), false)
  assert.equal(occlusion.obstructions.has(background), false)
  const count = world.stage.octree.getCount()
  occlusion.apply()
  assert.ok(isClipped(world, roof))
  const draw = cameraDraw(world, roof)
  assert.equal(draw.visible, true)
  assert.equal(draw.material.clippingPlanes[0], occlusion.plane)
  assert.ok(occlusion.plane.distanceToPoint(new THREE.Vector3(0, 1, 0)) > 0, 'lower structure stays below the cut')
  assert.ok(occlusion.plane.distanceToPoint(new THREE.Vector3(0, 3, 0)) < 0, 'upper geometry is cut away')
  assert.equal(roof.active, true)
  assert.equal(roof.mounted, true)
  assert.equal(world.stage.octree.getCount(), count)
  const hits = world.stage.raycast(new THREE.Vector3(0, 5, 0), new THREE.Vector3(0, -1, 0))
  assert.ok(
    hits.some(hit => hit.node === roof),
    'clipped model remains detectable'
  )
  occlusion.restore()
  assert.equal(isClipped(world, roof), false)
})

test('the cut plane ignores walking animation and stays above the standing avatar', () => {
  const { world, occlusion } = fixture()
  const player = world.entities.player
  const eye = new THREE.Matrix4().makeTranslation(0, 1.45, 0)
  let standingHeight = 1.9
  player.avatar = {
    getHeight: () => standingHeight,
    getBoneTransform: () => eye,
  }
  occlusion.update()
  assert.equal(occlusion.plane.constant, standingHeight + 0.25)
  for (let frame = 1; frame <= 12; frame++) {
    player.base.position.x = frame * 0.1
    eye.makeTranslation(player.base.position.x, 1.45 + Math.sin(frame) * 0.1, 0)
    world.time = frame * 0.02
    occlusion.update()
    assert.equal(occlusion.plane.constant, standingHeight + 0.25, 'walking must not bob the plane')
  }
  standingHeight = 2.2
  occlusion.update()
  assert.equal(occlusion.plane.constant, standingHeight + 0.25, 'a different avatar uses its standing height')
})

test('the cut plane follows player elevation every frame between geometry checks', () => {
  const { world, add, occlusion } = fixture()
  const roof = add([0, 3, 0], [6, 4, 6])
  occlusion.update()
  assert.equal(occlusion.plane.constant, 1.85)
  world.entities.player.base.position.y = 2
  world.time = 0.01
  occlusion.update()
  assert.equal(occlusion.plane.constant, 3.85)
  assert.equal(occlusion.obstructions.get(roof), 0, 'ray sampling remains throttled')
  occlusion.apply()
  assert.equal(cameraDraw(world, roof).material.clippingPlanes[0].constant, 3.85)
  occlusion.restore()
})

test('a standalone mesh keeps its authored clipping plane and shadow flags after the cut', () => {
  const { world, add, occlusion } = fixture()
  const originalPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 100)
  const roof = add([0, 3, 0], [6, 0.2, 6], {
    linked: false,
    material: new THREE.MeshStandardMaterial({ clippingPlanes: [originalPlane], clipShadows: false }),
  })
  const mesh = world.stage.scene.children.find(object => object.isMesh && !object.isInstancedMesh)
  const planes = mesh.material.clippingPlanes
  occlusion.update()
  occlusion.apply()
  assert.equal(mesh.visible, true)
  assert.deepEqual(mesh.material.clippingPlanes, [...planes, occlusion.plane])
  assert.equal(mesh.material.clipShadows, true)
  assert.equal(roof.mounted, true)
  occlusion.restore()
  assert.equal(mesh.material.clippingPlanes, planes)
  assert.equal(mesh.material.clipShadows, false)
})

test('detects all stacked obstructions and keeps clipped models detectable on later checks', () => {
  const { world, add, occlusion } = fixture()
  const lower = add([0, 3, 0], [8, 0.2, 8])
  const upper = add([0, 4, 0], [8, 0.2, 8])
  occlusion.update()
  assert.ok(occlusion.obstructions.has(lower))
  assert.ok(occlusion.obstructions.has(upper))
  occlusion.apply()
  world.time = 0.11
  occlusion.update()
  assert.equal(occlusion.obstructions.get(lower), world.time)
  assert.equal(occlusion.obstructions.get(upper), world.time)
  occlusion.restore()
})

test('orthographic shoulder rays find a partial obstruction outside the center ray', () => {
  const { world, add, occlusion } = fixture()
  const direction = new THREE.Vector3()
  world.camera.getWorldDirection(direction)
  const right = new THREE.Vector3().setFromMatrixColumn(world.camera.matrixWorld, 0)
  const center = new THREE.Vector3(0, 1.28, 0).addScaledVector(right, 0.3).addScaledVector(direction, -3)
  const blocker = add(center.toArray(), [0.12, 0.12, 0.12])
  occlusion.update()
  assert.ok(occlusion.obstructions.has(blocker))
})

test('model groups clip together, while exemptions, glass, invisible meshes and players are excluded', () => {
  const { world, root, add, occlusion } = fixture()
  const roofGroup = new Group({ cameraOcclusion: true })
  root.add(roofGroup)
  const roof = add([0, 3, 0], [6, 0.2, 6], {}, roofGroup)
  const roofPart = add([10, 3, 0], [1, 0.2, 1], {}, roofGroup)
  const exempt = add([0, 3.5, 0], [6, 0.2, 6], { cameraOcclusion: false }, roofGroup)
  const glass = add([0, 4, 0], [8, 0.2, 8], {
    linked: false,
    material: new THREE.MeshStandardMaterial({ transparent: true, opacity: 0.3 }),
  })
  const invisible = add([0, 4.5, 0], [8, 0.2, 8], { visible: false })
  const otherPlayer = add([0, 5, 0], [8, 0.2, 8])
  otherPlayer.ctx = { ...otherPlayer.ctx, entity: { isPlayer: true } }
  occlusion.update()
  assert.deepEqual([...occlusion.obstructions.keys()], [roofGroup])
  occlusion.apply()
  assert.ok(isClipped(world, roof))
  assert.ok(isClipped(world, roofPart))
  assert.equal(isClipped(world, exempt), false)
  assert.equal(isClipped(world, otherPlayer), false)
  assert.equal(glass.mounted, true)
  assert.equal(invisible.mounted, true)
  occlusion.restore()
  root.cameraOcclusion = false
  occlusion.apply()
  assert.equal(isClipped(world, roof), false, 'a new ancestor exemption also overrides the restoration delay')
  occlusion.restore()
  root.cameraOcclusion = null
  roofGroup.cameraOcclusion = false
  world.time = 1
  occlusion.update()
  assert.equal(occlusion.obstructions.size, 0)
})

test('roof restoration waits through a short clear interval, then releases the obstruction', () => {
  const { world, add, occlusion } = fixture()
  const roof = add([0, 3, 0], [6, 0.2, 6])
  occlusion.update()
  roof.position.set(20, 3, 0)
  world.stage.clean()
  world.time = 0.11
  occlusion.update()
  assert.ok(occlusion.obstructions.has(roof))
  world.time = 0.22
  occlusion.update()
  assert.equal(occlusion.obstructions.size, 0)
})

for (const mode of ['perspective', 'build', 'xr', 'mapped-camera', 'no-player']) {
  test(`${mode} immediately clears temporary clipping`, () => {
    const { world, add, occlusion } = fixture()
    const roof = add([0, 3, 0], [6, 0.2, 6])
    occlusion.update()
    occlusion.apply()
    assert.ok(isClipped(world, roof))
    if (mode === 'perspective') world.camera = new THREE.PerspectiveCamera()
    if (mode === 'build') world.builder.enabled = true
    if (mode === 'xr') world.entities.player.isXR = true
    if (mode === 'no-player') world.entities.player = null
    occlusion.update(mode !== 'mapped-camera')
    assert.equal(occlusion.obstructions.size, 0)
    assert.equal(isClipped(world, roof), false)
  })
}

test('portal suspension restores ordinary instance buffers, then reapplies the main camera mask', () => {
  const { world, add, occlusion } = fixture()
  const roof = add([0, 3, 0], [6, 0.2, 6])
  const model = [...world.stage.models.values()][0]
  const original = model.iMesh.instanceMatrix
  occlusion.update()
  occlusion.apply()
  const masked = model.iMesh.instanceMatrix
  assert.notEqual(masked, original)
  const resume = occlusion.suspend()
  assert.equal(model.iMesh.instanceMatrix, original)
  assert.equal(isClipped(world, roof), false)
  resume()
  assert.equal(model.iMesh.instanceMatrix, masked, 'reuses the main view GPU buffer after a portal draw')
  assert.ok(isClipped(world, roof))
  occlusion.restore()
  assert.equal(model.iMesh.instanceMatrix, original)
})

for (const failure of [null, 'shadow', 'main']) {
  test(`the shadow pass sees complete geometry and the main view stays clipped${failure ? ` after ${failure} failure` : ''}`, () => {
    const { world, root, add } = fixture()
    root.ctx.entity.root = root
    const roof = add([0, 3, 0], [6, 0.2, 6], { castShadow: true })
    const wall = add([0, 2, 1], [4, 4, 0.2], { castShadow: true })
    const authoredPlane = new THREE.Plane(new THREE.Vector3(1, 0, 0), 100)
    const frame = add([2, 2, 1], [0.2, 4, 0.2], {
      linked: false,
      castShadow: true,
      material: new THREE.MeshStandardMaterial({ clippingPlanes: [authoredPlane], clipShadows: true }),
    })
    const standalone = world.stage.scene.children.find(object => object.geometry === frame._geometry)
    const authoredPlanes = standalone.material.clippingPlanes
    const statue = new SkinnedMesh({
      object3d: new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial()),
      animations: [],
      position: [-2, 4, 0],
    })
    root.add(statue)
    const light = new Light({ position: [0, 4, 0] })
    root.add(light)
    world.stage.update()
    const originalBuffers = [...world.stage.models.values()].map(model => [model, model.iMesh.instanceMatrix])
    const graphics = new ClientGraphics(world)
    graphics.renderStyle = 'pixel-isometric'
    graphics.usePostprocessing = false
    let shadowDraws = 0
    const shadowMap = {
      enabled: true,
      render(lights, scene, camera) {
        shadowDraws++
        assert.equal(isClipped(world, roof), false, 'entire upper floors must still cast shadows')
        assert.equal(isClipped(world, wall), false, 'window and wall geometry must be complete for shadows')
        assert.ok(originalBuffers.every(([model, buffer]) => model.iMesh.instanceMatrix === buffer))
        assert.ok(standalone.material.clippingPlanes === authoredPlanes, 'authored clipping remains intact')
        assert.equal(standalone.material.clipShadows, true)
        assert.equal(statue.obj.visible, true)
        assert.equal(light.light.visible, true)
        assert.ok(this === shadowMap && scene === world.stage.scene && camera === world.camera)
        if (failure === 'shadow') throw new Error('shadow failed')
      },
    }
    const originalShadowRender = shadowMap.render
    graphics.renderer = {
      shadowMap,
      capabilities: { maxTextures: 32 },
      xr: { isPresenting: false },
      render(scene, camera) {
        assert.ok(isClipped(world, roof), 'main-view render list is built with the cut')
        this.shadowMap.render([], scene, camera)
        assert.ok(isClipped(world, roof), 'the main-view mask returns after shadows')
        assert.ok(isClipped(world, wall))
        assert.equal(standalone.material.clippingPlanes.length, authoredPlanes.length + 1)
        assert.equal(statue.obj.visible, false)
        assert.equal(light.light.visible, false)
        if (failure === 'main') throw new Error('main failed')
      },
    }
    if (failure) assert.throws(() => graphics.render(), new RegExp(`${failure} failed`))
    else {
      graphics.render()
      world.time = 0.11
      graphics.render()
    }
    assert.equal(shadowDraws, failure ? 1 : 2)
    assert.ok(shadowMap.render === originalShadowRender, 'the native shadow render function is restored')
    assert.equal(isClipped(world, roof), false)
    assert.equal(isClipped(world, wall), false)
    assert.ok(standalone.material.clippingPlanes === authoredPlanes)
    assert.equal(statue.obj.visible, true)
    assert.equal(light.light.visible, true)
    assert.equal(graphics.cameraOcclusion.restores.length, 0)
  })
}

for (const style of ['pixel-isometric', 'pixel-retro']) {
  test(`${style} rendering restores geometry even if the main draw throws`, () => {
    const { world, add } = fixture()
    const roof = add([0, 3, 0], [6, 0.2, 6])
    const graphics = new ClientGraphics(world)
    graphics.renderStyle = style
    graphics.usePostprocessing = false
    graphics.renderer = {
      shadowMap: { enabled: false },
      xr: { isPresenting: false },
      render() {
        assert.ok(isClipped(world, roof))
        throw new Error('draw failed')
      },
    }
    assert.throws(() => graphics.render(), /draw failed/)
    assert.equal(isClipped(world, roof), false)
    assert.equal(graphics.cameraOcclusion.restores.length, 0)
  })
}

for (const failPortal of [false, true]) {
  test(`native same-world portal suspends the mask and restores the main draw${failPortal ? ' after failure' : ''}`, () => {
    const { world, add } = fixture()
    const roof = add([0, 3, 0], [6, 0.2, 6])
    const graphics = new ClientGraphics(world)
    world.graphics = graphics
    graphics.renderStyle = 'pixel-isometric'
    graphics.usePostprocessing = false
    const view = {
      camera: world.camera.clone(),
      textureMatrix: new THREE.Matrix4(),
      target: new THREE.WebGLRenderTarget(1, 1),
      lastRender: -Infinity,
    }
    const source = {
      ctx: { entity: { data: {} } },
      target: 'exit',
      matrixWorld: new THREE.Matrix4(),
      resolution: 256,
      updateRate: 0,
      mesh: { visible: true, material: { uniforms: { linked: {}, preview: {}, textureMatrix: {} } } },
      getView: () => view,
    }
    const destination = {
      ctx: { entity: { data: {} } },
      portalId: 'exit',
      matrixWorld: new THREE.Matrix4().makeTranslation(10, 0, 0),
      mesh: { visible: true },
    }
    graphics.portals.add(source)
    graphics.portals.add(destination)
    let target = null
    let portalDraws = 0
    graphics.renderer = {
      xr: { enabled: true, isPresenting: false },
      shadowMap: { enabled: false, autoUpdate: true },
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
      render() {
        if (target === view.target) {
          portalDraws++
          assert.equal(isClipped(world, roof), false)
          if (failPortal) throw new Error('portal draw failed')
        } else {
          assert.ok(isClipped(world, roof))
          if (failPortal) assert.throws(() => graphics.renderPortal(source, world.camera), /portal draw failed/)
          else graphics.renderPortal(source, world.camera)
          assert.ok(isClipped(world, roof))
        }
      },
    }
    graphics.render()
    assert.equal(portalDraws, 1)
    assert.equal(isClipped(world, roof), false)
    assert.equal(target, null)
    assert.equal(graphics.renderingPortal, false)
    assert.equal(source.mesh.visible, true)
    assert.equal(destination.mesh.visible, true)
    view.target.dispose()
  })
}

test('GLB group and mesh extras survive cloning and can be controlled from scripts', () => {
  const source = new THREE.Group()
  const group = new THREE.Group()
  group.name = 'Roof'
  group.userData.cameraOcclusion = true
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  mesh.name = 'RoofTrim'
  mesh.userData.cameraOcclusion = false
  group.add(mesh)
  source.add(group)
  const root = glbToNodes({ scene: source, animations: [] }, { network: { isServer: false } })
  const copy = root.clone(true)
  assert.equal(copy.get('Roof').cameraOcclusion, true)
  assert.equal(copy.get('RoofTrim').cameraOcclusion, false)
  const proxy = copy.get('Roof').getProxy()
  proxy.cameraOcclusion = null
  assert.equal(copy.get('Roof').cameraOcclusion, null)
  assert.throws(() => {
    proxy.cameraOcclusion = 'yes'
  }, /boolean or null/)
})

test('camera clipping leaves native primitive physics mounted', async () => {
  const { world, root, occlusion } = fixture()
  let mounts = 0
  let unmounts = 0
  class PhysicsPrim extends Prim {
    mountPhysics() {
      mounts++
    }
    unmountPhysics() {
      unmounts++
    }
  }
  const roof = new PhysicsPrim({
    type: 'box',
    scale: [6, 0.2, 6],
    position: [0, 3, 0],
    physics: 'static',
  })
  root.add(roof)
  world.stage.update()
  assert.equal(mounts, 1)
  const before = unmounts
  occlusion.update()
  occlusion.apply()
  assert.ok(isClipped(world, roof))
  assert.equal(unmounts, before)
  occlusion.restore()
  assert.equal(mounts, 1)
})
