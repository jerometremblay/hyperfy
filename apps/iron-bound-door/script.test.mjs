import assert from 'node:assert/strict'
import test from 'node:test'
import { readFile } from 'node:fs/promises'
import { runInNewContext } from 'node:vm'

const code = await readFile(new URL('./script.js', import.meta.url), 'utf8')

test('click toggles the named pivot and broadcasts the state', () => {
  const handlers = {}, sent = [], rotations = []
  const actions = []
  const server = { state: {}, attachGeometry: () => ({ setPartRotation: (...args) => rotations.push(args) }), on: (name, fn) => { handlers[name] = fn }, send: (name, value) => sent.push([name, value]) }
  runInNewContext(code, { app: server, world: { isServer: true, isClient: false } })
  handlers.toggleDoor()
  assert.equal(server.state.open, true)
  assert.deepEqual(rotations.at(-1), ['door', 'y', -105 * Math.PI / 180])
  assert.equal(sent.at(-1)[0], 'doorChanged')
  handlers.toggleDoor()
  assert.equal(server.state.open, false)
  assert.equal(rotations.at(-1)[2], 0)
  const clientHandlers = {}, outgoing = []
  const client = { state: {}, attachGeometry: () => ({ setPartRotation() {} }), create: (_type, value) => { actions.push(value); return value }, add() {}, on: (name, fn) => { clientHandlers[name] = fn }, send: name => outgoing.push(name) }
  runInNewContext(code, { app: client, world: { isServer: false, isClient: true } })
  assert.equal(actions.length, 2)
  actions[0].onTrigger()
  assert.deepEqual(outgoing, ['toggleDoor'])
  clientHandlers.doorChanged({ open: true })
  assert.ok(actions.every(action => action.label === 'Close door' && action.position.z === 0.728))
})
