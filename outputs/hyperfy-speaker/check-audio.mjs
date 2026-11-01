import fs from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { AccessToken } from 'livekit-server-sdk'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'

const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
const client = makeClient(profile)
const object = JSON.parse(await fs.readFile(new URL('object.json', import.meta.url)))
const session = await client.request('/entities/' + object.entityId + '/speaker-session', { method: 'POST', json: {} })
const body = JSON.parse(Buffer.from(session.token.split('.')[1], 'base64url').toString())
const observer = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
  identity: 'speaker-check-observer', ttl: '2m',
})
observer.addGrant({
  roomJoin: true, room: body.video.room, canPublish: false,
  canSubscribe: true, canPublishData: false, canUpdateOwnMetadata: false,
})
const child = spawn('/Users/jerome/metaverse/hyperfy-speaker/.venv/bin/python', [
  new URL('check-audio.py', import.meta.url).pathname,
], { stdio: ['pipe', 'pipe', 'pipe'], env: { ...process.env, PYTHONDONTWRITEBYTECODE: '1' } })
child.stdin.end(JSON.stringify({
  wsUrl: session.wsUrl, identity: session.identity, world: object.origin,
  worldToken: profile.token, observerToken: await observer.toJwt(),
}))
let output = ''
child.stdout.on('data', data => { output += data })
// SDK diagnostics can contain session credentials; only retain a bounded success report.
child.stderr.on('data', () => {})
child.on('close', async code => {
  if (code) {
    console.log('Live audio verification did not complete.')
    process.exitCode = 1
    return
  }
  const report = JSON.parse(output.trim())
  if (!report.verified) {
    console.log(JSON.stringify(report))
    process.exitCode = 1
    return
  }
  await fs.writeFile(new URL('audio-validation.json', import.meta.url), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
})
