import type { Descriptor, Design, Parameters } from '../engine/parameters.ts';
import type { AssetBuild,SemanticAssetBuild } from '../catalog/types.ts';

export interface RecipeCase {
  id: string;
  name: string;
  parameters: Parameters;
}

export interface Recipe {
  descriptor: Descriptor;
  build(input: unknown): AssetBuild;
  finalize?(build:SemanticAssetBuild):void;
  load(input: unknown): Design;
  validationCases: RecipeCase[];
  integrationCases: RecipeCase[];
  constraints: string[];
  presentation: {
    category: string;
    order: number;
    kitIds: string[];
    thumbnails?: Record<string, string>;
  };
  source: {
    entry: string;
    exportName: string;
  };
}
