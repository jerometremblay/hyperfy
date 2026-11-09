import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'

const bundle = await build({
  stdin: { contents: `export { createNativePolyforkModel } from './src/core/extras/nativePolyforkModel.js'; export * as THREE from 'three'`, resolveDir: process.cwd() },
  bundle: true, platform: 'node', format: 'esm', write: false,
})
const { createNativePolyforkModel, THREE } = await import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)

test('native geometry retains a pivot and registers one scene attachment', () => {
  const object = new THREE.Group()
  const door = new THREE.Group()
  door.name = 'door'
  door.position.x = 0.75
  door.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshBasicMaterial()))
  object.add(door)
  const model = createNativePolyforkModel({ createAsset: () => object, params: { open: {type:'range', min:0, max:1, step:0.1, default:0} } })
  assert.equal(model.root.children.filter(node => node.name === 'nativegeometry').length, 1)
  assert.equal(model.object.getObjectByName('door'), door)
  assert.equal(door.position.x, 0.75)
  assert.equal(model.root.children.find(node => node.name === 'rigidbody').children[0].name, 'collider')
  assert.equal(model.fields[0].key, 'open')
  const collider = model.root.children.find(node => node.name === 'rigidbody').children[0]
  const before = collider._geometry.attributes.position.array.slice()
  assert.equal(model.setPartRotation('door', 'y', -Math.PI / 2), true)
  assert.equal(door.rotation.y, -Math.PI / 2)
  assert.notDeepEqual(collider._geometry.attributes.position.array, before)
  assert.equal(model.setPartRotation('missing', 'y', 0), false)
  assert.throws(() => model.setPartRotation('door', 'y', NaN), /Invalid/)
  const scene = new THREE.Scene()
  const handles = new Set()
  const stage = { scene, insertRaycastObject: value => { handles.add(value); return { destroy: () => handles.delete(value) } } }
  const attachment = model.root.children.find(node => node.name === 'nativegeometry')
  attachment.activate({ world: { stage }, entity: {} })
  assert.equal(handles.size, 1)
  assert.equal(object.parent, attachment.container)
  assert.equal(attachment.container.parent, scene)
  door.rotation.y = -1
  assert.equal(object.getObjectByName('door').rotation.y, -1)
  attachment.deactivate()
  assert.equal(handles.size, 0)
  assert.equal(attachment.container.parent, null)
  let disposed = false
  door.children[0].geometry.addEventListener('dispose', () => { disposed = true })
  model.dispose()
  assert.equal(disposed, true)
})

test('manual geometry remains detached until the app explicitly attaches it', () => {
  const object = new THREE.Group()
  object.add(new THREE.Mesh(new THREE.BoxGeometry(1, 2, 0.1), new THREE.MeshBasicMaterial()))
  let suppliedProps
  const model = createNativePolyforkModel({ createAsset: props => { suppliedProps = props; return object } }, { __manualGeometry: true, width: 2 })
  assert.deepEqual(suppliedProps, { width: 2 })
  assert.equal(model.root.children.length, 0)
  model.attach()
  assert.deepEqual(model.root.children.map(node => node.name), ['nativegeometry', 'rigidbody'])
  model.attach()
  assert.equal(model.root.children.length, 2)
  model.dispose()
})
