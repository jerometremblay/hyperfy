import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { resolveWorldProfile } from './world-profile.mjs'

function fixture(t, files) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hyperfy-profile-'))
  t.after(() => fs.rmSync(root, { recursive: true, force: true }))
  for (const [name, content] of Object.entries(files)) fs.writeFileSync(path.join(root, name), content)
  return root
}

test('no selection leaves the original dotenv loader in charge', () => {
  assert.deepEqual(resolveWorldProfile(undefined, { root: '/missing', env: {} }), {})
})

test('world overrides follow the normal NODE_ENV cascade and derive their own URLs', t => {
  const root = fixture(t, {
    '.env':
      'WORLD=world\nPORT=3000\nPUBLIC_WS_URL=wss://old/ws\nPUBLIC_API_URL=https://old/api\nASSETS_BASE_URL=https://old/assets\nSECRET=shared',
    '.env.production': 'PORT=3001\nMODE=production',
    '.env.world2': 'WORLD=worlds/world2\nPORT=3334\nPUBLIC_ORIGIN=http://localhost:3334\nTLS_KEY_FILE=',
  })
  const actual = resolveWorldProfile('world2', { root, env: { NODE_ENV: 'production' } })
  assert.equal(actual.WORLD, 'worlds/world2')
  assert.equal(actual.PORT, '3334')
  assert.equal(actual.SECRET, 'shared')
  assert.equal(actual.MODE, 'production')
  assert.equal(actual.NODE_ENV, 'production')
  assert.equal(actual.TLS_KEY_FILE, '')
  assert.equal(actual.PUBLIC_WS_URL, 'ws://localhost:3334/ws')
  assert.equal(actual.PUBLIC_API_URL, 'http://localhost:3334/api')
  assert.equal(actual.ASSETS_BASE_URL, 'http://localhost:3334/assets')
})

test('local profile and exported URLs override derived URLs; HTTPS produces WSS', t => {
  const root = fixture(t, {
    '.env.world2': 'PORT=3334\nPUBLIC_ORIGIN=https://world.example\nPUBLIC_API_URL=https://api.example/api',
    '.env.world2.local': 'PORT=3335\nASSETS_BASE_URL=https://cdn.example/assets',
  })
  const actual = resolveWorldProfile('world2', { root, env: { PORT: '4444', PUBLIC_API_URL: 'https://exported/api' } })
  assert.equal(actual.PORT, '4444')
  assert.equal(actual.PUBLIC_API_URL, 'https://exported/api')
  assert.equal(actual.PUBLIC_WS_URL, 'wss://world.example/ws')
  assert.equal(actual.ASSETS_BASE_URL, 'https://cdn.example/assets')
  const withoutShell = resolveWorldProfile('world2', { root, env: {} })
  assert.equal(withoutShell.PORT, '3335')
  assert.equal(withoutShell.PUBLIC_API_URL, 'https://api.example/api')
})

test('missing, unsafe and invalid profiles fail before startup', t => {
  const root = fixture(t, { '.env.world2': 'PUBLIC_ORIGIN=file:///tmp' })
  assert.throws(() => resolveWorldProfile('missing', { root, env: {} }), /Unknown world/)
  assert.throws(() => resolveWorldProfile('../world2', { root, env: {} }), /World name/)
  assert.throws(() => resolveWorldProfile('world2', { root, env: {} }), /PUBLIC_ORIGIN/)
})

test('HTTPS world keeps shared TLS certificates and derives secure public URLs', t => {
  const root = fixture(t, {
    '.env': 'TLS_KEY_FILE=key.pem\nTLS_CERT_FILE=cert.pem\nPUBLIC_WS_URL=wss://world.example:3333/ws',
    '.env.world2': 'WORLD=worlds/world2\nPORT=3334\nPUBLIC_ORIGIN=https://world.example:3334',
  })
  const actual = resolveWorldProfile('world2', { root, env: {} })
  assert.equal(actual.TLS_KEY_FILE, 'key.pem')
  assert.equal(actual.TLS_CERT_FILE, 'cert.pem')
  assert.equal(actual.PUBLIC_WS_URL, 'wss://world.example:3334/ws')
  assert.equal(actual.PUBLIC_API_URL, 'https://world.example:3334/api')
  assert.equal(actual.ASSETS_BASE_URL, 'https://world.example:3334/assets')
})

test('world-2d inherits the default admin code and signing secret unless explicitly overridden', t => {
  const root = fixture(t, {
    '.env': 'ADMIN_CODE=shared-test-code\nJWT_SECRET=shared-test-secret',
    '.env.world-2d': 'WORLD=worlds/world-2d\nPORT=3335\nPUBLIC_ORIGIN=http://localhost:3335',
  })
  const inherited = resolveWorldProfile('world-2d', { root, env: {} })
  assert.equal(inherited.ADMIN_CODE, 'shared-test-code')
  assert.equal(inherited.JWT_SECRET, 'shared-test-secret')
  fs.writeFileSync(path.join(root, '.env.world-2d.local'), 'ADMIN_CODE=world-test-code')
  const overridden = resolveWorldProfile('world-2d', { root, env: {} })
  assert.equal(overridden.ADMIN_CODE, 'world-test-code')
  assert.equal(overridden.JWT_SECRET, 'shared-test-secret')
})

test('HTTP switch overrides HTTPS settings while preserving the selected world and dotenv cascade', t => {
  const root = fixture(t, {
    '.env':
      'WORLD=world\nPORT=3333\nJWT_SECRET=shared-test-secret\nTLS_KEY_FILE=missing.key\nTLS_CERT_FILE=missing.crt\nPUBLIC_WS_URL=wss://old/ws\nPUBLIC_API_URL=https://old/api\nASSETS_BASE_URL=https://old/assets',
    '.env.local': 'PORT=3334',
  })
  const actual = resolveWorldProfile(undefined, {
    root,
    env: { HOST: 'remote.example', CORS_ORIGIN: 'https://old', PUBLIC_API_URL: 'https://exported/api' },
    httpHost: '127.0.0.1',
  })
  assert.equal(actual.WORLD, 'world')
  assert.equal(actual.JWT_SECRET, 'shared-test-secret')
  assert.equal(actual.TLS_KEY_FILE, '')
  assert.equal(actual.TLS_CERT_FILE, '')
  assert.equal(actual.HOST, '0.0.0.0')
  assert.equal(actual.CORS_ORIGIN, 'http://127.0.0.1:3334')
  assert.equal(actual.PUBLIC_ORIGIN, 'http://127.0.0.1:3334')
  assert.equal(actual.PUBLIC_WS_URL, 'ws://127.0.0.1:3334/ws')
  assert.equal(actual.PUBLIC_API_URL, 'http://127.0.0.1:3334/api')
  assert.equal(actual.ASSETS_BASE_URL, 'http://127.0.0.1:3334/assets')
})

test('HTTP switch uses the named world and exported port, overriding profile and exported HTTPS URLs', t => {
  const root = fixture(t, {
    '.env': 'WORLD=world\nPORT=3333',
    '.env.world2':
      'WORLD=worlds/world2\nPORT=3334\nPUBLIC_ORIGIN=https://world.example\nPUBLIC_WS_URL=wss://world.example/ws\nASSETS_BASE_URL=https://cdn.example/assets',
    '.env.world2.local': 'PORT=3335\nTLS_KEY_FILE=missing.key\nTLS_CERT_FILE=missing.crt',
  })
  const actual = resolveWorldProfile('world2', {
    root,
    env: { PORT: '4444', PUBLIC_ORIGIN: 'https://exported', TLS_KEY_FILE: 'exported.key' },
    httpHost: '192.168.1.50',
  })
  assert.equal(actual.WORLD, 'worlds/world2')
  assert.equal(actual.PORT, '4444')
  assert.equal(actual.TLS_KEY_FILE, '')
  assert.equal(actual.TLS_CERT_FILE, '')
  assert.equal(actual.PUBLIC_ORIGIN, 'http://192.168.1.50:4444')
  assert.equal(actual.PUBLIC_WS_URL, 'ws://192.168.1.50:4444/ws')
  assert.equal(actual.ASSETS_BASE_URL, 'http://192.168.1.50:4444/assets')
})

test('HTTP switch supports IPv6 loopback with valid URLs and an IPv6 listener', t => {
  const root = fixture(t, { '.env': 'PORT=3333' })
  const actual = resolveWorldProfile(undefined, { root, env: {}, httpHost: '::1' })
  assert.equal(actual.HOST, '::')
  assert.equal(actual.PUBLIC_ORIGIN, 'http://[::1]:3333')
  assert.equal(new URL(actual.PUBLIC_WS_URL).hostname, '[::1]')
})

test('HTTP switch rejects invalid IPs, ports and missing worlds before startup', t => {
  const root = fixture(t, { '.env': 'PORT=3333' })
  for (const httpHost of ['', 'localhost', '192.168.1.50/path', '999.1.1.1']) {
    assert.throws(() => resolveWorldProfile(undefined, { root, env: {}, httpHost }), /--ip/)
  }
  for (const PORT of ['', '0', '-1', '65536', '3333.5', 'invalid']) {
    assert.throws(() => resolveWorldProfile(undefined, { root, env: { PORT }, httpHost: '127.0.0.1' }), /PORT/)
  }
  assert.throws(() => resolveWorldProfile('missing', { root, env: {}, httpHost: '127.0.0.1' }), /Unknown world/)
})
