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
