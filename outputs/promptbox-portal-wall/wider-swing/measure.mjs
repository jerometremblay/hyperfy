import fs from 'node:fs/promises'
import { build } from 'esbuild'
import * as THREE from 'three'
import { OBB } from 'three/examples/jsm/math/OBB.js'

const directory = new URL('./', import.meta.url)
const source = await fs.readFile(new URL('before.js', directory), 'utf8')
const bundle = await build({ entryPoints: ['outputs/promptbox-large/runtime-adapter.mjs'],
  bundle: true, format: 'esm', platform: 'node', write: false })
const { executeSource } = await import('data:text/javascript;base64,' +
  Buffer.from(bundle.outputFiles[0].contents).toString('base64'))
const runtime = await executeSource(source, '\nreturn { doorRegistry, setDoorGeometry }',
  { state: { doors: {} } })
function bounds(node) {
  node.updateTransform()
  if (node.type === 'box') {
    return new OBB(new THREE.Vector3(), new THREE.Vector3().fromArray(node.size).multiplyScalar(.5))
      .applyMatrix4(node.matrixWorld)
  }
  const visual = runtime.visuals.find(v => v.node === node)
  if (!visual) return null
  visual.geometry.computeBoundingBox()
  const box = visual.geometry.boundingBox
  return new OBB(box.getCenter(new THREE.Vector3()), box.getSize(new THREE.Vector3()).multiplyScalar(.5))
    .applyMatrix4(visual.matrix)
}
const obstacles = runtime.nodes.filter(n => n.name === 'prim' &&
  !n.id?.startsWith('doors:') && !n.id?.match(/physics:.*-leaf:/))
  .map(node => ({ node, bounds: bounds(node) })).filter(o => {
    if (!o.bounds) return false
    const box = new THREE.Box3()
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      box.expandByPoint(new THREE.Vector3(x, y, z).multiply(o.bounds.halfSize)
        .applyMatrix3(o.bounds.rotation).add(o.bounds.center))
    }
    return box.intersectsBox(new THREE.Box3(
      new THREE.Vector3(4.2, .14, .1), new THREE.Vector3(9.1, 2.3, 1.5)))
  })
const report = []
for (const id of ['billiards-portal-left', 'billiards-portal-right']) {
  const door = runtime.audit.doorRegistry[id]
  const moving = runtime.nodes.filter(n => n.name === 'prim' && n.type === 'box' &&
    (n.id?.startsWith('doors:' + id + '-') && !n.id.includes('-hinge-frame') ||
      n.id?.startsWith('physics:' + id + '-leaf:')))
  const limits = []
  for (const clearance of [0, .005]) {
    const expanded = obstacles.map(o => ({ node: o.node, bounds: o.bounds.clone() }))
    for (const obstacle of expanded) obstacle.bounds.halfSize.addScalar(clearance)
    let firstIntersection
    for (let step = 0; step <= 18000; step++) {
      const degrees = step / 100
      runtime.audit.setDoorGeometry(door, Math.sign(door.openAngle) * degrees * Math.PI / 180)
      for (const node of moving) {
        const box = bounds(node)
        const hit = expanded.find(o => box.intersectsOBB(o.bounds, 1e-9))
        if (hit) { firstIntersection = { degrees, moving: node.id, obstacle: hit.node.id }; break }
      }
      if (firstIntersection) break
    }
    limits.push({ clearanceMetres: clearance, firstIntersection: firstIntersection || null })
  }
  report.push({ id, limits })
  runtime.audit.setDoorGeometry(door, 0)
}
await fs.writeFile(new URL('clearance-measurement.json', directory), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report))
