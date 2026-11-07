import { AnimationClip,Bone,QuaternionKeyframeTrack,SkinnedMesh,Vector3,VectorKeyframeTrack } from 'three';
import type { Object3D,KeyframeTrack } from 'three';
import { solveTwoBone,applyTwoBone } from './ik.ts';
import type { RigMetadata,RiggedAssetBuild } from './types.ts';
export function applyFoxPawTarget(root:Object3D,rig:RigMetadata,id:string,target:Vector3):void {
  if(rig.kind!=='fox')throw new Error('Expected fox rig');const effector=rig.effectors?.find(item=>item.id===id),chain=rig.chains.find(item=>item.upper===effector?.chain);
  if(!effector||!chain||target.y<effector.groundOffset-1e-7)throw new Error('Invalid fox paw target');
  const upper=root.getObjectByName(chain.upper) as Bone,lower=root.getObjectByName(chain.lower) as Bone,end=root.getObjectByName(chain.end) as Bone,pose=solveTwoBone(upper,lower,end,target.clone().add(new Vector3(...effector.offset)),new Vector3(0,0,id.startsWith('front')?-1:1));applyTwoBone(upper,lower,end,pose);
}
export function createFoxMotion(build:RiggedAssetBuild):void {
  if(build.rig.kind!=='fox')throw new Error('Expected fox build');const root=build.root,bones=build.rig.bones.map(item=>root.getObjectByName(item.name) as Bone),rest=bones.map(bone=>({position:bone.position.clone(),quaternion:bone.quaternion.clone()})),motion=root.getObjectByName('motion_root') as Bone,L=Number(build.config.applied.bodyLength),stride=L*.18,duty=.7,offsets:Record<string,number>={front_l:0,hind_r:.25,front_r:.5,hind_l:.75},effectors=build.rig.effectors!,paws=Object.fromEntries(effectors.map(effector=>[effector.id,root.getObjectByName(effector.bone)!.getWorldPosition(new Vector3())]));
  function reset(){bones.forEach((bone,i)=>{bone.position.copy(rest[i]!.position);bone.quaternion.copy(rest[i]!.quaternion);});root.updateMatrixWorld(true);}
  const clips:AnimationClip[]=[],metadata:RigMetadata['clips']=[];
  try{
    for(const name of ['idle','walk']){
      const duration=name==='idle'?2.4:1.2,count=Math.round(duration*60),times:number[]=[],positions:number[]=[],rotations=bones.map(()=>[] as number[]);
      for(let frame=0;frame<=count;frame++){
        reset();const phase=frame/count;times.push(phase*duration);motion.position.set(0,name==='idle'?L*.0008*Math.sin(phase*Math.PI*2):-L*.001*(1-Math.cos(phase*Math.PI*4)),name==='idle'?0:stride*phase);
        root.getObjectByName('spine')!.rotation.y=.008*Math.sin(phase*Math.PI*2);root.getObjectByName('head')!.rotation.x=.012*Math.sin(phase*Math.PI*2);
        for(const [i,tail] of ['tail_base','tail_mid_a','tail_mid_b','tail_tip'].entries())root.getObjectByName(tail)!.rotation.y=(name==='idle'?.045:.075)*Math.sin(phase*Math.PI*2+i*.45);
        root.getObjectByName('ear_l')!.rotation.z=.018*Math.sin(phase*Math.PI*2);root.getObjectByName('ear_r')!.rotation.z=-.018*Math.sin(phase*Math.PI*2);root.updateMatrixWorld(true);
        for(const effector of effectors){const target=paws[effector.id]!.clone();if(name==='walk'){
          const local=phase+offsets[effector.id]!,cycle=Math.floor(local),u=local-cycle;target.z+=stride*(cycle+duty/2-offsets[effector.id]!);
          if(u>duty){const t=(u-duty)/(1-duty),smooth=t*t*t*(t*(t*6-15)+10);target.z+=stride*smooth;target.y+=L*.035*Math.sin(Math.PI*t)**2;}
        }applyFoxPawTarget(root,build.rig,effector.id,target);root.updateMatrixWorld(true);}
        positions.push(...motion.position.toArray());bones.forEach((bone,i)=>rotations[i]!.push(...bone.quaternion.toArray()));
      }
      const tracks:KeyframeTrack[]=[new VectorKeyframeTrack('motion_root.position',times,positions),...bones.map((bone,i)=>new QuaternionKeyframeTrack(bone.name+'.quaternion',times,rotations[i]!))],contacts:RigMetadata['clips'][number]['contacts']=[];
      for(const effector of effectors){if(name==='idle')contacts.push({bone:effector.bone,start:0,end:duration});else for(let cycle=0;cycle<=1;cycle++){const start=Math.max(0,cycle-offsets[effector.id]!),end=Math.min(1,cycle+duty-offsets[effector.id]!);if(end>start)contacts.push({bone:effector.bone,start:start*duration,end:end*duration});}}
      clips.push(new AnimationClip(name,duration,tracks));metadata.push({name,duration,rootDelta:[0,0,name==='walk'?stride:0],contacts});
    }
    root.animations=clips;build.rig.clips=metadata;
  }finally{reset();root.traverse(object=>{if(object instanceof SkinnedMesh)object.skeleton.update();});}
}
