import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { mkdtemp } from 'node:fs/promises'
import { tmpdir } from 'node:os'

const temp = await mkdtemp(`${tmpdir()}/scripted-pose-test-`)
await build({
  stdin: {
    contents: `export { sanitizeScriptedPose } from './scriptedPose.js'
      export { createPlayerProxy } from './createPlayerProxy.js'`,
    resolveDir: fileURLToPath(new URL('.', import.meta.url)),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  outfile: `${temp}/proxy.mjs`,
})
const { sanitizeScriptedPose, createPlayerProxy } = await import(`${temp}/proxy.mjs`)

const hand = () => ({ kind: 'controller', p: [0.2, 0.8, -0.3], w: [0, 0, 0, 1], f: {}, pole: [0, 2, 0] })
const pose = () => ({ bones: { hips: { position: [0, -0.1, 0] } }, hands: { right: hand() } })

test('scripted poses clone and validate normalized body, wrists and elbow poles', () => {
  const input = pose()
  const result = sanitizeScriptedPose(input)
  assert.deepEqual(result.hands.right.pole, [0, 1, 0])
  input.bones.hips.position[1] = 1
  input.hands.right.p[0] = 3
  assert.equal(result.bones.hips.position[1], -0.1)
  assert.equal(result.hands.right.p[0], 0.2)
  for (const invalid of [
    {},
    null,
    [],
    { bones: { unknown: { rotation: [0, 0, 0, 1] } } },
    { hands: { right: { ...hand(), p: [Infinity, 0, 0] } } },
    { hands: { right: { ...hand(), p: [5, 0, 0] } } },
    { hands: { right: { ...hand(), w: [1e300, 0, 0, 1] } } },
    { hands: { right: { ...hand(), pole: [0, 0, 0] } } },
    { hands: { right: { ...hand(), pole: [NaN, 1, 0] } } },
    { hands: { right: hand(), left: { ...hand(), w: [0, 0, 0, 0] } } },
  ])
    assert.equal(sanitizeScriptedPose(invalid), null)
})

test('predicted visual roots are cloned and cannot replace another player or physical state', () => {
  const input = { ...pose(), root: { position: [1, 2, 3], quaternion: [0, 0, 0, 1] } }
  const clean = sanitizeScriptedPose(input)
  assert.deepEqual(clean.root, input.root)
  assert.deepEqual(sanitizeScriptedPose({ root: input.root }).root, input.root)
  input.root.position[0] = 8
  assert.equal(clean.root.position[0], 1)
  for (const root of [
    null, {}, { position: [Infinity, 0, 0], quaternion: [0, 0, 0, 1] },
    { position: [1e7, 0, 0], quaternion: [0, 0, 0, 1] },
    { position: [1, 2, 3], quaternion: [0, 0, 0, 0] },
  ]) assert.equal(sanitizeScriptedPose({ ...pose(), root }), null)
  const physical = { position: [10, 0, 0], quaternion: [0, 0, 0, 1] }
  const applied = []
  const world = { network: { isClient: true, id: 'local' }, livekit: {} }
  const player = { world, data: { owner: 'local' }, base: physical,
    avatar: { setScriptedPose(value) { applied.push(value) } } }
  const proxy = createPlayerProxy({ world }, player)
  assert.equal(proxy.setPose(clean), true)
  assert.deepEqual(physical.position, [10, 0, 0])
  player.data.owner = 'remote'
  assert.equal(proxy.setPose(clean), false, 'visual root prediction is only for the local player')
  assert.equal(applied.length, 1)
})

test('only the latest app can clear its client pose, including app cleanup', () => {
  const applied = []
  const world = { network: { isClient: true }, livekit: {} }
  const player = {
    world,
    data: {},
    avatar: {
      setScriptedPose(value) {
        applied.push(value)
      },
    },
  }
  const a = createPlayerProxy({ world }, player)
  const b = createPlayerProxy({ world }, player)
  assert.equal(a.setPose(pose()), true)
  assert.equal(a.setPose({}), false)
  assert.equal(applied.length, 1, 'invalid pose leaves the previous pose intact')
  assert.equal(b.setPose(pose()), true)
  assert.equal(a.setPose(null), false, 'an older app cannot clear the current owner')
  a.$cleanup()
  assert.notEqual(applied.at(-1), null)
  b.$cleanup()
  assert.equal(applied.at(-1), null)
  assert.equal(player.scriptedPose, null)
  player.world = { network: { isClient: false } }
  assert.equal(createPlayerProxy({}, player).setPose(pose()), false)
})

test('pose release forwards a bounded duration only for the current owner', () => {
  const applied = []
  const world = { network: { isClient: true }, livekit: {} }
  const player = { world, data: {}, avatar: {
    setScriptedPose(value, duration) { applied.push({ value, duration }) },
  } }
  const owner = createPlayerProxy({ world }, player)
  const other = createPlayerProxy({ world }, player)
  owner.setPose(pose())
  for (const duration of [-1, NaN, Infinity, 3]) assert.equal(owner.setPose(null, { duration }), false)
  assert.equal(other.setPose(null, { duration: 0.45 }), false)
  assert.equal(owner.setPose(null, { duration: 0.45 }), true)
  assert.deepEqual(applied.at(-1), { value: null, duration: 0.45 })
  assert.equal(player.scriptedPoseOwner, null, 'normal input and new apps can take over immediately')
  owner.setPose(pose())
  owner.setPose(null)
  assert.deepEqual(applied.at(-1), { value: null, duration: 0 })
})

test('pose entry forwards its bounded duration without accepting invalid updates', () => {
  const applied = []
  const world = { network: { isClient: true, id: 'local' }, livekit: {} }
  const player = { world, data: { owner: 'local' }, avatar: {
    setScriptedPose(value, duration) { applied.push({ value, duration }) },
  } }
  const proxy = createPlayerProxy({ world }, player)
  for (const duration of [-1, NaN, Infinity, 3])
    assert.equal(proxy.setPose(pose(), { duration }), false)
  assert.equal(applied.length, 0)
  assert.equal(proxy.setPose(pose(), { duration: 1 }), true)
  assert.equal(applied.at(-1).duration, 1)
  assert.equal(proxy.setPose(pose()), true)
  assert.equal(applied.at(-1).duration, 0, 'ordinary pose updates keep the active transition')
})

test('bone transform reads forward only an explicit target-pose option', () => {
  const calls = []
  const world = { network: { isClient: true }, livekit: {} }
  const matrix = {}
  const proxy = createPlayerProxy({ world }, { world, data: {}, avatar: {
    getBoneTransform(name, options) { calls.push({ name, options }); return matrix },
  } })
  assert.equal(proxy.getBoneTransform('rightEye', { targetPose: true }), matrix)
  assert.deepEqual(calls.at(-1), { name: 'rightEye', options: { targetPose: true } })
  proxy.getBoneTransform('head')
  assert.deepEqual(calls.at(-1).options, { targetPose: false })
  proxy.getBoneTransform('head', { targetPose: 'true' })
  assert.deepEqual(calls.at(-1).options, { targetPose: false })
})
