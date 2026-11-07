import type { SemanticAssetBuild,AssetBuild } from '../catalog/types.ts';
export interface RigBone {name:string;parent:string|null}
export interface RigChain {upper:string;lower:string;end:string;side:'left'|'right'}
export interface RigClip {name:string;duration:number;rootDelta:[number,number,number];contacts:{bone:string;start:number;end:number}[]}
export interface RigEffector {id:string;bone:string;chain:string;offset:[number,number,number];groundOffset:number}
export interface RigMetadata {version:1;kind:'humanoid'|'fox';effectors?:RigEffector[];bones:RigBone[];meshes:string[];chains:RigChain[];clips:RigClip[]}
export interface RawRiggedBuild extends AssetBuild {rig:RigMetadata}
export interface RiggedAssetBuild extends SemanticAssetBuild {rig:RigMetadata;dispose:()=>void}
