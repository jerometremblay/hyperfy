import assert from 'node:assert/strict'
import test from 'node:test'
import { createClientScriptStorage } from './clientScriptStorage.js'

test('script keys persist through the existing storage API and cannot read or overwrite host credentials', () => {
  const values = new Map([['authToken', 'host-token'], ['prefs', { view: 'pixel' }]])
  const host = { get: key => values.get(key), set: (key, value) => values.set(key, value) }
  const scripts = createClientScriptStorage(host)
  assert.equal(scripts.get('authToken'), undefined)
  scripts.set('authToken', 'app-value')
  assert.equal(values.get('authToken'), 'host-token')
  scripts.set('prefs', { own: true })
  assert.deepEqual(values.get('prefs'), { view: 'pixel' })
  scripts.set('hyperfy-journal-pages-v1', { pages: ['cached'] })
  assert.deepEqual(createClientScriptStorage(host).get('hyperfy-journal-pages-v1'), { pages: ['cached'] })
})
