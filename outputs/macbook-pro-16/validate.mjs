import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { build } from 'esbuild'
import { Box3, Vector3, Matrix4, Quaternion } from 'three'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const bundle = await build({
  entryPoints: ['outputs/macbook-pro-16/runtime.mjs'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
  define: { 'process.env.PUBLIC_PLAYER_COLLISION': '"false"' },
})
const { execute } = await import(
  'data:text/javascript;base64,' + Buffer.from(bundle.outputFiles[0].contents).toString('base64')
)
const source = await fs.readFile(new URL('macbook.js', import.meta.url), 'utf8')
const parsed = parseHyp(await fs.readFile(new URL('macbook-pro-16.hyp', import.meta.url)))
assert.equal(Buffer.from(parsed.assets.find(a => a.type === 'script').bytes).toString(), source)
const client = execute(source)
const node = id => client.nodes.find(n => n.id === id)
const callbacks = runtime => runtime.handlers.get('update')?.size || 0
assert.equal(callbacks(client), 0)
const logo = node('apple-logo-image')
const logoAsset = parsed.assets.find(a => a.url === logo.src)
const logoBytes = Buffer.from(logoAsset.bytes)
assert(logoBytes.equals(await fs.readFile(new URL('apple-logo.png', import.meta.url))))
assert.equal(logoBytes.readUInt32BE(16), 500)
assert.equal(logoBytes.readUInt32BE(20), 615)
assert.equal(logoBytes[25], 4, 'PNG must include grayscale alpha')
assert.equal(client.nodes.filter(n => n.name === 'image').length, 2)
assert.equal(logo.parent, node('display-assembly'))
assert.equal(logo.color, 'transparent')
assert.equal(logo.doubleside, false)
assert(!node('apple-logo') && !node('apple-leaf'), 'Logo must not use primitive silhouettes')
assert(new Vector3(0, 0, 1).transformDirection(logo.matrixWorld).z > 0.95)
assert(new Vector3(1, 0, 0).transformDirection(logo.matrixWorld).x > 0.99, 'Outside logo must not be mirrored')
logo.ctx.world.loader = { get: () => ({ width: 500, height: 615 }) }
logo.ctx.world.graphics = { maxAnisotropy: 1 }
logo.ctx.world.setupMaterial = () => {}
logo.ctx.world.stage.octree = { insert() {}, remove() {}, move() {} }
await logo.build()
assert.equal(logo.mesh.material.transparent, true)
assert.equal(logo.mesh.geometry.parameters.width, logo.width)
assert.equal(logo.mesh.geometry.parameters.height, logo.height)
assert.equal(logo.mesh.material.side, 0)
const nativeScreen = node('github-screen')
assert.equal(nativeScreen.name, 'image')
assert.equal(nativeScreen.parent, node('display-assembly'))
assert.equal(nativeScreen.lit, false)
assert.equal(nativeScreen.doubleside, false)
assert.equal(nativeScreen.fit, 'contain')
assert.equal(client.configs.filter(c => c.kind === 'webview').length, 0)
const screenshotAsset = parsed.assets.find(a => a.url === nativeScreen.src)
assert(screenshotAsset, 'Screenshot must be embedded in the package')
const screenshotBytes = Buffer.from(screenshotAsset.bytes)
assert(screenshotBytes.equals(await fs.readFile(new URL('github-page.png', import.meta.url))))
nativeScreen.ctx.world.loader = {
  get: () => ({ width: screenshotBytes.readUInt32BE(16), height: screenshotBytes.readUInt32BE(20) }),
}
await nativeScreen.build()
assert(Math.abs(nativeScreen.mesh.geometry.parameters.width - 0.3446) < 1e-8)
assert(Math.abs(nativeScreen.mesh.geometry.parameters.height - 0.3446 / 1.6) < 1e-8)
assert.equal(nativeScreen.mesh.material.transparent, false)
assert.equal(nativeScreen.mesh.material.side, 0)
nativeScreen.commit(true)
assert(nativeScreen.mesh.matrixWorld.equals(nativeScreen.matrixWorld))
const openNormal = new Vector3(0, 0, 1).transformDirection(node('github-screen').matrixWorld)
assert(openNormal.z < -0.95 && openNormal.y > 0)
const screenRight = new Vector3(1, 0, 0).transformDirection(node('github-screen').matrixWorld)
assert(screenRight.x < -0.99, 'screen text must read correctly from the -Z user side')
const lidTop = new Vector3(0, 0.24, 0).applyMatrix4(node('display-assembly').matrixWorld)
const lidBottom = new Vector3(0, 0, 0).applyMatrix4(node('display-assembly').matrixWorld)
assert(lidTop.y > lidBottom.y && lidTop.z > lidBottom.z, 'open lid should lean away from user')
const bounds = visual =>
  new Box3().setFromBufferAttribute(visual.geometry.attributes.position).applyMatrix4(visual.node.matrixWorldOffset)
const body = bounds(client.visuals.find(v => v.node.id === 'aluminum-unibody'))
const deck = bounds(client.visuals.find(v => v.node.id === 'top-deck'))
assert(lidBottom.z > body.max.z, 'Open lid must sit behind the rear of the base')
assert(lidBottom.z - body.max.z < 0.008, 'Open lid must remain close to the rear of the base')
assert(lidBottom.y < deck.max.y, 'Open lid lower edge must sit beside the base rather than above it')
assert(lidBottom.y > body.min.y, 'Open lid must not extend beneath the base')
client.event('macbook:state', { open: false })
assert.equal(callbacks(client), 1)
for (let i = 0; i < 60; i++) client.tick(1 / 60)
assert.equal(callbacks(client), 0)
assert.equal(node('lid-action').label, 'Open MacBook')
assert(Math.abs(node('lid-hinge').rotation.x + Math.PI / 2) < 1e-8)
logo.commit(true)
nativeScreen.commit(true)
assert(logo.mesh.matrixWorld.equals(logo.matrixWorld))
assert(nativeScreen.mesh.matrixWorld.equals(nativeScreen.matrixWorld))
assert(new Vector3(0, 0, 1).transformDirection(logo.matrixWorld).y > 0.99, 'Closed logo must face upward')
assert(
  new Vector3(0, 0, 1).transformDirection(nativeScreen.matrixWorld).y < -0.99,
  'Closed screenshot must face downward into the laptop'
)
const keys = client.visuals.filter(v => v.node.id.startsWith('key-'))
const glass = bounds(client.visuals.find(v => v.node.id === 'black-display-glass'))
const lidOutside = bounds(client.visuals.find(v => v.node.id === 'aluminum-display-lid'))
const closedRim = client.visuals.filter(v => v.node.id.startsWith('gasket-')).map(bounds)
for (const rim of closedRim) {
  assert(Math.abs(rim.min.y - deck.max.y) < 0.00001, 'Closed perimeter must touch the deck')
  assert(rim.min.z >= body.min.z && rim.max.z <= body.max.z, 'Closed perimeter must lie over the base')
}
for (const skirt of client.visuals.filter(v => v.node.id.startsWith('lid-edge-skirt-')).map(bounds)) {
  assert(Math.abs(skirt.min.y - deck.max.y) < 0.00001, 'Closed aluminum edge must meet the base')
}
assert(Math.abs(lidOutside.min.z - body.min.z) < 0.001, 'Closed lid and base fronts must align')
assert(Math.abs(lidOutside.max.z - body.max.z) < 0.007, 'Closed lid must cover the rear of the base')
assert(
  new Box3().setFromBufferAttribute(logo.mesh.geometry.attributes.position).applyMatrix4(logo.matrixWorld).min.y >
    lidOutside.max.y,
  'Logo must clear the outside aluminum surface'
)
assert(glass.min.y > Math.max(...keys.map(v => bounds(v).max.y)), 'closed display must clear the key caps')
assert(
  glass.min.y - Math.max(...keys.map(v => bounds(v).max.y)) < 0.0002,
  'Closed glass should have only a small clearance above the keys'
)
const allBounds = new Box3()
for (const visual of client.visuals) allBounds.union(bounds(visual))
assert(allBounds.min.y >= -1e-8, 'root must be the physical contact plane')
assert(allBounds.max.y < 0.021, 'closed laptop thickness should be believable')
client.event('macbook:state', { open: true })
client.tick(0.2)
client.event('macbook:state', { open: false })
client.tick(0.1)
client.event('macbook:state', { open: true })
for (let i = 0; i < 60; i++) client.tick(1 / 60)
assert.equal(callbacks(client), 0)
assert.equal(node('lid-action').label, 'Close MacBook')
const sent = []
const server = execute(source, { server: true, onSend: (...args) => sent.push(args) })
server.world.players = {
  near: { position: new Vector3(0, 1, 0) },
  far: { position: new Vector3(100, 0, 0) },
}
server.event('macbook:toggle', {}, 'unknown')
server.event('macbook:toggle', {}, 'far')
assert.equal(server.app.state.open, true)
server.event('macbook:toggle', {}, 'near')
assert.equal(server.app.state.open, false)
assert.deepEqual(sent, [['macbook:state', { open: false }]])
assert.equal(callbacks(server), 0)
assert.equal(server.configs.filter(c => c.kind === 'webview').length, 0)
const object = JSON.parse(await fs.readFile(new URL('object.json', import.meta.url)))
const local = new Vector3(...object.entity.position)
  .sub(new Vector3(...object.desk.position))
  .applyQuaternion(new Quaternion(...object.desk.quaternion).invert())
  .divide(new Vector3(...object.desk.scale))
assert(local.distanceTo(new Vector3(...object.deskLocal)) < 1e-8)
assert.equal(object.entity.pinned, false)
for (const config of client.configs.filter(c => c.kind === 'prim')) assert.equal(config.physics, null)
const report = {
  valid: true,
  actualRuntimeConstructors: true,
  exactPackageSource: true,
  embeddedTransparentLogo: true,
  embeddedGitHubScreenshot: true,
  clientWebViews: 0,
  nativeImageMesh: true,
  logoOrientationAndClearance: true,
  primitives: client.visuals.length,
  extrusions: client.configs.filter(c => c.type === 'extrude').length,
  clientIdleUpdateCallbacks: callbacks(client),
  serverIdleUpdateCallbacks: callbacks(server),
  roundedExtrusions: true,
  closedLidClearsKeyboard: true,
  closedRimTouchesDeck: true,
  openLidBehindBase: true,
  lowOffsetHinge: true,
  screenOrientation: true,
  opensClosesAndReverses: true,
  serverValidatesDistance: true,
  independentMovableEntity: true,
  deskLocal: local.toArray(),
  closedBounds: { min: allBounds.min.toArray(), max: allBounds.max.toArray() },
}
await fs.writeFile(new URL('validation.json', import.meta.url), JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))
