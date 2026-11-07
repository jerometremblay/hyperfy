import { readSemantics } from './semantics.ts';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import type { Preview, AssetBuild, Design } from './index.ts';
export async function exportAsset(build: Pick<Preview, 'root'>): Promise<Uint8Array> {
  const semantic=build.root.userData.openpoly!==undefined;
  if(semantic)readSemantics(build.root);
  const result = await new GLTFExporter().parseAsync(build.root, { binary: true, onlyVisible: !semantic, trs: false });
  if (!(result instanceof ArrayBuffer)) throw new Error('Exporter did not produce binary glTF');
  return new Uint8Array(result);
}

function bytesOf(text:string){return new TextEncoder().encode(text);}
function base64(bytes:Uint8Array){
 let value='';for(let offset=0;offset<bytes.length;offset+=8192)value+=String.fromCharCode(...bytes.subarray(offset,offset+8192));
 return btoa(value);
}
function crc32(bytes:Uint8Array){
 let crc=0xffffffff;
 for(const byte of bytes){crc^=byte;for(let bit=0;bit<8;bit++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);}
 return (crc^0xffffffff)>>>0;
}
export function zipFiles(files:Record<string,Uint8Array>):Uint8Array {
 const entries=Object.entries(files),locals:Uint8Array[]=[],central:Uint8Array[]=[];let offset=0;
 for(const [name,data] of entries){
  const filename=bytesOf(name),crc=crc32(data),header=new Uint8Array(30+filename.length),view=new DataView(header.buffer);
  view.setUint32(0,0x04034b50,true);view.setUint16(4,20,true);view.setUint16(6,0x800,true);view.setUint32(14,crc,true);view.setUint32(18,data.length,true);view.setUint32(22,data.length,true);view.setUint16(26,filename.length,true);header.set(filename,30);
  locals.push(header,data);
  const record=new Uint8Array(46+filename.length),entry=new DataView(record.buffer);
  entry.setUint32(0,0x02014b50,true);entry.setUint16(4,20,true);entry.setUint16(6,20,true);entry.setUint16(8,0x800,true);entry.setUint32(16,crc,true);entry.setUint32(20,data.length,true);entry.setUint32(24,data.length,true);entry.setUint16(28,filename.length,true);entry.setUint32(42,offset,true);record.set(filename,46);central.push(record);offset+=header.length+data.length;
 }
 const centralSize=central.reduce((sum,record)=>sum+record.length,0),end=new Uint8Array(22),view=new DataView(end.buffer);
 view.setUint32(0,0x06054b50,true);view.setUint16(8,entries.length,true);view.setUint16(10,entries.length,true);view.setUint32(12,centralSize,true);view.setUint32(16,offset,true);
 const result=new Uint8Array(offset+centralSize+end.length);let cursor=0;
 for(const part of [...locals,...central,end]){result.set(part,cursor);cursor+=part.length;}
 return result;
}
export function snapshotModule(bytes:Uint8Array,config:Design):string {
 return "import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';\nexport const configuration="+JSON.stringify(config)+";\nexport function glbBytes(){return Uint8Array.from(atob("+JSON.stringify(base64(bytes))+"),character=>character.charCodeAt(0));}\nexport async function createAsset(){return (await new GLTFLoader().parseAsync(glbBytes().buffer,'')).scene;}\n";
}
export async function exportBundle(build:AssetBuild){
 const bytes=await exportAsset(build),module=snapshotModule(bytes,build.config),name=build.config.family;
 const html='<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+name+' preview</title><style>body{margin:0;background:#f4f6fa;font:14px system-ui}canvas{display:block}#status{position:fixed;bottom:16px;left:16px;padding:8px 12px;background:#ffffffdd;border-radius:8px}</style><div id="status">Loading online preview…</div><script type="importmap">'+JSON.stringify({imports:{three:'https://cdn.jsdelivr.net/npm/three@0.186.1/build/three.module.js','three/addons/':'https://cdn.jsdelivr.net/npm/three@0.186.1/examples/jsm/'}})+'</script><script type="module">'+module+`
import { Scene, Color, WebGLRenderer, OrthographicCamera, HemisphereLight, DirectionalLight, Box3, Vector3 } from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
try {
 const scene=new Scene();scene.background=new Color('#f4f6fa');
 const renderer=new WebGLRenderer({antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,2));document.body.append(renderer.domElement);
 const camera=new OrthographicCamera(-1,1,1,-1,0.001,1000),orbit=new OrbitControls(camera,renderer.domElement);
 scene.add(new HemisphereLight(0xffffff,0xb6bdb0,1.6));const light=new DirectionalLight(0xfffaf0,2.3);light.position.set(-2,5,3);scene.add(light);
 const model=await createAsset();scene.add(model);const bounds=new Box3().setFromObject(model),center=bounds.getCenter(new Vector3()),size=bounds.getSize(new Vector3()).length();
 camera.position.copy(center).addScaledVector(new Vector3(2.7,1.85,3.5).normalize(),size*3);camera.lookAt(center);orbit.target.copy(center);orbit.update();
 function resize(){const aspect=innerWidth/innerHeight,span=size*1.25/Math.min(aspect,1);camera.left=-span*aspect/2;camera.right=span*aspect/2;camera.top=span/2;camera.bottom=-span/2;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);}
 addEventListener('resize',resize);resize();renderer.setAnimationLoop(()=>{orbit.update();renderer.render(scene,camera);});
 document.getElementById('status').textContent='Drag to orbit · Scroll to zoom';
} catch(error){document.getElementById('status').textContent='Preview failed: '+error.message;}
`+'</script></html>';
 const files:Record<string,Uint8Array>={
  [name+'.glb']:bytes,
  [name+'.design.json']:bytesOf(JSON.stringify(build.config,null,2)),
  [name+'.mjs']:bytesOf(module),
  'preview.html':bytesOf(html),
  'README.txt':bytesOf('Open preview.html in a current browser. It includes the model and loads Three.js 0.186.1 from jsDelivr, so internet access is required.\nThe .mjs file is a static GLB snapshot module, not a procedural generator. In a project with Three.js installed, import createAsset() and add the awaited scene to your scene.\nThe GLB and saved design preserve palette, shading and individual part colors. Viewer-only effects are not exported.\n'),
 };
 return {files,bytes:zipFiles(files)};
}
