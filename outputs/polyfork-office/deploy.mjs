import fs from 'node:fs/promises'
import {createHash, randomUUID} from 'node:crypto'
import assert from 'node:assert/strict'
import {Vector3,Quaternion} from 'three'
import {loadProfile,makeClient} from '../../tools/worldsync/src/deployment.mjs'
const client=makeClient(await loadProfile('../hyperfy-world-jerome','online-world'))
const snapshot=await client.request('/snapshot?excludeSeatPoses=true')
const house=snapshot.entities.find(e=>e.id==='HCzjtaVZFI'), desk=snapshot.entities.find(e=>e.id==='d16ab219-9538-445c-a9c1-02a9cbf2ae2e')
const houseBlueprint=snapshot.blueprints.find(b=>b.id===house.blueprint)
assert.equal(houseBlueprint.version,30);assert.deepEqual(house.scale,[1,1,1]);assert.equal(house.pinned,true)
assert.deepEqual(desk.position,[42.88400561516337,3.302967176636911,16.846898913569728]);assert.deepEqual(desk.quaternion,house.quaternion)
const q=new Quaternion(...house.quaternion), base=new Vector3(...house.position)
const specs=[
 {key:'bookcase',name:'Polyfork HD Alcove Bookcase',local:[-2.46,3.302,7.95],yaw:Math.PI/2},
 {key:'plant',name:'Polyfork HD Floor Houseplant',local:[2.42,3.302,8.15],yaw:0},
 {key:'rug',name:'Polyfork HD Wool Rug',local:[0,3.304,8.8],yaw:0},
 {key:'lamp',name:'Polyfork HD Table Lamp',local:[-1.84,4.083,10.51],yaw:0},
]
const plan=[]
for(const item of specs){const bytes=await fs.readFile(new URL(item.key+'.glb',import.meta.url));assert.equal(bytes.toString('ascii',0,4),'glTF');const hash=createHash('sha256').update(bytes).digest('hex');const pos=new Vector3(...item.local).applyQuaternion(q).add(base).toArray();const rot=q.clone().multiply(new Quaternion().setFromAxisAngle(new Vector3(0,1,0),item.yaw)).toArray();plan.push({...item,bytes,hash,position:pos,quaternion:rot,blueprintId:randomUUID(),entityId:randomUUID()})}
await fs.writeFile(new URL('baseline.json',import.meta.url),JSON.stringify(snapshot,null,2))
console.log(JSON.stringify(plan.map(({bytes,hash,...row})=>row),null,2))
if(!process.argv.includes('--write'))process.exit(0)
const created=[]
for(const p of plan){
 const currentHouse=await client.request('/entities/'+house.id), currentDesk=await client.request('/entities/'+desk.id)
 for (const field of ['id','blueprint','position','quaternion','scale','pinned']) {
   assert.deepEqual(currentHouse[field],house[field],'House changed: '+field)
   assert.deepEqual(currentDesk[field],desk[field],'Desk changed: '+field)
 }
 assert(!currentHouse.mover && !currentHouse.uploader && !currentDesk.mover && !currentDesk.uploader)
 assert.deepEqual(await client.request('/apps/'+house.blueprint),houseBlueprint,'House changed during deployment')
 await client.uploadAsset({bytes:p.bytes,sha256:p.hash,extension:'glb',mime:'model/gltf-binary',url:`asset://${p.hash}.glb`})
 const model=`asset://${p.hash}.glb`;const blueprint=await client.request('/apps',{method:'POST',json:{id:p.blueprintId,name:p.name,model,script:null,desc:'Polyfork HD office furnishing',author:'Polyfork',props:{},public:false,preload:true}})
 const entity=await client.request('/entities',{method:'POST',json:{id:p.entityId,blueprint:blueprint.id,position:p.position,quaternion:p.quaternion,scale:[1,1,1],pinned:false}})
 created.push({key:p.key,blueprint,entity});await fs.writeFile(new URL('created.json',import.meta.url),JSON.stringify(created,null,2))
}
const after=await client.request('/snapshot?excludeSeatPoses=true');for(const p of created){const entity=after.entities.find(e=>e.id===p.entity.id);for(const field of ['id','blueprint','position','quaternion','scale','pinned'])assert.deepEqual(entity[field],p.entity[field]);assert.deepEqual(after.blueprints.find(b=>b.id===p.blueprint.id),p.blueprint)}
assert.deepEqual(after.entities.find(e=>e.id===house.id),house);assert.deepEqual(after.entities.find(e=>e.id===desk.id),desk)
console.log('Verified four separately movable placements and unchanged house and desk')
