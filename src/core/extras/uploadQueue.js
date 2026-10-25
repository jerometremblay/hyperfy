// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/uploadQueue.js
// Serial upload queue for the client: one transfer at a time, one short retry, batch cancellation.
// Pure: no world, no DOM. fetch and sleep are injectable for tests.

export const CHECK_TIMEOUT_MS = 30_000
export const UPLOAD_TIMEOUT_MS = 180_000
export const MAX_RETRY_AFTER_S = 5
const RETRY_STATUSES = new Set([429, 503])

// runs tasks one at a time in the order they were queued; a failure never blocks the next task.
// tasks may belong to a batch (an AbortController): when one of them fails the batch is aborted inside the
// queue's own chain, before the next entry is started, so the rest of the batch is skipped and rejects with
// the abort reason no matter how quickly the caller observes the failure. a task receives the batch signal
export function createUploadQueue() {
  let tail = Promise.resolve()
  function enqueue(task, { batch } = {}) {
    const signal = batch?.signal
    const run = () => {
      if (signal?.aborted) return Promise.reject(signal.reason)
      return new Promise(resolve => resolve(task(signal))).catch(err => {
        batch?.abort()
        throw err
      })
    }
    const result = tail.then(run, run)
    tail = result.catch(() => {})
    return result
  }
  return { enqueue }
}

// a fetch that gives up after timeoutMs, follows the caller's signal, and repeats once when the server
// answers 429/503 with a short Retry-After. any other response is returned as is, body unread
export async function fetchWithRetry(url, init, { timeoutMs, signal, fetch = globalThis.fetch, sleep = wait } = {}) {
  for (let attempt = 0; ; attempt++) {
    const link = linkSignal(signal, timeoutMs)
    let resp
    try {
      resp = await fetch(url, { ...init, signal: link.signal })
    } finally {
      link.clear()
    }
    if (resp.ok || attempt > 0 || !RETRY_STATUSES.has(resp.status)) return resp
    const after = await retryAfterOf(resp)
    if (after === null || after > MAX_RETRY_AFTER_S) return resp
    await sleep(after * 1000, signal)
  }
}

// an abort or a timeout is reported in the same shape as a server rejection
export function describeAbort(err) {
  if (err?.name === 'TimeoutError') return new Error('Upload failed: timed out')
  if (err?.name === 'AbortError') return new Error('Upload failed: cancelled')
  return err
}

// the seconds come from the body first: the header is not readable across origins
async function retryAfterOf(resp) {
  let value
  try {
    value = (await resp.clone().json()).retryAfter
  } catch (_err) {
    // not a json body
  }
  if (value === undefined || value === null) value = resp.headers.get('retry-after')
  if (value === undefined || value === null || value === '') return null
  const n = Number(value)
  return Number.isFinite(n) && n >= 0 ? n : null
}

// a signal that aborts on the caller's signal or after timeoutMs, and a clear() for when the request settled.
// AbortSignal.timeout needs Safari 16; older engines get a timer that is cleared on settle
function linkSignal(signal, timeoutMs) {
  const controller = new AbortController()
  const follow = source => () => controller.abort(source.reason)
  if (signal?.aborted) controller.abort(signal.reason)
  else signal?.addEventListener('abort', follow(signal), { once: true })
  let clear = () => {}
  if (typeof AbortSignal.timeout === 'function') {
    const timeout = AbortSignal.timeout(timeoutMs)
    timeout.addEventListener('abort', follow(timeout), { once: true })
  } else {
    const timer = setTimeout(() => controller.abort(new DOMException('request timed out', 'TimeoutError')), timeoutMs)
    clear = () => clearTimeout(timer)
  }
  return { signal: controller.signal, clear }
}

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) return reject(signal.reason)
    const onAbort = () => {
      clearTimeout(timer)
      reject(signal.reason)
    }
    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort)
      resolve()
    }, ms)
    signal?.addEventListener('abort', onAbort, { once: true })
  })
}
