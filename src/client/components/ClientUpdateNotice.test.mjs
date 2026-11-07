import assert from 'node:assert/strict'
import fs from 'node:fs'
import vm from 'node:vm'
import test from 'node:test'
import { transform } from 'esbuild'

const network = fs.readFileSync(new URL('../../core/systems/ClientNetwork.js', import.meta.url), 'utf8')
const method = network.slice(network.indexOf('  onClientBuild('), network.indexOf('  onSnapshot('))
const handlers = new Map()
const world = { network: {}, on: (name, fn) => handlers.set(name, fn), off: name => handlers.delete(name) }
const events = []
const context = vm.createContext({ document: { querySelector: () => ({ getAttribute: () => '/index-loaded.js' }) } })
const receiver = vm.runInContext(`({${method}})`, context)
receiver.world = {
  emit: (name, value) => {
    events.push([name, value])
    world.network.updateAvailable = value
    handlers.get(name)?.(value)
  },
}

test('matching builds stay quiet; changed build announces without reloading', () => {
  receiver.onClientBuild('/index-loaded.js')
  assert.equal(receiver.updateAvailable, false)
  receiver.onClientBuild('/index-new.js')
  assert.equal(receiver.updateAvailable, true)
  assert.deepEqual(events.at(-1), ['client-update', true])
})

test('notice persists until reload is clicked and unsubscribes on unmount', async () => {
  const source = fs.readFileSync(new URL('./ClientUpdateNotice.js', import.meta.url), 'utf8')
  const body = source.slice(source.indexOf('export function')).replace('export ', '')
  const { code } = await transform(body, { loader: 'jsx', jsxFactory: 'h' })
  let state,
    cleanup,
    reloads = 0
  const ui = vm.createContext({
    useState: init => {
      state ??= init()
      return [
        state,
        value => {
          state = value
        },
      ]
    },
    useEffect: effect => {
      cleanup = effect()
    },
    css: () => '',
    RefreshCwIcon: () => null,
    window: { location: { reload: () => reloads++ } },
    h: (tag, props, ...children) => ({ tag, props, children }),
  })
  vm.runInContext(code + '\nthis.render = ClientUpdateNotice', ui)
  world.network.updateAvailable = false
  assert.equal(ui.render({ world }), null)
  receiver.onClientBuild('/index-new.js')
  const notice = ui.render({ world })
  assert.equal(notice.props.role, 'status')
  assert.equal(reloads, 0)
  notice.children.find(child => child.tag === 'button').props.onClick()
  assert.equal(reloads, 1)
  cleanup()
  assert.equal(handlers.size, 0)
})
