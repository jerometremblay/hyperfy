import assert from 'node:assert/strict'
import test from 'node:test'
import { getPortalStatus } from './portalStatus.js'

function world(overrides = {}, nodes = [{ name: 'portal', mounted: true, portalId: '' }]) {
  return {
    entities: {
      items: new Map([
        [
          'instance',
          {
            isApp: true,
            data: { id: 'instance' },
            blueprint: {},
            root: { traverse: callback => nodes.forEach(callback) },
            ...overrides,
          },
        ],
      ]),
    },
  }
}

test('status reports a world, native app portal, and embedded endpoint without scripts', () => {
  assert.deepEqual(getPortalStatus(world()), { available: true })
  assert.deepEqual(getPortalStatus(world(), 'instance'), { available: true })
  assert.deepEqual(getPortalStatus(world({}, [{ name: 'portal', mounted: true, portalId: 'embedded' }]), 'embedded'), {
    available: true,
  })
})

test('missing, moving, disabled, and unmounted portals are unavailable', () => {
  for (const state of [
    world(),
    world({ data: { id: 'missing', mover: 'builder' } }),
    world({ blueprint: { disabled: true }, data: { id: 'missing' } }),
    world({}, [{ name: 'portal', mounted: false, portalId: 'missing' }]),
  ]) {
    assert.deepEqual(getPortalStatus(state, 'missing'), { available: false, error: 'Destination portal not found' })
  }
})
