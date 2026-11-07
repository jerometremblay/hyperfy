import { humanoidRecipe as rawHumanoidRecipe } from '../../examples/recipes/stylized-humanoid/index.js';
import { foxRecipe as rawFoxRecipe } from '../../examples/recipes/stylized-fox/index.js';
import { disposeAsset } from '../catalog/build.js';
import { createHumanoidMotion } from '../rigging/motion.js';
import { createFoxMotion } from '../rigging/fox-motion.js';
import { validateRig, validateRigMotion } from '../rigging/validation.js';
function riggedRecipe(raw, createMotion, exportName) {
    return { ...raw, source: { entry: 'src/recipes/rigged.ts', exportName }, build(input) {
            const build = raw.build(input);
            build.dispose = () => disposeAsset(build);
            return build;
        }, finalize(asset) {
            const build = asset;
            validateRig(build.root, build.rig);
            build.root.userData.openpolyRig = build.rig;
            createMotion(build);
            validateRigMotion(build.root, build.rig);
        } };
}
export const humanoidRecipe = riggedRecipe(rawHumanoidRecipe, createHumanoidMotion, 'humanoidRecipe');
export const foxRecipe = riggedRecipe(rawFoxRecipe, createFoxMotion, 'foxRecipe');
