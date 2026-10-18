import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { build as bundleEngineModule } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { zipSync } from 'fflate'
import { buildWorldBundle, inspectZip, verifyWorldBundle } from '../src/bundle.mjs'
import { compileProject, compileSingleObject } from '../src/compiler.mjs'
import { sha256 } from '../src/canonical.mjs'
import { importHyp, unpackObject } from '../src/importer.mjs'
import { packHyp, parseHyp } from '../src/hyp-format.mjs'
import { readBoundedFile } from '../src/paths.mjs'

const quat = [0, 0, 0, 1]
let engineExportApp

async function loadEngineExportApp() {
  if (!engineExportApp) {
    const sourcePath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../src/core/extras/appTools.js')
    const result = await bundleEngineModule({
      entryPoints: [sourcePath],
      bundle: true,
      platform: 'node',
      format: 'esm',
      write: false,
      plugins: [
        {
          name: 'utils-test-stub',
          setup(build) {
            build.onResolve({ filter: /^\.\.\/utils$/ }, () => ({ path: 'utils-test-stub', namespace: 'utils-test-stub' }))
            build.onLoad({ filter: /.*/, namespace: 'utils-test-stub' }, () => ({
              contents: 'export const uuid = () => "fixture"',
              loader: 'js',
            }))
          },
        },
      ],
    })
    engineExportApp = await import(
      'data:text/javascript;base64,' + Buffer.from(result.outputFiles[0].contents).toString('base64')
    )
  }
  return engineExportApp
}

async function makeProject(t) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-worldsync-test-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const chair = path.join(root, 'objects', 'furniture', 'chair')
  const terrain = path.join(root, 'objects', 'environment', 'terrain')
  const stool = path.join(root, 'objects', 'furniture', 'stool')
  const sceneDir = path.join(root, 'scenes', 'camp')
  await fs.mkdir(path.join(chair, 'textures'), { recursive: true })
  await fs.mkdir(terrain, { recursive: true })
  await fs.mkdir(path.join(stool, 'textures'), { recursive: true })
  await fs.mkdir(sceneDir, { recursive: true })
  await fs.writeFile(path.join(chair, 'chair.glb'), Buffer.from('chair-model'))
  await fs.writeFile(path.join(chair, 'script.js'), Buffer.from('export default app => app'))
  await fs.writeFile(path.join(chair, 'textures', 'wood.webp'), Buffer.from('wood-texture'))
  await fs.writeFile(path.join(terrain, 'terrain.glb'), Buffer.from('terrain-model'))
  await fs.writeFile(path.join(stool, 'textures', 'cloth.webp'), Buffer.from('wood-texture'))
  await fs.mkdir(path.join(chair, 'animations'), { recursive: true })
  await fs.writeFile(path.join(chair, 'animations', 'jump.glb'), Buffer.from('script-dependency'))
  await fs.writeFile(
    path.join(chair, 'object.json'),
    JSON.stringify({
      schemaVersion: 1,
      key: 'furniture/chair',
      mode: 'files',
      extraAssets: [{ file: 'file:./animations/jump.glb', type: 'model' }],
      blueprint: {
        name: 'Chair',
        model: 'file:./chair.glb',
        script: 'file:./script.js',
        props: {
          wood: { type: 'texture', url: 'file:./textures/wood.webp' },
          labels: ['file:./ordinary-string.png'],
        },
        disabled: true,
      },
    })
  )
  await fs.writeFile(
    path.join(terrain, 'object.json'),
    JSON.stringify({
      schemaVersion: 1,
      key: 'environment/terrain',
      mode: 'files',
      role: 'environment',
      blueprint: { name: 'Terrain', model: 'file:./terrain.glb' },
    })
  )
  await fs.writeFile(
    path.join(stool, 'object.json'),
    JSON.stringify({
      schemaVersion: 1,
      key: 'furniture/stool',
      mode: 'files',
      blueprint: {
        name: 'Stool',
        model: 'script-only',
        props: { cloth: { type: 'texture', url: 'file:./textures/cloth.webp' } },
      },
    })
  )
  await fs.writeFile(
    path.join(sceneDir, 'scene.json'),
    JSON.stringify({
      schemaVersion: 1,
      sceneKey: 'camp',
      title: 'Camp',
      environment: 'environment/terrain',
      settingsFile: 'settings.json',
      instances: [
        {
          key: 'furniture/chair-left',
          object: 'furniture/chair',
          position: [1, 0, 2],
          quaternion: quat,
          scale: [1, 1, 1],
          pinned: false,
        },
        {
          key: 'furniture/chair-right',
          object: 'furniture/chair',
          position: [3, 0, 2],
          quaternion: [0, 0, 0, -1],
          scale: [1, 1, 1],
          pinned: true,
        },
      ],
    })
  )
  await fs.writeFile(
    path.join(sceneDir, 'settings.json'),
    JSON.stringify({
      title: 'Camp',
      dayNightCycle: true,
      spawn: { position: [0, 0, 0], quaternion: quat },
    })
  )
  return root
}

function sampleHyp() {
  const model = Buffer.from('legacy-model')
  const script = Buffer.from('export default app => app')
  const texture = Buffer.from('legacy-texture')
  const assets = [
    { type: 'model', url: 'asset://' + sha256(model) + '.glb', mime: 'model/gltf-binary', bytes: model },
    { type: 'script', url: 'asset://' + sha256(script) + '.js', mime: 'text/javascript', bytes: script },
    { type: 'texture', url: 'asset://' + sha256(texture) + '.webp', mime: 'image/webp', bytes: texture },
  ]
  const blueprint = {
    name: 'Legacy chair',
    model: assets[0].url,
    script: assets[1].url,
    props: { texture: { type: 'texture', url: assets[2].url } },
    disabled: true,
  }
  return { blueprint, assets, bytes: packHyp(blueprint, assets) }
}

test('compiles loose source, nested typed assets, shared instances, and the environment separately', async t => {
  const root = await makeProject(t)
  const compiled = await compileProject(root, 'camp')
  assert.equal(compiled.objects.length, 3)
  assert.equal(compiled.scene.instances.length, 2)
  assert.equal(compiled.assets.length, 5)
  const chair = compiled.objects.find(object => object.key === 'furniture/chair')
  assert.equal(chair.blueprint.disabled, true)
  assert.match(chair.blueprint.model, /^asset:\/\/[a-f0-9]{64}\.glb$/)
  assert.match(chair.blueprint.props.wood.url, /^asset:\/\/[a-f0-9]{64}\.webp$/)
  assert.equal(chair.blueprint.props.labels[0], 'file:./ordinary-string.png')
  assert.deepEqual(compiled.scene.instances.map(instance => instance.key), [
    'furniture/chair-left',
    'furniture/chair-right',
  ])
  assert.deepEqual(compiled.scene.instances[1].quaternion, quat)
  assert.equal(compiled.objects.find(object => object.key === 'environment/terrain').blueprint.scene, true)
  assert.equal(chair.assets.some(asset => asset.source.endsWith('animations/jump.glb')), true)
  assert.equal(compiled.assets.filter(asset => asset.sha256 === sha256(Buffer.from('wood-texture'))).length, 1)
})

test('script-only source works without inventing a model', async t => {
  const root = await makeProject(t)
  const objectDir = path.join(root, 'objects', 'furniture', 'chair')
  const manifest = JSON.parse(await fs.readFile(path.join(objectDir, 'object.json'), 'utf8'))
  manifest.blueprint.model = 'script-only'
  await fs.writeFile(path.join(objectDir, 'object.json'), JSON.stringify(manifest))
  const compiled = await compileSingleObject(root, 'furniture/chair')
  assert.equal(compiled.blueprint.model, 'script-only')
  assert.equal(compiled.assets.some(asset => asset.source.endsWith('/chair.glb')), false)
})

test('rejects path traversal, missing references, invalid transforms, and unresolved LFS pointers', async t => {
  const root = await makeProject(t)
  const manifestPath = path.join(root, 'objects', 'furniture', 'chair', 'object.json')
  const manifest = JSON.parse(await fs.readFile(manifestPath, 'utf8'))
  manifest.blueprint.model = 'file:../outside.glb'
  await fs.writeFile(manifestPath, JSON.stringify(manifest))
  await assert.rejects(compileSingleObject(root, 'furniture/chair'), /parent path segments/)

  manifest.blueprint.model = 'file:./chair.glb'
  await fs.writeFile(manifestPath, JSON.stringify(manifest))
  const scenePath = path.join(root, 'scenes', 'camp', 'scene.json')
  const scene = JSON.parse(await fs.readFile(scenePath, 'utf8'))
  scene.instances[0].object = 'missing/object'
  await fs.writeFile(scenePath, JSON.stringify(scene))
  await assert.rejects(compileProject(root, 'camp'), /missing object/)

  scene.instances[0].object = 'furniture/chair'
  scene.instances[0].scale = [1, 0, 1]
  await fs.writeFile(scenePath, JSON.stringify(scene))
  await assert.rejects(compileProject(root, 'camp'), /scale values must be positive/)

  scene.instances[0].scale = [1, 1, 1]
  await fs.writeFile(scenePath, JSON.stringify(scene))
  const pointer = 'version https://git-lfs.github.com/spec/v1\\noid sha256:' + 'a'.repeat(64) + '\\nsize 12\\n'
  await fs.writeFile(path.join(root, 'objects', 'furniture', 'chair', 'chair.glb'), pointer)
  await assert.rejects(compileSingleObject(root, 'furniture/chair'), /unresolved Git LFS pointer/)

  await fs.writeFile(path.join(root, 'outside.glb'), Buffer.from('outside'))
  await fs.unlink(path.join(root, 'objects', 'furniture', 'chair', 'chair.glb'))
  await fs.symlink(
    path.join(root, 'outside.glb'),
    path.join(root, 'objects', 'furniture', 'chair', 'chair.glb')
  )
  await assert.rejects(compileSingleObject(root, 'furniture/chair'), /Symbolic links are not allowed/)
  await fs.unlink(path.join(root, 'objects', 'furniture', 'chair', 'chair.glb'))
  await fs.writeFile(path.join(root, 'objects', 'furniture', 'chair', 'chair.glb'), Buffer.from('chair-model'))
  await assert.rejects(
    readBoundedFile(path.join(root, 'objects', 'furniture', 'chair', 'chair.glb'), { maxBytes: 2 }),
    /exceeds the 2 byte limit/
  )
})

test('builds a deterministic portable bundle and verifies every payload', async t => {
  const root = await makeProject(t)
  const compiled = await compileProject(root, 'camp')
  const first = buildWorldBundle(compiled, { includeHyp: true })
  const second = buildWorldBundle(compiled, { includeHyp: true })
  assert.deepEqual(first, second)
  const result = verifyWorldBundle(first)
  assert.equal(result.manifest.sceneKey, 'camp')
  assert.equal(result.fileCount, result.manifest.payloads.length + 1)
  assert.ok(result.totalBytes > 0)
  assert.equal(inspectZip(first).has('scene.json'), true)

  const damaged = Buffer.from(first)
  damaged[damaged.length - 1] ^= 1
  assert.throws(() => verifyWorldBundle(damaged))
  assert.throws(() => verifyWorldBundle(zipSync({ '../escape.txt': new Uint8Array([1]) })), /Unsafe bundle entry path/)

  const findCentralHeader = bytes => Buffer.from(bytes).indexOf(Buffer.from([0x50, 0x4b, 0x01, 0x02]))
  const oversized = Buffer.from(zipSync({ payload: new Uint8Array([1]) }))
  oversized.writeUInt32LE(256 * 1024 * 1024 + 1, findCentralHeader(oversized) + 24)
  assert.throws(() => verifyWorldBundle(oversized), /Bundle entry exceeds the size limit/)

  const zipBomb = Buffer.from(zipSync({ payload: new Uint8Array([1]) }))
  zipBomb.writeUInt32LE(10000, findCentralHeader(zipBomb) + 24)
  assert.throws(() => verifyWorldBundle(zipBomb), /compression ratio is too high/)

  const symlink = Buffer.from(zipSync({ payload: new Uint8Array([1]) }))
  const symlinkHeader = findCentralHeader(symlink)
  symlink.writeUInt16LE((3 << 8) | 20, symlinkHeader + 4)
  symlink.writeUInt32LE((0o120777 << 16) >>> 0, symlinkHeader + 38)
  assert.throws(() => verifyWorldBundle(symlink), /Symbolic links are not allowed/)
})

test('requires an explicit opt-in for nonportable external dependencies', async t => {
  const root = await makeProject(t)
  const scriptPath = path.join(root, 'objects', 'furniture', 'chair', 'script.js')
  await fs.writeFile(scriptPath, "const endpoint = 'https://example.invalid/data'\nexport default app => app")
  const compiled = await compileProject(root, 'camp')
  const warning = compiled.warnings.find(item => item.code === 'external-asset')
  assert.equal(warning.path.startsWith('objects/furniture/chair/script.js:'), true)
  assert.equal(Object.hasOwn(warning, 'url'), false)
  assert.throws(() => buildWorldBundle(compiled), /prevent a portable bundle/)
  const bundle = buildWorldBundle(compiled, { allowExternal: true })
  const result = verifyWorldBundle(bundle)
  assert.equal(result.manifest.portability.isPortable, false)
  assert.deepEqual(result.manifest.portability.externalDependencies, [
    { path: 'objects/furniture/chair/script.js:1' },
  ])
})

test('native HYP packs and parses exact asset payloads without executing scripts', () => {
  const sample = sampleHyp()
  const parsed = parseHyp(sample.bytes)
  assert.deepEqual(parsed.blueprint, sample.blueprint)
  assert.equal(parsed.assets.length, 3)
  assert.deepEqual(parsed.assets[1].bytes, sample.assets[1].bytes)
  assert.throws(() => parseHyp(Buffer.concat([sample.bytes, Buffer.from([0])])), /trailing bytes/)
})

test('parses a HYP package produced by Hyperfy exportApp', async () => {
  const model = Buffer.from('engine-fixture-model')
  const script = Buffer.from('export default app => app')
  const texture = Buffer.from('engine-fixture-texture')
  const assets = [
    { type: 'model', bytes: model, mime: 'model/gltf-binary', extension: 'glb' },
    { type: 'script', bytes: script, mime: 'application/javascript', extension: 'js' },
    { type: 'texture', bytes: texture, mime: 'image/webp', extension: 'webp' },
  ].map(asset => ({
    ...asset,
    url: 'asset://' + sha256(asset.bytes) + '.' + asset.extension,
  }))
  const files = new Map(assets.map(asset => [asset.url, new File([asset.bytes], asset.extension, { type: asset.mime })]))
  const blueprint = {
    name: 'Engine fixture',
    model: assets[0].url,
    script: assets[1].url,
    props: {
      wood: { type: 'texture', url: assets[2].url },
      emote: { type: 'emote', url: assets[0].url },
    },
    disabled: false,
  }
  const { exportApp } = await loadEngineExportApp()
  const file = await exportApp(blueprint, async url => files.get(url))
  const parsed = parseHyp(await file.arrayBuffer())
  assert.deepEqual(parsed.blueprint, blueprint)
  assert.deepEqual(parsed.assets.map(asset => asset.type).sort(), ['model', 'script', 'texture'])
  assert.deepEqual(parsed.assets.find(asset => asset.type === 'model').types.sort(), ['emote', 'model'])
  assert.deepEqual(
    parsed.assets.map(asset => Buffer.from(asset.bytes).toString()).sort(),
    assets.map(asset => asset.bytes.toString()).sort()
  )
  const reparsed = parseHyp(packHyp(parsed.blueprint, parsed.assets))
  assert.deepEqual(reparsed.assets.find(asset => asset.url === assets[0].url).types.sort(), ['emote', 'model'])
})

test('imports legacy HYP as source and extracts it with semantic parity', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-worldsync-import-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const inputPath = path.join(root, 'legacy.hyp')
  const sample = sampleHyp()
  await fs.writeFile(inputPath, sample.bytes)
  const plainRoot = path.join(root, 'plain')
  const extractedRoot = path.join(root, 'extracted')
  await fs.mkdir(plainRoot)
  await fs.mkdir(extractedRoot)

  const legacy = await importHyp(plainRoot, inputPath, 'furniture/legacy-chair')
  assert.equal(legacy.mode, 'hyp')
  const legacySource = JSON.parse(
    await fs.readFile(path.join(legacy.objectDir, 'object.json'), 'utf8')
  )
  assert.equal(legacySource.mode, 'hyp')
  assert.deepEqual(await fs.readFile(path.join(legacy.objectDir, 'original.hyp')), sample.bytes)
  const extracted = await importHyp(extractedRoot, inputPath, 'furniture/legacy-chair', { extract: true })
  assert.equal(extracted.mode, 'files')
  const compiled = await compileSingleObject(extractedRoot, 'furniture/legacy-chair')
  assert.equal(compiled.blueprint.name, sample.blueprint.name)
  assert.equal(await fs.readFile(path.join(extracted.objectDir, 'script.js')).then(bytes => bytes.equals(sample.assets[1].bytes)), true)
  assert.deepEqual(new Set(compiled.assets.map(asset => asset.url)), new Set(sample.assets.map(asset => asset.url)))
})

test('rejects malformed HYP before creating an object directory', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-worldsync-invalid-hyp-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const input = path.join(root, 'invalid.hyp')
  await fs.writeFile(input, Buffer.from([1, 2, 3, 4, 5]))
  await assert.rejects(importHyp(root, input, 'furniture/invalid'), /Invalid or incomplete \.hyp file header/)
  await assert.rejects(fs.access(path.join(root, 'objects', 'furniture', 'invalid')))
})

test('unpacks an existing HYP object and optionally keeps a non-authoritative provenance copy', async t => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-worldsync-unpack-'))
  t.after(() => fs.rm(root, { recursive: true, force: true }))
  const inputPath = path.join(root, 'legacy.hyp')
  const sample = sampleHyp()
  await fs.writeFile(inputPath, sample.bytes)
  const imported = await importHyp(root, inputPath, 'furniture/legacy-chair')
  const result = await unpackObject(root, 'furniture/legacy-chair', { keepOriginal: true })
  assert.equal(result.mode, 'files')
  const objectDir = imported.objectDir
  assert.equal(
    await fs.readFile(path.join(objectDir, 'provenance', 'original.hyp')).then(bytes => bytes.equals(sample.bytes)),
    true
  )
  assert.equal(JSON.parse(await fs.readFile(path.join(objectDir, 'object.json'), 'utf8')).mode, 'files')
  assert.equal(await fs.access(path.join(objectDir, 'original.hyp')).then(() => false, () => true), true)
})
