import assert from 'node:assert/strict'
import { createNodeClientWorld } from '../../../build/world-node-client.js'

const worlds = [createNodeClientWorld(), createNodeClientWorld()]
const tokens = [[], []]
const ready = worlds.map(world => new Promise(resolve => world.once('ready', resolve)))
let timer

try {
  await Promise.all(
    worlds.map((world, index) =>
      world.init({
        wsUrl: process.argv[2],
        name: `Headless-check-${index}`,
        onAuthToken: token => tokens[index].push(token),
      })
    )
  )
  await Promise.race([
    Promise.all(ready),
    new Promise((resolve, reject) => {
      timer = setTimeout(() => reject(new Error('headless clients did not become ready')), 10000)
    }),
  ])
  assert.ok(worlds[0].network.id !== worlds[1].network.id, 'clients own separate identities')
  assert.equal(tokens[0].length, 1)
  assert.equal(tokens[1].length, 1)
  assert.ok(tokens[0][0] !== tokens[1][0], 'clients receive separate session credentials')
  assert.ok(worlds.every(world => !world.fatalError))
  console.log('HEADLESS_READY_TWO_SEPARATE_SESSIONS')
} finally {
  clearTimeout(timer)
  for (const world of worlds) world.destroy()
}
