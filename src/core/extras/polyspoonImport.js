const MAX_RECIPE_BYTES = 512000

async function downloadRecipe(url, fetcher) {
  let response
  try {
    response = await fetcher(url.href, {
      credentials: 'omit', referrerPolicy: 'no-referrer', redirect: 'follow', signal: AbortSignal.timeout(30000),
    })
  } catch {
    throw new Error('Could not load the recipe. The URL must allow cross-origin access.')
  }
  if (!response.ok) throw new Error(`Could not load the recipe (${response.status})`)
  if (response.url && new URL(response.url).protocol !== 'https:') throw new Error('Recipe redirects must use HTTPS')
  if (!response.body) throw new Error('The recipe is empty')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > MAX_RECIPE_BYTES) throw new Error('The recipe is too large')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  try { return new TextDecoder('utf-8', { fatal: true }).decode(bytes) }
  catch { throw new Error('The recipe must be UTF-8 text') }
}

export async function importPolyspoonRecipe(world, input, fetcher = fetch, params = {}) {
  let url
  try { url = new URL(input) } catch { throw new Error('Enter a valid HTTPS URL') }
  if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048) throw new Error('Enter a valid HTTPS URL')
  const isAsset = url.origin === 'https://polyspoon.com' && /^\/asset\/[a-f0-9]{64}\/?$/.test(url.pathname)
  const body = isAsset ? { assetUrl: url.href, params } : { source: await downloadRecipe(url, fetcher), params }
  const result = await fetcher(`${world.network.apiUrl}/polyspoon/recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${world.network.authToken}` },
    body: JSON.stringify(body),
  })
  const data = await result.json().catch(() => ({}))
  if (!result.ok) throw new Error(data.error || 'Could not add the recipe')
  if (!/^polyspoon:\/\/[a-f0-9]{64}$/.test(data.model || '')) throw new Error('Invalid response from the world')
  let name = isAsset && typeof data.name === 'string' ? data.name : url.pathname.split('/').pop() || ''
  try { name = decodeURIComponent(name) } catch {}
  name = name.replace(/(?:\.recipe)?\.mjs$/i, '').replace(/[-_]+/g, ' ').trim()
  if (!name) name = 'Polyspoon object'
  return { name: name.slice(0, 100), url: url.href, model: data.model, script: null, props: {}, image: null, preload: false, public: false, locked: false, unique: false, scene: false, disabled: false }
}

// Preserve the existing blueprint and transform; only its approved recipe changes.
export async function refreshPolyspoonRecipe(world, app, fetcher = fetch) {
  const initial = world.blueprints.get(app.data.blueprint)
  if (!initial || !/^(?:polyspoon|polyfork):\/\/[a-f0-9]{64}$/.test(initial.model || '') || !initial.url || initial.frozen) {
    throw new Error('This object has no refreshable recipe source')
  }
  const paramsJson = JSON.stringify(initial.props || {})
  const polyfork = /^https:\/\/polyfork\.dev\/asset\/([a-z0-9-]+)(\?edition=hd)?$/.exec(initial.url)
  const updated = polyfork
    ? await importPolyforkModel(world, { id: polyfork[1], title: initial.name }, fetcher, JSON.parse(paramsJson), { hd: !!polyfork[2], cdnBase: globalThis.localStorage?.getItem('polyforkCdnBase') || '' })
    : await importPolyspoonRecipe(world, initial.url, fetcher, JSON.parse(paramsJson))
  const current = world.blueprints.get(initial.id)
  if (
    world.entities.get(app.data.id) !== app || app.data.blueprint !== initial.id ||
    !world.entities.player.isAdmin() || !current || current.frozen ||
    current.version !== initial.version || current.model !== initial.model || current.url !== initial.url ||
    JSON.stringify(current.props || {}) !== paramsJson
  ) throw new Error('The object changed while refreshing; please try again')
  if (updated.model === current.model) return false
  if (!world.blueprints.modify({ id: current.id, version: current.version + 1, model: updated.model }, true)) {
    throw new Error('Could not save the refreshed object')
  }
  return true
}

async function polyforkCdn(world, fetcher, hd, cdnBase) {
  if (!hd) return ''
  if (!cdnBase) {
    const config = await fetcher(`${world.network.apiUrl}/polyspoon/cdn`, { headers: { Authorization: `Bearer ${world.network.authToken}` } })
    const data = await config.json().catch(() => ({}))
    if (!config.ok) throw new Error(data.error || 'Could not read Polyfork configuration')
    cdnBase = data.url || ''
  }
  if (!/^https:\/\/polyfork\.dev\/c\/[a-f0-9]+\/$/.test(cdnBase)) throw new Error('Configure a Polyfork CDN URL to use HD models')
  return cdnBase
}

export async function loadPolyforkSource(world, asset, fetcher = fetch, { hd = false, cdnBase = '' } = {}) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id || '')) throw new Error('Invalid Polyfork model')
  cdnBase = await polyforkCdn(world, fetcher, hd, cdnBase)
  const url = new URL(hd ? `${cdnBase}${asset.id}-hd.mjs` : `https://polyfork.dev/cdn/${asset.id}.mjs`)
  return downloadRecipe(url, fetcher)
}

export async function importPolyforkModel(world, asset, fetcher = fetch, params = {}, options = {}) {
  const { hd = false } = options
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(asset.id || '')) throw new Error('Invalid Polyfork model')
  const cdnBase = await polyforkCdn(world, fetcher, hd, options.cdnBase || '')
  const result = await fetcher(`${world.network.apiUrl}/polyspoon/native-recipes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${world.network.authToken}` },
    body: JSON.stringify({ id: asset.id, hd, cdnBase, params }),
  })
  const data = await result.json().catch(() => ({}))
  if (!result.ok) throw new Error(data.error || 'Could not add the Polyfork model')
  if (!/^polyfork:\/\/[a-f0-9]{64}$/.test(data.model || '')) throw new Error('Invalid response from the world')
  return { name: String(asset.title || asset.id).slice(0, 100), url: `https://polyfork.dev/asset/${asset.id}${hd ? '?edition=hd' : ''}`, model: data.model, script: null, props: params, image: null, preload: false, public: false, locked: false, unique: false, scene: false, disabled: false }
}
