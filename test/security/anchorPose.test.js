// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/anchorPose.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Euler, Matrix4, Quaternion, Vector3, Object3D } from 'three'
import { readAnchorPose } from '../../src/core/extras/anchorPose.js'
import { loadClient } from './lib/clientHarness.mjs'
import * as physxConvert from '../../src/core/extras/physxConvert.js'

const rotation = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), Math.PI / 2)
const scaledAnchor = () => new Matrix4().compose(new Vector3(1, 2, 3), rotation, new Vector3(2, 2, 2))
const composedSingular = () =>
  new Matrix4().makeScale(0, 1, 1).multiply(new Matrix4().makeRotationFromEuler(new Euler(0.4, 0.7, 0.3)))

function assertRotation(actual, expected = rotation) {
  assert.ok(Math.abs(actual.length() - 1) < 1e-15)
  assert.ok(1 - Math.abs(actual.dot(expected)) < 1e-15)
}

function assertRejected(matrix) {
  const position = new Vector3(4, 5, 6)
  const quaternion = new Quaternion(0.5, 0.5, 0.5, 0.5)
  assert.equal(readAnchorPose(matrix, position, quaternion), false)
  assert.deepEqual(position.toArray(), [4, 5, 6])
  assert.deepEqual(quaternion.toArray(), [0.5, 0.5, 0.5, 0.5])
}

test('readAnchorPose: scaled and rotated anchors yield bounded position and unit rotation without changing input', () => {
  for (const scale of [new Vector3(2, 2, 2), new Vector3(2, 3, 4), new Vector3(-2, 3, 4), new Vector3(1e-13, 1, 1)]) {
    const matrix = new Matrix4().compose(new Vector3(-1e6, 0, 1e6), rotation, scale)
    const before = matrix.toArray()
    const position = new Vector3()
    const quaternion = new Quaternion()
    assert.equal(readAnchorPose(matrix, position, quaternion), true)
    assert.deepEqual(position.toArray(), [-1e6, 0, 1e6])
    assertRotation(quaternion)
    assert.deepEqual(matrix.toArray(), before)
  }
})

test('readAnchorPose: uniform world scale 1e-5 yields the anchor position and a unit rotation', () => {
  const anchor = new Object3D()
  anchor.position.set(1, 2, 3)
  anchor.quaternion.copy(rotation)
  anchor.scale.setScalar(1e-5)
  anchor.updateMatrixWorld()
  const position = new Vector3()
  const quaternion = new Quaternion()
  assert.equal(readAnchorPose(anchor.matrixWorld, position, quaternion), true)
  assert.deepEqual(position.toArray(), [1, 2, 3])
  assertRotation(quaternion)
})

test('readAnchorPose: element and determinant checks reject before decomposition', t => {
  t.mock.method(Matrix4.prototype, 'decompose', () => assert.fail('invalid matrix reached decomposition'))
  for (let i = 0; i < 16; i++) {
    for (const bad of [NaN, Infinity, -Infinity]) {
      const matrix = new Matrix4()
      matrix.elements[i] = bad
      assertRejected(matrix)
    }
  }
  for (const matrix of [
    new Matrix4().makeScale(0, 1, 1),
    composedSingular(),
    new Matrix4().makeScale(1e200, 1e200, 1e200),
  ])
    assertRejected(matrix)
})

test('readAnchorPose: rejects oversized positions and decomposition overflow without touching outputs', () => {
  for (let i = 0; i < 3; i++) {
    for (const bad of [1e6 + 1, -1e6 - 1, 1e300]) {
      const matrix = scaledAnchor()
      matrix.elements[12 + i] = bad
      assertRejected(matrix)
    }
  }
  // The determinant is finite, but a column length overflows during decomposition.
  assertRejected(new Matrix4().makeScale(1e200, 1e-100, 1e-100))
  const position = new Vector3()
  const quaternion = new Quaternion()
  assert.equal(readAnchorPose(scaledAnchor(), position, quaternion), true, 'recovers after rejection')
  assert.deepEqual(position.toArray(), [1, 2, 3])
  assertRotation(quaternion)
})

for (const kind of ['Local', 'Remote']) {
  test(`Player${kind}: invalid anchors preserve pose and do not snap; valid anchors recover and clear at unit scale`, () => {
    const Player = loadClient(`core/entities/Player${kind}.js`, `Player${kind}`, {
      ...physxConvert,
      readAnchorPose,
      simpleCamLerp() {},
    })
    let anchor = composedSingular()
    let positionSnaps = 0
    let quaternionSnaps = 0
    let capsuleReads = 0
    let cleans = 0
    const base = new Object3D()
    base.position.set(4, 5, 6)
    base.quaternion.set(0.5, 0.5, 0.5, 0.5)
    base.clean = () => {
      cleans++
    }
    const pose = { p: { x: 4, y: 5, z: 6 }, q: { x: 0, y: 0, z: 0, w: 1 } }
    const player = Object.assign(Object.create(Player.prototype), {
      base,
      data: { id: 'player', effect: { anchorId: 'anchor' } },
      getAnchorMatrix: () => anchor,
      position: {
        snap: () => {
          positionSnaps++
        },
      },
      quaternion: {
        snap: () => {
          quaternionSnaps++
        },
      },
      capsule: {
        getGlobalPose: () => {
          capsuleReads++
          return pose
        },
      },
      capsuleHandle: {
        snap: () => {
          positionSnaps++
        },
      },
      controller: {
        position: new Vector3(),
        teleport(v) {
          positionSnaps++
          this.position.copy(v)
          Object.assign(pose.p, { x: v.x, y: v.y, z: v.z })
        },
      },
      body: { active: false },
      cam: new Object3D(),
      control: { camera: new Object3D() },
      camHeight: 1.2,
      firstPerson: true,
      world: { emit() {}, network: { send() {} }, camera: { near: 0.2, updateProjectionMatrix() {} } },
    })
    const assertUnchanged = () => {
      assert.deepEqual(base.position.toArray(), [4, 5, 6])
      assert.deepEqual(base.quaternion.toArray(), [0.5, 0.5, 0.5, 0.5])
      assert.equal(positionSnaps, 0)
      assert.equal(quaternionSnaps, 0)
      assert.equal(capsuleReads, 0)
      assert.equal(cleans, 0)
    }
    for (const invalid of [composedSingular(), new Matrix4().makeTranslation(1e300, 0, 0)]) {
      anchor = invalid
      player.lateUpdate(1 / 60)
      assertUnchanged()
    }
    anchor = scaledAnchor()
    player.lateUpdate(1 / 60)
    assert.deepEqual(base.position.toArray(), [1, 2, 3])
    assertRotation(base.quaternion)
    assert.equal(positionSnaps, 1)
    assert.equal(quaternionSnaps, kind === 'Remote' ? 1 : 0)
    assert.equal(capsuleReads, 0)
    assert.equal(cleans, kind === 'Remote' ? 1 : 0)
    if (kind === 'Local') assert.deepEqual(pose.p, { x: 1, y: 2, z: 3 })
    player.setEffect(null)
    assert.equal(player.data.effect, null)
    if (kind === 'Remote') assert.equal(player.body.active, true)
    base.updateMatrixWorld()
    const scale = new Vector3()
    base.matrixWorld.decompose(new Vector3(), new Quaternion(), scale)
    assert.ok(scale.distanceTo(new Vector3(1, 1, 1)) < 1e-15)
    assert.ok(base.matrixWorld.elements.every(Number.isFinite))
  })
}
