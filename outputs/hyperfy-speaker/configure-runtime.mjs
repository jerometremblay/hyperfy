import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import path from 'node:path'
import os from 'node:os'
import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { loadProfile } from '../../tools/worldsync/src/deployment.mjs'

const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const origin = new URL(profile.apiUrl).origin
const support = path.join(os.homedir(), 'Library/Application Support/Hyperfy Speaker')
const runtime = path.join(support, 'LiveKit')
await fs.mkdir(runtime, { recursive: true, mode: 0o700 })
const statePath = path.join(runtime, 'credentials.json')
let state
try {
  state = JSON.parse(await fs.readFile(statePath, 'utf8'))
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  state = { key: 'API' + randomBytes(12).toString('hex'), secret: randomBytes(32).toString('hex') }
  await fs.writeFile(statePath, JSON.stringify(state), { mode: 0o600 })
}
const cert = process.env.TLS_CERT_FILE
const key = process.env.TLS_KEY_FILE
assert(cert && key, 'The world TLS certificate is required')
await Promise.all([fs.access(cert), fs.access(key)])
const livekitConfig = path.join(runtime, 'livekit.yaml')
await fs.writeFile(livekitConfig, [
  'port: 7884',
  'bind_addresses: ["127.0.0.1"]',
  'rtc:',
  '  tcp_port: 7881',
  '  udp_port: 7882',
  '  node_ip: 192.168.0.130',
  '  use_external_ip: false',
  '  enable_loopback_candidate: true',
  'keys:',
  `  ${state.key}: ${state.secret}`,
  'logging:',
  '  level: warn',
  '',
].join('\n'), { mode: 0o600 })
const proxyConfig = path.join(runtime, 'nginx.conf')
const quoted = value => JSON.stringify(value)
await fs.writeFile(proxyConfig, [
  'worker_processes 1;',
  `pid ${quoted(path.join(runtime, 'nginx.pid'))};`,
  'error_log stderr crit;',
  'events { worker_connections 256; }',
  'http {',
  '  access_log off;',
  `  client_body_temp_path ${quoted(path.join(runtime, 'client-temp'))};`,
  `  proxy_temp_path ${quoted(path.join(runtime, 'proxy-temp'))};`,
  '  server {',
  '    listen 7880 ssl;',
  '    server_name monstre.duckdns.org;',
  `    ssl_certificate ${quoted(cert)};`,
  `    ssl_certificate_key ${quoted(key)};`,
  '    ssl_protocols TLSv1.2 TLSv1.3;',
  '    location / {',
  '      proxy_pass http://127.0.0.1:7884;',
  '      proxy_http_version 1.1;',
  '      proxy_set_header Upgrade $http_upgrade;',
  '      proxy_set_header Connection "upgrade";',
  '      proxy_read_timeout 3600s;',
  '      proxy_send_timeout 3600s;',
  '      proxy_buffering off;',
  '    }',
  '  }',
  '}',
  '',
].join('\n'), { mode: 0o600 })
const localEnv = path.resolve('.env.local')
let contents = ''
try { contents = await fs.readFile(localEnv, 'utf8') } catch (e) { if (e.code !== 'ENOENT') throw e }
const values = {
  LIVEKIT_WS_URL: 'wss://monstre.duckdns.org:7880',
  LIVEKIT_API_KEY: state.key,
  LIVEKIT_API_SECRET: state.secret,
}
for (const [name, value] of Object.entries(values)) {
  const line = new RegExp(`^${name}=.*$`, 'm')
  contents = line.test(contents) ? contents.replace(line, `${name}=${value}`) : contents.trimEnd() + `\n${name}=${value}\n`
}
await fs.writeFile(localEnv, contents, { mode: 0o600 })
await fs.chmod(localEnv, 0o600)
const object = JSON.parse(await fs.readFile(new URL('object.json', import.meta.url), 'utf8'))
const configPath = path.join(support, 'config.json')
try {
  const existing = JSON.parse(await fs.readFile(configPath, 'utf8'))
  assert(!existing.world_url || existing.world_url === origin, 'Mac helper is already configured for another world')
  assert(!existing.speaker_id || existing.speaker_id === object.entityId, 'Mac helper already targets another speaker')
} catch (e) { if (e.code !== 'ENOENT') throw e }
await fs.writeFile(configPath, JSON.stringify({
  world_url: origin, speaker_id: object.entityId, device: 'Hyperfy Speaker',
}, null, 2) + '\n', { mode: 0o600 })
const xml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')
for (const [label, args] of [
  ['org.hyperfy.speaker.livekit', ['/opt/homebrew/bin/livekit-server', '--config', livekitConfig]],
  ['org.hyperfy.speaker.proxy', ['/opt/homebrew/opt/nginx/bin/nginx', '-c', proxyConfig, '-g', 'daemon off;']],
]) {
  const file = path.join(os.homedir(), 'Library/LaunchAgents', label + '.plist')
  await fs.writeFile(file, `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0"><dict>
<key>Label</key><string>${label}</string>
<key>ProgramArguments</key><array>${args.map(a => '<string>' + xml(a) + '</string>').join('')}</array>
<key>RunAtLoad</key><true/><key>KeepAlive</key><true/>
<key>WorkingDirectory</key><string>${xml(runtime)}</string>
<key>StandardOutPath</key><string>${xml(path.join(runtime, label + '.log'))}</string>
<key>StandardErrorPath</key><string>${xml(path.join(runtime, label + '.log'))}</string>
</dict></plist>
`, { mode: 0o600 })
}
const keychainHelper = path.resolve('outputs/hyperfy-speaker/save-keychain')
const result = spawnSync(keychainHelper, [], {
  input: JSON.stringify({ world: origin, token: profile.token }),
  stdio: ['pipe', 'pipe', 'pipe'],
})
assert.equal(result.status, 0, 'Could not store the world token in Keychain')
console.log(JSON.stringify({ configured: true, world: origin, speakerId: object.entityId, device: 'Hyperfy Speaker', livekit: values.LIVEKIT_WS_URL }))
