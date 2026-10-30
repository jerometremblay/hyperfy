import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { TokenVerifier } from 'livekit-server-sdk'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./ServerLiveKit.js', import.meta.url))],
  bundle: true, format: 'esm', platform: 'node', write: false,
})
const { ServerLiveKit } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

test('speaker credentials publish only audio to the current world room', async () => {
  const world = {
    entities: { get: id => id === 'box' ? { isApp: true, data: { blueprint: 'app' } } : null },
    blueprints: { get: () => ({ id: 'app' }) },
  }
  const livekit = new ServerLiveKit(world)
  Object.assign(livekit, { enabled: true, wsUrl: 'ws://localhost:7880', apiKey: 'test-key', apiSecret: 'test-secret' })
  const session = await livekit.createSpeakerSession('box')
  const claims = await new TokenVerifier('test-key', 'test-secret').verify(session.token)
  assert.equal(claims.sub, 'speaker:box')
  assert.equal(claims.video.room, livekit.roomId)
  assert.equal(claims.video.canSubscribe, false)
  assert.equal(claims.video.canPublishData, false)
  assert.equal(claims.video.canUpdateOwnMetadata, false)
  assert.deepEqual(claims.video.canPublishSources, ['microphone'])
  assert.ok(claims.exp - claims.nbf <= 15 * 60)
  await assert.rejects(livekit.createSpeakerSession('missing'), { statusCode: 404 })
  world.blueprints.get = () => ({ disabled: true })
  await assert.rejects(livekit.createSpeakerSession('box'), { statusCode: 404 })
  livekit.enabled = false
  await assert.rejects(livekit.createSpeakerSession('box'), { statusCode: 503 })
})
