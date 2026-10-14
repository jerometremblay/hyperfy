import assert from 'node:assert/strict'
import test from 'node:test'
import { getPortalStatus, getPortalLoadingImage } from './portalStatus.js'

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

test('loading images belong to the requested destination endpoint, including world-attached nodes', () => {
  const image = { type: 'image', url: 'asset://arrival.jpg' }
  const entity = { blueprint: { props: { arrivalImage_instance: image, arrivalImage_embedded: image } } }
  assert.deepEqual(getPortalLoadingImage(world(entity), 'instance'), image)
  assert.equal(getPortalLoadingImage(world(entity), 'other'), null)
  assert.equal(getPortalLoadingImage(world(entity)), null)
  for (const overrides of [
    { ...entity, data: { id: 'instance', mover: 'builder' } },
    { blueprint: { disabled: true, props: { arrivalImage_instance: image, arrivalImage_embedded: image } } },
    { blueprint: { props: { arrivalImage_instance: 'not-an-image' } } },
  ])
    assert.equal(getPortalLoadingImage(world(overrides), 'instance'), null)
  assert.deepEqual(
    getPortalLoadingImage(
      world({
        ...entity,
        root: null,
        worldNodes: [{ traverse: callback => callback({ name: 'portal', mounted: true, portalId: 'embedded' }) }],
      }),
      'embedded'
    ),
    image
  )
})

test('portals sharing a blueprint retain separate arrival images', () => {
  const first = { type: 'image', url: 'asset://first.jpg' }
  const second = { type: 'image', url: 'asset://second.jpg' }
  const state = world({ blueprint: { props: { arrivalImage_first: first, arrivalImage_second: second } } }, [
    { name: 'portal', mounted: true, portalId: 'first' },
    { name: 'portal', mounted: true, portalId: 'second' },
  ])
  assert.deepEqual(getPortalLoadingImage(state, 'first'), first)
  assert.deepEqual(getPortalLoadingImage(state, 'second'), second)
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
