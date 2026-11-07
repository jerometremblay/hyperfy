import { humanoidRecipe as rawHumanoidRecipe } from '../../examples/recipes/stylized-humanoid/index.ts';
import { foxRecipe as rawFoxRecipe } from '../../examples/recipes/stylized-fox/index.ts';
import { disposeAsset } from '../catalog/build.ts';
import { createHumanoidMotion } from '../rigging/motion.ts';
import { createFoxMotion } from '../rigging/fox-motion.ts';
import { validateRig,validateRigMotion } from '../rigging/validation.ts';
import type { RiggedAssetBuild } from '../rigging/types.ts';
import type { Recipe } from './types.ts';

function riggedRecipe(raw:Recipe,createMotion:(build:RiggedAssetBuild)=>void,exportName:string):Recipe {
  return {...raw,source:{entry:'src/recipes/rigged.ts',exportName},build(input){
    const build=raw.build(input) as RiggedAssetBuild;
    build.dispose=()=>disposeAsset(build);
    return build;
  },finalize(asset){
    const build=asset as RiggedAssetBuild;
      validateRig(build.root,build.rig);build.root.userData.openpolyRig=build.rig;
      createMotion(build);validateRigMotion(build.root,build.rig);
  }};
}
export const humanoidRecipe=riggedRecipe(rawHumanoidRecipe,createHumanoidMotion,'humanoidRecipe');
export const foxRecipe=riggedRecipe(rawFoxRecipe,createFoxMotion,'foxRecipe');
