import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./Avatar.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { Avatar } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('retains a pose override before activation and across avatar remounts', () => {
  const applied = []
  const pose = { hips: { rotation: [0, 0, 0, 1], position: [0, 0.1, 0] } }
  const nextPose = { hips: { rotation: [0, 0.2, 0, 1], position: [0, 0.2, 0] } }
  const factory = {
    create() {
      return {
        setEmote() {},
        setVisible() {},
        setPoseOverride(value) {
          applied.push(value && JSON.parse(JSON.stringify(value)))
        },
        destroy() {},
      }
    },
  }
  const world = { setHot() {}, avatars: { add() {}, remove() {} } }
  const context = { world, entity: {} }
  const avatar = new Avatar({ factory, poseOverride: pose })

  avatar.activate(context)
  assert.deepEqual(applied, [pose])

  avatar.setPoseOverride(nextPose)
  assert.deepEqual(applied.at(-1), nextPose)

  avatar.deactivate()
  avatar.activate(context)
  assert.deepEqual(applied.at(-1), nextPose)
})

test('retains scripted hands before activation and clears them across remounts', () => {
  const applied = []
  const factory = {
    create: () => ({
      setEmote() {},
      setVisible() {},
      destroy() {},
      setScriptedPose(value) {
        applied.push(value)
      },
    }),
  }
  const context = { world: { setHot() {}, avatars: { add() {}, remove() {} } }, entity: {} }
  const avatar = new Avatar({ factory })
  const pose = { bones: {}, hands: { left: { kind: 'hand', p: [0, 1, -0.3], w: [0, 0, 0, 1], f: {} } } }
  avatar.setScriptedPose(pose)
  avatar.activate(context)
  assert.equal(applied.at(-1), pose)
  avatar.deactivate()
  avatar.activate(context)
  assert.equal(applied.at(-1), pose)
  avatar.setScriptedPose(null)
  avatar.deactivate()
  avatar.activate(context)
  assert.equal(applied.at(-1), null)
})

test('forwards scripted release duration without replaying it on remount', () => {
  const applied = []
  const factory = { create: () => ({
    setEmote() {}, setVisible() {}, destroy() {},
    setScriptedPose(pose, duration) { applied.push({ pose, duration }) },
  }) }
  const context = { world: { setHot() {}, avatars: { add() {}, remove() {} } }, entity: {} }
  const avatar = new Avatar({ factory })
  avatar.activate(context)
  avatar.setScriptedPose(null, 0.45)
  assert.deepEqual(applied.at(-1), { pose: null, duration: 0.45 })
  avatar.deactivate()
  avatar.activate(context)
  assert.equal(applied.at(-1).pose, null)
  assert.equal(applied.at(-1).duration, undefined)
})

test('retains the head-only view across remounts and temporary visibility changes', () => {
  const applied = []
  const factory = { create: () => ({
    setEmote() {}, setVisible() {}, destroy() {},
    setFirstPerson(active, headOnly) { applied.push({ active, headOnly }) },
  }) }
  const context = { world: { setHot() {}, avatars: { add() {}, remove() {} } }, entity: {} }
  const avatar = new Avatar({ factory })
  avatar.setFirstPerson(true, { headOnly: true })
  avatar.activate(context)
  assert.deepEqual(applied.at(-1), { active: true, headOnly: true })
  avatar.setFirstPerson(false)
  avatar.setFirstPerson(true)
  assert.deepEqual(applied.at(-1), { active: true, headOnly: true })
  avatar.deactivate()
  avatar.activate(context)
  assert.deepEqual(applied.at(-1), { active: true, headOnly: true })
  assert.throws(() => avatar.setFirstPerson(true, { headOnly: 1 }), /headOnly/)
  avatar.setFirstPerson(false, { headOnly: false })
  assert.deepEqual(applied.at(-1), { active: false, headOnly: false })
})

test('retains the arms-only mask across remounts and clears it on return to the full avatar', () => {
  const applied = []
  const factory = { create: () => ({
    setEmote() {}, setVisible() {}, destroy() {},
    setFirstPerson(active, headOnly, armsOnly) { applied.push({ active, headOnly, armsOnly }) },
  }) }
  const context = { world: { setHot() {}, avatars: { add() {}, remove() {} } }, entity: {} }
  const avatar = new Avatar({ factory })
  avatar.setFirstPerson(true, { armsOnly: true })
  avatar.activate(context)
  assert.deepEqual(applied.at(-1), { active: true, headOnly: false, armsOnly: true })
  avatar.deactivate()
  avatar.activate(context)
  assert.deepEqual(applied.at(-1), { active: true, headOnly: false, armsOnly: true })
  avatar.setFirstPerson(false)
  assert.deepEqual(applied.at(-1), { active: false, headOnly: false, armsOnly: false })
  assert.throws(() => avatar.setFirstPerson(true, { armsOnly: 'true' }), /armsOnly/)
})
