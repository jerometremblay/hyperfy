import { attachSemantics } from './semantics.ts';
import { Mesh,SkinnedMesh } from 'three';
import { splitAppearance, styleAsset } from './appearance.ts';
import type { Recipe } from '../recipes/types.ts';
import type { SemanticAssetBuild, Preview } from './types.ts';

export function buildRecipeAsset(recipe:Recipe,input:unknown={}):SemanticAssetBuild {
  const {parameters,appearance}=splitAppearance(input);
  const build=recipe.build(parameters);
  try{styleAsset(build,appearance);attachSemantics(build,recipe.descriptor.controls);recipe.finalize?.(build as SemanticAssetBuild);return build as SemanticAssetBuild;}catch(error){disposeAsset(build);throw error;}
}
const disposedRoots=new WeakSet<Preview['root']>();
export function disposeAsset(build:Preview):void {
  if(disposedRoots.has(build.root))return;
  disposedRoots.add(build.root);
  const geometries=new Set<Mesh['geometry']>(),materials=new Set(Object.values(build.materials)),skeletons=new Set<SkinnedMesh['skeleton']>();
  build.root.traverse(object=>{
    if(object instanceof Mesh){geometries.add(object.geometry);for(const material of Array.isArray(object.material)?object.material:[object.material])materials.add(material as Preview['materials'][string]);}
    if(object instanceof SkinnedMesh)skeletons.add(object.skeleton);
  });
  for(const geometry of geometries)geometry.dispose();
  for(const material of materials)material.dispose();
  for(const skeleton of skeletons)skeleton.dispose();
}
