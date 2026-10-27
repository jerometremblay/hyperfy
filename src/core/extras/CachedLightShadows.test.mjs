import assert from 'node:assert/strict'
import test from 'node:test'
import * as THREE from 'three'
import { CachedLightShadows } from './CachedLightShadows.js'

function fixture() {
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera()
  const cache = new CachedLightShadows()
  const room = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshStandardMaterial())
  room.castShadow = true
  const avatar = room.clone()
  avatar.getEntity = () => ({ isPlayer: true })
  const point = new THREE.PointLight()
  const spot = new THREE.SpotLight()
  const sun = new THREE.DirectionalLight()
  for (const light of [point, spot, sun]) light.castShadow = true
  scene.add(room, avatar, point, spot, spot.target, sun)
  const captures = []
  const renderer = {
    autoClear: false,
    xr: { enabled: true },
    getRenderTarget: () => null,
    getActiveCubeFace: () => 0,
    getActiveMipmapLevel: () => 0,
    setRenderTarget() {},
    render() {
      const lights = []
      scene.traverseVisible(object => {
        if (object.isLight && object.castShadow && (object.shadow.autoUpdate || object.shadow.needsUpdate)) {
          lights.push(object)
        }
      })
      this.shadowMap.render(lights)
    },
    shadowMap: {
      enabled: true,
      autoUpdate: true,
      type: THREE.PCFShadowMap,
      render(lights) {
        const casters = []
        scene.traverseVisible(object => {
          if (object.castShadow && object.geometry) casters.push(object)
        })
        captures.push({
          lights: [...lights],
          casters,
          instances: new Map(
            casters
              .filter(object => object.isInstancedMesh)
              .map(object => [object, object.instanceMatrix.array.slice()])
          ),
        })
        for (const light of lights) {
          light.shadow.map ||= {}
          light.shadow.needsUpdate = false
        }
      },
    },
  }
  const render = (now, enabled = true) => cache.render(renderer, scene, camera, enabled, now)
  const warm = () => {
    render(0)
    render(500)
  }
  return { cache, scene, camera, room, avatar, point, spot, sun, renderer, captures, render, warm }
}

test('stable point/spot maps capture once, omit avatars and leave sun and normal caster flags intact', () => {
  const f = fixture()
  f.warm()
  assert.deepEqual(f.captures[0].lights, [f.point, f.spot])
  assert.deepEqual(f.captures[0].casters, [f.room])
  for (let i = 501; i < 1000; i++) f.render(i)
  assert.equal(f.captures.length, 1)
  assert.equal(f.point.shadow.autoUpdate, false)
  assert.equal(f.spot.shadow.autoUpdate, false)
  assert.equal(f.sun.shadow.autoUpdate, true)
  assert.equal(f.avatar.castShadow, true)
  assert.equal(f.room.castShadow, true)
})

test('camera movement, avatar movement, brightness and color changes reuse the map', () => {
  const f = fixture()
  f.warm()
  f.camera.position.x = 10
  f.avatar.position.x = 3
  f.point.intensity = 8
  f.point.color.set('red')
  f.render(600)
  assert.equal(f.captures.length, 1)
})

test('moving room geometry is removed from cached shadows, then recaptured after settling', () => {
  const f = fixture()
  f.warm()
  f.room.position.x = 2
  f.render(600)
  assert.deepEqual(f.captures.at(-1).casters, [])
  for (let i = 601; i < 900; i++) {
    f.room.position.x += 0.01
    f.render(i)
  }
  assert.equal(f.captures.length, 2, 'moving geometry must not force an every-frame rebake')
  f.render(1399)
  assert.equal(f.captures.length, 3)
  assert.deepEqual(f.captures.at(-1).casters, [f.room])
})

test('instance matrix uploads without actual movement keep the cache, real movement invalidates it', () => {
  const f = fixture()
  f.scene.remove(f.room)
  const instances = new THREE.InstancedMesh(f.room.geometry, f.room.material, 2)
  instances.castShadow = true
  f.scene.add(instances)
  f.warm()
  instances.instanceMatrix.needsUpdate = true
  f.render(600)
  assert.equal(f.captures.length, 1)
  instances.setMatrixAt(0, new THREE.Matrix4().makeTranslation(3, 0, 0))
  instances.instanceMatrix.needsUpdate = true
  const movedMatrices = instances.instanceMatrix.array.slice()
  f.render(700)
  assert.equal(f.captures.length, 2)
  assert.deepEqual(f.captures.at(-1).casters, [instances])
  const captured = f.captures.at(-1).instances.get(instances)
  assert.equal(captured[0], 0, 'only the moving instance is hidden')
  assert.equal(captured[16], 1, 'the stationary instance still casts a shadow')
  assert.deepEqual(instances.instanceMatrix.array, movedMatrices, 'normal rendering sees the original matrices')
  f.render(1200)
  assert.deepEqual(f.captures.at(-1).casters, [instances])
})

test('late geometry, removals and light movement refresh cached maps', () => {
  const f = fixture()
  f.warm()
  const late = f.room.clone()
  f.scene.add(late)
  f.render(600)
  assert.equal(f.captures.length, 1)
  f.render(1100)
  assert.deepEqual(f.captures.at(-1).casters, [f.room, late])
  f.scene.remove(f.room)
  f.render(1101)
  assert.deepEqual(f.captures.at(-1).casters, [late])
  f.point.position.x = 2
  f.render(1102)
  assert.equal(f.point.shadow.autoUpdate, true, 'moving lights fall back to normal rendering')
  f.render(1602)
  assert.deepEqual(f.captures.at(-1).lights, [f.point])
})

test('budget-suppressed lights retain pending refreshes until selected again', () => {
  const f = fixture()
  f.warm()
  f.point.castShadow = false
  f.scene.remove(f.room)
  f.render(600)
  assert.deepEqual(f.captures.at(-1).lights, [f.spot])
  assert.equal(f.point.shadow.needsUpdate, true)
  f.point.castShadow = true
  f.render(601)
  assert.deepEqual(f.captures.at(-1).lights, [f.point])
})

test('disabling the experiment restores dynamic shadows, and reset releases tracked scene objects', () => {
  const f = fixture()
  f.warm()
  f.render(600, false)
  assert.equal(f.point.shadow.autoUpdate, true)
  assert.equal(f.point.shadow.needsUpdate, true)
  assert.equal(f.spot.shadow.autoUpdate, true)
  assert.equal(f.cache.lights.size, 0)
  assert.equal(f.cache.casters.size, 0)
})

test('a failed shadow capture restores caster flags and remains pending for retry', () => {
  const f = fixture()
  f.render(0)
  const capture = f.renderer.shadowMap.render
  f.renderer.shadowMap.render = () => {
    assert.equal(f.avatar.castShadow, false)
    throw new Error('capture failed')
  }
  assert.throws(() => f.render(500), /capture failed/)
  assert.equal(f.avatar.castShadow, true)
  assert.equal(f.renderer.autoClear, false)
  assert.equal(f.renderer.xr.enabled, true)
  assert.equal(f.scene.overrideMaterial, null)
  assert.equal(f.sun.shadow.autoUpdate, true)
  assert.equal(f.point.shadow.needsUpdate, true)
  f.renderer.shadowMap.render = capture
  f.render(501)
  assert.equal(f.captures.length, 1)
})

test('context/map replacement and shadow quality changes cannot reuse obsolete maps', () => {
  const f = fixture()
  f.warm()
  f.point.shadow.map = null
  f.render(600)
  assert.deepEqual(f.captures.at(-1).lights, [f.point])
  f.spot.shadow.mapSize.set(1024, 1024)
  f.render(601)
  assert.equal(f.spot.shadow.autoUpdate, true)
  f.render(1101)
  assert.deepEqual(f.captures.at(-1).lights, [f.spot])
  f.cache.reset()
  f.render(700)
  f.render(1200)
  assert.deepEqual(f.captures.at(-1).lights, [f.point, f.spot])
})
