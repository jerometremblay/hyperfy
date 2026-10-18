import path from 'node:path'
import { canonicalScene, compareText, sha256, stableJson } from './canonical.mjs'
import { createObjectAssetResolver, EXTENSIONS, MIME } from './asset-resolver.mjs'
import { parseHyp } from './hyp-format.mjs'
import { discoverObjects } from './object-source.mjs'
import { loadScene } from './scene-source.mjs'
import { readBoundedFile, resolveLocalReference } from './paths.mjs'

const ENGINE_DEFAULTS = {
  image: null,
  author: null,
  url: null,
  desc: '',
  model: null,
  script: null,
  props: {},
  preload: false,
  public: false,
  locked: false,
  unique: false,
  frozen: false,
  disabled: false,
}

function fingerprintSource(manifestBytes, assets) {
  const parts = [
    Buffer.from('worldsync-source-v1\0'),
    Buffer.from(manifestBytes),
    ...assets
      .slice()
      .sort((left, right) => compareText(left.source, right.source))
      .flatMap(asset => [Buffer.from('\0' + asset.source + '\0'), Buffer.from(asset.bytes)]),
  ]
  return sha256(Buffer.concat(parts))
}

function fingerprintCompiled(blueprint, assets) {
  const value = {
    blueprint,
    assets: assets
      .map(asset => ({
        url: asset.url,
        types: [...(asset.types || [asset.type])].sort(compareText),
        sha256: asset.sha256,
      }))
      .sort((a, b) => compareText(a.url, b.url)),
  }
  return sha256(stableJson(value))
}

function findExternalDependencies(blueprint) {
  const warnings = []
  const visit = (value, pointer) => {
    if (Array.isArray(value)) {
      value.forEach((item, index) => visit(item, pointer + '/' + index))
      return
    }
    if (!value || typeof value !== 'object') return
    if (typeof value.url === 'string' && /^https?:\/\//i.test(value.url)) {
      warnings.push({ code: 'external-asset', path: pointer + '/url' })
    }
    for (const [key, child] of Object.entries(value)) {
      if (key !== 'url') visit(child, pointer + '/' + key)
    }
  }
  for (const [field, value] of Object.entries(blueprint)) {
    if (['model', 'script'].includes(field) && typeof value === 'string' && /^https?:\/\//i.test(value)) {
      warnings.push({ code: 'external-asset', path: 'blueprint.' + field })
    }
  }
  if (blueprint.image) visit(blueprint.image, 'blueprint.image')
  if (blueprint.props) visit(blueprint.props, 'blueprint.props')
  return warnings
}

function findExternalScriptReferences(assets) {
  const warnings = []
  const pattern = /https?:\/\/[^\s"'`<>]+/gi
  for (const asset of assets) {
    if (!(asset.types || [asset.type]).includes('script')) continue
    const source = Buffer.from(asset.bytes).toString('utf8')
    for (const match of source.matchAll(pattern)) {
      const line = source.slice(0, match.index).split('\n').length
      warnings.push({ code: 'external-asset', path: asset.source ? asset.source + ':' + line : 'embedded-script:' + line })
    }
  }
  return warnings
}

async function compileObject(root, source) {
  const manifest = source.manifest
  let blueprint
  let assets
  let warnings = []
  let sourceAssets = []
  if (manifest.mode === 'files') {
    const resolver = await createObjectAssetResolver(root, source)
    const authored = { ...ENGINE_DEFAULTS, ...structuredClone(manifest.blueprint) }
    delete authored.id
    delete authored.version
    if (manifest.role === 'environment') authored.scene = true
    const resolved = await resolver.resolveBlueprint(authored, manifest.extraAssets || [])
    blueprint = resolved.blueprint
    assets = resolved.assets
    warnings = [...resolved.warnings, ...findExternalScriptReferences(assets)]
    sourceAssets = assets
  } else {
    const resolvedSource = await resolveLocalReference(root, source.objectDir, manifest.source, 'legacy .hyp source')
    const bytes = await readBoundedFile(resolvedSource.absolutePath, { label: resolvedSource.relativePath })
    const imported = parseHyp(bytes)
    blueprint = { ...ENGINE_DEFAULTS, ...structuredClone(imported.blueprint) }
    delete blueprint.id
    delete blueprint.version
    if (blueprint.scene && manifest.role !== 'environment') {
      throw new Error('Legacy .hyp object ' + manifest.key + ' uses scene=true but is not declared as role environment')
    }
    if (manifest.role === 'environment') blueprint.scene = true
    assets = imported.assets.map(asset => ({
      url: asset.url,
      sha256: asset.sha256,
      extension: asset.extension,
      type: asset.type,
      mime: asset.mime,
      source: resolvedSource.relativePath,
      bytes: Buffer.from(asset.bytes),
      size: asset.bytes.byteLength,
      types: [...asset.types],
    }))
    sourceAssets = [{ source: resolvedSource.relativePath, bytes }]
    warnings = [...findExternalDependencies(blueprint), ...findExternalScriptReferences(assets)]
  }
  const sourceFiles =
    manifest.mode === 'files'
      ? await Promise.all(
          sourceAssets.map(async asset => ({
            source: asset.source,
            bytes: asset.bytes,
          }))
        )
      : sourceAssets
  return {
    key: manifest.key,
    mode: manifest.mode,
    role: manifest.role || null,
    blueprint,
    assets,
    warnings,
    sourceFingerprint: fingerprintSource(source.sourceBytes, sourceFiles),
    semanticFingerprint: fingerprintCompiled(blueprint, assets),
  }
}

function addGlobalAssets(target, assets) {
  for (const asset of assets) {
    const existing = target.get(asset.url)
    if (existing) {
      if (!Buffer.from(existing.bytes).equals(Buffer.from(asset.bytes))) {
        throw new Error('Conflicting asset bytes for ' + asset.url)
      }
      existing.types = [...new Set([...(existing.types || [existing.type]), ...(asset.types || [asset.type])])].sort(compareText)
      continue
    }
    target.set(asset.url, asset)
  }
}

async function compileSettings(root, sceneSource) {
  const settingsDir = path.dirname(path.join(root, sceneSource.settingsPath))
  const settings = structuredClone(sceneSource.settings)
  const assets = []
  const warnings = []
  for (const field of ['image', 'avatar']) {
    const value = settings[field]
    if (!value?.url) continue
    if (value.url.startsWith('file:')) {
      const resolved = await resolveLocalReference(root, settingsDir, value.url, 'settings.' + field + '.url')
      const bytes = await readBoundedFile(resolved.absolutePath, { label: resolved.relativePath })
      const extension = path.extname(resolved.relativePath).slice(1).toLowerCase()
      const type = field === 'avatar' ? 'avatar' : 'texture'
      if (!EXTENSIONS[type]?.has(extension)) {
        throw new Error('settings.' + field + '.url has unsupported .' + extension + ' extension for ' + type)
      }
      const digest = sha256(bytes)
      value.url = 'asset://' + digest + '.' + extension
      assets.push({
        url: value.url,
        sha256: digest,
        extension,
        type,
        mime: MIME[extension],
        source: resolved.relativePath,
        bytes,
        size: bytes.byteLength,
        types: [type],
      })
    } else if (value.url.startsWith('asset://')) {
      throw new Error('settings.' + field + '.url must be a local file reference in an offline source build')
    } else if (/^https?:\/\//i.test(value.url)) {
      warnings.push({ code: 'external-asset', path: 'settings.' + field + '.url' })
    } else {
      throw new Error('settings.' + field + '.url must use file:./ or an http(s) URL')
    }
  }
  return { settings, assets, warnings }
}

export async function compileProject(root, sceneKey) {
  const sources = await discoverObjects(root)
  const compiledObjects = new Map()
  const globalAssets = new Map()
  const warnings = []
  for (const source of sources) {
    const compiled = await compileObject(root, source)
    compiledObjects.set(compiled.key, compiled)
    warnings.push(...compiled.warnings)
    addGlobalAssets(globalAssets, compiled.assets)
  }

  const sourceScene = await loadScene(root, sceneKey)
  const scene = sourceScene.scene
  const referenced = new Set()
  for (const instance of scene.instances) {
    if (referenced.has(instance.key)) throw new Error('Duplicate instance key: ' + instance.key)
    referenced.add(instance.key)
    const object = compiledObjects.get(instance.object)
    if (!object) throw new Error('Scene instance ' + instance.key + ' references missing object ' + instance.object)
    if (object.role === 'environment') throw new Error('Environment object cannot be placed as instance ' + instance.key)
  }
  if (scene.environment) {
    const environment = compiledObjects.get(scene.environment)
    if (!environment) throw new Error('Scene references missing environment object ' + scene.environment)
    if (environment.role !== 'environment') {
      throw new Error('Scene environment ' + scene.environment + ' must declare role environment')
    }
  }

  const compiledSettings = await compileSettings(root, sourceScene)
  warnings.push(...compiledSettings.warnings)
  addGlobalAssets(globalAssets, compiledSettings.assets)
  const canonicalLayout = canonicalScene({
    schemaVersion: 1,
    sceneKey: scene.sceneKey,
    ...(scene.title === undefined ? {} : { title: scene.title }),
    ...(scene.environment === undefined ? {} : { environment: scene.environment }),
    settingsFile: scene.settingsFile || 'settings.json',
    instances: scene.instances,
  })
  return {
    schemaVersion: 1,
    scene: canonicalLayout,
    settings: compiledSettings.settings,
    objects: [...compiledObjects.values()].sort((left, right) => compareText(left.key, right.key)),
    assets: [...globalAssets.values()].sort((left, right) => compareText(left.url, right.url)),
    warnings,
    sourceScene,
  }
}

export async function compileSingleObject(root, key) {
  const sources = await discoverObjects(root)
  const source = sources.find(item => item.manifest.key === key)
  if (!source) throw new Error('Object not found: ' + key)
  return compileObject(root, source)
}

export { compileObject, fingerprintCompiled, fingerprintSource }
