// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/test/physicsRetry.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

// Phase 3b-2b-2 on the real PhysX wasm: physics skipped because of a transform comes back once the transform changes,
// without rebuilding for moves that leave the checked transform as it was. On the code before this change none of
// these mount again (a skip sets needsRebuild = false and nothing retries).
let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())
const probe = (name, fn) => test(name, () => runRealPhysx(bundle, fn, undefined, { deadline: 60000 }))

probe('physics retry: a collider skipped for its scale or extent mounts once the transform is valid', ({ B, root }) => {
  const counted = node => {
    let mounts = 0
    const mount = node.mount
    node.mount = function (...args) {
      mounts++
      return mount.apply(this, args)
    }
    return () => mounts
  }
  // a mirrored convex mesh is skipped for its scale; un-mirroring it mounts it
  const tetra = () => {
    const geometry = new B.THREE.BufferGeometry()
    geometry.setAttribute('position', new B.THREE.Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1], 3))
    return geometry
  }
  const rb = new B.RigidBody({ type: 'static' })
  const mirrored = new B.Collider({ type: 'geometry', geometry: tetra(), convex: true })
  mirrored.scale.set(-1, 1, 1)
  rb.add(mirrored)
  root.add(rb)
  assert.equal(mirrored.physicsSkipped, 'scale')
  const mounts = counted(mirrored)
  // moving the body leaves the collider's own key unchanged: no retry
  for (let i = 0; i < 50; i++) {
    rb.position.x += 1
    rb.clean()
  }
  assert.equal(mounts(), 0, 'moves that keep the checked transform do not retry')
  mirrored.scale.set(1, 1, 1)
  mirrored.clean()
  assert.ok(mirrored.shape, 'mounted once the scale is valid')
  assert.equal(mounts(), 1)
  // a mesh larger than the physics range is skipped for its extent; scaling it down mounts it from the held cook
  const big = new B.THREE.BufferGeometry()
  big.setAttribute('position', new B.THREE.Float32BufferAttribute([0, 0, 0, 2e6, 0, 0, 0, 1, 0, 0, 0, 1], 3))
  const huge = new B.Collider({ type: 'geometry', geometry: big, convex: true })
  rb.add(huge)
  assert.equal(huge.physicsSkipped, 'extent')
  assert.ok(huge.heldPmesh, 'the cooked mesh is held while skipped')
  huge.scale.set(0.1, 0.1, 0.1)
  huge.clean()
  assert.ok(huge.shape, 'mounted at the smaller scale')
  assert.equal(huge.heldPmesh, null, 'the held mesh is released once a shape owns one')
  // a scale change smaller than a float32 step still retries: 3 x 333333.35 is just past the 1e6 extent in float32,
  // 3 x 333333.34 is not (both scales round to the same float32)
  const edge = new B.THREE.BufferGeometry()
  edge.setAttribute('position', new B.THREE.Float32BufferAttribute([0, 0, 0, 3, 0, 0, 0, 1, 0, 0, 0, 1], 3))
  const boundary = new B.Collider({ type: 'geometry', geometry: edge, convex: true })
  boundary.scale.set(333333.35, 1, 1)
  rb.add(boundary)
  assert.equal(boundary.physicsSkipped, 'extent')
  boundary.scale.set(333333.34, 1, 1)
  boundary.clean()
  assert.ok(boundary.shape, 'mounted after a sub-float32 scale change')
  // the same for a prim: a torus [1, 2] reaches 3 from its centre
  const torus = new B.Prim({ type: 'torus', size: [1, 2], physics: 'static', opacity: 0 })
  torus.scale.set(333333.35, 333333.35, 333333.35)
  root.add(torus)
  assert.equal(torus.actor ?? null, null, 'skipped for its extent')
  torus.scale.set(333333.34, 333333.34, 333333.34)
  torus.clean()
  assert.ok(torus.actor, 'the prim mounts after a sub-float32 scale change')
})

probe(
  'physics retry: a prim and a rigid body skipped outside the range mount when moved back',
  ({ B, root, physics }) => {
    const prim = new B.Prim({ type: 'box', size: [1, 1, 1], physics: 'static', opacity: 0, position: [2e6, 0, 0] })
    root.add(prim)
    assert.equal(prim.actor ?? null, null, 'no prim actor outside the range')
    prim.position.x = 0
    prim.clean()
    assert.ok(prim.actor, 'the prim mounts once it is back inside')
    const rb = new B.RigidBody({ type: 'dynamic', position: [2e6, 0, 0] })
    rb.add(new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 }))
    root.add(rb)
    assert.equal(rb.actor ?? null, null, 'no rigid body actor outside the range')
    // a joint waiting for that body
    const other = new B.RigidBody({ type: 'dynamic', position: [3, 0, 0] })
    other.add(new B.Collider({ type: 'box', width: 1, height: 1, depth: 1 }))
    root.add(other)
    const joint = new B.Joint({ type: 'fixed' })
    joint.body0 = rb
    joint.body1 = other
    root.add(joint)
    assert.equal(physics.scene.getNbConstraints(), 0, 'the joint waits')
    rb.position.x = 0
    rb.clean()
    assert.ok(rb.actor, 'the body mounts once it is back inside')
    assert.equal(rb.actor.getNbShapes(), 1, 'with its collider shape')
    assert.equal(physics.scene.getNbConstraints(), 1, 'and the waiting joint')
  }
)
