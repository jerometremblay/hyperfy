import assert from 'node:assert/strict'
import test from 'node:test'
import { checkPortalDestination } from './portalDestination.js'

function status(available, error) {
  return new Response(JSON.stringify({ available, error }), { headers: { 'content-type': 'application/json' } })
}

test('remote status reports a missing portal ID and preserves a subpath', async () => {
  const requests = []
  const error = await checkPortalDestination('https://example.com/world/?x=1#view', 'missing', async url => {
    requests.push(url)
    return status(false, 'Destination portal not found')
  })
  assert.equal(error, 'Destination portal not found')
  assert.deepEqual(requests, ['https://example.com/world/api/portal-status?portalId=missing'])
})

test('an available native endpoint needs no page fallback', async () => {
  assert.equal(await checkPortalDestination('https://example.com', 'exit', async () => status(true)), '')
})

test('legacy worlds fall back to the page and report HTTP failures', async () => {
  for (const code of [200, 404, 503]) {
    let calls = 0
    const error = await checkPortalDestination('https://example.com/world', 'exit', async () => {
      if (calls++ === 0) return new Response(null, { status: 404 })
      return new Response(null, { status: code })
    })
    assert.equal(error, code === 200 ? '' : `Remote world unavailable (HTTP ${code})`)
    assert.equal(calls, 2)
  }
})

test('network failures are errors; CORS-only failures use opaque reachability', async () => {
  assert.equal(
    await checkPortalDestination('https://example.com', '', async () => {
      throw new Error('offline')
    }),
    'Remote world unreachable'
  )
  assert.equal(
    await checkPortalDestination('https://example.com', '', async (_url, options) => {
      if (options.mode === 'no-cors') return new Response()
      throw new Error('CORS')
    }),
    ''
  )
})

test('timeouts do not retry an aborted request', async () => {
  const controller = new AbortController()
  controller.abort()
  let calls = 0
  const error = await checkPortalDestination(
    'https://example.com',
    '',
    async () => {
      calls++
      throw new Error('aborted')
    },
    controller.signal
  )
  assert.equal(error, 'Remote destination timed out')
  assert.equal(calls, 1)
})

test('a remote status service error is not hidden by a successful page fallback', async () => {
  let calls = 0
  const error = await checkPortalDestination('https://example.com', 'exit', async () => {
    calls++
    return new Response(null, { status: 503 })
  })
  assert.equal(error, 'Remote world unavailable (HTTP 503)')
  assert.equal(calls, 1)
})
