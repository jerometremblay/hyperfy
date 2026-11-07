// Validate a prepared toolkit's registered sofa recipe without exporting a GLB.
// Usage: node outputs/polyspoon-sofa/validate-polyspoon.mjs /absolute/prepared-directory
import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import { dirname, isAbsolute, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { createAsset as createHyperfyAsset, disposeAsset as disposeHyperfyAsset } from './sofa.recipe.mjs'

const project = process.argv[2]
if (!project || !isAbsolute(project)) throw new Error('Pass the absolute path of the prepared directory')
const here = dirname(fileURLToPath(import.meta.url))
const compiled = join(project, '.polyspoon/toolkit/.recipe-build')
const importFile = path => import(pathToFileURL(join(compiled, path)).href)
const catalog = await importFile('src/catalog/index.js')
const { inspectGeometry, geometrySnapshot } = await importFile('src/lantern/inspect.js')
const { readSemantics } = await importFile('src/catalog/semantics.js')
const { designInput } = await importFile('src/catalog/appearance.js')
const descriptor = catalog.descriptor('cognac-leather-sofa')
const stored = JSON.parse(await readFile(join(here, 'sofa.design.json'), 'utf8'))
assert.deepEqual(catalog.loadDesign(stored), stored)
assert.throws(() => catalog.loadDesign({ ...stored, applied: { ...stored.applied, seatCount: 4 } }), /Applied parameters mismatch/)
assert.throws(() => catalog.loadDesign({ ...stored, familyVersion: '9.0.0' }), /Unsupported configuration/)

const hashGeometry = root => createHash('sha256').update(JSON.stringify(geometrySnapshot(root))).digest('hex')
function compareWithHyperfy(root, parameters) {
  const source = createHyperfyAsset(parameters)
  const model = root.children[0]
  model.rotation.y = 0
  root.updateMatrixWorld(true)
  source.updateMatrixWorld(true)
  try {
    const meshes = object => {
      const result = []
      object.traverse(node => { if (node.isMesh) result.push(node) })
      return result
    }
    const actual = meshes(root), expected = meshes(source)
    assert.equal(actual.length, expected.length)
    for (let i = 0; i < actual.length; i++) {
      assert.deepEqual(actual[i].matrixWorld.toArray(), expected[i].matrixWorld.toArray(), `part ${i} transform`)
      assert.equal(actual[i].material.color.getHex(), expected[i].material.color.getHex(), `part ${i} color`)
      assert.equal(actual[i].material.roughness, expected[i].material.roughness, `part ${i} roughness`)
      assert.deepEqual(actual[i].geometry.index?.array, expected[i].geometry.index?.array, `part ${i} indices`)
      for (const name of ['position', 'normal', 'uv']) {
        assert.deepEqual(actual[i].geometry.getAttribute(name)?.array, expected[i].geometry.getAttribute(name)?.array, `part ${i} ${name}`)
      }
    }
  } finally {
    model.rotation.y = Math.PI
    root.updateMatrixWorld(true)
    disposeHyperfyAsset(source)
  }
}
function check(parameters) {
  const first = catalog.buildAsset(descriptor.id, parameters)
  try {
    const inspection = inspectGeometry(first.root)
    assert.deepEqual(inspection.errors, [], `invalid geometry for ${JSON.stringify(parameters)}`)
    const semantics = readSemantics(first.root)
    assert.equal(semantics.parts.length, first.root.getObjectsByProperty('isMesh', true).length)
    const loaded = catalog.loadDesign(first.config)
    assert.deepEqual(loaded, first.config)
    compareWithHyperfy(first.root, parameters)
    const rebuilt = catalog.buildAsset(descriptor.id, designInput(loaded))
    try {
      assert.equal(hashGeometry(rebuilt.root), hashGeometry(first.root), 'saved design must reproduce geometry')
      assert.deepEqual(readSemantics(rebuilt.root), semantics)
    } finally {
      catalog.disposeAsset(rebuilt)
    }
    if (parameters['color.leather']) {
      for (let i = 1; i <= (parameters.seatCount ?? descriptor.defaults.seatCount); i++) {
        for (const kind of ['seat', 'back']) {
          const part = first.root.getObjectByName(`${kind}-cushion-${i}-part-0`)
          assert.ok(part, `${kind} cushion ${i}`)
          assert.equal(part.userData.materialRole, 'leather')
          assert.equal(`#${part.material.color.getHexString()}`, parameters['color.leather'])
        }
      }
    }
    return { hash: hashGeometry(first.root), parts: semantics.parts.map(part => part.id) }
  } finally {
    catalog.disposeAsset(first)
  }
}

const baseline = check({})
let cases = 1
for (const control of descriptor.controls) {
  if (!['integer', 'range'].includes(control.kind)) continue
  for (const value of [control.min, control.max]) {
    const result = check({ [control.key]: value })
    if (value !== control.default) assert.notEqual(result.hash, baseline.hash, `${control.key} must change geometry`)
    cases++
  }
}
const twoSeats = check({ seatCount: 2, 'color.leather': '#2478bd' })
const fiveSeats = check({ seatCount: 5, 'color.leather': '#abcdef' })
for (const id of twoSeats.parts) assert.ok(fiveSeats.parts.includes(id), `part identity changed: ${id}`)
cases += 2
console.log(JSON.stringify({ registeredFamily: descriptor.id, controls: descriptor.controls.length, cases, savedDesignRoundTrips: true, semanticParts: baseline.parts.length, geometryValid: true, matchesHyperfy: true }))
