import { Group, Mesh,Quaternion,Vector3,PropertyBinding } from 'three';
import type { Object3D } from 'three';
import { plainRecord,controlMetadata,parseControls } from '../engine/parameters.ts';
import type { Control } from '../engine/parameters.ts';
import type { AssetBuild } from './types.ts';

export type Point3=[number,number,number];
export interface AssetJoint {
  id:string;
  node:string;
  kind:'revolute';
  pivot:Point3;
  axis:Point3;
  angleUnit:'degrees';
  limits:[number,number];
  angle:number;
  parameter?:string;
}
export interface AssetSemantics {
  version:1;
  identity:{family:string;recipeVersion:string};
  coordinates:{lengthUnit:'m';up:'+Y';front:'+Z';origin:'ground-center';anchorSpace:'root'};
  controls:ReturnType<typeof controlMetadata>;
  anchors:Record<string,Point3>;
  materials:{id:string}[];
  parts:{id:string;node:string;materialId:string;material:string;group:string}[];
  joints:AssetJoint[];
  delivery:{version:1;mode:'editable';identity:'node-per-part';movingGroups:'separate'};
}
const identifier=/^[a-zA-Z0-9][a-zA-Z0-9_.:-]*$/;
function portableNode(value:string){if(!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(value))throw new Error('Portable joint node name required');}
function id(value:unknown){if(typeof value!=='string'||!identifier.test(value)||['__proto__','constructor','prototype'].includes(value))throw new Error('Invalid semantic identifier');}
function vector(value:unknown):asserts value is Point3 {if(!Array.isArray(value)||value.length!==3||!value.every(n=>typeof n==='number'&&Number.isFinite(n)))throw new Error('Expected finite semantic vector');}
function sameFields(value:unknown,expected:Record<string,unknown>){const record=plainRecord(value);return Object.keys(record).length===Object.keys(expected).length&&Object.entries(expected).every(([key,item])=>record[key]===item);}
function validateControlDomains(controls:AssetSemantics['controls']){
 for(const c of controls){
  if(!['range','integer','choice','toggle','color'].includes(c.kind)||!['m','cm','count','seed','ratio','none','color'].includes(c.unit)||c.displayUnit!==c.unit)throw new Error('Invalid semantic control kind or display unit');
  const units=c.unit==='cm'||c.unit==='m'?['m']:c.unit==='count'||c.unit==='seed'?['integer']:c.unit==='ratio'?['dimensionless']:c.unit==='color'?['color']:c.kind==='range'||c.kind==='integer'?['dimensionless','degrees']:['none'];
  if(!units.includes(c.inputUnit))throw new Error('Invalid semantic input unit');
  if(typeof c.label!=='string'||!Array.isArray(c.targets)||!Array.isArray(c.affects))throw new Error('Invalid semantic control');
  if(c.kind==='range'||c.kind==='integer'){
   if(![c.min,c.max,c.step].every(Number.isFinite)||c.min>c.max||c.step<=0||c.kind==='integer'&&![c.min,c.max,c.step].every(Number.isInteger))throw new Error('Invalid semantic numeric control');
  }
  if(c.kind==='choice'){
   if(!Array.isArray(c.options)||!c.options.length||c.options.some(option=>typeof option.value!=='string'))throw new Error('Invalid semantic choice control');
   if(new Set(c.options.map(option=>option.value)).size!==c.options.length)throw new Error('Duplicate semantic choice');
  }
 }
 parseControls(controls,{});
}
function groupFor(object:Object3D,root:Object3D,joints:AssetJoint[]){
 let group='static';for(let parent=object.parent;parent&&parent!==root;parent=parent.parent){const joint=joints.find(j=>j.node===parent.name);if(joint){if(group!=='static')throw new Error('Nested semantic joints unsupported');group=joint.id;}}return group;
}
function unique(values:string[]){values.forEach(id);if(new Set(values).size!==values.length)throw new Error('Duplicate semantic reference');}
function json(value:unknown,seen=new Set<object>()):void {
 if(value===null||typeof value==='string'||typeof value==='boolean'||typeof value==='number'&&Number.isFinite(value))return;
 if(!value||typeof value!=='object'||seen.has(value)||!Array.isArray(value)&&![Object.prototype,null].includes(Object.getPrototypeOf(value)))throw new Error('Expected acyclic plain JSON semantics');
 seen.add(value);for(const key of Reflect.ownKeys(value)){if(typeof key!=='string')throw new Error('Invalid semantic key');if(Array.isArray(value)&&key==='length')continue;json((value as Record<string,unknown>)[key],seen);}seen.delete(value);
}
export function validateSemantics(input:unknown):asserts input is AssetSemantics {
 json(input);const s=plainRecord(input) as unknown as AssetSemantics;
 if(s.version!==1)throw new Error('Unsupported semantic contract version');
 id(s.identity?.family);if(!/^\d+\.\d+\.\d+$/.test(s.identity?.recipeVersion))throw new Error('Invalid semantic recipe version');
 if(!sameFields(s.coordinates,{lengthUnit:'m',up:'+Y',front:'+Z',origin:'ground-center',anchorSpace:'root'}))throw new Error('Unsupported semantic coordinates');
 for(const [name,point] of Object.entries(plainRecord(s.anchors))){id(name);vector(point);}
 if(!Array.isArray(s.controls)||!Array.isArray(s.materials)||!Array.isArray(s.parts)||!Array.isArray(s.joints))throw new Error('Missing semantic collections');
 validateControlDomains(s.controls);unique(s.controls.map(c=>c.key));unique(s.materials.map(m=>m.id));unique(s.parts.map(p=>p.id));unique(s.parts.map(p=>p.node));unique(s.joints.map(j=>j.id));unique(s.joints.map(j=>j.node));
 for(const joint of s.joints){
  portableNode(joint.node);vector(joint.pivot);vector(joint.axis);
  if(joint.id==='static'||joint.kind!=='revolute'||joint.angleUnit!=='degrees'||Math.abs(new Vector3(...joint.axis).length()-1)>1e-12||!Array.isArray(joint.limits)||joint.limits.length!==2||!joint.limits.every(Number.isFinite)||joint.limits[0]>joint.limits[1]||!Number.isFinite(joint.angle)||joint.angle<joint.limits[0]||joint.angle>joint.limits[1])throw new Error('Invalid semantic joint');
  if(joint.parameter!==undefined&&!s.controls.some(c=>c.key===joint.parameter))throw new Error('Unknown joint parameter');
 }
 for(const part of s.parts){id(part.materialId);id(part.material);id(part.group);if(!s.materials.some(m=>m.id===part.materialId)||part.group!=='static'&&!s.joints.some(j=>j.id===part.group))throw new Error('Dangling semantic part reference');}
 for(const joint of s.joints)if(!s.parts.some(p=>p.group===joint.id))throw new Error('Empty semantic joint');
 if(!sameFields(s.delivery,{version:1,mode:'editable',identity:'node-per-part',movingGroups:'separate'}))throw new Error('Unsupported semantic delivery mapping');
}
export function attachSemantics(build:AssetBuild,controls:Control[]):AssetSemantics {
 const joints=structuredClone(build.joints??[]),parts:AssetSemantics['parts']=[];
 build.root.traverse(object=>{
  if(!(object instanceof Mesh))return;
  if(Array.isArray(object.material))throw new Error('Semantic part requires one material');
  const role=object.userData.materialRole;id(role);
  const group=groupFor(object,build.root,joints);
  const partId=object.userData.partId??object.name;id(partId);
  parts.push({id:partId,node:object.name,materialId:role,material:object.material.name,group});
  object.userData.openpoly={version:1,partId,materialId:role,group};
 });
 const result:AssetSemantics={version:1,identity:{family:build.config.family,recipeVersion:build.config.familyVersion},coordinates:{lengthUnit:'m',up:'+Y',front:'+Z',origin:'ground-center',anchorSpace:'root'},controls:controlMetadata(controls),anchors:structuredClone(build.anchors) as Record<string,Point3>,materials:[...new Set(parts.map(p=>p.materialId))].sort().map(id=>({id})),parts,joints,delivery:{version:1,mode:'editable',identity:'node-per-part',movingGroups:'separate'}};
 validateSemantics(result);
 for(const joint of joints){const nodes=build.root.getObjectsByProperty('name',joint.node);if(nodes.length!==1||nodes[0]!.parent!==build.root)throw new Error('Invalid semantic joint node');nodes[0]!.userData.openpoly={version:1,jointId:joint.id,axis:[...joint.axis]};}
 build.anchors=result.anchors;build.joints=result.joints;build.root.userData.anchors=result.anchors;build.root.userData.openpoly=result;build.semantics=result;return result;
}
export function readSemantics(root:Object3D):AssetSemantics {
 const metadata=root.userData.openpoly;validateSemantics(metadata);
 const actual:Mesh[]=[];root.traverse(object=>{if(object instanceof Mesh)actual.push(object);});
 if(actual.length!==metadata.parts.length)throw new Error('Semantic part count mismatch');
 for(const part of metadata.parts){
  const nodes=actual.filter(node=>node.userData.openpoly?.partId===part.id);
  const node=nodes[0];
  if(nodes.length!==1||!node||Array.isArray(node.material))throw new Error('Missing or duplicate semantic part node');
  if(node.name!==part.node&&node.name!==PropertyBinding.sanitizeNodeName(part.node))throw new Error('Semantic node identity mismatch');
  if(node.userData.materialRole!==part.materialId||node.material.name!==part.material||node.userData.openpoly.version!==1||node.userData.openpoly.materialId!==part.materialId||node.userData.openpoly.group!==part.group||groupFor(node,root,metadata.joints)!==part.group)throw new Error('Semantic material or group mapping mismatch');
 }
 for(const joint of metadata.joints){
  const nodes=root.getObjectsByProperty('name',joint.node),node=nodes[0];if(nodes.length!==1||!node||node.parent!==root)throw new Error('Missing semantic joint node');
  const declaration=node.userData.openpoly;const expected=new Quaternion().setFromAxisAngle(new Vector3(...joint.axis),joint.angle*Math.PI/180);
  if(![...node.position.toArray(),...node.scale.toArray(),...node.quaternion.toArray()].every(Number.isFinite)||declaration?.version!==1||declaration.jointId!==joint.id||!Array.isArray(declaration.axis)||declaration.axis.length!==3||declaration.axis.some((n:number,i:number)=>n!==joint.axis[i])||node.position.distanceTo(new Vector3(...joint.pivot))>1e-10||node.scale.distanceTo(new Vector3(1,1,1))>1e-10||Math.abs(node.quaternion.length()-1)>1e-10||1-Math.abs(node.quaternion.dot(expected))>1e-10)throw new Error('Semantic joint transform mismatch');
 }

 return metadata;
}
export function jointGroup(root:Group,name:string,pivot:Point3,members:Object3D[]):Group {
 portableNode(name);id(name);vector(pivot);if(!members.length||new Set(members).size!==members.length||members.some(part=>part.parent!==root)||root.getObjectByName(name))throw new Error('Invalid joint group');
 const group=new Group();group.name=name;group.position.set(...pivot);root.add(group);root.updateMatrixWorld(true);
 for(const part of members){if(part.parent!==root)throw new Error('Joint member must be a root child');part.position.sub(group.position);group.add(part);}
 return group;
}
export function setJointPose(root:Object3D,id:string,angle:number):void {
 const metadata=readSemantics(root),joint=metadata.joints.find(j=>j.id===id);
 if(!joint||!Number.isFinite(angle)||angle<joint.limits[0]||angle>joint.limits[1])throw new Error('Unsupported joint pose');
 const nodes=root.getObjectsByProperty('name',joint.node),node=nodes[0];if(nodes.length!==1||!node||node.parent!==root)throw new Error('Missing joint node');
 node.quaternion.copy(new Quaternion().setFromAxisAngle(new Vector3(...joint.axis),angle*Math.PI/180));joint.angle=angle;root.updateMatrixWorld(true);
}
