import assert from 'node:assert/strict'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./PlayerLocal.js', import.meta.url))],
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { getXRTurnAngle } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

test('maps XR right-stick input to a continuous turn angle', () => {
  const frameDelta = 1 / 60

  assert.equal(getXRTurnAngle(1, frameDelta), -90 / 60)
  assert.equal(getXRTurnAngle(-0.5, frameDelta), 45 / 60)
  assert.equal(getXRTurnAngle(0, frameDelta), 0)
})
