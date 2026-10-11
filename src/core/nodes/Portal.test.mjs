import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { build } from 'esbuild'
import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

const bundle = await build({
  stdin: {
    contents: `export { Portal } from './src/core/nodes/Portal.js';
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
const { Portal, ClientGraphics, glbToNodes, getPortalCameraDistance } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
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
  let query = null
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
        getQueryParam: () => query,
        setQueryParam(_entity, _key, value) {
          query = value
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
    setQuery(value) {
      query = value
    },
    getQuery: () => query,
  }
}

function mounted(data = {}, ctx = context()) {
  const portal = new Portal({ position: [0, 1.2, 0], ...data })
  portal.activate(ctx)
  return { portal, ...ctx }
}

test('portal defaults to one side, supports proxy edits, copying, and cleans up native updates', () => {
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

for (const doubleside of [false, true]) {
  for (const remote of [false, true]) {
    test(`${doubleside ? 'two' : 'one'}-sided native ${remote ? 'remote' : 'same-world'} entry needs no script`, () => {
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
      assert.equal(count(), doubleside ? 1 : 0)
      if (!doubleside) {
        ctx.player.base.position.set(0, 0, -1)
        portal.update()
        ctx.player.base.position.set(0, 0, 1)
        portal.update() // Crossed from the back; must not travel.
        assert.equal(count(), 0)
        ctx.player.base.position.set(0, 0, 0.2)
        portal.update()
        assert.equal(count(), 1)
      }
      if (remote) assert.equal(ctx.opened[0], 'https://example.com/world?foo=1&portalId=exit#view')
      else {
        assert.ok(ctx.teleports[0].position.z >= 1)
        destination.update()
        assert.equal(count(), 1)
      }
      portal.deactivate()
      destination.deactivate()
    })
  }
}

test('native entry follows nested, rotated, scaled transforms and catches fast front crossings', () => {
  const { portal, player, opened } = mounted({
    url: 'https://example.com',
    position: [4, 1.2, 6],
    rotation: [0, Math.PI / 3, 0],
    scale: [2, 1, 0.5],
  })
  player.base.position.set(0, -1.2, 2).applyMatrix4(portal.matrixWorld)
  portal.update()
  player.base.position.set(0, -1.2, -2).applyMatrix4(portal.matrixWorld)
  portal.update()
  assert.equal(opened.length, 1)
  portal.deactivate()
})

test('remote arrival waits for player readiness, consumes query, and clears the exit', () => {
  const { portal, player, setQuery, getQuery, teleports } = mounted({ portalId: 'exit', position: [4, 1.2, 6] })
  setQuery('exit')
  player.controller.controller = null
  portal.update()
  assert.equal(teleports.length, 0)
  player.controller.controller = {}
  portal.update()
  assert.equal(teleports.length, 1)
  assert.deepEqual(teleports[0].position.toArray(), [4, 0, 7])
  assert.equal(getQuery(), null)
  portal.update()
  assert.equal(teleports.length, 1)
  portal.deactivate()
})

test('moving portals do not travel and server portals do not register client updates', () => {
  const state = context()
  const portal = new Portal({ url: 'https://example.com', position: [0, 1.2, 0] })
  portal.activate({ ...state, moving: true })
  portal.update()
  assert.equal(state.opened.length, 0)
  portal.deactivate()
  const server = new Portal()
  server.activate({ world: {} })
  server.deactivate()
})

test('one-sided camera clearance stops only front approaches', () => {
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
  assert.equal(ctx.opened.length, 1)
  root.deactivate()
  assert.equal(ctx.hot.size, 0)
})

for (const remote of [false, true]) {
  test(`inactive side never triggers ${remote ? 'remote' : 'same-world'} travel during slow or fast crossings`, () => {
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
      }
      portal.travel(ctx.player, new THREE.Vector3(0, -1.2, -0.1), new THREE.Matrix4())
      assert.equal(ctx.opened.length, 0)
      assert.equal(ctx.teleports.length, 0)
      portal.deactivate()
      destination.deactivate()
    }
  })
}

test('moving a linked portal does not turn the old/new local positions into a player crossing', () => {
  const ctx = context()
  const destination = new Portal({ portalId: 'exit', position: [50, 1.2, 0] })
  destination.activate(ctx)
  const { portal } = mounted({ portalId: 'entry', target: 'exit' }, ctx)
  ctx.player.base.position.set(10, 0, 10)
  portal.update()
  portal.position.set(20, 1.2, 20)
  portal.clean() // Builder transforms are committed through Node.clean / Stage.clean.
  assert.ok(portal.matrixWorld.elements[12] === 20 && portal.matrixWorld.elements[14] === 20)
  portal.update()
  assert.equal(ctx.teleports.length, 0, 'moving the portal must not teleport a stationary player')

  ctx.player.base.position.set(20, 0, 21)
  portal.update()
  ctx.player.base.position.set(20, 0, 20.2)
  portal.update()
  assert.equal(ctx.teleports.length, 1)
  assert.ok(ctx.teleports[0].position.distanceTo(new THREE.Vector3(50, 0, 1)) < 0.000001)
  portal.deactivate()
  destination.deactivate()
})

test('portal travel follows current app move state and resumes after placement without rebuilding', () => {
  const ctx = context()
  const entity = { data: { id: 'entry', mover: 'builder' } }
  const portal = new Portal({ position: [0, 1.2, 0], url: 'https://example.com' })
  portal.activate({ world: ctx.world, entity, moving: true })
  ctx.player.base.position.set(0, 0, 0.2)
  portal.update()
  assert.equal(ctx.opened.length, 0)
  entity.data.mover = null // App.modify ends a move without rebuilding the node.
  portal.update()
  assert.equal(ctx.opened.length, 0, 'placement over the player must not trigger travel')
  ctx.player.base.position.set(0, 0, 1)
  portal.update()
  ctx.player.base.position.set(0, 0, 0.2)
  portal.update()
  assert.equal(ctx.opened.length, 1, 'a portal created in build mode must work after placement')
  portal.deactivate()

  const active = new Portal({ position: [0, 1.2, 0], url: 'https://example.com' })
  active.activate({ world: ctx.world, entity, moving: false })
  entity.data.mover = 'builder'
  active.update()
  assert.equal(ctx.opened.length, 1, 'picking up an active portal must disable travel')
  active.deactivate()
})

test('travel follows a moved, rotated and scaled destination under an app root', () => {
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
  assert.equal(ctx.teleports.length, 1)
  assert.ok(ctx.teleports[0].position.distanceTo(new THREE.Vector3(30.6, 0, 40)) < 0.000001)
  assert.equal(destination.portalId, 'exit')
  portal.deactivate()
  root.deactivate()
})

test('a fast diagonal crossing arrives at the aperture offset, not the previous distant sample', () => {
  const ctx = context()
  const destination = new Portal({ portalId: 'exit', position: [50, 1.2, 0] })
  destination.activate(ctx)
  const { portal } = mounted({ portalId: 'entry', target: 'exit' }, ctx)
  ctx.player.base.position.set(10, 0, 10)
  portal.update()
  ctx.player.base.position.set(-10, 0, -10)
  portal.update()
  assert.equal(ctx.teleports.length, 1)
  assert.ok(ctx.teleports[0].position.distanceTo(new THREE.Vector3(50, 0, 1)) < 0.000001)
  portal.deactivate()
  destination.deactivate()
})

test('one-sided portals skip preview work behind the aperture, including transformed portals', () => {
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
