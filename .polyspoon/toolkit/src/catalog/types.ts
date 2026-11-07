import type { AssetJoint,AssetSemantics } from './semantics.ts';
import type { Box3, Group, MeshStandardMaterial, MeshBasicMaterial, Vector3 } from 'three';
import type { Design } from '../engine/parameters.ts';

export interface Preview {
  root: Group;
  bounds: Box3;
  dimensions: Vector3;
  materials: Record<string, MeshStandardMaterial | MeshBasicMaterial>;
}

export interface AssetBuild extends Preview {
  config: Design;
  anchors: Record<string, number[]>;
  joints?:AssetJoint[];
  semantics?:AssetSemantics;
  handleGap?: { width: number; bottom: number; height: number };
}

export interface SemanticAssetBuild extends AssetBuild { semantics:AssetSemantics }
