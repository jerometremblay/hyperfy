import { attachSemantics } from './semantics.js';
import { Mesh, SkinnedMesh } from 'three';
import { splitAppearance, styleAsset } from './appearance.js';
export function buildRecipeAsset(recipe, input = {}) {
    const { parameters, appearance } = splitAppearance(input);
    const build = recipe.build(parameters);
    try {
        styleAsset(build, appearance);
        attachSemantics(build, recipe.descriptor.controls);
        recipe.finalize?.(build);
        return build;
    }
    catch (error) {
        disposeAsset(build);
        throw error;
    }
}
const disposedRoots = new WeakSet();
export function disposeAsset(build) {
    if (disposedRoots.has(build.root))
        return;
    disposedRoots.add(build.root);
    const geometries = new Set(), materials = new Set(Object.values(build.materials)), skeletons = new Set();
    build.root.traverse(object => {
        if (object instanceof Mesh) {
            geometries.add(object.geometry);
            for (const material of Array.isArray(object.material) ? object.material : [object.material])
                materials.add(material);
        }
        if (object instanceof SkinnedMesh)
            skeletons.add(object.skeleton);
    });
    for (const geometry of geometries)
        geometry.dispose();
    for (const material of materials)
        material.dispose();
    for (const skeleton of skeletons)
        skeleton.dispose();
}
