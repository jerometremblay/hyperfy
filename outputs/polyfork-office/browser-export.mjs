import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { createAsset as plant } from './plant-hd.mjs'
import { createAsset as bookcase } from './alcove-bookcase-83894d-hd.mjs'
import { createAsset as lamp } from './table-lamp-e25998-hd.mjs'
import { createAsset as rug } from './wool-rug-ab2bd1-hd.mjs'
window.exportModels = async () => { let out = {}; for (const [name,create] of Object.entries({plant,bookcase,lamp,rug})) { const b = await new GLTFExporter().parseAsync(create(), {binary:true}); const bytes = new Uint8Array(b); let s = ''; for (let i=0;i<bytes.length;i+=8192) s+=String.fromCharCode(...bytes.subarray(i,i+8192)); out[name]=btoa(s) } return out }
