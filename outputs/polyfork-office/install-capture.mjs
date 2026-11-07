import fs from 'node:fs/promises';import path from 'node:path';import assert from 'node:assert/strict';
const target='/Users/jerome/metaverse/hyperfy-world-jerome', stage='/private/tmp/polyfork-office-world';
const scene='scenes/local-world/scene.json', map='.worldsync/captures/online-world.json';
const a=JSON.parse(await fs.readFile(path.join(target,scene))), b=JSON.parse(await fs.readFile(path.join(stage,scene)));
for(const key of Object.keys(a))if(key!=='instances')assert.deepEqual(a[key],b[key]);for(const item of a.instances)assert.deepEqual(b.instances.find(v=>v.key===item.key),item);
const added=b.instances.filter(v=>!a.instances.some(x=>x.key===v.key));assert.equal(added.length,4);
const expected=['app-187ed216e767ff02','app-55c6aac79b50fc4f','app-a7f353dc69e423bd','app-ebcd90fd54d5852b'];assert.deepEqual(added.map(v=>v.object).sort(),expected);
for(const key of expected){const dest=path.join(target,'objects',key);try{await fs.access(dest);throw new Error('Object path already exists: '+key)}catch(e){if(e.code!=='ENOENT')throw e}}
for(const key of expected)await fs.cp(path.join(stage,'objects',key),path.join(target,'objects',key),{recursive:true,errorOnExist:true,force:false});
await fs.copyFile(path.join(stage,scene),path.join(target,scene));await fs.copyFile(path.join(stage,map),path.join(target,map));console.log('Installed four verified capture objects and scene additions');
