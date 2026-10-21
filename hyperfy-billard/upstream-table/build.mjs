// Convert the pinned upstream table to self-contained, Y-up Hyperfy GLB.
import fs from 'node:fs/promises'
import { createHash } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js'
const here = fileURLToPath(new URL('.', import.meta.url))
const hash = bytes => createHash('sha256').update(bytes).digest('hex')
globalThis.ProgressEvent ??= class { constructor(type, fields) { Object.assign(this, { type }, fields) } }
globalThis.FileReader ??= class {
  readAsArrayBuffer(blob) { blob.arrayBuffer().then(result => { this.result = result; this.onloadend?.() }) }
  readAsDataURL(blob) { blob.arrayBuffer().then(result => { this.result = `data:${blob.type};base64,${Buffer.from(result).toString('base64')}`; this.onloadend?.() }) }
}
const raw = await fs.readFile(`${here}p8.min.gltf`)
const bin = await fs.readFile(`${here}p8.min.bin`)
const gltf = JSON.parse(raw)
gltf.buffers[0].uri = `data:application/octet-stream;base64,${bin.toString('base64')}`
const loaded = await new GLTFLoader().parseAsync(JSON.stringify(gltf), '')
loaded.scene.updateMatrixWorld(true)
const table = new THREE.Group()
table.name = 'Tailuge eight-ball table'
const metres = 0.028575 / 0.5
const length = 2.3368, width = 1.1684, clothHeight = 0.708
const shiftX = length / 2 - 22 * metres
const shiftY = width / 2 - 11 * metres
const cloth = []
loaded.scene.traverse(node => {
  if (!node.isMesh || node.material.name !== 'cloth') return
  const p = node.geometry.attributes.position
  for (let i = 0; i < p.count; i++) cloth.push(new THREE.Vector3().fromBufferAttribute(p, i).applyMatrix4(node.matrixWorld).z)
})
const clothTop = Math.max(...cloth)
const audit = []
const addShadowBackfaces = geometry => {
  const index = geometry.index
  const front = index
    ? Array.from(index.array).slice(0, index.count)
    : Array.from({ length: geometry.attributes.position.count }, (_, i) => i)
  const groups = geometry.groups.length
    ? geometry.groups.map(({ start, count, materialIndex }) => ({ start, count, materialIndex }))
    : [{ start: 0, count: front.length, materialIndex: 0 }]
  const back = []
  for (const { start, count } of groups) {
    for (let i = start; i < start + count; i += 3) {
      back.push(front[i], front[i + 2], front[i + 1])
    }
  }
  geometry.setIndex([...front, ...back])
  if (geometry.groups.length) {
    geometry.clearGroups()
    for (const group of groups) geometry.addGroup(group.start, group.count, group.materialIndex)
    let start = front.length
    for (const group of groups) {
      geometry.addGroup(start, group.count, group.materialIndex)
      start += group.count
    }
  }
  return geometry
}
loaded.scene.traverse(node => {
  if (!node.isMesh) return // Upstream browser lighting is replaced by world lighting.
  const geometry = node.geometry.clone()
  // Decode quantized/interleaved attributes before writing metric float values.
  for (const name of ['position', 'normal']) {
    const attribute = geometry.attributes[name]
    const values = []
    for (let i = 0; i < attribute.count; i++) values.push(attribute.getX(i), attribute.getY(i), attribute.getZ(i))
    geometry.setAttribute(name, new THREE.Float32BufferAttribute(values, 3))
  }
  geometry.applyMatrix4(node.matrixWorld)
  const p = geometry.attributes.position
  // Like upstream scaleTableModel: translate the end/corner sections, keeping
  // pocket mouths and rail thickness at their original ball-relative size.
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i)
    p.setXYZ(i,
      x * metres + (Math.abs(x) > 5 ? Math.sign(x) * shiftX : 0),
      clothHeight + (z - clothTop) * metres,
      -(y * metres + (Math.abs(y) > 3 ? Math.sign(y) * shiftY : 0)))
  }
  // Native source is Z-up. Preserve its authored normals while changing axes.
  const normal = geometry.attributes.normal
  for (let i = 0; i < normal.count; i++) {
    const y = normal.getY(i), z = normal.getZ(i)
    normal.setXYZ(i, normal.getX(i), z, -y)
  }
  // Stage renders shadow depth from each material's back side. Duplicate
  // reversed triangles so the table's thin, upward-facing surfaces still cast.
  addShadowBackfaces(geometry)
  geometry.computeBoundingBox()
  const material = node.material.clone()
  // Give the playing cloth a warm orange-peach finish, including its shaded
  // edge and the matching cushion fabric from the upstream blue table.
  if (material.name === 'cloth') material.color.set('#e99476')
  if (material.name === 'clothshade') material.color.set('#cf7258')
  if (material.name === 'CushionBlue') material.color.set('#b85d49')
  const mesh = new THREE.Mesh(geometry, material)
  mesh.name = `upstream-${node.material.name}`
  mesh.castShadow = mesh.receiveShadow = true
  mesh.userData.castShadow = true
  mesh.userData.receiveShadow = true
  table.add(mesh)
  audit.push({ material: node.material.name, vertices: p.count, min: geometry.boundingBox.min.toArray(), max: geometry.boundingBox.max.toArray() })
})
// The upstream browser asset contains the tabletop only. Four plain supports
// ground it at the existing cloth height, without reusing the custom furniture.
for (const x of [-0.94, 0.94]) for (const z of [-0.43, 0.43]) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.56, 0.12), new THREE.MeshStandardMaterial({ color: '#281c16', roughness: 0.55 }))
  leg.name = 'support-leg'
  leg.position.set(x, 0.28, z)
  leg.userData.castShadow = true
  leg.userData.receiveShadow = true
  table.add(leg)
}
const output = Buffer.from(await new GLTFExporter().parseAsync(table, { binary: true }))
await fs.writeFile(`${here}model.glb`, output)
const source = await fs.readFile(`${here}table.js`)
const modelUrl = `asset://${hash(output)}.glb`, scriptUrl = `asset://${hash(source)}.js`
const blueprint = { id: 'tailuge-pool-table', version: 0, name: 'Tailuge 8 ft Pool Table', model: modelUrl, script: scriptUrl, author: 'tailuge and contributors; Hyperfy conversion', desc: 'Original p8 model, GPL-3.0-only. Converted to Y-up and fitted to WPA 8 ft; four plain support legs added.', props: { poolChannel: 'classic-8-ft-pool-table', clothColor: '#e99476' }, unique: false, disabled: false }
const assets = [{ type: 'model', url: modelUrl, size: output.length, mime: 'model/gltf-binary' }, { type: 'script', url: scriptUrl, size: source.length, mime: 'text/plain' }]
const header = Buffer.from(JSON.stringify({ blueprint, assets }))
const prefix = Buffer.alloc(4); prefix.writeUInt32LE(header.length)
await fs.writeFile(`${here}table.hyp`, Buffer.concat([prefix, header, output, source]))
await fs.writeFile(`${here}manifest.json`, JSON.stringify({ repository: 'https://github.com/tailuge/billiards', commit: 'b23b1d9f0da103783f70fa48a6c6f7f288290d9e', sourceHashes: { 'p8.min.gltf': hash(raw), 'p8.min.bin': hash(bin) }, modelUrl, scriptUrl, clothHeight, length, width, sourceClothTop: clothTop, metresPerSourceUnit: metres, endTranslations: [shiftX, shiftY], meshes: audit, addedSupportLegs: 4 }, null, 2) + '\n')
console.log(`Built upstream table: ${output.length} bytes, ${audit.length} original material meshes + 4 supports`)
