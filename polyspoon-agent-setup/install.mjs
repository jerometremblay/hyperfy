import {readFile,writeFile,mkdir,realpath} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {homedir} from 'node:os';
import {adapters,hash,exists,safeDestination,options,verifyBundle} from './support.mjs';

export async function installBundle({bundle,project,app}){
 if(!Object.hasOwn(adapters,app))throw Error('Unsupported app: '+app);
 const root=await realpath(resolve(project));if(root===homedir()||root===dirname(root))throw Error('Choose a project directory, not home or filesystem root');
 const manifest=await verifyBundle(bundle),statePath=await safeDestination(root,'.polyspoon/agent-install.json');
 const prior=(await exists(statePath))?JSON.parse(await readFile(statePath,'utf8')):{files:{},apps:[]};
 const targets=new Map([
  [adapters[app]+'/SKILL.md','SKILL.md'],
  ...['runtime.mjs','bootstrap.mjs','support.mjs','formats.mjs','model-controls.json','toolkit.zip','LICENSE','NOTICE'].map(name=>['.polyspoon/'+name,name]),
 ]);
 const planned=[];
 for(const [path,name] of targets){
  if(!manifest.files[name])throw Error('Required bundle file missing: '+name);
  const target=await safeDestination(root,path),bytes=await readFile(join(bundle,name)),current=(await exists(target))?await readFile(target):undefined;
  if(current&&hash(current)!==hash(bytes)&&hash(current)!==prior.files[path])throw Error('Install conflict, user file preserved: '+path);
  planned.push({path,target,bytes,unchanged:current&&hash(current)===hash(bytes)});
 }
 for(const item of planned)if(!item.unchanged){await mkdir(dirname(item.target),{recursive:true});await writeFile(item.target,item.bytes,{flag:(await exists(item.target))?'w':'wx'});}
 const files={...prior.files,...Object.fromEntries(planned.map(p=>[p.path,hash(p.bytes)]))};
 await mkdir(dirname(statePath),{recursive:true});
 await writeFile(statePath,JSON.stringify({formatVersion:1,bundleVersion:manifest.version,toolkit:manifest.toolkit,apps:[...new Set([...prior.apps,app])],files},null,2)+'\n');
 return {installed:true,app,skill:adapters[app],project:root,runtime:'Run node .polyspoon/bootstrap.mjs after inspecting installed source and notices; installation alone does not bootstrap the engine.'};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 try{const args=options(process.argv.slice(2),['--project','--app']);if(!args['--project']||!args['--app'])throw Error('Use node install.mjs --project PROJECT --app codex|claude|cursor|copilot');console.log(JSON.stringify(await installBundle({bundle:dirname(fileURLToPath(import.meta.url)),project:args['--project'],app:args['--app']}),null,2));}
 catch(error){console.error(error.message);process.exitCode=1;}
}
