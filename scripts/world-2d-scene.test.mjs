import assert from 'node:assert/strict'
import test from 'node:test'
import fs from 'node:fs/promises'
import vm from 'node:vm'
import { Vector3, Euler, Quaternion } from 'three'
import { bundleRealPhysx, runRealPhysx } from '../test/security/lib/realPhysx.mjs'

const source = await fs.readFile(new URL('./world-2d-scene.js', import.meta.url), 'utf8')

function fixture(isServer = true) {
  const nodes = []
  const handlers = {}
  const teleports = []
  const fallen = { position: new Vector3(20, -10000, 20), teleport: (...args) => teleports.push(args) }
  const healthy = { position: new Vector3(0, 0, 0), teleport: () => assert.fail('healthy player teleported') }
  const spawn = { position: new Vector3(0.3, 0.6, 4.8), quaternion: new Quaternion() }
  const app = {
    create(kind, props) {
      const node = {
        kind,
        ...props,
        position: new Vector3(),
        children: [],
        add(child) {
          this.children.push(child)
        },
      }
      nodes.push(node)
      return node
    },
    add() {},
    on(event, fn) {
      handlers[event] = fn
    },
  }
  const world = { isServer, getPlayers: () => [healthy, fallen], getSpawn: () => spawn }
  vm.runInNewContext(source, { app, world, Vector3, Euler })
  return { nodes, handlers, teleports, fallen, spawn }
}

test('a player already far below the catch floor recovers; normal players stay in place', () => {
  const { handlers, teleports, fallen, spawn } = fixture()
  handlers.update(0.25)
  assert.deepEqual(teleports[0][0].toArray(), [0.3, 0.6, 4.8])
  assert.equal(teleports[0][1], 0)
  fallen.position.y = 0
  handlers.update(0.25)
  assert.equal(teleports.length, 1)
  spawn.position.set(1, 2, 3)
  spawn.quaternion.setFromAxisAngle(new Vector3(0, 1, 0), 0.5)
  fallen.position.y = -6
  handlers.update(0.25)
  assert.deepEqual(teleports[1][0].toArray(), [1, 2, 3])
  assert.ok(Math.abs(teleports[1][1] - 0.5) < 1e-10)
})

test('native player collision stops falls on the island and on the catch floor', async () => {
  const { nodes, handlers } = fixture(false)
  assert.equal(handlers.update, undefined)
  const bodies = nodes
    .filter(node => node.kind === 'rigidbody')
    .map(node => ({
      position: node.position.toArray(),
      colliders: node.children.map(({ type, width, height, depth }) => ({ type, width, height, depth })),
    }))
  const bundle = await bundleRealPhysx()
  try {
    await runRealPhysx(
      bundle,
      async ({ B, root, body, step }, bodies) => {
        for (const data of bodies) {
          const floor = new B.RigidBody({ type: 'static', position: data.position })
          for (const collider of data.colliders) floor.add(new B.Collider(collider))
          root.add(floor)
        }
        const player = body('Controller', { position: [0, 3, 0], layer: 'player' })
        const outside = body('Controller', { position: [30, -3, 0], layer: 'player' })
        for (let i = 0; i < 120; i++) {
          player.move(new B.THREE.Vector3(0, -0.1, 0))
          outside.move(new B.THREE.Vector3(0, -0.1, 0))
          step()
        }
        assert.ok(player.position.y > -0.2 && player.position.y < 0, 'island floor stops the native controller')
        assert.ok(outside.position.y > -5.6 && outside.position.y < -5, 'catch floor stops a fall outside the island')
      },
      bodies
    )
  } finally {
    bundle.destroy()
  }
})
