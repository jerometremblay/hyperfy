import { inspectGeometry } from '../lantern/inspect.ts';
import { Bone,SkinnedMesh } from 'three';
import type { Group } from 'three';
import type { RigMetadata } from './types.ts';
export function validateRig(root:Group,rig:RigMetadata):void {
  if(rig.version!==1||!['humanoid','fox'].includes(rig.kind)||!rig.bones.length||rig.bones.length>32||rig.meshes.length>8)throw new Error('Invalid rig metadata');
  if(inspectGeometry(root).errors.length)throw new Error('Invalid rig geometry');
  const names=new Set<string>();
  for(const declaration of rig.bones){
    if(!/^[a-z][a-z0-9_]*$/.test(declaration.name)||names.has(declaration.name))throw new Error('Invalid bone identity');names.add(declaration.name);
    const nodes=root.getObjectsByProperty('name',declaration.name),node=nodes[0];
    if(node&&(![...node.position.toArray(),...node.quaternion.toArray(),...node.scale.toArray()].every(Number.isFinite)||Math.abs(node.quaternion.length()-1)>1e-6))throw new Error('Invalid bone transform');
    if(nodes.length!==1||!(node instanceof Bone)||declaration.parent===null&&node.parent!==root||(node.parent instanceof Bone?node.parent.name:null)!==declaration.parent)throw new Error('Bone hierarchy mismatch');
  }
  if(rig.kind==='humanoid'&&rig.effectors!==undefined)throw new Error('Humanoid effectors remain implicit');
  if(rig.kind==='fox'){
    const effectors=rig.effectors;if(!effectors||effectors.length!==4||rig.chains.length!==4||new Set(effectors.map(item=>item.id)).size!==4)throw new Error('Fox needs four paw effectors');
    for(const effector of effectors){const chain=rig.chains.find(chain=>chain.upper===effector.chain),suffix=effector.id.endsWith('_l')?'l':'r',pair=effector.id.startsWith('front_')?'front':'hind';if(!['front_l','front_r','hind_l','hind_r'].includes(effector.id)||effector.bone!==pair+'_paw_'+suffix||!chain||chain.end!==(pair==='front'?'front_paw_':'hind_hock_')+suffix||!root.getObjectByName(effector.bone)||effector.offset.length!==3||!effector.offset.every(Number.isFinite)||!Number.isFinite(effector.groundOffset)||effector.groundOffset<=0)throw new Error('Invalid fox paw effector');}
  }
  for(const chain of rig.chains)if(root.getObjectByName(chain.lower)?.parent!==root.getObjectByName(chain.upper)||root.getObjectByName(chain.end)?.parent!==root.getObjectByName(chain.lower))throw new Error('Invalid rig IK chain');
  let triangles=0;const actual:string[]=[];
  root.traverse(object=>{
    if(!(object instanceof SkinnedMesh))return;actual.push(object.name);
    const position=object.geometry.getAttribute('position'),weights=object.geometry.getAttribute('skinWeight'),indices=object.geometry.getAttribute('skinIndex');
    if(!position||!weights||!indices||position.count!==weights.count||position.count!==indices.count||weights.itemSize!==4||indices.itemSize!==4)throw new Error('Skin attribute mismatch');
    triangles+=(object.geometry.index?.count??position.count)/3;
    if(object.skeleton.bones.length!==rig.bones.length||object.skeleton.boneInverses.length!==rig.bones.length)throw new Error('Skeleton length mismatch');
    object.skeleton.bones.forEach((bone,i)=>{if(bone!==root.getObjectByName(rig.bones[i]!.name)||!object.skeleton.boneInverses[i]!.elements.every(Number.isFinite)||Math.abs(object.skeleton.boneInverses[i]!.determinant())<1e-12)throw new Error('Invalid bind skeleton');});
    for(let i=0;i<position.count;i++){let sum=0;for(let j=0;j<4;j++){const index=indices.getComponent(i,j),weight=weights.getComponent(i,j);if(!Number.isInteger(index)||index<0||index>=rig.bones.length||!Number.isFinite(weight)||weight<0)throw new Error('Invalid skin influence');sum+=weight;}if(Math.abs(sum-1)>1e-5)throw new Error('Unnormalized skin weights');}
  });
  if(triangles>12000||!actual.length||actual.length!==rig.meshes.length||new Set(actual).size!==actual.length||actual.some(name=>!rig.meshes.includes(name)))throw new Error('Invalid rig mesh inventory');
}

export function validateRigMotion(root:Group,rig:RigMetadata):void {
  validateRig(root,rig);
  if(root.animations.length!==2||rig.clips.length!==2||new Set(root.animations.map(clip=>clip.name)).size!==2)throw new Error('Required rig clips missing');
  for(const clip of root.animations){
    const declaration=rig.clips.find(item=>item.name===clip.name);
    if(!declaration||!['idle','walk'].includes(clip.name)||!Number.isFinite(clip.duration)||clip.duration<=0||clip.duration>4||Math.abs(declaration.duration-clip.duration)>1e-6||!declaration.rootDelta.every(Number.isFinite))throw new Error('Invalid rig clip declaration');
    if(new Set(clip.tracks.map(track=>track.name)).size!==clip.tracks.length||clip.tracks.length!==rig.bones.length+1)throw new Error('Invalid rig track inventory');
    for(const track of clip.tracks){
      const [node,property,...extra]=track.name.split('.');
      if(extra.length||!rig.bones.some(bone=>bone.name===node)||!['position','quaternion'].includes(property??'')||property==='position'&&node!=='motion_root'||track.times.length>241||track.times.length<2||track.getValueSize()!==(property==='position'?3:4)||!Array.from(track.values).every(Number.isFinite))throw new Error('Invalid rig track');
      if(property==='quaternion')for(let i=0;i<track.values.length;i+=4)if(Math.abs(Math.hypot(...Array.from(track.values.slice(i,i+4)))-1)>1e-5)throw new Error('Invalid animation quaternion');
      for(let i=0;i<track.times.length;i++)if(!Number.isFinite(track.times[i])||i>0&&track.times[i]!<=track.times[i-1]!)throw new Error('Invalid rig track times');
      if(Math.abs(track.times[0]!)>1e-6||Math.abs(track.times.at(-1)!-clip.duration)>1e-6)throw new Error('Rig track duration mismatch');
    }
    const contactBones=rig.kind==='humanoid'?['foot_l','foot_r']:rig.effectors!.map(effector=>effector.bone);
    if(declaration.contacts.length<contactBones.length||declaration.contacts.length>contactBones.length*2||rig.kind==='humanoid'&&declaration.contacts.length!==2||new Set(declaration.contacts.map(contact=>contact.bone)).size!==contactBones.length)throw new Error('Missing rig contacts');
    for(const bone of contactBones){const intervals=declaration.contacts.filter(contact=>contact.bone===bone).sort((a,b)=>a.start-b.start);if(intervals.some((interval,i)=>i>0&&interval.start<intervals[i-1]!.end))throw new Error('Overlapping rig contacts');}
    for(const contact of declaration.contacts)if(!contactBones.includes(contact.bone)||![contact.start,contact.end].every(Number.isFinite)||contact.start<0||contact.end>clip.duration||contact.start>=contact.end)throw new Error('Invalid rig contact interval');
  }
}
