/** Check a remote endpoint without treating a legacy world's missing API as downtime. */
export async function checkPortalDestination(url, portalId, fetchImpl = globalThis.fetch, signal) {
  const statusURL = new URL(url)
  statusURL.pathname = `${statusURL.pathname.replace(/\/$/, '')}/api/portal-status`
  statusURL.search = ''
  statusURL.hash = ''
  if (portalId) statusURL.searchParams.set('portalId', portalId)
  try {
    const response = await fetchImpl(statusURL.href, { signal, cache: 'no-store', credentials: 'omit' })
    if (response.status >= 500) return `Remote world unavailable (HTTP ${response.status})`
    if (response.ok && response.headers.get('content-type')?.includes('application/json')) {
      const status = await response.json()
      if (typeof status.available === 'boolean') {
        return status.available
          ? ''
          : typeof status.error === 'string'
            ? status.error.slice(0, 160)
            : 'Destination portal unavailable'
      }
    }
  } catch {
    if (signal?.aborted) return 'Remote destination timed out'
  }
  try {
    const response = await fetchImpl(url, { signal, cache: 'no-store', credentials: 'omit' })
    return response.ok ? '' : `Remote world unavailable (HTTP ${response.status})`
  } catch {
    if (signal?.aborted) return 'Remote destination timed out'
    // An opaque response proves reachability, but cannot expose HTTP status or portal IDs.
    try {
      await fetchImpl(url, { signal, mode: 'no-cors', cache: 'no-store', credentials: 'omit' })
      return ''
    } catch {
      return signal?.aborted ? 'Remote destination timed out' : 'Remote world unreachable'
    }
  }
}
