import fs from 'node:fs/promises'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
globalThis.FileReader = class { readAsArrayBuffer(blob) { blob.arrayBuffer().then(value => { this.result = value; this.onloadend?.() }) } readAsDataURL(blob) { blob.arrayBuffer().then(value => { this.result = `data:${blob.type};base64,${Buffer.from(value).toString('base64')}`; this.onloadend?.() }) } }
for (const [key, module] of [['plant','plant'],['bookcase','alcove-bookcase-83894d'],['lamp','table-lamp-e25998'],['rug','wool-rug-ab2bd1']]) {
  const { createAsset } = await import(`./${module}-hd.mjs`)
  const group = createAsset()
  const result = await new GLTFExporter().parseAsync(group, { binary: true, onlyVisible: true })
  await fs.writeFile(new URL(`./${key}.glb`,import.meta.url), Buffer.from(result))
  console.log(key, result.byteLength)
}
