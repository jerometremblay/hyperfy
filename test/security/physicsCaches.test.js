// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physicsCaches.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())

test('physics cache: 100K distinct overlap radii allocate no natives after initialization', async () => {
  await runRealPhysx(bundle, async ({ B, physics, PHYSX, body }) => {
    const origin = new B.THREE.Vector3()
    const target = body('RigidBody', { type: 'static', position: [20, 0, 0] })
    assert.equal(physics.overlapSphere(1, origin, 0xffffffff).length, 0)
    assert.ok(physics.overlapSphere(25, origin, 0xffffffff).some(hit => hit.actor.ptr === target.actor.ptr))
    // Warm wrapper caches too. Count constructors, not heap capacity, which can hide leaks.
    physics.overlapSphere(0.01, origin, 0xffffffff)
    const allocations = []
    for (const name of Object.keys(PHYSX)) {
      if (!name.startsWith('Px') || typeof PHYSX[name] !== 'function') continue
      PHYSX[name] = new Proxy(PHYSX[name], {
        construct(target, args) {
          allocations.push(name)
          return Reflect.construct(target, args)
        },
      })
    }
    const geometries = new Set()
    const overlap = physics.scene.overlap.bind(physics.scene)
    let expectedRadius
    physics.scene.overlap = (geometry, ...args) => {
      geometries.add(geometry.ptr)
      assert.equal(geometry.get_radius(), Math.fround(expectedRadius))
      return overlap(geometry, ...args)
    }
    for (let i = 0; i < 100000; i++) {
      expectedRadius = 0.01 + i / 10000
      assert.equal(physics.overlapSphere(expectedRadius, origin, 0xffffffff).length, 0)
    }
    assert.equal(allocations.length, 0, 'queries must not construct new natives')
    assert.equal(geometries.size, 1, 'all radii use the same native geometry')
    const other = new B.Physics(physics.world)
    await other.init()
    assert.notEqual(other.overlapSphereGeometry.ptr, physics.overlapSphereGeometry.ptr)
  })
})

test('physics cache: material triple separators prevent concatenation collisions', async () => {
  await runRealPhysx(bundle, async ({ physics }) => {
    const a = physics.getMaterial(1, 11, 1)
    const b = physics.getMaterial(11, 1, 1)
    assert.notEqual(a.ptr, b.ptr)
    assert.equal(a.getStaticFriction(), 1)
    assert.equal(b.getStaticFriction(), 11)
    assert.equal(physics.getMaterial(1, 11, 1), a)
  })
})

test('physics cache: 70K material triples stay bounded, nonzero and preserve cache hits at the cap', async () => {
  await runRealPhysx(bundle, async ({ physics, B }) => {
    const warnings = []
    console.warn = line => warnings.push(line)
    const defaults = physics.defaultMaterial
    const coefficients = material => [
      material.getStaticFriction(),
      material.getDynamicFriction(),
      material.getRestitution(),
    ]
    const defaultValues = coefficients(defaults)
    const first = physics.getMaterial(0, 0.5, 0.25)
    const firstValues = coefficients(first)
    const create = physics.physics.createMaterial.bind(physics.physics)
    let creates = 0
    physics.physics.createMaterial = (...args) => {
      creates++
      return create(...args)
    }
    let zeroPointers = 0
    for (let i = 1; i <= 70000; i++) {
      const material = physics.getMaterial(i / 70001, 0.5, 0.25)
      if (!material?.ptr) zeroPointers++
    }
    const entries =
      physics.materials instanceof Map ? [...physics.materials.values()] : Object.values(physics.materials)
    assert.ok(entries.length <= 4096, `cache retained ${entries.length} materials`)
    assert.equal(entries.length, 4096)
    assert.equal(zeroPointers, 0)
    assert.equal(creates, 4095)
    assert.equal(physics.getMaterial(0, 0.5, 0.25), first, 'hits still win over the cap')
    assert.equal(physics.getMaterial(9, 9, 0.9), defaults)
    assert.deepEqual(coefficients(first), firstValues)
    assert.deepEqual(coefficients(defaults), defaultValues)
    const other = new B.Physics(physics.world)
    await other.init()
    for (let i = 0; i < 4100; i++) other.getMaterial(i / 4100, 0.5, 0.25)
    assert.equal(warnings.length, 1, 'cap warning has one fixed process-wide key')
  })
})

test('physics cache: zero-pointer material falls back without caching and can be retried', async () => {
  await runRealPhysx(bundle, async ({ physics, PHYSX }) => {
    const warnings = []
    console.warn = line => warnings.push(line)
    const create = physics.physics.createMaterial.bind(physics.physics)
    const zero = PHYSX.wrapPointer(0, PHYSX.PxMaterial)
    assert.equal(zero.ptr, 0)
    physics.physics.createMaterial = () => zero
    for (let i = 0; i < 100; i++) {
      assert.equal(physics.getMaterial(i / 100, 0.4, 0.3), physics.defaultMaterial)
    }
    const entries =
      physics.materials instanceof Map ? [...physics.materials.values()] : Object.values(physics.materials)
    assert.equal(entries.length, 0)
    assert.equal(warnings.length, 1)
    physics.physics.createMaterial = create
    const retried = physics.getMaterial(0, 0.4, 0.3)
    assert.ok(retried.ptr)
    assert.notEqual(retried, physics.defaultMaterial)
    assert.equal(physics.getMaterial(0, 0.4, 0.3), retried)
  })
})
