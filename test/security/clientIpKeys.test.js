// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/clientIpKeys.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { clientIpKey, clientIpKeys } from '../../src/server/uploadLimits.js'

test('clientIpKeys: IPv4 and both expanded and compressed mapped spellings share one key', () => {
  for (const value of ['1.2.3.4', '::ffff:1.2.3.4', '::ffff:102:304', '0:0:0:0:0:FFFF:0102:0304']) {
    assert.deepEqual(clientIpKeys(value), { key: '1.2.3.4', parents: [] })
    assert.equal(clientIpKey(value), '1.2.3.4')
  }
})

test('clientIpKeys: /64 keys share /56 and /48 parents at the exact boundaries', () => {
  const a = clientIpKeys('2001:db8:1234:abcd::1')
  assert.deepEqual(a, { key: '2001:db8:1234:abcd::/64', parents: ['2001:db8:1234:ab00::/56', '2001:db8:1234::/48'] })
  assert.deepEqual(a.parents, clientIpKeys('2001:0db8:1234:abff:1:2:3:4').parents)
  assert.notEqual(a.parents[0], clientIpKeys('2001:db8:1234:ac00::').parents[0])
  assert.equal(a.parents[1], clientIpKeys('2001:db8:1234:ac00::').parents[1])
  assert.notEqual(a.parents[1], clientIpKeys('2001:db8:1235::').parents[1])
})

test('clientIpKeys: fallback, invalid headers, zone ids, and non-mapped embedded IPv4', () => {
  assert.deepEqual(clientIpKeys(['1.2.3.4'], '::ffff:102:304'), { key: '1.2.3.4', parents: [] })
  assert.deepEqual(clientIpKeys('garbage', 'bad'), { key: 'unknown', parents: [] })
  assert.equal(clientIpKeys('fe80::1%eth0').key, 'fe80:0:0:0::/64')
  assert.equal(clientIpKeys('2001:db8::1.2.3.4').parents.length, 2)
})
