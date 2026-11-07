import fs from 'node:fs/promises'
import { compilePolyforkRecipe } from '../../src/server/compilePolyforkRecipe.js'
import {loadProfile,makeClient} from '../../tools/worldsync/src/deployment.mjs'
const c=makeClient(await loadProfile('../hyperfy-world-jerome','online-world'))
for (const [key,file] of [['bookcase','alcove-bookcase-83894d'],['plant','plant'],['rug','wool-rug-ab2bd1'],['lamp','table-lamp-e25998']]) {
 const module=await fs.readFile(new URL(file+'-hd.mjs',import.meta.url),'utf8')
 const source=await compilePolyforkRecipe(module)
 await fs.writeFile(new URL(key+'-compiled.js',import.meta.url),source)
 try { const result=await c.request('/polyspoon/recipes',{method:'POST',json:{source,params:{},validateOnly:true}});console.log(key,'compiled',source.length,'validation',JSON.stringify(result)) } catch(e) {console.log(key,'validation failed:',e.message)}
}
