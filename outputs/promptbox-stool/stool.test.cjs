const { test } = require('node:test')
const assert = require('node:assert/strict')
const vm = require('node:vm')
const fs = require('node:fs')
const source = fs.readFileSync(__dirname + '/stool.js', 'utf8')
function setup(server) {
  const handlers = {}, worldHandlers = {}, nodes = [], sent = [], player = { id: 'p1', networkId: 'n1', teleport: () => {}, applyEffect(options) { this.options = options; return { cancel: () => options.onEnd() } } }
  const pos = () => ({ clone() { return { multiply() { return this }, applyQuaternion() { return this }, add() { return this } } } })
  const app = { state: {}, scale: {}, quaternion: {}, position: {}, create(type, props) { const n = { type, ...props, position: pos() }; nodes.push(n); return n }, add() {}, on(name, fn) { handlers[name] = fn }, send(name, value) { sent.push([name, value]) } }
  const world = { isServer: server, isClient: !server, getPlayer: () => player, getPlayers: () => [player, { id: 'p2', networkId: 'n2' }], on(name, fn) { worldHandlers[name] = fn }, off() {} }
  vm.runInNewContext(source, { app, world, Math })
  return { handlers, worldHandlers, nodes, sent, player, app }
}
test('server allows one occupant and releases on leave', () => {
 const x = setup(true); x.handlers['stool:claim']({ token: 1 }, 'n1'); x.handlers['stool:claim']({ token: 2 }, 'n2')
 assert.equal(x.sent.filter(([name]) => name === 'stool:answer')[1][1].accepted, false)
 x.worldHandlers.leave({ playerId: 'p1' }); x.handlers['stool:claim']({ token: 3 }, 'n2')
 assert.equal(x.sent.filter(([name]) => name === 'stool:answer')[2][1].accepted, true)
})
test('client hides prompt while claiming and sitting, restores on end', () => {
 const x = setup(false), action = x.nodes.find(n => n.type === 'action'); assert.equal(action.active, true)
 action.onTrigger(); assert.equal(action.active, false)
 x.handlers['stool:owner']('p1'); x.handlers['stool:answer']({ playerId: 'p1', token: 1, accepted: true }); assert.equal(action.active, false)
 x.player.options.onEnd(); assert.equal(x.sent.at(-1)[0], 'stool:release'); x.handlers['stool:owner'](null); assert.equal(action.active, true)
})
