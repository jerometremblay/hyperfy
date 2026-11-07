import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {hash,options,exists} from './support.mjs';

const base=dirname(fileURLToPath(import.meta.url)),toolkit=join(base,'toolkit'),compiled=join(toolkit,'.recipe-build');
if(!(await exists(join(compiled,'src/catalog/index.js'))))throw Error('Engine not ready. Run node .polyspoon/bootstrap.mjs from your project.');
const installedState=JSON.parse(await readFile(join(base,'agent-install.json'),'utf8'));
if((await readFile(join(toolkit,'.polyspoon-archive'),'utf8')).trim()!==installedState.toolkit.sha256)throw Error('Engine/archive mismatch. Preserve the existing toolkit and bootstrap the installed archive in a fresh project.');
await import(pathToFileURL(join(compiled,'scripts/node-platform.js')).href);
const engine=await import(pathToFileURL(join(compiled,'src/catalog/index.js')).href);
const deliveryRevision=installedState.toolkit.deliveryRevision;
if(![2,3].includes(deliveryRevision))throw Error('Unsupported source delivery revision');
const exportAsset=deliveryRevision===3?(await import(pathToFileURL(join(compiled,'src/catalog/delivery.js')).href)).exportDeliverable:(await import(pathToFileURL(join(compiled,'src/catalog/export.js')).href)).exportAsset;
const {designInput}=await import(pathToFileURL(join(compiled,'src/catalog/appearance.js')).href);
const {inspectGeometry}=await import(pathToFileURL(join(compiled,'src/lantern/inspect.js')).href);
const [command,...rest]=process.argv.slice(2);
if(command==='catalog'&&rest.length===0){console.log(JSON.stringify(engine.catalog,null,2));}
else if(command==='build'){
 const args=options(rest,['--family','--parameters','--config','--out','--formats']);
 if(!args['--out']||Boolean(args['--config'])===Boolean(args['--family'])||args['--config']&&args['--parameters'])throw Error('Use build --family ID [--parameters JSON] --out NEW_DIRECTORY [--formats obj,fbx,usdz|all], or build --config DESIGN --out NEW_DIRECTORY [--formats ...]');
 const requested=[...new Set((args['--formats']??'').split(',').map(v=>v.trim()).filter(Boolean).flatMap(v=>v==='all'?['obj','fbx','usdz']:[v]))];if(requested.some(v=>!['glb','obj','fbx','usdz'].includes(v)))throw Error('--formats accepts obj, fbx, usdz or all');
 const design=args['--config']?engine.loadDesign(JSON.parse(await readFile(resolve(args['--config']),'utf8'))):undefined;
 const build=engine.buildAsset(design?.family??args['--family'],design?designInput(design):JSON.parse(args['--parameters']??'{}'));
 try{
  if(design?.migration)build.config.migration=structuredClone(design.migration);
  const geometry=inspectGeometry(build.root);if(geometry.errors.length)throw Error(JSON.stringify(geometry.errors));
  const bytes=await exportAsset(build),out=resolve(args['--out']);await mkdir(dirname(out),{recursive:true});await mkdir(out,{recursive:false});
  const state=JSON.parse(await readFile(join(base,'agent-install.json'),'utf8'));
  await writeFile(join(out,'asset.glb'),bytes,{flag:'wx'});await writeFile(join(out,'asset.design.json'),JSON.stringify(build.config,null,2)+'\n',{flag:'wx'});
  const formats=await import(pathToFileURL(join(base,'formats.mjs')).href),written={};for(const format of requested)if(format!=='glb'){const name='asset'+formats.exportFormats[format].extension;await writeFile(join(out,name),formats.convertGlb(bytes,format,'asset'),{flag:'wx'});written[format]=name;}
  await writeFile(join(out,'asset.controls.json'),JSON.stringify(formats.controlsDocument({design:build.config,glb:bytes}),null,2)+'\n',{flag:'wx'});
  const report={family:build.config.family,version:build.config.familyVersion,dimensions:build.dimensions.toArray(),anchors:build.anchors,geometry,glbSha256:hash(bytes),formats:written,controls:'asset.controls.json',toolkit:state.toolkit,limits:['Geometry/export evidence only; inspect actual views and verify the requested target separately.']};
  await writeFile(join(out,'report.json'),JSON.stringify(report,null,2)+'\n',{flag:'wx'});console.log(JSON.stringify({output:out,...report},null,2));
 }finally{engine.disposeAsset(build);}
}else throw Error('Use catalog or build');
