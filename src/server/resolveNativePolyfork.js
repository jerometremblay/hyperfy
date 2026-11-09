// Only the publisher's CDN may supply native code. Browser-submitted source
// cannot establish provenance, even when it claims to be a Polyfork model.
export async function resolveNativePolyfork({ id, hd = false, cdnBase = '' }, fetcher = fetch) {
  if (typeof id !== 'string' || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id) || id.length > 160 || typeof hd !== 'boolean') {
    throw new Error('Invalid Polyfork model')
  }
  if (hd && (typeof cdnBase !== 'string' || !/^https:\/\/polyfork\.dev\/c\/[a-f0-9]+\/$/.test(cdnBase))) {
    throw new Error('Invalid Polyfork CDN URL')
  }
  const url = hd ? `${cdnBase}${id}-hd.mjs` : `https://polyfork.dev/cdn/${id}.mjs`
  const response = await fetcher(url, { redirect: 'error', signal: AbortSignal.timeout(30000) })
  if (!response.ok || !response.body) throw new Error('Could not download Polyfork model')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    for (;;) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 512000) throw new Error('Polyfork model is too large')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
  }
  if (!size) throw new Error('Polyfork model is empty')
  const bytes = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)))
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
  catch { throw new Error('Polyfork model must be UTF-8') }
}
