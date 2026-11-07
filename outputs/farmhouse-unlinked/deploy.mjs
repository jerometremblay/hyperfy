import fs from 'node:fs/promises'
import {createHash,randomUUID} from 'node:crypto'
import * as T from 'three'
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import {loadProfile,makeClient} from '../../tools/worldsync/src/deployment.mjs'
const dir=new URL('.',import.meta.url).pathname
const parts=JSON.parse(await fs.readFile(dir+'parts.json','utf8'))
const generated=JSON.parse(await fs.readFile(dir+'generated.json','utf8'))
// Round-trip all exported visible vertices back into original recipe coordinates.
for(let i=0;i<5;i++){
 const bytes=await fs.readFile(dir+`part-${i}.glb`);const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'')
 const original=new Map(generated.meshes.map(m=>[m.name,m]));const tr=parts.transforms[i];const matrix=new T.Matrix4().compose(new T.Vector3(...tr.position),new T.Quaternion(...tr.quaternion),new T.Vector3(1,1,1));let visible=0,colliders=0
 gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(n=>{if(!n.isMesh)return;if(n.userData.node==='collider'){colliders++;return}visible++;const m=original.get(n.name);assert.ok(m,n.name);const a=n.geometry.attributes.position;assert.equal(a.count,m.positions.length/3);for(let j=0;j<a.count;j++){const actual=new T.Vector3().fromBufferAttribute(a,j).applyMatrix4(n.matrixWorld).applyMatrix4(matrix);const expected=new T.Vector3().fromArray(m.positions,j*3).applyMatrix4(new T.Matrix4().fromArray(m.matrix));assert.ok(actual.distanceTo(expected)<0.000002,`Vertex mismatch ${n.name}`)}});assert.equal(visible,parts.counts[i]);assert.equal(colliders,1)
}
const source=await fs.readFile(dir+'chair.js','utf8');new vm.Script(source)
// Exercise the copied callback-based seat lifecycle, including cancellation and reuse.
const handlers={},sent=[],nodes={};let effect
const app={state:{},position:new T.Vector3(),scale:new T.Vector3(1,1,1),quaternion:new T.Quaternion(),create(type,opts){const n={...opts,position:new T.Vector3(),rotation:new T.Euler()};nodes[type]=n;return n},add(){},on(n,f){handlers[n]=f},send(...a){sent.push(a)}}
const player={id:'test-player',teleport(){},applyEffect(opts){effect={active:true,cancel(){this.active=false;opts.onEnd()}};return effect}}
vm.runInNewContext(source,{app,props:{sitEmote:{url:'test-emote'}},world:{isClient:true,isServer:false,getPlayer:()=>player}})
assert.equal(nodes.action.active,true);nodes.action.onTrigger();assert.equal(nodes.action.active,false);handlers.seatState({occupant:player.id});assert.equal(effect.active,true);effect.cancel();assert.equal(sent.at(-1)[0],'releaseSeat');handlers.seatState({occupant:null});assert.equal(nodes.action.active,true);handlers.destroy();assert.equal(nodes.action.active,false);assert.equal(handlers.update,undefined)
console.log('Verified: 79 meshes retain original vertex positions; five colliders; seat cancellation/reuse; no idle update callbacks.')
if(!process.argv.includes('--apply'))process.exit(0)
const c=makeClient(await loadProfile('../hyperfy-world-jerome','online-world'))
const current=await c.request('/apps/'+parts.blueprint.id);assert.equal(current.version,parts.blueprint.version,'Live blueprint changed')
const instance=parts.entities[0];assert.equal(parts.entities.length,1)
const live=await c.request('/entities/'+instance.id);for(const key of Object.keys(instance))assert.deepEqual(live[key],instance[key],'Live placement changed');assert.ok(!live.mover && !live.uploader,'Object is being edited')
async function upload(file,extension,mime){const bytes=await fs.readFile(dir+file),sha256=createHash('sha256').update(bytes).digest('hex');return (await c.request('/assets',{method:'POST',file:{bytes,sha256,extension,mime}})).url}
const chairScript=await upload('chair.js','js','text/javascript')
const result={blueprints:[],entities:[],original:instance}
await fs.writeFile(dir+'deployment.json',JSON.stringify(result,null,2))
const baseQ=new T.Quaternion(...instance.quaternion)
for(let i=0;i<5;i++){
 const model=await upload(`part-${i}.glb`,'glb','model/gltf-binary')
 const b=await c.request('/apps',{method:'POST',json:{id:randomUUID(),name:i?`Farmhouse Chair ${i} (Unlinked)`:'Farmhouse Table (Unlinked)',model,script:i?chairScript:null,url:null,props:i?{sitEmote:{type:'emote',url:'asset://440bbd2e231ddefbe36f380d6fb0b6b322791a3d79459e649b3f063cf745c7ec.glb'}}:{},unique:true,desc:'Independent static extraction of the imported Farmhouse set. Unlinked from Polyspoon updates.'}})
 result.blueprints.push(b);await fs.writeFile(dir+'deployment.json',JSON.stringify(result,null,2))
 const tr=parts.transforms[i],position=new T.Vector3(...tr.position).multiply(new T.Vector3(...instance.scale)).applyQuaternion(baseQ).add(new T.Vector3(...instance.position)).toArray(),quaternion=baseQ.clone().multiply(new T.Quaternion(...tr.quaternion)).toArray()
 const ent=i?await c.request('/entities',{method:'POST',json:{id:randomUUID(),blueprint:b.id,position,quaternion,scale:instance.scale,pinned:false}}):await c.request('/entities/'+instance.id,{method:'PATCH',json:{blueprint:b.id}})
 result.entities.push(ent);await fs.writeFile(dir+'deployment.json',JSON.stringify(result,null,2))
}
const snapshot=await c.request('/snapshot?excludeSeatPoses=true')
for(const e of result.entities){const live=snapshot.entities.find(v=>v.id===e.id);assert.ok(live);for(const key of Object.keys(live))assert.deepEqual(live[key],e[key]);const b=snapshot.blueprints.find(v=>v.id===e.blueprint);assert.ok(!b.url);assert.ok(b.model.endsWith('.glb'));assert.equal(b.unique,true)}
assert.equal(snapshot.entities.filter(e=>e.blueprint===parts.blueprint.id).length,0)
console.log('Live verified: one table, four independently editable chairs; original set has no remaining placement.');await fs.writeFile(dir+'verified.json',JSON.stringify({verifiedAt:new Date().toISOString(),entities:result.entities},null,2))
