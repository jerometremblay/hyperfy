import assert from 'node:assert/strict'
import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
assert.equal(profile.apiUrl, 'https://monstre.duckdns.org:3333/api/agent')
const client = makeClient(profile)
const original = { id:'0fygaLyowZ', blueprint:'gKzSLyeopN', position:[28.80285522800112,0.6209670371892955,4.623530605719165], quaternion:[0,-0.08344509548097004,0,0.9965123762604114], scale:[0.7209367720386733,1,0.7798459151911727], pinned:false }
const unchanged = async () => {
 const current = await client.request('/entities/' + original.id)
 for (const key of Object.keys(original)) assert.deepEqual(current[key], original[key], `Prompt box ${key} changed`)
 assert(!current.mover && !current.uploader, 'Prompt box is being edited')
 const blueprint = await client.request('/apps/' + original.blueprint)
 assert.equal(blueprint.version, 1)
 assert.equal(blueprint.props.prompt, 'A small high stool to sit while waiting to play pool. make it sittable.')
 return { current, blueprint }
}
const before = await unchanged()
const source = await readFile(new URL('./stool.js', import.meta.url), 'utf8')
await writeFile(new URL('./before.json', import.meta.url), JSON.stringify(before, null, 2))
const uploaded = await client.request('/scripts', { method:'POST', json:{source} })
assert.equal(uploaded.url, 'asset://' + createHash('sha256').update(source).digest('hex') + '.js')
assert.equal((await client.requestBytes('/assets/' + uploaded.url.slice(8))).bytes.toString(), source)
await unchanged()
const blueprint = await client.request('/apps', { method:'POST', json:{ name:'Pool Room Stool', model:'script-only', script:uploaded.url, desc:'A small padded stool for the pool room.' } })
const position = [...original.position]; position[1] -= original.scale[1] / 2
const entity = await client.request('/entities', { method:'POST', json:{ blueprint:blueprint.id, position, quaternion:original.quaternion, scale:[1,1,1] } })
await writeFile(new URL('./created.json', import.meta.url), JSON.stringify({blueprint, entity}, null, 2))
assert.deepEqual((await client.request('/entities/' + entity.id)).position, position)
assert.equal((await client.request('/apps/' + blueprint.id)).script, uploaded.url)
await unchanged()
await client.request('/entities/' + original.id, { method:'DELETE' })
const snapshot = await client.request('/snapshot?excludeSeatPoses=true')
assert(snapshot.entities.some(e => e.id === entity.id && e.blueprint === blueprint.id))
assert(!snapshot.entities.some(e => e.id === original.id))
console.log(JSON.stringify({entityId:entity.id, blueprintId:blueprint.id, position, promptBoxRemoved:true}, null, 2))
