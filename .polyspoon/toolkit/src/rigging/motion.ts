import { AnimationClip,Bone,QuaternionKeyframeTrack,SkinnedMesh,Vector3,VectorKeyframeTrack } from 'three';
import type { KeyframeTrack } from 'three';
import { solveTwoBone,applyTwoBone } from './ik.ts';
import type { RiggedAssetBuild } from './types.ts';

export function createHumanoidMotion(build:RiggedAssetBuild):void {
  const root=build.root,bones=build.rig.bones.map(item=>root.getObjectByName(item.name) as Bone),motion=root.getObjectByName('motion_root') as Bone,height=Number(build.config.applied.height),stride=height*.28;
  const rest=bones.map(bone=>({position:bone.position.clone(),quaternion:bone.quaternion.clone()}));
  function reset(){bones.forEach((bone,i)=>{bone.position.copy(rest[i]!.position);bone.quaternion.copy(rest[i]!.quaternion);});root.updateMatrixWorld(true);}
  const ankles=Object.fromEntries(build.rig.chains.map(chain=>[chain.side,root.getObjectByName(chain.end)!.getWorldPosition(new Vector3())]));
  const clips:AnimationClip[]=[],metadata:RiggedAssetBuild['rig']['clips']=[];
  try{
    for(const name of ['idle','walk']){
      const duration=name==='idle'?2.4:1.2,count=Math.round(duration*60),times:number[]=[],positions:number[]=[],rotations=bones.map(()=>[] as number[]);
      for(let frame=0;frame<=count;frame++){
        reset();const phase=frame/count;times.push(phase*duration);
        motion.position.set(0,name==='idle'?height*.001*Math.sin(phase*Math.PI*2):height*(-.001+.001*Math.cos(phase*Math.PI*4)),name==='idle'?0:stride*phase);
        root.getObjectByName('spine')!.rotation.x=.015*Math.sin(phase*Math.PI*2);
        for(const suffix of ['l','r'])root.getObjectByName('upper_arm_'+suffix)!.rotation.x=name==='walk'?(suffix==='l'?1:-1)*.3*Math.sin(phase*Math.PI*2):0;
        root.updateMatrixWorld(true);
        for(const chain of build.rig.chains){
          const target=ankles[chain.side]!.clone();
          if(name==='walk'){
            const swing=chain.side==='left'?phase>.5:phase<.5;
            if(swing){const t=chain.side==='left'?(phase-.5)*2:phase*2,smooth=t*t*t*(t*(t*6-15)+10);target.z=(chain.side==='left'?0:-stride/2)+stride*smooth;target.y+=height*.025*Math.sin(Math.PI*t)**2;}
            else target.z=chain.side==='left'?0:stride/2;
            target.z+=stride/4;
          }
          const upper=root.getObjectByName(chain.upper) as Bone,lower=root.getObjectByName(chain.lower) as Bone,end=root.getObjectByName(chain.end) as Bone,pose=solveTwoBone(upper,lower,end,target,new Vector3(0,0,1));applyTwoBone(upper,lower,end,pose);
        }
        root.updateMatrixWorld(true);positions.push(...motion.position.toArray());bones.forEach((bone,i)=>rotations[i]!.push(...bone.quaternion.toArray()));
      }
      const tracks:KeyframeTrack[]=[new VectorKeyframeTrack('motion_root.position',times,positions),...bones.map((bone,i)=>new QuaternionKeyframeTrack(bone.name+'.quaternion',times,rotations[i]!))];
      clips.push(new AnimationClip(name,duration,tracks));metadata.push({name,duration,rootDelta:[0,0,name==='walk'?stride:0],contacts:name==='idle'?[{bone:'foot_l',start:0,end:duration},{bone:'foot_r',start:0,end:duration}]:[{bone:'foot_l',start:0,end:duration/2},{bone:'foot_r',start:duration/2,end:duration}]});
    }
    root.animations=clips;build.rig.clips=metadata;
  }finally{reset();root.traverse(object=>{if(object instanceof SkinnedMesh)object.skeleton.update();});}
}
