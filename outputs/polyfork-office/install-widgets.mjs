import fs from 'node:fs/promises'
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { loadProfile,makeClient } from '../../tools/worldsync/src/deployment.mjs'
const c=makeClient(await loadProfile('../hyperfy-world-jerome','online-world'))
const created=JSON.parse(await fs.readFile(new URL('created.json',import.meta.url),'utf8'))
const assetIds={bookcase:'alcove-bookcase-83894d',plant:'floor-houseplant-8fad17',rug:'wool-rug-ab2bd1',lamp:'table-lamp-e25998'}
const plan=[]
for(const item of created){
 const blueprint=await c.request('/apps/'+item.blueprint.id),entity=await c.request('/entities/'+item.entity.id)
 assert.deepEqual(blueprint,item.blueprint,'Blueprint was edited: '+item.key)
 for(const field of ['id','blueprint','position','scale','pinned'])assert.deepEqual(entity[field],item.entity[field],item.key+' changed: '+field)
 assert(entity.quaternion.every((v,i)=>Math.abs(v-item.entity.quaternion[i])<1e-12),item.key+' rotation changed')
 assert(!entity.mover&&!entity.uploader,'Object is being moved: '+item.key)
 const source=await fs.readFile(new URL(item.key+'-compiled.js',import.meta.url),'utf8')
 const hash=createHash('sha256').update(source).digest('hex')
 plan.push({key:item.key,blueprint,entity,source,model:'polyspoon://'+hash,url:`https://polyfork.dev/asset/${assetIds[item.key]}?edition=hd`})
}
if(!process.argv.includes('--write')) {console.log('Ready to register and update',plan.map(p=>p.key).join(', '));process.exit(0)}
for(const p of plan){const result=await c.request('/polyspoon/recipes',{method:'POST',json:{source:p.source,params:p.blueprint.props}});assert.equal(result.model,p.model)}
const result=[]
for(const p of plan){
 assert.deepEqual(await c.request('/apps/'+p.blueprint.id),p.blueprint,'Blueprint changed while registering: '+p.key)
 const e=await c.request('/entities/'+p.entity.id);for(const field of ['id','blueprint','position','quaternion','scale','pinned'])assert.deepEqual(e[field],p.entity[field]);assert(!e.mover&&!e.uploader)
 const updated=await c.request('/apps/'+p.blueprint.id,{method:'PATCH',json:{version:p.blueprint.version,model:p.model,url:p.url}})
 assert.equal(updated.model,p.model);assert.equal(updated.url,p.url);assert.equal(updated.version,p.blueprint.version+1)
 result.push({key:p.key,blueprint:updated,entity:p.entity});await fs.writeFile(new URL('widgets-deployed.json',import.meta.url),JSON.stringify(result,null,2));console.log('Updated',p.key)
}
for(const p of result){assert.deepEqual(await c.request('/apps/'+p.blueprint.id),p.blueprint);const e=await c.request('/entities/'+p.entity.id);for(const field of ['position','quaternion','scale','pinned'])assert.deepEqual(e[field],p.entity[field]);const bytes=(await c.requestBytes('/assets/'+p.blueprint.model.slice(12)+'.js')).bytes;assert.equal(createHash('sha256').update(bytes).digest('hex'),p.blueprint.model.slice(12))}
console.log('Verified editable recipe assets, blueprints, and unchanged placements')
