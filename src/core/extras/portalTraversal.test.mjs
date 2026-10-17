import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

const bundle = await build({
  stdin: {
    contents: `export * from './src/core/extras/portalTraversal.js';
      export { PortalAvatars } from './src/core/extras/PortalAvatars.js';`,
    resolveDir: process.cwd(),
  },
  bundle: true,
  format: 'esm',
  platform: 'node',
  write: false,
})
const { getPortalTransform, getPortalPlane, supportsPortalTraversal, overlapsPortal, PortalAvatars } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)

function portal(id, position, angle) {
  return {
    portalId: id,
    target: '',
    width: 3,
    height: 4,
    doubleside: false,
    ctx: {},
    matrixWorld: new THREE.Matrix4().compose(
      new THREE.Vector3(...position),
      new THREE.Quaternion().setFromEuler(new THREE.Euler(angle, 0, 0)),
      new THREE.Vector3(1, 1, 1)
    ),
  }
}

function fixture() {
  const source = portal('top', [0, 0, 0], -Math.PI / 2)
  const destination = portal('bottom', [10, 3, 0], Math.PI / 2)
  source.target = destination.portalId
  const scene = new THREE.Scene()
  const avatarScene = new THREE.Group()
  const mesh = new THREE.SkinnedMesh(new THREE.BoxGeometry(0.4, 1.6, 0.4), new THREE.MeshStandardMaterial())
  const bone = new THREE.Bone()
  mesh.add(bone)
  mesh.bind(new THREE.Skeleton([bone]))
  mesh.bindMode = THREE.DetachedBindMode
  avatarScene.add(mesh)
  avatarScene.position.set(10, 2.2, 0)
  scene.add(avatarScene)
  const player = {
    base: { position: new THREE.Vector3(10, 2.2, 0) },
    avatar: { instance: { raw: { scene: avatarScene } }, getHeight: () => 1.6 },
  }
  const rig = new THREE.Group()
  rig.position.set(10, 3.8, 0)
  const camera = new THREE.PerspectiveCamera()
  rig.add(camera)
  scene.add(rig)
  scene.updateMatrixWorld(true)
  const world = {
    stage: { scene },
    rig,
    camera,
    graphics: { portals: new Set([source, destination]) },
    entities: { player, players: new Map([['player', player]]) },
  }
  return { source, destination, scene, avatarScene, mesh, player, rig, camera, world, copies: new PortalAvatars(world) }
}

test('floor-to-ceiling mapping keeps gravity, physical size and the exact foot offset; inverse restores pose', () => {
  const { source, destination } = fixture()
  assert.ok(supportsPortalTraversal(source, destination))
  const transform = getPortalTransform(source, destination)
  const feet = new THREE.Vector3(0.2, -0.8, 0.3)
  const exit = feet.clone().applyMatrix4(transform)
  assert.ok(exit.distanceTo(new THREE.Vector3(9.8, 2.2, -0.3)) < 1e-10)
  assert.ok(exit.clone().applyMatrix4(getPortalTransform(destination, source)).distanceTo(feet) < 1e-10)
  assert.ok(overlapsPortal(destination, exit))
  assert.ok(!overlapsPortal(destination, new THREE.Vector3(10, 0, 0)))
  assert.ok(!overlapsPortal(destination, new THREE.Vector3(20, 2.2, 0)))
  assert.ok(getPortalPlane(destination).distanceToPoint(exit) > 0)
})

test('sideways, upside-down, differently scaled and reflected mappings retain ordinary teleport behavior', () => {
  const { source, destination } = fixture()
  destination.matrixWorld.identity()
  assert.equal(supportsPortalTraversal(source, destination), false)
  const upright = portal('a', [0, 0, 0], 0)
  const other = portal('b', [10, 0, 0], 0)
  assert.equal(supportsPortalTraversal(upright, other), true)
  other.matrixWorld.scale(new THREE.Vector3(2, 2, 2))
  assert.equal(supportsPortalTraversal(upright, other), false)
  other.matrixWorld.makeScale(-1, 1, 1)
  assert.equal(supportsPortalTraversal(upright, other), false)
})

test('a split avatar shares its animated skeleton and morph weights, clips both sides and releases only copied materials', () => {
  const { mesh, copies, player, source, destination, avatarScene } = fixture()
  const original = mesh.material
  mesh.morphTargetInfluences = [0.6]
  copies.update()
  const copy = copies.copies.get(player)
  assert.equal(copy.source, destination)
  assert.equal(copy.destination, source)
  const { replica } = copy.meshes[0]
  assert.equal(replica.skeleton, mesh.skeleton)
  assert.equal(replica.geometry, mesh.geometry)
  assert.equal(replica.morphTargetInfluences, mesh.morphTargetInfluences)
  assert.notEqual(mesh.material, original)
  assert.equal(mesh.material.clippingPlanes[0], copy.sourcePlane)
  assert.equal(replica.material.clippingPlanes[0], copy.exitPlane)
  assert.ok(copy.sourcePlane.distanceToPoint(new THREE.Vector3(10, 2.5, 0)) > 0)
  assert.ok(copy.sourcePlane.distanceToPoint(new THREE.Vector3(10, 3.5, 0)) < 0)
  assert.ok(copy.exitPlane.distanceToPoint(new THREE.Vector3(0, 0.5, 0)) > 0)
  assert.ok(
    new THREE.Vector3().setFromMatrixPosition(replica.matrixWorld).distanceTo(new THREE.Vector3(0, -0.8, 0)) < 1e-10
  )
  let disposed = 0
  mesh.material.addEventListener('dispose', () => disposed++)
  replica.material.addEventListener('dispose', () => disposed++)
  original.addEventListener('dispose', () => assert.fail('original material disposed'))
  mesh.geometry.addEventListener('dispose', () => assert.fail('shared geometry disposed'))
  avatarScene.position.y = 0
  player.base.position.y = 0
  copies.update()
  assert.equal(copies.copies.size, 0)
  assert.equal(mesh.material, original)
  assert.equal(replica.parent, null)
  assert.equal(disposed, 2)
})

test('feet can remain on destination stairs while the eye renders above the source, then independently crosses', () => {
  const { copies, player, camera, rig } = fixture()
  copies.update()
  const original = rig.position.clone()
  const restore = copies.mapCamera()
  assert.equal(typeof restore, 'function')
  assert.ok(camera.getWorldPosition(new THREE.Vector3()).distanceTo(new THREE.Vector3(0, 0.8, 0)) < 1e-10)
  assert.deepEqual(player.base.position.toArray(), [10, 2.2, 0])
  restore()
  assert.ok(rig.position.distanceTo(original) < 1e-10)
  rig.position.y = 2.8
  rig.updateMatrixWorld(true)
  assert.equal(copies.mapCamera(), undefined)
})

test('projects the camera with the avatar head when the third-person lens is outside the portal', () => {
  const { copies, player, camera, rig, source, destination } = fixture()
  const head = new THREE.Matrix4().makeTranslation(10, 3.8, 0)
  player.avatar.getBoneTransform = bone => (bone === 'head' ? head : null)
  camera.position.x = 2
  rig.updateMatrixWorld(true)
  copies.update()

  const original = rig.position.clone()
  const transform = getPortalTransform(destination, source)
  const restore = copies.mapCamera()

  assert.equal(typeof restore, 'function')
  assert.ok(rig.position.distanceTo(original.clone().applyMatrix4(transform)) < 1e-10)
  restore()
  assert.ok(rig.position.distanceTo(original) < 1e-10)
})

test('moving endpoints, removed players, avatar swaps and remote links release split representations', () => {
  const { copies, world, source, player, mesh } = fixture()
  const original = mesh.material
  copies.update()
  source.ctx.moving = true
  copies.update()
  assert.equal(copies.copies.size, 0)
  assert.equal(mesh.material, original)
  source.ctx.moving = false
  source.url = 'https://example.com'
  copies.update()
  assert.equal(copies.copies.size, 0)
  source.url = ''
  copies.update()
  assert.equal(copies.copies.size, 1)
  world.entities.players.delete('player')
  player.portalTraversal = { source }
  copies.update()
  assert.equal(copies.copies.size, 0)
  assert.equal(player.portalTraversal, null)
  copies.destroy()
})
