import { Scene,Mesh,SkinnedMesh } from 'three';
import type { BufferGeometry } from 'three';
import { clone } from 'three/addons/utils/SkeletonUtils.js';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { readSemantics } from '../catalog/semantics.ts';
import { validateRigMotion } from './validation.ts';
import type { RiggedAssetBuild } from './types.ts';
export async function exportRiggedAsset(build:RiggedAssetBuild):Promise<Uint8Array> {
  readSemantics(build.root);validateRigMotion(build.root,build.rig);
  if(build.root.userData.openpolyRig!==build.rig)throw new Error('Rig metadata authority mismatch');
  const copy=clone(build.root),scene=new Scene();scene.name=build.root.name;scene.userData=structuredClone(build.root.userData);scene.animations=build.root.animations;
  for(const child of [...copy.children])scene.add(child);
  const geometries=new Set<BufferGeometry>();
  try{
    scene.traverse(object=>{if(object instanceof Mesh&&!Array.isArray(object.material)&&'flatShading' in object.material&&object.material.flatShading){const geometry=object.geometry.index?object.geometry.toNonIndexed():object.geometry.clone();geometries.add(geometry);geometry.computeVertexNormals();object.geometry=geometry;}});
    const result=await new GLTFExporter().parseAsync(scene,{binary:true,onlyVisible:false,trs:true,animations:scene.animations});
    if(!(result instanceof ArrayBuffer))throw new Error('Exporter did not produce animated binary glTF');return new Uint8Array(result);
  }finally{const skeletons=new Set<SkinnedMesh['skeleton']>();scene.traverse(object=>{if(object instanceof SkinnedMesh)skeletons.add(object.skeleton);});for(const skeleton of skeletons)skeleton.dispose();for(const geometry of geometries)geometry.dispose();}
}
