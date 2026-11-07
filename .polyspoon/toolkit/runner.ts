import './scripts/node-platform.ts';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname, resolve } from 'node:path';
import { buildAsset, loadDesign, disposeAsset } from './src/catalog/index.ts';
import { designInput } from './src/catalog/appearance.ts';
import { exportDeliverable } from './src/catalog/delivery.ts';
import { inspectGeometry, geometrySnapshot } from './src/lantern/inspect.ts';
const options=new Map<string,string>();
const args=process.argv.slice(2);
for(let i=0;i<args.length;i+=2){const key=args[i]!,value=args[i+1];if(!['--config','--out'].includes(key)||!value||value.startsWith('--')||options.has(key))throw new Error('Use --config path --out file.glb');options.set(key,value);}
const configPath=resolve(options.get('--config')??'config.json');
const out=resolve(options.get('--out')??'output.glb'),reportPath=out+'.report.json';
if(!out.endsWith('.glb')||[out,reportPath].includes(configPath))throw new Error('Output must be a new GLB path distinct from input');
const config=loadDesign(JSON.parse(await readFile(configPath,'utf8')));
if(config.family!=="bench")throw new Error('Design does not match this package recipe');
const hash=(value:string|Uint8Array)=>createHash('sha256').update(value).digest('hex');
const packageManifest=JSON.parse(await readFile('manifest.json','utf8'));
const sourceHashes:Record<string,string>={},modifiedSourcePaths:string[]=[];
for(const path of Object.keys(packageManifest.files).filter(path=>path.endsWith('.ts')||path.endsWith('.mjs')).sort()){const digest=hash(await readFile(path));sourceHashes[path]=digest;if(digest!==packageManifest.files[path].sha256)modifiedSourcePaths.push(path);}
const source={currentExecutableSourceHash:hash(JSON.stringify(sourceHashes)),modifiedSourcePaths,matchesPackagedSource:modifiedSourcePaths.length===0};
const build=buildAsset(config.family,designInput(config));
if(config.migration)build.config.migration=config.migration;
try{
const geometry=inspectGeometry(build.root);
if(geometry.errors.length)throw new Error(geometry.errors.join('; '));
const bytes=await exportDeliverable(build);
const report={family:config.family,config:build.config,source,geometry,dimensions:build.dimensions.toArray(),bounds:{min:build.bounds.min.toArray(),max:build.bounds.max.toArray()},geometryHash:hash(JSON.stringify(geometrySnapshot(build.root))),glbHash:hash(bytes),glbBytes:bytes.length};
await mkdir(dirname(out),{recursive:true});
await writeFile(out,bytes);await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:out,report:reportPath,geometryHash:report.geometryHash,glbHash:report.glbHash}));
}finally{disposeAsset(build);}
