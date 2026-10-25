// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/uploadQueue.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'

import {
  MAX_RETRY_AFTER_S,
  createUploadQueue,
  describeAbort,
  fetchWithRetry,
} from '../../src/core/extras/uploadQueue.js'

const tick = () => new Promise(resolve => setTimeout(resolve, 5))
const json = (status, body, headers = {}) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json', ...headers } })
// a fetch stand-in that answers from a script and records every call; a `null` entry never answers.
// a stalled call keeps the loop alive the way an open socket would (AbortSignal.timeout is unref'd in node)
const scripted = answers => {
  const calls = []
  const fetch = (url, init) =>
    new Promise((resolve, reject) => {
      calls.push({ url, init })
      const answer = answers.shift()
      const open = setTimeout(() => {}, 30_000)
      init.signal.addEventListener(
        'abort',
        () => {
          clearTimeout(open)
          reject(init.signal.reason)
        },
        { once: true }
      )
      if (answer !== null) {
        clearTimeout(open)
        resolve(answer)
      }
    })
  return { fetch, calls }
}
const sleeps = []
const sleep = ms => {
  sleeps.push(ms)
  return Promise.resolve()
}

test('queue: tasks run one at a time in order, and a failure does not block the next', async () => {
  const queue = createUploadQueue()
  const log = []
  const task = (name, fail) => async () => {
    log.push(`${name}:start`)
    await tick()
    log.push(`${name}:end`)
    if (fail) throw new Error(name)
    return name
  }
  const results = await Promise.allSettled([
    queue.enqueue(task('a')),
    queue.enqueue(task('b', true)),
    queue.enqueue(task('c')),
  ])
  assert.deepEqual(log, ['a:start', 'a:end', 'b:start', 'b:end', 'c:start', 'c:end'])
  assert.equal(results[0].value, 'a')
  assert.equal(results[1].reason.message, 'b')
  assert.equal(results[2].value, 'c')
  assert.equal(await queue.enqueue(task('d')), 'd', 'the queue keeps working afterwards')
})

test('queue: a failing task aborts its batch inside the queue, so the rest is skipped and other batches run on', async () => {
  const queue = createUploadQueue()
  const task = (ran, name, fail) => async () => {
    ran.push(name)
    await tick()
    if (fail) throw new Error(name)
    return name
  }
  // the calling pattern of ClientBuilder through ClientNetwork.upload: enqueue each file with the batch and
  // Promise.all them. the same through an async wrapper, whose extra microtask hop must make no difference
  for (const [label, wrap] of [
    ['direct', fn => fn],
    [
      'async wrapper',
      fn =>
        async (...args) =>
          fn(...args),
    ],
  ]) {
    const ran = []
    const batch = new AbortController()
    const other = new AbortController()
    const enqueue = wrap(queue.enqueue)
    const promises = [
      enqueue(task(ran, 'a', true), { batch }),
      enqueue(task(ran, 'b'), { batch }),
      enqueue(task(ran, 'c'), { batch }),
      enqueue(task(ran, 'd'), { batch: other }),
    ]
    await assert.rejects(Promise.all(promises), /^Error: a$/)
    const results = await Promise.allSettled(promises)
    assert.deepEqual(ran, ['a', 'd'], `${label}: b and c never started`)
    assert.equal(results[1].reason.name, 'AbortError', label)
    assert.equal(results[2].reason.name, 'AbortError', label)
    assert.equal(results[3].value, 'd', `${label}: another batch is unaffected`)
    assert.equal(batch.signal.aborted, true)
    assert.equal(other.signal.aborted, false)
  }
})

test('queue: an abort from outside skips what has not started; the running task sees the signal', async () => {
  const queue = createUploadQueue()
  const batch = new AbortController()
  const other = new AbortController()
  const ran = []
  const task = name => signal =>
    new Promise((resolve, reject) => {
      ran.push(name)
      signal?.addEventListener('abort', () => reject(signal.reason), { once: true })
      setTimeout(() => resolve(name), 20)
    })
  const a = queue.enqueue(task('a'), { batch })
  const b = queue.enqueue(task('b'), { batch })
  const c = queue.enqueue(task('c'), { batch })
  const d = queue.enqueue(task('d'), { batch: other })
  await tick()
  batch.abort()
  const results = await Promise.allSettled([a, b, c, d])
  assert.deepEqual(ran, ['a', 'd'], 'b and c never ran')
  assert.equal(results[0].status, 'rejected')
  assert.equal(results[0].reason.name, 'AbortError')
  assert.equal(results[1].status, 'rejected')
  assert.equal(results[2].status, 'rejected')
  assert.equal(results[3].value, 'd', 'another batch is unaffected')
})

test('fetchWithRetry: one retry on 429/503 when the body says to come back soon', async () => {
  for (const status of [429, 503]) {
    sleeps.length = 0
    const { fetch, calls } = scripted([json(status, { error: 'busy', retryAfter: 2 }), json(200, { ok: true })])
    const resp = await fetchWithRetry('/u', { method: 'POST' }, { timeoutMs: 1000, fetch, sleep })
    assert.equal(resp.status, 200)
    assert.equal(calls.length, 2)
    assert.equal(calls[1].init.method, 'POST', 'the same request again')
    assert.deepEqual(sleeps, [2000])
  }
  // the header is used when the body has no retryAfter
  const { fetch, calls } = scripted([new Response('', { status: 503, headers: { 'retry-after': '1' } }), json(200, {})])
  assert.equal((await fetchWithRetry('/u', {}, { timeoutMs: 1000, fetch, sleep })).status, 200)
  assert.equal(calls.length, 2)
  // a second refusal is returned, body intact
  const twice = scripted([json(429, { error: 'first', retryAfter: 1 }), json(429, { error: 'second', retryAfter: 1 })])
  const resp = await fetchWithRetry('/u', {}, { timeoutMs: 1000, fetch: twice.fetch, sleep })
  assert.equal(resp.status, 429)
  assert.equal((await resp.json()).error, 'second')
  assert.equal(twice.calls.length, 2)
})

test('fetchWithRetry: no retry on a long Retry-After, a missing one, or any other status', async () => {
  const long = scripted([json(429, { error: 'wait', retryAfter: MAX_RETRY_AFTER_S + 1 })])
  let resp = await fetchWithRetry('/u', {}, { timeoutMs: 1000, fetch: long.fetch, sleep })
  assert.equal(resp.status, 429)
  assert.equal((await resp.json()).error, 'wait', 'the body is still readable')
  assert.equal(long.calls.length, 1)
  const none = scripted([new Response('busy', { status: 503 })])
  resp = await fetchWithRetry('/u', {}, { timeoutMs: 1000, fetch: none.fetch, sleep })
  assert.equal(resp.status, 503)
  assert.equal(none.calls.length, 1)
  for (const status of [507, 413, 415, 403, 401, 500]) {
    const s = scripted([json(status, { error: 'no', retryAfter: 1 })])
    resp = await fetchWithRetry('/u', {}, { timeoutMs: 1000, fetch: s.fetch, sleep })
    assert.equal(resp.status, status)
    assert.equal(s.calls.length, 1, `status ${status}`)
  }
})

test('fetchWithRetry: times out, follows the batch signal, and both read as upload failures', async () => {
  const stalled = scripted([null])
  await assert.rejects(fetchWithRetry('/u', {}, { timeoutMs: 20, fetch: stalled.fetch, sleep }), err => {
    assert.equal(err.name, 'TimeoutError')
    assert.equal(describeAbort(err).message, 'Upload failed: timed out')
    return true
  })
  const batch = new AbortController()
  const held = scripted([null])
  const pending = fetchWithRetry('/u', {}, { timeoutMs: 10_000, signal: batch.signal, fetch: held.fetch, sleep })
  await tick()
  batch.abort()
  await assert.rejects(pending, err => {
    assert.equal(err.name, 'AbortError')
    assert.equal(describeAbort(err).message, 'Upload failed: cancelled')
    return true
  })
  // an abort during the retry wait
  const waiting = scripted([json(429, { retryAfter: 1 })])
  const ctrl = new AbortController()
  const realSleep = (ms, signal) =>
    new Promise((_, reject) => signal.addEventListener('abort', () => reject(signal.reason)))
  const p = fetchWithRetry('/u', {}, { timeoutMs: 1000, signal: ctrl.signal, fetch: waiting.fetch, sleep: realSleep })
  await tick()
  ctrl.abort()
  await assert.rejects(p, err => err.name === 'AbortError')
  assert.equal(waiting.calls.length, 1)
  const plain = new Error('Upload failed: too many uploads')
  assert.equal(describeAbort(plain), plain, 'server rejections pass through')
})

test('fetchWithRetry: without AbortSignal.timeout a timer stands in, and it is cleared once the request settles', async () => {
  const native = AbortSignal.timeout
  delete AbortSignal.timeout
  try {
    assert.equal(typeof AbortSignal.timeout, 'undefined')
    const stalled = scripted([null])
    await assert.rejects(fetchWithRetry('/u', {}, { timeoutMs: 20, fetch: stalled.fetch, sleep }), err => {
      assert.equal(err.name, 'TimeoutError')
      assert.equal(describeAbort(err).message, 'Upload failed: timed out')
      return true
    })
    const timers = () => process.getActiveResourcesInfo().filter(r => r === 'Timeout').length
    const baseline = timers()
    const quick = scripted([json(200, { ok: true })])
    assert.equal((await fetchWithRetry('/u', {}, { timeoutMs: 60_000, fetch: quick.fetch, sleep })).status, 200)
    assert.equal(timers(), baseline, 'no 60 s timer left behind')
  } finally {
    AbortSignal.timeout = native
  }
})
