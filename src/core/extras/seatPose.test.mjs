import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./seatPose.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const {
  sanitizeNormalizedPose,
  getMatchingSeatPose,
  getStoredSeatPose,
  sanitizePoseStyleName,
  sanitizePoseStyles,
  sanitizeSeatPoseInput,
  sanitizeSeatPoseRecord,
  sanitizeSeatProfileId,
  seatPoseStorageKey,
  seatPoseProfileStorageKey,
  seatPoseStylesStorageKey,
} = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

const pose = {
  hips: { position: [0, 0.1, 0], rotation: [0, 0, 0, 2] },
  leftUpperArm: { rotation: [0, 0.5, 0, 1] },
}

test('sanitizes and normalizes normalized humanoid poses', () => {
  const actual = sanitizeNormalizedPose(pose)
  assert.deepEqual(actual.hips.position, [0, 0.1, 0])
  assert.deepEqual(actual.hips.rotation, [0, 0, 0, 1])
  assert.ok(Math.abs(Math.hypot(...actual.leftUpperArm.rotation) - 1) < 1e-10)
})

test('rejects unknown bones, non-hips translation, and invalid numeric transforms', () => {
  assert.equal(sanitizeNormalizedPose({ arbitraryBone: { rotation: [0, 0, 0, 1] } }), null)
  assert.equal(sanitizeNormalizedPose({ spine: { position: [0, 0, 0] } }), null)
  assert.equal(sanitizeNormalizedPose({ hips: { rotation: [0, 0, 0, 0] } }), null)
  assert.equal(sanitizeNormalizedPose({ hips: { position: [0, 3, 0] } }), null)
})

test('validates complete seat configs and stable identity keys', () => {
  const config = sanitizeSeatPoseInput({
    avatarUrl: 'asset://avatar.vrm',
    offset: [0.1, 0, -0.2],
    rotation: [0, 0.2, 0, 1],
    pose,
  })
  assert.ok(config)
  assert.equal(sanitizeSeatPoseInput({ ...config, offset: [Infinity, 0, 0] }), null)
  assert.deepEqual(sanitizeSeatPoseRecord({ version: 1, anchorId: 'couch:seat-1', ...config }).anchorId, 'couch:seat-1')
  const record = { version: 1, anchorId: 'couch:seat-1', ...config }
  assert.equal(
    getMatchingSeatPose({ effect: { anchorId: 'couch:seat-1' }, seatPose: record }, 'asset://avatar.vrm').anchorId,
    'couch:seat-1'
  )
  assert.equal(
    getMatchingSeatPose({ effect: { anchorId: 'other-seat' }, seatPose: record }, 'asset://avatar.vrm'),
    null
  )
  assert.equal(
    getMatchingSeatPose({ effect: { anchorId: 'couch:seat-1' }, seatPose: record }, 'asset://other.vrm'),
    null
  )

  const storage = new Map([[seatPoseStorageKey('user:1', 'asset://avatar.vrm', 'couch:seat-1'), record]])
  const world = {
    anchors: { get: id => (id === 'couch:seat-1' ? {} : null) },
    storage: { get: key => storage.get(key) },
  }
  const player = {
    data: { id: 'user:1', userId: 'user:1', avatar: 'asset://avatar.vrm', effect: { anchorId: 'couch:seat-1' } },
  }
  assert.deepEqual(getStoredSeatPose(world, player), sanitizeSeatPoseRecord(record))
  player.data.effect = null
  assert.equal(getStoredSeatPose(world, player), null)
  assert.equal(
    seatPoseStorageKey('user:1', 'avatar/a.vrm', 'couch:seat-1'),
    'seatPose:user%3A1:avatar%2Fa.vrm:couch%3Aseat-1'
  )
  assert.equal(seatPoseStylesStorageKey('user:1'), 'seatPoseStyles:user%3A1')
})

test('reuses a matching furniture-profile config on another seat instance', () => {
  const profileId = sanitizeSeatProfileId(' modular-couch-v1:middle ')
  assert.equal(profileId, 'modular-couch-v1:middle')
  assert.equal(sanitizeSeatProfileId('bad\nprofile'), null)

  const profileRecord = {
    version: 1,
    profileId,
    avatarUrl: 'asset://avatar.vrm',
    offset: [0.1, 0, -0.2],
    rotation: [0, 0.2, 0, 1],
    pose,
  }
  const storage = new Map([[seatPoseProfileStorageKey('user:1', profileRecord.avatarUrl, profileId), profileRecord]])
  const currentAnchorId = 'second-couch:middle'
  const world = {
    anchors: {
      get: id => (id === currentAnchorId ? {} : null),
      getProfileId: id => (id === currentAnchorId ? profileId : null),
    },
    storage: { get: key => storage.get(key) },
  }
  const player = {
    data: {
      id: 'user:1',
      userId: 'user:1',
      avatar: profileRecord.avatarUrl,
      effect: { anchorId: currentAnchorId },
    },
  }

  assert.deepEqual(getStoredSeatPose(world, player), {
    version: 1,
    anchorId: currentAnchorId,
    profileId,
    avatarUrl: profileRecord.avatarUrl,
    offset: profileRecord.offset,
    rotation: [0, 0.2 / Math.hypot(0, 0.2, 0, 1), 0, 1 / Math.hypot(0, 0.2, 0, 1)],
    pose: sanitizeNormalizedPose(pose),
  })
  assert.equal(
    seatPoseProfileStorageKey('user:1', profileRecord.avatarUrl, profileId),
    'seatPoseProfile:user%3A1:asset%3A%2F%2Favatar.vrm:modular-couch-v1%3Amiddle'
  )
})

test('limits reusable style names and rejects duplicate style names', () => {
  assert.equal(sanitizePoseStyleName('  relaxed  '), 'relaxed')
  assert.equal(sanitizePoseStyleName(''), null)
  assert.equal(sanitizePoseStyleName('bad\nname'), null)
  assert.equal(
    sanitizePoseStyles([
      { name: 'Relaxed', pose },
      { name: 'relaxed', pose },
    ]),
    null
  )
  assert.deepEqual(sanitizePoseStyles([{ name: 'Relaxed', pose }]), [
    { name: 'Relaxed', pose: sanitizeNormalizedPose(pose) },
  ])
})
