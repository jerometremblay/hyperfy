import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import * as THREE from 'three'

async function load(entry) {
  const bundle = await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', write: false })
  return import(`data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`)
}
const { photoOptions, renderPhoto, PhotoCapture, encodePhoto, applyPhotoFilter } = await load(
  'src/core/extras/PhotoCapture.js'
)
const { Apps } = await load('src/core/systems/Apps.js')
const { Image } = await load('src/core/nodes/Image.js')
const pose = () => ({ position: new THREE.Vector3(0, 1, 3), quaternion: new THREE.Quaternion() })

function fixture() {
  const entity = {}
  const object = new THREE.Mesh()
  const hidden = new THREE.Mesh()
  hidden.visible = false
  const node = {
    ctx: { entity },
    mesh: object,
    traverse(fn) {
      fn(this)
    },
  }
  const avatarScene = new THREE.Scene()
  const avatar = {
    _firstPerson: true,
    instance: { raw: { scene: avatarScene } },
    setFirstPerson(value) {
      this._firstPerson = value
    },
  }
  const nametags = new THREE.Mesh()
  const bubble = new THREE.Mesh()
  const world = {
    stage: { scene: new THREE.Scene() },
    entities: { player: { avatar }, players: new Map([['remote', { bubble: { mesh: bubble } }]]) },
    nametags: { mesh: nametags },
    environment: { renderExposure: 1.25 },
  }
  const previous = {}
  let target = previous
  let calls = 0
  let disposed = 0
  const viewport = new THREE.Vector4(2, 3, 400, 300)
  const renderer = {
    xr: { enabled: true },
    shadowMap: { enabled: false },
    toneMapping: THREE.NoToneMapping,
    toneMappingExposure: 0.7,
    outputColorSpace: THREE.LinearSRGBColorSpace,
    autoClear: false,
    getRenderTarget: () => target,
    getActiveCubeFace: () => 3,
    getActiveMipmapLevel: () => 2,
    getCurrentViewport: value => value.copy(viewport),
    getClearColor: value => value.set('#123456'),
    getClearAlpha: () => 0.3,
    setClearColor(color, alpha) {
      assert.equal(color.getHexString(), '123456')
      assert.equal(alpha, 0.3)
    },
    setRenderTarget(value, face, mip) {
      target = value
      if (value !== previous) value.addEventListener('dispose', () => disposed++)
      else {
        assert.equal(face, 3)
        assert.equal(mip, 2)
      }
    },
    state: {
      viewport(value) {
        assert.deepEqual(value.toArray(), viewport.toArray())
      },
    },
    clear() {},
    render(scene, camera) {
      calls++
      if (scene === world.stage.scene) {
        assert.equal(avatar._firstPerson, false)
        assert.equal(object.visible, false)
        assert.equal(nametags.visible, false)
        assert.equal(bubble.visible, false)
        assert.equal(renderer.xr.enabled, false)
        assert.equal(camera.layers.isEnabled(2), true)
        if (renderer.fail) throw new Error('draw failed')
      }
    },
    readRenderTargetPixels(target, x, y, w, h, pixels) {
      pixels.fill(calls)
    },
  }
  const graphics = { world, renderer, renderingPortal: false }
  const options = { ...photoOptions(entity, { ...pose(), hide: [node] }), entity }
  return {
    entity,
    graphics,
    renderer,
    node,
    object,
    hidden,
    avatar,
    options,
    previous,
    restored() {
      assert.equal(target, previous)
      assert.equal(renderer.xr.enabled, true)
      assert.equal(renderer.autoClear, false)
      assert.equal(renderer.toneMapping, THREE.NoToneMapping)
      assert.equal(renderer.toneMappingExposure, 0.7)
      assert.equal(renderer.outputColorSpace, THREE.LinearSRGBColorSpace)
      assert.equal(graphics.renderingPortal, false)
      assert.equal(object.visible, true)
      assert.equal(hidden.visible, false)
      assert.equal(avatar._firstPerson, true)
      assert.equal(nametags.visible, true)
      assert.equal(bubble.visible, true)
      assert.ok(disposed >= 1)
    },
  }
}

test('server API rejects without attempting graphics or taking a dead hook', async () => {
  const apps = new Apps({ network: { isServer: true } })
  await assert.rejects(apps.worldMethods.capturePhoto({}, pose()), /client-only/)
})

test('options clamp dimensions, copy camera pose and enforce app ownership', () => {
  const entity = {}
  const input = { ...pose(), width: 4, height: 2048 }
  const value = photoOptions(entity, input)
  assert.equal(value.width, 64)
  assert.equal(value.height, 1024)
  input.position.x = 900
  assert.equal(value.position.x, 0)
  assert.throws(() => photoOptions(entity, { ...pose(), width: NaN }), /finite/)
  assert.throws(() => photoOptions(entity, { ...pose(), quaternion: new THREE.Quaternion(0, 0, 0, 0) }), /nonzero/)
  assert.throws(() => photoOptions(entity, { ...pose(), near: 5, far: 1 }), /far/)
  assert.throws(() => photoOptions(entity, { ...pose(), hide: [{}] }), /belong/)
})

for (const fail of [false, true])
  test(`render restores hidden nodes, full-avatar mode and renderer state (failure=${fail})`, () => {
    const f = fixture()
    f.renderer.fail = fail
    if (fail) assert.throws(() => renderPhoto(f.graphics, f.options), /draw failed/)
    else assert.equal(renderPhoto(f.graphics, f.options).length, 512 * 512 * 4)
    f.restored()
  })

test('queue captures one request per frame, continues after failures, bounds memory and cancels dead apps', async () => {
  const f = fixture()
  const photos = new PhotoCapture(f.graphics)
  photos.save = async pixels => ({ id: pixels[0] })
  const one = photos.capture(f.entity, { ...pose(), hide: [f.node] }, { dead: false })
  const two = photos.capture(f.entity, { ...pose(), hide: [f.node] }, { dead: false })
  photos.process()
  assert.equal(photos.queue.length, 1)
  photos.process()
  assert.notDeepEqual(await one, await two)
  const dead = photos.capture(f.entity, pose(), { dead: true })
  photos.process()
  await assert.rejects(dead, /destroyed/)
  const requests = Array.from({ length: 8 }, () => photos.capture(f.entity, pose(), { dead: false }))
  await assert.rejects(photos.capture(f.entity, pose(), {}), /too many/)
  const settled = Promise.allSettled(requests)
  photos.destroy()
  assert.ok((await settled).every(r => r.status === 'rejected'))
})

test('JPEG encoding flips rows; save hashes, uploads and inserts an image-compatible URL', async () => {
  const previousDocument = globalThis.document
  let encoded
  globalThis.document = {
    createElement() {
      return {
        getContext: () => ({
          createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
          putImageData(image) {
            encoded = [...image.data]
          },
        }),
        toBlob(callback, type, quality) {
          assert.equal(type, 'image/jpeg')
          assert.equal(quality, 0.85)
          callback(new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type }))
        },
      }
    },
  }
  try {
    const options = { width: 1, height: 2, quality: 0.85 }
    await encodePhoto(new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]), options)
    assert.deepEqual(encoded, [5, 6, 7, 8, 1, 2, 3, 4])
    const calls = []
    const photos = new PhotoCapture({
      world: {
        network: {
          async upload(file) {
            calls.push(['upload', file])
          },
        },
        loader: {
          insert(...args) {
            calls.push(['insert', ...args])
          },
        },
      },
    })
    const result = await photos.save(new Uint8Array(8), options, { dead: false })
    assert.match(result.url, /^asset:\/\/[0-9a-f]{64}\.jpg$/)
    assert.equal(new Image({ src: result.url }).src, result.url)
    assert.equal(calls[0][1].name, result.url.slice(8))
    assert.equal(calls[1][1], 'image')
    assert.equal(calls[1][2], result.url)
  } finally {
    globalThis.document = previousDocument
  }
})

test('client API suppresses successful and failed callbacks after app destruction', async () => {
  for (const failure of [false, true]) {
    let finish
    const apps = new Apps({
      network: { isClient: true },
      graphics: {
        photos: {
          capture: () =>
            new Promise((resolve, reject) => {
              finish = failure ? reject : resolve
            }),
        },
      },
    })
    const hook = { dead: false }
    let settled = false
    const pending = apps.worldMethods.capturePhoto({ getDeadHook: () => hook }, pose())
    pending.then(
      () => {
        settled = true
      },
      () => {
        settled = true
      }
    )
    await Promise.resolve()
    hook.dead = true
    finish(failure ? new Error('failed') : { url: 'photo' })
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(settled, false)
  }
})

test('a failed queued render does not prevent the next frame from completing', async () => {
  const f = fixture()
  const photos = new PhotoCapture(f.graphics)
  photos.save = async () => ({ url: 'next-photo' })
  const first = photos.capture(f.entity, { ...pose(), hide: [f.node] }, { dead: false })
  const second = photos.capture(f.entity, { ...pose(), hide: [f.node] }, { dead: false })
  f.renderer.fail = true
  photos.process()
  await assert.rejects(first, /draw failed/)
  f.renderer.fail = false
  photos.process()
  assert.deepEqual(await second, { url: 'next-photo' })
  assert.equal(photos.pending, 0)
})

test('photo filters default to none and reject unsupported values before queueing', () => {
  assert.equal(photoOptions({}, pose()).filter, 'none')
  for (const filter of ['none', 'grayscale', 'sepia']) {
    assert.equal(photoOptions({}, { ...pose(), filter }).filter, filter)
  }
  const photos = new PhotoCapture({})
  for (const filter of ['blur', 'Grayscale', false, 0, {}, []]) {
    assert.throws(
      () => photos.capture({}, { ...pose(), filter }, { dead: false }),
      /filter must be none, grayscale or sepia/
    )
  }
  assert.equal(photos.pending, 0)
  assert.equal(photos.queue.length, 0)
})

test('photo filters transform sRGB channels in place, clamp sepia, and preserve alpha', () => {
  const color = new Uint8ClampedArray([255, 0, 0, 123, 0, 255, 0, 50, 0, 0, 255, 255])
  const original = [...color]
  assert.equal(applyPhotoFilter(color, 'none'), color)
  assert.deepEqual([...color], original)
  assert.equal(applyPhotoFilter(color, 'grayscale'), color)
  assert.deepEqual([...color], [54, 54, 54, 123, 182, 182, 182, 50, 18, 18, 18, 255])
  const sepia = new Uint8ClampedArray([200, 200, 200, 77, 0, 0, 0, 255, 255, 255, 255, 0])
  applyPhotoFilter(sepia, 'sepia')
  assert.deepEqual([...sepia], [255, 241, 187, 77, 0, 0, 0, 255, 255, 255, 239, 0])
})

test('encoding filters flipped rows before JPEG upload and echoes each applied filter', async () => {
  const previousDocument = globalThis.document
  let encoded
  globalThis.document = {
    createElement: () => ({
      getContext: () => ({
        createImageData: (w, h) => ({ data: new Uint8ClampedArray(w * h * 4) }),
        putImageData(image) {
          encoded = [...image.data]
        },
      }),
      toBlob: (callback, type) => callback(new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xd9])], { type })),
    }),
  }
  try {
    const calls = []
    const photos = new PhotoCapture({
      world: {
        network: {
          async upload(file) {
            calls.push(['upload', file])
          },
        },
        loader: {
          insert(...args) {
            calls.push(['insert', ...args])
          },
        },
      },
    })
    const pixels = new Uint8Array([255, 0, 0, 255, 200, 200, 200, 255])
    for (const [filter, expected] of [
      ['none', [200, 200, 200, 255, 255, 0, 0, 255]],
      ['grayscale', [200, 200, 200, 255, 54, 54, 54, 255]],
      ['sepia', [255, 241, 187, 255, 100, 89, 69, 255]],
    ]) {
      const options = { ...photoOptions({}, { ...pose(), filter }), width: 1, height: 2 }
      const result = await photos.save(pixels, options, { dead: false })
      assert.deepEqual(encoded, expected)
      assert.equal(result.filter, filter)
      assert.equal(result.width, 1)
      assert.equal(result.height, 2)
      assert.match(result.url, /^asset:\/\/[0-9a-f]{64}\.jpg$/)
      assert.deepEqual([...pixels], [255, 0, 0, 255, 200, 200, 200, 255])
    }
    assert.deepEqual(
      calls.map(([method]) => method),
      ['upload', 'insert', 'upload', 'insert', 'upload', 'insert']
    )
  } finally {
    globalThis.document = previousDocument
  }
})
