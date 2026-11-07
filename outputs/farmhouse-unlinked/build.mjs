import fs from 'node:fs/promises'
import path from 'node:path'
import { Worker } from 'node:worker_threads'
import { build } from 'esbuild'
import * as T from 'three'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { loadProfile, makeClient } from '../../tools/worldsync/src/deployment.mjs'
const dir=path.dirname(new URL(import.meta.url).pathname)
const client=makeClient(await loadProfile('../hyperfy-world-jerome','online-world'))
const snapshot=await client.request('/snapshot?excludeSeatPoses=true')
const bp=snapshot.blueprints.find(b=>b.id==='Io1ikeh2RJ')
if(!bp?.model.startsWith('polyspoon://')) throw Error('Original already changed')
await fs.writeFile(dir+'/before.json',JSON.stringify(snapshot,null,2))
const source=await (await fetch('https://monstre.duckdns.org:3333/api/polyspoon/sandboxed-recipes/'+bp.model.slice(12))).text()
await fs.writeFile(dir+'/original-recipe.js',source)
const bundled=await build({entryPoints:['src/server/polyspoonNodeWorker.js'],bundle:true,platform:'node',format:'esm',packages:'external',write:false})
const workerPath=dir+'/sandbox-worker.mjs'; await fs.writeFile(workerPath,bundled.outputFiles[0].contents)
const worker=new Worker(workerPath,{resourceLimits:{maxOldGenerationSizeMb:128}})
const output=await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{worker.terminate();reject(Error('timeout'))},15000);worker.once('error',reject);worker.once('message',m=>{clearTimeout(timer);m.error?reject(Error(m.error)):resolve(m.result)});worker.postMessage({source,parameters:JSON.stringify(bp.props)})});await worker.terminate()
const data=JSON.parse(output); await fs.writeFile(dir+'/generated.json',output)
globalThis.FileReader=class {readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.()})}}
const groups=Array.from({length:5},()=>new T.Group());const transforms=[{position:[0,0,0],quaternion:[0,0,0,1]}]
for(let d=0;d<4;d++){const a=Math.PI/2+d*Math.PI/2, r=bp.props.length/2+.16+(d%2?.08:.024);const p=Math.cos(a)*r,z=Math.sin(a)*r,yaw=Math.atan2(-p,-z)+(d%3-1)*.06; transforms.push({position:[p,0,z],quaternion:new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),yaw).toArray()})}
const counts=Array(5).fill(0)
for(const mesh of data.meshes){const match=/^chair-(\d+)-/.exec(mesh.name);const idx=match?Number(match[1])+1:0;if(idx>4)throw Error('Unexpected chair');counts[idx]++
 const geo=new T.BufferGeometry();geo.setAttribute('position',new T.Float32BufferAttribute(mesh.positions,3));if(mesh.normals)geo.setAttribute('normal',new T.Float32BufferAttribute(mesh.normals,3));if(mesh.indices)geo.setIndex(mesh.indices);if(!mesh.normals)geo.computeVertexNormals()
 const tr=transforms[idx];const inverse=new T.Matrix4().compose(new T.Vector3(...tr.position),new T.Quaternion(...tr.quaternion),new T.Vector3(1,1,1)).invert();geo.applyMatrix4(inverse.multiply(new T.Matrix4().fromArray(mesh.matrix)))
 const mat=new T.MeshStandardMaterial({color:mesh.material.color,roughness:mesh.material.roughness,metalness:mesh.material.metalness});const node=new T.Mesh(geo,mat);node.name=mesh.name;groups[idx].add(node)
}
for(let i=0;i<5;i++){if(!counts[i])throw Error('Empty part');const group=groups[i];const geometries=group.children.map(n=>{const g=n.geometry.clone().toNonIndexed();for(const key of Object.keys(g.attributes))if(key!=='position')g.deleteAttribute(key);return g});const collider=new T.Mesh(mergeGeometries(geometries),new T.MeshBasicMaterial());collider.name='collision';collider.userData={node:'collider',convex:false};const body=new T.Group();body.name='static-body';body.userData={node:'rigidbody',type:'static'};body.add(collider);group.add(body);const glb=await new GLTFExporter().parseAsync(group,{binary:true});await fs.writeFile(dir+`/part-${i}.glb`,Buffer.from(glb))}
let seat=await fs.readFile('../hyperfy-world-jerome/objects/apps/weathered-adirondack-chair/script.js','utf8');seat=seat.slice(seat.indexOf('// One stable sitting place.'));seat='app.resetOnMove = false\nconst sitEmote = props.sitEmote?.url\n'+seat.replaceAll('adirondack-seat-0','farmhouse-seat').replace('groundY + m(14.0), m(-1.5)','0.52, 0.01').replace('anchor.rotation.y = 0','anchor.rotation.y = Math.PI').replace('groundY + m(19.0), m(-18.0)','0.65, 0.30').replace('[0, groundY + m(1.5), m(-21.0)]','[0, 0.05, 0.7]')
await fs.writeFile(dir+'/chair.js',seat);await fs.writeFile(dir+'/parts.json',JSON.stringify({blueprint:bp,transforms,counts,entities:snapshot.entities.filter(e=>e.blueprint===bp.id)},null,2));console.log(JSON.stringify({counts,instances:snapshot.entities.filter(e=>e.blueprint===bp.id).length,transforms}))
