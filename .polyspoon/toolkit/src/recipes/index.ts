import { RecipeRegistry } from './registry.ts';
import { lanternRecipe, cottageRecipe, treeRecipe, fenceRecipe, crateRecipe, boulderRecipe } from './builtins.ts';
import { benchRecipe } from '../../examples/recipes/bench/index.ts';
import { planterRecipe } from '../../examples/recipes/planter/index.ts';
import { treasureChestRecipe } from '../../examples/recipes/treasure-chest/index.ts';
import { wheelbarrowRecipe } from '../../examples/recipes/wheelbarrow/index.ts';
import { stoneWellRecipe } from '../../examples/recipes/stone-well/index.ts';
import { coniferRecipe } from '../../examples/recipes/conifer/index.ts';
import { humanoidRecipe,foxRecipe } from './rigged.ts';
export type { Recipe, RecipeCase } from './types.ts';

export const registry = new RecipeRegistry();
for (const entry of [lanternRecipe,cottageRecipe,treeRecipe,fenceRecipe,crateRecipe,boulderRecipe,benchRecipe,planterRecipe,treasureChestRecipe,wheelbarrowRecipe,stoneWellRecipe,coniferRecipe,humanoidRecipe,foxRecipe]) registry.register(entry);
export const recipe = (id: string) => registry.get(id);
