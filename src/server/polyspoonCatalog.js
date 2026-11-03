const ORIGIN = 'https://polyspoon.com'

// Polyspoon's catalog and recipe downloads do not permit cross-origin browser
// requests. Restrict server requests to known paths on this fixed origin.
async function readPolyspoon(path, limit, fetcher) {
  const response = await fetcher(`${ORIGIN}${path}`, { redirect: 'error', signal: AbortSignal.timeout(15000) })
  if (!response.ok || !response.body) throw new Error('Polyspoon could not provide this asset')
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > limit) throw new Error('Polyspoon response is too large')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
  }
  return new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
}

export async function resolvePolyspoonAsset(input, fetcher = fetch) {
  let url
  try { url = new URL(input) } catch { throw new Error('Enter a valid Polyspoon asset URL') }
  const match = /^\/asset\/([a-f0-9]{64})\/?$/.exec(url.pathname)
  if (url.origin !== ORIGIN || url.username || url.password || !match) {
    throw new Error('Enter a valid Polyspoon asset URL')
  }
  const id = match[1]
  let model
  try { model = JSON.parse(await readPolyspoon(`/api/catalog/${id}`, 1000000, fetcher)) }
  catch { throw new Error('Could not read the Polyspoon asset') }
  if (model.id !== id || !/^[a-z0-9][a-z0-9-]{0,79}$/.test(model.sourceFamily || '')) {
    throw new Error('This Polyspoon asset does not provide a supported recipe')
  }
  if (model.sourcePackage) throw new Error('This Polyspoon asset uses a source package that is not supported yet')
  const page = await readPolyspoon(`/asset/${id}`, 100000, fetcher)
  const loaderPath = page.match(/\/app\/assets\/recipe-loader-[A-Za-z0-9_-]+\.js/)?.[0]
  if (!loaderPath) throw new Error('Could not find Polyspoon recipe information')
  const loader = await readPolyspoon(loaderPath, 512000, fetcher)
  const family = model.sourceFamily
  const mapping = new RegExp(`["']\\./modules/${family}/([0-9.]+)/asset\\.mjs["']\\s*:\\s*([A-Za-z_$][\\w$]*)`, 'g')
  const choices = [...loader.matchAll(mapping)].sort((a, b) => b[1].localeCompare(a[1]))
  if (!choices.length) throw new Error('This Polyspoon asset does not provide a supported recipe')
  const symbol = choices[0][2].replace(/[$]/g, '\\$&')
  const assignment = new RegExp(`(?:^|[,;]|\\b(?:var|let|const)\\s+)${symbol}\\s*=\\s*([\x60"'])(/app/assets/asset-[A-Za-z0-9_-]+\\.mjs)\\1`)
  const recipePath = loader.match(assignment)?.[2]
  if (!recipePath) throw new Error('Could not find the Polyspoon recipe download')
  const source = await readPolyspoon(recipePath, 512000, fetcher)
  const hint = [model.candidate, model.handle, model.title].filter(value => typeof value === 'string').join(' ').slice(0, 1000)
  return { source, name: typeof model.title === 'string' ? model.title.slice(0, 100) : 'Polyspoon object', hint, recipeUrl: `${ORIGIN}${recipePath}` }
}

// Match Polyspoon's own preset selection from its catalog hint. This wrapper
// executes with the recipe inside the sandbox, never in the host process.
export function applyPolyspoonCatalogPreset(compiled, hint) {
  return `${compiled}\n;PolyspoonRecipe=(()=>{const r=PolyspoonRecipe,h=${JSON.stringify(hint)}.toLowerCase().replace(/[^a-z0-9]+/g,' ');let best=null,score=0;for(const p of r.metadata.presets||[]){const id=String(p.id).toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),words=id.split(' ').filter(Boolean);if(words.length&&words.every(w=>h.includes(w))&&id.length>score){best=p;score=id.length}}return {...r,createAsset:params=>r.createAsset({...best?.parameters,...params})}})();`
}
