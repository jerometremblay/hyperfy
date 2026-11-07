import { Bone,Quaternion,Vector3 } from 'three';
export interface TwoBonePose {upper:Quaternion;lower:Quaternion;end:Quaternion}
export function solveTwoBone(upper:Bone,lower:Bone,end:Bone,target:Vector3,pole:Vector3):TwoBonePose {
  if(lower.parent!==upper||end.parent!==lower||![...target.toArray(),...pole.toArray()].every(Number.isFinite))throw new Error('Invalid IK chain or target');
  upper.updateWorldMatrix(true,false);const origin=upper.getWorldPosition(new Vector3()),direction=target.clone().sub(origin),distance=direction.length(),a=lower.position.length(),b=end.position.length();
  if(a<1e-6||b<1e-6||distance<1e-6||distance>a+b-1e-8||distance<Math.abs(a-b)+1e-8)throw new Error('IK target is unreachable');direction.divideScalar(distance);
  const bend=pole.clone().addScaledVector(direction,-pole.dot(direction));if(bend.lengthSq()<1e-12)throw new Error('IK pole is degenerate');bend.normalize();
  const along=(a*a-b*b+distance*distance)/(2*distance),height=Math.sqrt(Math.max(0,a*a-along*along)),middle=origin.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  const upperWorld=new Quaternion().setFromUnitVectors(lower.position.clone().normalize(),middle.clone().sub(origin).normalize()),lowerWorld=new Quaternion().setFromUnitVectors(end.position.clone().normalize(),target.clone().sub(middle).normalize()),parent=upper.parent!.getWorldQuaternion(new Quaternion());
  return {upper:parent.invert().multiply(upperWorld),lower:upperWorld.clone().invert().multiply(lowerWorld),end:lowerWorld.clone().invert()};
}
export function applyTwoBone(upper:Bone,lower:Bone,end:Bone,pose:TwoBonePose):void {upper.quaternion.copy(pose.upper);lower.quaternion.copy(pose.lower);end.quaternion.copy(pose.end);}
