import assert from 'node:assert/strict'
import test, { mock } from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const bundle = await build({
  stdin: {
    contents: `export { Portal } from './src/core/nodes/Portal.js';
      export { App } from './src/core/entities/App.js';
      export { ClientGraphics } from './src/core/systems/ClientGraphics.js';
      export { glbToNodes } from './src/core/extras/glbToNodes.js';
      export { getPortalCameraDistance } from './src/core/extras/portalCamera.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { App, Portal, ClientGraphics, glbToNodes, getPortalCameraDistance } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

mock.method(
  globalThis,
  'fetch',
  async () =>
    new Response(JSON.stringify({ available: true }), {
      headers: { 'content-type': 'application/json' },
    })
)

function context() {
  const hot = new Set()
  const portals = new Set()
  const teleports = []
  const opened = []
  const player = {
    controller: { controller: {} },
    base: { position: new THREE.Vector3() },
    teleport(data) {
      teleports.push(data)
      this.base.position.copy(data.position)
    },
  }
  const query = new Map()
  const world = {
    entities: { player },
    camera: new THREE.PerspectiveCamera(),
    graphics: { portals },
    stage: { scene: new THREE.Scene(), dirtyNodes: new Set(), octree: { insert() {}, move() {}, remove() {} } },
    setHot(node, value) {
      if (value) hot.add(node)
      else hot.delete(node)
    },
    emit() {},
    apps: {
      worldMethods: {
        getQueryParam: (_entity, key) => query.get(key) ?? null,
        setQueryParam(_entity, key, value) {
          query.set(key, value)
        },
        open(_entity, url) {
          opened.push(url)
        },
      },
    },
  }
  return {
    world,
    hot,
    player,
    teleports,
    opened,
    setQuery(value, key = 'portalId') {
      query.set(key, value)
    },
    getQuery: (key = 'portalId') => query.get(key) ?? null,
  }
}

function mounted(data = {}, ctx = context()) {
  const portal = new Portal({ position: [0, 1.2, 0], ...data })
  portal.activate(ctx)
  return { portal, ...ctx }
}

test('portal defaults to one side, supports proxy edits, copying, and cleans up native updates', async () => {
  const { portal, world, hot } = mounted()
  assert.equal(portal.doubleside, false)
  assert.equal(portal.mesh.material.side, THREE.DoubleSide)
  assert.equal(portal.mesh.material.uniforms.doubleside.value, false)
  assert.equal(portal.mesh.material.uniforms.inactive.value.getHexString(), 'd3d3d3')
  assert.ok(hot.has(portal))
  portal.getProxy().doubleside = true
  assert.equal(portal.mesh.material.side, THREE.DoubleSide)
  assert.equal(portal.mesh.material.uniforms.doubleside.value, true)
  portal.getProxy().doubleside = false
  assert.equal(portal.mesh.material.uniforms.doubleside.value, false)
  portal.getProxy().doubleside = true
  portal.getProxy().url = 'https://example.com/world'
  assert.equal(new Portal().copy(portal).url, portal.url)
  assert.equal(new Portal().copy(portal).doubleside, true)
  assert.throws(() => {
    portal.url = 'javascript:alert(1)'
  }, /HTTP/)
  assert.throws(() => {
    portal.doubleside = 'true'
  }, /boolean/)
  portal.deactivate()
  assert.equal(world.stage.scene.children.length, 0)
  assert.equal(world.graphics.portals.size, 0)
  assert.equal(hot.size, 0)
})

test('arrival screenshot uses the endpoint camera, flips pixels and restores renderer state after capture and failure', async t => {
  const ctx = context()
  const { portal } = mounted({ position: [10, 1.2, 20] }, ctx)
  const previousTarget = {}
  const viewport = new THREE.Vector4(1, 2, 3, 4)
  let target = previousTarget
  let disposed = false
  let image
  const renderer = {
    xr: { enabled: true },
    toneMapping: 123,
    autoClear: false,
    getRenderTarget: () => target,
    getActiveCubeFace: () => 2,
    getActiveMipmapLevel: () => 3,
    getCurrentViewport: out => out.copy(viewport),
    setRenderTarget(value) {
      target = value
      if (value?.isWebGLRenderTarget)
        value.addEventListener('dispose', () => {
          disposed = true
        })
    },
    state: {
      viewport(value) {
        assert.deepEqual(value.toArray(), viewport.toArray())
      },
    },
    clear() {},
    render(_scene, camera) {
      assert.deepEqual(camera.position.toArray(), [10, 1.2, 21])
      assert.ok(Math.abs(camera.rotation.y) === Math.PI)
      assert.equal(renderer.xr.enabled, false)
    },
    readRenderTargetPixels(_target, _x, _y, width, height, pixels) {
      pixels.fill(42, 0, width * 4)
      pixels.fill(99, (height - 1) * width * 4)
    },
  }
  globalThis.document = {
    createElement() {
      return {
        getContext() {
          return {
            createImageData(width, height) {
              return { data: new Uint8ClampedArray(width * height * 4) }
            },
            putImageData(value) {
              image = value
            },
          }
        },
        toBlob(callback) {
          callback(new Blob(['jpg'], { type: 'image/jpeg' }))
        },
      }
    },
  }
  t.after(() => {
    delete globalThis.document
  })
  const graphics = { world: ctx.world, renderer, renderingPortal: false }
  const blob = await ClientGraphics.prototype.capturePortalArrival.call(graphics, portal)
  assert.equal(blob.type, 'image/jpeg')
  assert.equal(image.data[0], 99)
  assert.equal(image.data.at(-1), 42)
  assert.equal(target, previousTarget)
  assert.equal(renderer.xr.enabled, true)
  assert.equal(renderer.toneMapping, 123)
  assert.equal(renderer.autoClear, false)
  assert.equal(graphics.renderingPortal, false)
  assert.equal(disposed, true)
  renderer.render = () => {
    throw new Error('capture failed')
  }
  await assert.rejects(ClientGraphics.prototype.capturePortalArrival.call(graphics, portal), /capture failed/)
  assert.equal(target, previousTarget)
  assert.equal(renderer.xr.enabled, true)
  portal.deactivate()
})

test('refresh arrival preview uploads before saving through existing blueprint modification', async () => {
  const ctx = context()
  const blueprint = { id: 'portal-app', version: 1, props: { destinationPortalId: 'other' } }
  ctx.entity = { data: { id: 'exit' }, blueprint }
  ctx.player.isBuilder = () => true
  const { portal } = mounted({ appConfig: true }, ctx)
  const events = []
  ctx.world.graphics.capturePortalArrival = async () => new Blob(['saved preview'], { type: 'image/jpeg' })
  ctx.world.network = {
    async upload() {
      events.push('upload')
    },
    send(name, change) {
      events.push(name)
      assert.equal(change.props.arrivalImage_exit.type, 'image')
    },
  }
  ctx.world.loader = { insert() {} }
  ctx.world.blueprints = {
    get: () => blueprint,
    modify(change) {
      events.push('modify')
      assert.equal(change.version, 2)
      assert.equal(change.props.destinationPortalId, 'other')
      assert.match(change.props.arrivalImage_exit.url, /^asset:\/\/[a-f0-9]{64}\.jpg$/)
    },
  }
  const button = ctx.entity.fields.find(field => field.key === 'refreshArrivalPreview')
  await button.onClick()
  assert.deepEqual(events, ['upload', 'modify', 'blueprintModified'])
  portal.deactivate()
})

for (const doubleside of [false, true]) {
  for (const remote of [false, true]) {
    test(`${doubleside ? 'two' : 'one'}-sided native ${remote ? 'remote' : 'same-world'} entry needs no script`, async () => {
      const ctx = context()
      const destination = new Portal({ portalId: 'exit', position: [10, 1.2, 0] })
      destination.activate(ctx)
      const { portal } = mounted(
        {
          portalId: 'entry',
          target: 'exit',
          doubleside,
          url: remote ? 'https://example.com/world?foo=1&portalId=old#view' : '',
        },
        ctx
      )
      const count = () => ctx.opened.length + ctx.teleports.length
      ctx.player.base.position.set(0, 0, -0.2)
      portal.update()
      await portal.pendingTravel
      assert.equal(count(), doubleside ? 1 : 0)
      if (!doubleside) {
        ctx.player.base.position.set(0, 0, -1)
        portal.update()
        await portal.pendingTravel
        ctx.player.base.position.set(0, 0, 1)
        portal.update()
        await portal.pendingTravel // Crossed from the back; must not travel.
        assert.equal(count(), 0)
        ctx.player.base.position.set(0, 0, 0.2)
        portal.update()
        await portal.pendingTravel
        assert.equal(count(), 1)
      }
      if (remote) {
        const url = new URL(ctx.opened[0])
        assert.equal(url.searchParams.get('portalId'), 'exit')
        assert.equal(url.searchParams.get('foo'), '1')
        assert.equal(url.hash, '#view')
        assert.equal(JSON.parse(url.searchParams.get('portalPose')).length, 6)
      } else {
        assert.ok(ctx.teleports[0].position.z >= 1)
        destination.update()
        assert.equal(count(), 1)
      }
      portal.deactivate()
      destination.deactivate()
    })
  }
}

test('native entry follows nested, rotated, scaled transforms and catches fast front crossings', async () => {
  const { portal, player, opened } = mounted({
    url: 'https://example.com',
    position: [4, 1.2, 6],
    rotation: [0, Math.PI / 3, 0],
    scale: [2, 1, 0.5],
  })
  player.base.position.set(0, -1.2, 2).applyMatrix4(portal.matrixWorld)
  portal.update()
  await portal.pendingTravel
  player.base.position.set(0, -1.2, -2).applyMatrix4(portal.matrixWorld)
  portal.update()
  await portal.pendingTravel
  assert.equal(opened.length, 1)
  portal.deactivate()
})

test('remote arrival does not sweep the spawn-to-destination jump through another portal', () => {
  const ctx = context()
  const entrance = mounted(
    {
      portalId: 'uPOFtrqbln',
      target: 'PBETNgBqKt',
      position: [1.3370979987264022, 1.2022886152394405, 0.5277763532587141],
      quaternion: [0, -0.7071067811865475, 0, 0.7071067811865476],
    },
    ctx
  ).portal
  const wrongExit = mounted({ portalId: 'PBETNgBqKt', position: [32.88, 1.32, 17.31] }, ctx).portal
  const arrival = mounted(
    {
      portalId: 'OL3wuJiVCk',
      position: [35.248015737151604, 1.320967176636911, 8.598231050782724],
      quaternion: [0, -0.766044443118978, 0, 0.6427876096865394],
    },
    ctx
  ).portal
  ctx.setQuery('OL3wuJiVCk')
  entrance.update()
  wrongExit.update()
  arrival.update()
  entrance.update()
  wrongExit.update()
  arrival.update()
  assert.equal(ctx.teleports.length, 1)
  assert.equal(ctx.getQuery(), null)
  for (const portal of [entrance, wrongExit, arrival]) portal.deactivate()
})

test('remote arrival waits for player readiness, consumes query, and clears the exit', async () => {
  const { portal, player, setQuery, getQuery, teleports } = mounted({ portalId: 'exit', position: [4, 1.2, 6] })
  setQuery('exit')
  player.controller.controller = null
  portal.update()
  await portal.pendingTravel
  assert.equal(teleports.length, 0)
  player.controller.controller = {}
  portal.update()
  await portal.pendingTravel
  assert.equal(teleports.length, 1)
  assert.deepEqual(teleports[0].position.toArray(), [4, 0, 7])
  assert.equal(getQuery(), null)
  portal.update()
  await portal.pendingTravel
  assert.equal(teleports.length, 1)
  portal.deactivate()
})

for (const pose of ['broken', '[1,2,3]', '[0,0,1,0,0,0]', '[0,0,1,0,0,"bad"]']) {
  test(`invalid remote pose ${pose} falls back to the legacy arrival`, () => {
    const state = mounted({ portalId: 'exit', position: [4, 1.2, 6] })
    state.setQuery('exit')
    state.setQuery(pose, 'portalPose')
    state.portal.update()
    assert.deepEqual(state.teleports[0].position.toArray(), [4, 0, 7])
    assert.equal(state.getQuery('portalPose'), null)
    state.portal.deactivate()
  })
}

test('moving portals do not travel and server portals do not register client updates', async () => {
  const state = context()
  const portal = new Portal({ url: 'https://example.com', position: [0, 1.2, 0] })
  portal.activate({ ...state, moving: true })
  portal.update()
  await portal.pendingTravel
  assert.equal(state.opened.length, 0)
  portal.deactivate()
  const server = new Portal()
  server.activate({ world: {} })
  server.deactivate()
})

test('one-sided camera clearance stops only front approaches', async () => {
  const portal = new Portal({ width: 2, height: 3 })
  const front = new THREE.Vector3(0, 0, 1)
  const back = new THREE.Vector3(0, 0, -1)
  assert.equal(getPortalCameraDistance([portal], front, back, 4, 0.2), 0.8)
  assert.equal(getPortalCameraDistance([portal], back, front, 4, 0.2), 4)
  portal.doubleside = true
  assert.equal(getPortalCameraDistance([portal], back, front, 4, 0.2), 0.8)
})

test('catalog package loads and configures a native portal with no JavaScript asset', async () => {
  const bytes = readFileSync(new URL('../../../src/world/collections/default/WorldPortal.hyp', import.meta.url))
  const length = bytes.readUInt32LE(0)
  const header = JSON.parse(bytes.subarray(4, 4 + length))
  assert.equal(header.blueprint.script, null)
  assert.equal(header.assets.length, 1)
  const model = bytes.subarray(4 + length)
  assert.equal(model.length, header.assets[0].size)
  assert.equal(header.blueprint.model, `asset://${createHash('sha256').update(model).digest('hex')}.glb`)
  const glb = await new GLTFLoader().parseAsync(
    model.buffer.slice(model.byteOffset, model.byteOffset + model.byteLength),
    ''
  )
  const ctx = context()
  const entity = {
    data: { id: 'instance' },
    blueprint: {
      ...header.blueprint,
      props: {
        ...header.blueprint.props,
        destination: 'https://example.com',
        destinationPortalId: 'remote',
      },
    },
  }
  const root = glbToNodes(glb, ctx.world)
  root.activate({ world: ctx.world, entity })
  const portal = [...ctx.world.graphics.portals][0]
  assert.equal(portal.portalId, 'instance')
  assert.equal(portal.url, 'https://example.com')
  assert.equal(portal.target, 'remote')
  assert.equal(portal.doubleside, false)
  assert.ok(entity.fields.some(field => field.key === 'destination'))
  assert.ok(entity.fields.some(field => field.key === 'destinationPortalId'))
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.opened.length, 1)
  root.deactivate()
  assert.equal(ctx.hot.size, 0)
})

for (const remote of [false, true]) {
  test(`inactive side never triggers ${remote ? 'remote' : 'same-world'} travel during slow or fast crossings`, async () => {
    for (const steps of [
      [-1, -0.2, -0.01, 0.01, 0.2, 1],
      [-2, 2],
    ]) {
      const ctx = context()
      const destination = new Portal({ portalId: 'exit', position: [10, 1.2, 0] })
      destination.activate(ctx)
      const { portal } = mounted(
        { target: 'exit', url: remote ? 'https://example.com' : '', rotation: [0, Math.PI / 3, 0], scale: [2, 1, 0.5] },
        ctx
      )
      for (const z of steps) {
        ctx.player.base.position.set(0, -1.2, z).applyMatrix4(portal.matrixWorld)
        portal.update()
        await portal.pendingTravel
      }
      portal.travel(ctx.player, new THREE.Vector3(0, -1.2, -0.1), new THREE.Matrix4())
      assert.equal(ctx.opened.length, 0)
      assert.equal(ctx.teleports.length, 0)
      portal.deactivate()
      destination.deactivate()
    }
  })
}

test('moving a linked portal does not turn the old/new local positions into a player crossing', async () => {
  const ctx = context()
  const destination = new Portal({ portalId: 'exit', position: [50, 1.2, 0] })
  destination.activate(ctx)
  const { portal } = mounted({ portalId: 'entry', target: 'exit' }, ctx)
  ctx.player.base.position.set(10, 0, 10)
  portal.update()
  await portal.pendingTravel
  portal.position.set(20, 1.2, 20)
  portal.clean() // Builder transforms are committed through Node.clean / Stage.clean.
  assert.ok(portal.matrixWorld.elements[12] === 20 && portal.matrixWorld.elements[14] === 20)
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.teleports.length, 0, 'moving the portal must not teleport a stationary player')

  ctx.player.base.position.set(20, 0, 21)
  portal.update()
  await portal.pendingTravel
  ctx.player.base.position.set(20, 0, 20.2)
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.teleports.length, 1)
  assert.ok(ctx.teleports[0].position.distanceTo(new THREE.Vector3(50, 0, 1)) < 0.000001)
  portal.deactivate()
  destination.deactivate()
})

test('portal travel follows current app move state and resumes after placement without rebuilding', async () => {
  const ctx = context()
  const entity = { data: { id: 'entry', mover: 'builder' } }
  const portal = new Portal({ position: [0, 1.2, 0], url: 'https://example.com' })
  portal.activate({ world: ctx.world, entity, moving: true })
  ctx.player.base.position.set(0, 0, 0.2)
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.opened.length, 0)
  entity.data.mover = null // App.modify ends a move without rebuilding the node.
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.opened.length, 0, 'placement over the player must not trigger travel')
  ctx.player.base.position.set(0, 0, 1)
  portal.update()
  await portal.pendingTravel
  ctx.player.base.position.set(0, 0, 0.2)
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.opened.length, 1, 'a portal created in build mode must work after placement')
  portal.deactivate()

  const active = new Portal({ position: [0, 1.2, 0], url: 'https://example.com' })
  active.activate({ world: ctx.world, entity, moving: false })
  entity.data.mover = 'builder'
  active.update()
  assert.equal(ctx.opened.length, 1, 'picking up an active portal must disable travel')
  active.deactivate()
})

test('travel follows a moved, rotated and scaled destination under an app root', async () => {
  const ctx = context()
  const root = glbToNodes({ scene: new THREE.Scene(), animations: [] }, ctx.world)
  const destination = new Portal({ portalId: 'exit', position: [0, 1.2, 0] })
  root.add(destination)
  root.activate(ctx)
  const { portal } = mounted({ portalId: 'entry', target: 'exit' }, ctx)
  root.position.set(30, 0, 40)
  root.rotation.y = Math.PI / 2
  root.scale.set(2, 1, 0.5)
  root.clean()
  ctx.player.base.position.set(0, 0, 0.2)
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.teleports.length, 1)
  assert.ok(ctx.teleports[0].position.distanceTo(new THREE.Vector3(30.6, 0, 40)) < 0.000001)
  assert.equal(destination.portalId, 'exit')
  portal.deactivate()
  root.deactivate()
})

test('a fast diagonal crossing arrives at the aperture offset, not the previous distant sample', async () => {
  const ctx = context()
  const destination = new Portal({ portalId: 'exit', position: [50, 1.2, 0] })
  destination.activate(ctx)
  const { portal } = mounted({ portalId: 'entry', target: 'exit' }, ctx)
  ctx.player.base.position.set(10, 0, 10)
  portal.update()
  await portal.pendingTravel
  ctx.player.base.position.set(-10, 0, -10)
  portal.update()
  await portal.pendingTravel
  assert.equal(ctx.teleports.length, 1)
  assert.ok(ctx.teleports[0].position.distanceTo(new THREE.Vector3(50, 0, 1)) < 0.000001)
  portal.deactivate()
  destination.deactivate()
})

test('one-sided portals skip preview work behind the aperture, including transformed portals', async () => {
  const graphics = new ClientGraphics({ stage: { scene: new THREE.Scene() } })
  const transform = new THREE.Matrix4().compose(
    new THREE.Vector3(4, 1, 6),
    new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 3),
    new THREE.Vector3(2, 1, 0.5)
  )
  const portal = {
    matrixWorld: transform,
    doubleside: false,
    target: 'destination',
    mesh: { material: { uniforms: { linked: { value: false } } } },
    getView() {
      throw new Error('preview requested')
    },
  }
  graphics.portals.add(portal)
  graphics.portals.add({ portalId: 'destination' })
  const eye = new THREE.PerspectiveCamera()
  eye.position.set(0, 0, -1).applyMatrix4(transform)
  eye.updateMatrixWorld()
  assert.doesNotThrow(() => graphics.renderPortal(portal, eye))
  portal.doubleside = true
  assert.throws(() => graphics.renderPortal(portal, eye), /preview requested/)
  portal.doubleside = false
  eye.position.set(0, 0, 1).applyMatrix4(transform)
  eye.updateMatrixWorld()
  assert.throws(() => graphics.renderPortal(portal, eye), /preview requested/)
})

for (const destinationDoubleSide of [false, true]) {
  for (const entrySide of [-1, 1]) {
    test(`entry from side ${entrySide} honors direction and ${destinationDoubleSide ? 'two' : 'one'}-sided destination arrival`, async () => {
      const ctx = context()
      const sourceRotation = Math.PI / 3
      const destinationRotation = -Math.PI / 4
      const destination = new Portal({
        portalId: 'exit',
        doubleside: destinationDoubleSide,
        position: [30, 1.2, 40],
        rotation: [0, destinationRotation, 0],
      })
      destination.activate(ctx)
      const { portal } = mounted(
        {
          portalId: 'entry',
          target: 'exit',
          doubleside: true,
          rotation: [0, sourceRotation, 0],
        },
        ctx
      )
      const localDirection = new THREE.Vector3(0.3, 0, -entrySide).normalize()
      const worldDirection = localDirection.clone().transformDirection(portal.matrixWorld)
      ctx.world.camera.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), worldDirection)
      ctx.player.base.position.set(0.1, -1.2, entrySide * 0.2).applyMatrix4(portal.matrixWorld)
      portal.update()
      await portal.pendingTravel
      assert.equal(ctx.teleports.length, 1)
      const arrival = ctx.teleports[0]
      const localArrival = arrival.position.clone().applyMatrix4(destination.matrixWorld.clone().invert())
      assert.equal(Math.sign(localArrival.z), destinationDoubleSide ? entrySide : 1)
      assert.ok(Math.abs(localArrival.x + 0.1) < 0.000001)
      const expected = new THREE.Vector3(
        -localDirection.x,
        localDirection.y,
        !destinationDoubleSide && entrySide < 0 ? localDirection.z : -localDirection.z
      ).transformDirection(destination.matrixWorld)
      const actual = new THREE.Vector3(0, 0, -1).applyAxisAngle(new THREE.Vector3(0, 1, 0), arrival.rotationY)
      assert.ok(actual.distanceTo(expected) < 0.000001, 'arrival direction must follow the destination sidedness')
      destination.update()
      assert.equal(ctx.teleports.length, 1, 'arrival must not immediately trigger return travel')
      portal.deactivate()
      destination.deactivate()
    })
  }
}

for (const doubleside of [false, true]) {
  for (const side of [-1, 1]) {
    test(`remote arrival preserves internal arrival pose for side ${side}, doubleside=${doubleside}`, async () => {
      const source = mounted({
        portalId: 'entry',
        target: 'exit',
        doubleside: true,
        url: 'https://example.com/?foo=1#view',
        rotation: [0, 0.7, 0],
      })
      const localDirection = new THREE.Vector3(0.4, 0, -side).normalize()
      const worldDirection = localDirection.clone().transformDirection(source.portal.matrixWorld)
      source.world.camera.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), worldDirection)
      const localPosition = new THREE.Vector3(0.2, -1.2, side * 0.2)
      source.player.base.position.copy(localPosition).applyMatrix4(source.portal.matrixWorld)
      source.portal.update()
      await source.portal.pendingTravel
      const url = new URL(source.opened[0])
      assert.equal(url.searchParams.get('foo'), '1')
      assert.equal(url.hash, '#view')
      const remote = mounted({ portalId: 'exit', doubleside, position: [10, 1.2, 20], rotation: [0, -0.8, 0] })
      remote.setQuery(url.searchParams.get('portalId'))
      remote.setQuery(url.searchParams.get('portalPose'), 'portalPose')
      remote.portal.update()
      const expected = mounted({ doubleside, position: [10, 1.2, 20], rotation: [0, -0.8, 0] })
      expected.portal.arrive(expected.player, localPosition, localDirection)
      assert.ok(remote.teleports[0].position.distanceTo(expected.teleports[0].position) < 1e-6)
      assert.ok(Math.abs(remote.teleports[0].rotationY - expected.teleports[0].rotationY) < 1e-6)
      assert.equal(remote.getQuery('portalPose'), null)
      remote.portal.update()
      assert.equal(remote.teleports.length, 1)
      for (const state of [source, remote, expected]) state.portal.deactivate()
    })
  }
}

test('missing local destinations show an aperture error which clears when the endpoint mounts', async () => {
  const { portal, world, teleports } = mounted({ target: 'missing' })
  portal.update()
  assert.equal(portal.statusMessage, 'Destination portal not found')
  assert.equal(portal.mesh.material.uniforms.showStatus.value, true)
  assert.equal(teleports.length, 0)
  const destination = new Portal({ portalId: 'missing' })
  destination.activate({ world })
  portal.update()
  assert.equal(portal.statusMessage, '')
  assert.equal(portal.mesh.material.uniforms.showStatus.value, false)
  portal.deactivate()
  destination.deactivate()
})

test('remote failures remain in the portal and block travel; a fresh check can recover', async () => {
  globalThis.fetch.mock.mockImplementation(async () => {
    throw new Error('offline')
  })
  const { portal, opened } = mounted({ url: 'https://example.com' })
  try {
    portal.update()
    await portal.pendingTravel
    assert.equal(portal.statusMessage, 'Remote world unreachable')
    assert.equal(portal.mesh.material.uniforms.showStatus.value, true)
    assert.equal(opened.length, 0)
    globalThis.fetch.mock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ available: true }), {
          headers: { 'content-type': 'application/json' },
        })
    )
    await portal.travel(new THREE.Vector3(), new THREE.Vector3(0, -1.2, 0.2), new THREE.Matrix4())
    assert.equal(opened.length, 1)
    assert.equal(portal.statusMessage, '')
  } finally {
    portal.deactivate()
    globalThis.fetch.mock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ available: true }), {
          headers: { 'content-type': 'application/json' },
        })
    )
  }
})

test('unmount cancels a pending remote check and never redirects from a stale result', async () => {
  let resolveRequest
  globalThis.fetch.mock.mockImplementation(
    () =>
      new Promise(resolve => {
        resolveRequest = resolve
      })
  )
  const { portal, opened } = mounted({ url: 'https://example.com' })
  try {
    portal.update()
    const pending = portal.pendingTravel
    const signal = portal.destinationController.signal
    portal.deactivate()
    assert.equal(signal.aborted, true)
    resolveRequest(
      new Response(JSON.stringify({ available: true }), {
        headers: { 'content-type': 'application/json' },
      })
    )
    await pending
    assert.equal(opened.length, 0)
  } finally {
    globalThis.fetch.mock.mockImplementation(
      async () =>
        new Response(JSON.stringify({ available: true }), {
          headers: { 'content-type': 'application/json' },
        })
    )
  }
})

test('shipped legacy portals use the configured URL for both status and native travel', async () => {
  for (const hash of [
    'f8204cf3972edd061cd130dce6db4c48669dd6a0ae0e445df4702f908a752c2d',
    '3b2352be97555f92bb06f60033cd57cd3987509f90a17c32331fb93f45124431',
  ]) {
    const ctx = context()
    const blueprint = {
      model: 'asset://2b332a8c564f68a0b5be0b283c1859979bfe8a0bd7fce465a8de8339e530fa41.glb',
      script: `asset://${hash}.js`,
      props: { destination: 'https://example.org/world', destinationPortalId: 'exit' },
    }
    ctx.world.blueprints = { get: () => blueprint }
    ctx.world.network = { id: 'client' }
    ctx.world.loader = {
      get() {
        throw new Error('Legacy model and script must not load')
      },
    }
    const entity = {
      world: ctx.world,
      data: { id: 'legacy', position: [8, 0, -10], quaternion: [0, 0, 0, 1], scale: [1, 1, 1] },
      n: 0,
      eventQueue: [],
      unbuild() {},
    }
    await App.prototype.build.call(entity)
    const portal = entity.root.children[0]
    assert.equal(entity.script, undefined)
    assert.equal(portal.name, 'portal')
    assert.equal(portal.url, blueprint.props.destination)
    assert.equal(portal.target, 'exit')
    assert.equal(portal.portalId, 'legacy')
    assert.deepEqual(entity.root.position.toArray(), [8, 0, -10])
    assert.equal(portal.doubleside, false)
    portal.refreshDestinationStatus()
    await portal.destinationCheck
    assert.equal(portal.statusMessage, '')
    await portal.travel(ctx.player, new THREE.Vector3(0, 0, 0.1), new THREE.Matrix4())
    assert.equal(ctx.opened.length, 1)
    const opened = new URL(ctx.opened[0])
    assert.equal(opened.origin + opened.pathname, 'https://example.org/world')
    assert.equal(opened.searchParams.get('portalId'), 'exit')
    assert.deepEqual(JSON.parse(opened.searchParams.get('portalPose')), [0, 0, 0.1, 0, 0, -1])
    globalThis.fetch.mock.mockImplementation(async () => {
      throw new Error('offline')
    })
    try {
      await portal.travel(ctx.player, new THREE.Vector3(0, 0, 0.1), new THREE.Matrix4())
      assert.equal(portal.statusMessage, 'Remote world unreachable')
      assert.equal(ctx.opened.length, 1)
    } finally {
      globalThis.fetch.mock.mockImplementation(
        async () =>
          new Response(JSON.stringify({ available: true }), {
            headers: { 'content-type': 'application/json' },
          })
      )
      entity.root.deactivate()
    }
    // A custom script using the same bootstrap model must still load and execute.
    const root = App.prototype.getNodes.call(entity)
    root.remove(root.children[0])
    blueprint.script = 'asset://custom.js'
    let ran = false
    const script = {
      exec() {
        ran = true
      },
    }
    ctx.world.loader = { get: type => (type === 'script' ? script : { toNodes: () => root }) }
    entity.getWorldProxy = () => ({})
    entity.getAppProxy = () => ({})
    await App.prototype.build.call(entity)
    assert.equal(entity.script, script)
    assert.equal(ran, true)
    entity.root.deactivate()
  }
})

test('continuous local crossing waits for the plane, preserves overshoot and immediately permits reversing through an unlinked exit', () => {
  const ctx = context()
  const destination = mounted({ portalId: 'exit', position: [10, 1.2, 0] }, ctx).portal
  const source = mounted({ portalId: 'entry', target: 'exit' }, ctx).portal
  const crossings = []
  ctx.player.crossPortal = transform => {
    crossings.push(transform)
    ctx.player.base.position.applyMatrix4(transform)
  }
  ctx.player.base.position.set(0.2, 0, 1)
  source.update()
  ctx.player.base.position.z = 0.1
  source.update()
  assert.equal(crossings.length, 0, 'touching the former 0.3m trigger must not travel')
  ctx.player.base.position.z = 0
  source.update()
  assert.equal(crossings.length, 0)
  ctx.player.base.position.z = -0.05
  source.update()
  assert.equal(crossings.length, 1)
  assert.ok(ctx.player.base.position.distanceTo(new THREE.Vector3(9.8, 0, 0.05)) < 1e-10)
  destination.update()
  assert.equal(crossings.length, 1)
  assert.equal(destination.statusMessage, '')
  ctx.player.base.position.z = -0.05
  destination.update()
  assert.equal(crossings.length, 2)
  assert.ok(ctx.player.base.position.distanceTo(new THREE.Vector3(0.2, 0, 0.05)) < 1e-10)
  assert.equal(ctx.teleports.length, 0)
  source.deactivate()
  destination.deactivate()
})

test('floor-to-ceiling traversal places the feet below the destination without pushing the head clear', () => {
  const ctx = context()
  const source = mounted(
    { portalId: 'entry', target: 'exit', position: [0, 3, 0], rotation: [-Math.PI / 2, 0, 0], width: 3, height: 3 },
    ctx
  ).portal
  const destination = mounted(
    { portalId: 'exit', position: [10, 3, 0], rotation: [Math.PI / 2, 0, 0], width: 3, height: 3 },
    ctx
  ).portal
  ctx.player.crossPortal = transform => ctx.player.base.position.applyMatrix4(transform)
  ctx.player.base.position.set(0, 3.5, 0)
  source.update()
  ctx.player.base.position.y = 2.2
  source.update()
  assert.ok(ctx.player.base.position.distanceTo(new THREE.Vector3(10, 2.2, 0)) < 1e-10)
  assert.ok(ctx.player.base.position.y + 1.6 > 3, 'head must remain beyond the exit plane')
  assert.equal(ctx.teleports.length, 0)
  source.deactivate()
  destination.deactivate()
})

test('sliding along the exact plane and leaving outside the aperture does not cross', () => {
  const ctx = context()
  const source = mounted({ portalId: 'entry', target: 'exit' }, ctx).portal
  const destination = mounted({ portalId: 'exit', position: [10, 1.2, 0] }, ctx).portal
  ctx.player.crossPortal = () => assert.fail('crossed outside the opening')
  ctx.player.base.position.set(0, 0, 0.2)
  source.update()
  ctx.player.base.position.set(0, 0, 0)
  source.update()
  ctx.player.base.position.set(3, 0, 0)
  source.update()
  ctx.player.base.position.set(3, 0, -0.2)
  source.update()
  source.deactivate()
  destination.deactivate()
})
