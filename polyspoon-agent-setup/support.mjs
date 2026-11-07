import {createHash} from 'node:crypto';
import {lstat,mkdir,readFile,writeFile} from 'node:fs/promises';
import {dirname,join,resolve,sep} from 'node:path';

export const adapters={codex:'.agents/skills/polyspoon',claude:'.claude/skills/polyspoon',cursor:'.cursor/skills/polyspoon',copilot:'.github/skills/polyspoon'};
export const hash=bytes=>createHash('sha256').update(bytes).digest('hex');
export async function exists(path){try{return await lstat(path);}catch(error){if(error.code==='ENOENT')return;throw error;}}
export async function safeDestination(project,path){
 const root=resolve(project),target=resolve(root,path);
 if(target===root||!target.startsWith(root+sep))throw Error('Destination escapes project');
 for(let p=target;;p=dirname(p)){
  if((await exists(p))?.isSymbolicLink())throw Error('Symlink destination: '+p);
  if(p===root)break;
 }
 return target;
}
export function options(args,allowed){
 const result={};
 for(let i=0;i<args.length;i+=2){const key=args[i],value=args[i+1];if(!allowed.includes(key)||!value||value.startsWith('--')||Object.hasOwn(result,key))throw Error('Unsupported or missing option: '+key);result[key]=value;}
 return result;
}
export async function extractStored(bytes,directory){
 if(bytes.length>32*1024*1024)throw Error('Toolkit exceeds size limit');
 const files=new Map();let offset=0;
 while(offset+30<=bytes.length&&bytes.readUInt32LE(offset)===0x04034b50){
  const flags=bytes.readUInt16LE(offset+6),method=bytes.readUInt16LE(offset+8),size=bytes.readUInt32LE(offset+22),length=bytes.readUInt16LE(offset+26),extra=bytes.readUInt16LE(offset+28),start=offset+30+length+extra,end=start+size;
  if(flags!==0x800||method!==0||size!==bytes.readUInt32LE(offset+18)||extra!==0||size>4*1024*1024||end>bytes.length)throw Error('Unsupported toolkit ZIP');
  const name=bytes.subarray(offset+30,offset+30+length).toString('utf8');
  if(!/^[a-zA-Z0-9_./-]+$/.test(name)||name.split('/').some(p=>!p||p==='.'||p==='..')||files.has(name)||files.size>=512)throw Error('Unsafe toolkit member');
  files.set(name,bytes.subarray(start,end));offset=end;
 }
 if(files.size===0||offset+4>bytes.length||bytes.readUInt32LE(offset)!==0x02014b50)throw Error('Invalid toolkit ZIP');
 await mkdir(directory,{recursive:false});
 for(const [name,data] of files){const destination=await safeDestination(directory,name);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,data,{flag:'wx'});}
 return files.size;
}
export async function verifyBundle(bundle){
 const manifest=JSON.parse(await readFile(join(bundle,'bundle.json'),'utf8'));
 if(manifest.formatVersion!==1||manifest.name!=='polyspoon-agent'||!manifest.files)throw Error('Invalid agent bundle');
 for(const [name,record] of Object.entries(manifest.files)){
  if(!/^[a-zA-Z0-9_.-]+$/.test(name))throw Error('Unsafe bundle path');
  const bytes=await readFile(join(bundle,name));if(hash(bytes)!==record.sha256||bytes.length!==record.bytes)throw Error('Bundle integrity mismatch: '+name);
 }
 return manifest;
}
