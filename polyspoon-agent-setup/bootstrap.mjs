import {readFile,writeFile} from 'node:fs/promises';
import {dirname,join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import {hash,exists,extractStored,safeDestination} from './support.mjs';

const base=dirname(fileURLToPath(import.meta.url)),project=dirname(base),toolkit=await safeDestination(project,'.polyspoon/toolkit');
const state=JSON.parse(await readFile(join(base,'agent-install.json'),'utf8')),bytes=await readFile(join(base,'toolkit.zip')),digest=hash(bytes);
if(digest!==state.toolkit.sha256)throw Error('Installed toolkit archive changed');
if(await exists(toolkit)){
 const marker=join(toolkit,'.polyspoon-archive');
 if(!(await exists(marker))||(await readFile(marker,'utf8')).trim()!==digest)throw Error('Toolkit exists with different or incomplete source. Preserve it and choose a fresh project, or explicitly migrate its edits before bootstrapping.');
 if(await exists(join(toolkit,'.recipe-build/src/catalog/index.js'))){console.log(JSON.stringify({ready:true,reused:true,toolkit}));process.exit(0);}
}else{
 await extractStored(bytes,toolkit);await writeFile(join(toolkit,'.polyspoon-archive'),digest+'\n',{flag:'wx'});
}
const run=(command,args)=>{const result=spawnSync(command,args,{cwd:toolkit,stdio:'inherit',shell:false});if(result.error)throw result.error;if(result.status!==0)throw Error(command+' failed with '+result.status+'; source preserved at '+toolkit);};
run(process.platform==='win32'?'npm.cmd':'npm',['ci','--ignore-scripts','--no-audit','--no-fund']);
if(await exists(join(toolkit,'bootstrap.glb')))throw Error('Preserve existing bootstrap outputs before retrying compilation');
run(process.execPath,['build.mjs','--config','config.json','--out','bootstrap.glb']);
console.log(JSON.stringify({ready:true,reused:false,toolkit,archiveSha256:digest}));
