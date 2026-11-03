import { readFile } from 'node:fs/promises'
import { parseArgs } from 'node:util'
import { compilePolyspoonRecipe } from '../src/server/compilePolyspoonRecipe.js'
import { loadProfile, makeClient } from '../tools/worldsync/src/deployment.mjs'

const { values } = parseArgs({
  options: {
    url: { type: 'string' },
    file: { type: 'string' },
    name: { type: 'string' },
    position: { type: 'string' },
    params: { type: 'string', default: '{}' },
    root: { type: 'string', default: '../hyperfy-world-jerome' },
    profile: { type: 'string', default: 'online-world' },
  },
})
if (!!values.url === !!values.file || !values.name || !values.position) {
  throw new Error('Provide --url or --file, --name, and --position as a JSON [x,y,z] array')
}
const position = JSON.parse(values.position)
const props = JSON.parse(values.params)
if (!Array.isArray(position) || position.length !== 3 || !position.every(Number.isFinite)) {
  throw new Error('Position must contain three finite numbers')
}
if (!props || typeof props !== 'object' || Array.isArray(props)) throw new Error('Parameters must be a JSON object')

let source
let sourceUrl
if (values.url) {
  const url = new URL(values.url)
  if (url.protocol !== 'https:' || url.username || url.password || url.href.length > 2048) throw new Error('Recipe URL must use HTTPS and be at most 2048 characters')
  sourceUrl = url.href
  const response = await fetch(url, { redirect: 'error', signal: AbortSignal.timeout(30000) })
  if (!response.ok) throw new Error(`Recipe download failed (${response.status})`)
  const reader = response.body.getReader()
  const chunks = []
  let size = 0
  try {
    while (true) {
      const { value, done } = await reader.read()
      if (done) break
      size += value.byteLength
      if (size > 512000) throw new Error('Recipe is too large')
      chunks.push(value)
    }
  } finally {
    await reader.cancel()
  }
  source = new TextDecoder('utf-8', { fatal: true }).decode(Buffer.concat(chunks))
} else {
  source = await readFile(values.file, 'utf8')
}
if (Buffer.byteLength(source) > 512000) throw new Error('Recipe is too large')
const bundledSource = await compilePolyspoonRecipe(source)
const client = makeClient(await loadProfile(values.root, values.profile))
const { model } = await client.request('/polyspoon/recipes', {
  method: 'POST',
  json: { source: bundledSource, params: props },
})
const blueprint = await client.request('/apps', { method: 'POST', json: { name: values.name, model, props, ...(sourceUrl ? { url: sourceUrl } : {}) } })
const entity = await client.request('/entities', { method: 'POST', json: { blueprint: blueprint.id, position } })
console.log(JSON.stringify({ model, blueprint: blueprint.id, entity: entity.id, position }))
