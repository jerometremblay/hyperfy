// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/coalesce.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import { createOnce } from '../../src/server/coalesce.js'

const tick = () => new Promise(resolve => setTimeout(resolve, 5))

test('createOnce: callers overlapping on a key share one attempt, and only the first is told it created', async () => {
  const inflight = new Map()
  let creates = 0
  let finish
  const create = () =>
    new Promise(resolve => {
      creates++
      finish = resolve
    })
  const p1 = createOnce(inflight, 'k', create)
  const p2 = createOnce(inflight, 'k', create)
  const p3 = createOnce(inflight, 'k', create)
  const other = createOnce(inflight, 'other', async () => true)
  await tick()
  assert.equal(creates, 1, 'one attempt for k')
  assert.equal(inflight.size, 1, 'only k is still in flight')
  finish(true)
  assert.deepEqual(await Promise.all([p1, p2, p3, other]), [true, false, false, true])
  assert.equal(inflight.size, 0)
  // afterwards the store decides again: here it reports the content as already there
  assert.equal(await createOnce(inflight, 'k', async () => false), false)
  assert.equal(creates, 1)
})

test('createOnce: when the shared attempt fails, the waiter makes its own and the failure reaches the first caller', async () => {
  const inflight = new Map()
  let n = 0
  const create = () => (n++ === 0 ? Promise.reject(new Error('disk full')) : Promise.resolve(true))
  const first = createOnce(inflight, 'k', create)
  const second = createOnce(inflight, 'k', create)
  await assert.rejects(first, /disk full/)
  assert.equal(await second, true)
  assert.equal(n, 2)
  assert.equal(inflight.size, 0)
})
