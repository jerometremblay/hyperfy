import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'
import { exportApp, importApp } from './appTools'
import { hashFile } from '../utils-client'
import { isEqual } from 'lodash-es'

export const MIN_PROMPT_BOX_SIZE = 0.01
const MAX_PACKAGE_SIZE = 50 * 1024 * 1024

export function isPromptBox(blueprint) {
  return blueprint?.props?.promptBox === true
}

// The app is a unit cube. Instance scale supplies its dimensions in meters.
export const promptBoxScript = `
app.add(app.create('prim', {
  type: 'box', color: '#6ac4dc', opacity: 0.15,
  doubleside: true, castShadow: false, receiveShadow: false,
}))
for (let axis = 0; axis < 3; axis++) {
  for (const a of [-0.5, 0.5]) for (const b of [-0.5, 0.5]) {
    const size = [0.006, 0.006, 0.006]
    const position = [0, 0, 0]
    size[axis] = 1
    position[(axis + 1) % 3] = a
    position[(axis + 2) % 3] = b
    app.add(app.create('prim', {
      type: 'box', size, position, color: '#6ac4dc',
      castShadow: false, receiveShadow: false,
    }))
  }
}
`

export function getPromptBoxSnapshot(app) {
  const dimensions = app.root.scale.toArray()
  if (!dimensions.every(n => Number.isFinite(n) && n >= MIN_PROMPT_BOX_SIZE)) {
    throw new Error('Box dimensions must be at least 0.01 m.')
  }
  return {
    entityId: app.data.id,
    blueprintId: app.data.blueprint,
    prompt: app.blueprint.props.prompt || '',
    position: app.root.position.toArray(),
    quaternion: app.root.quaternion.toArray(),
    dimensions,
  }
}

export function assertPromptBoxUnchanged(app, request) {
  if (
    !request ||
    !isPromptBox(app.blueprint) ||
    app.destroyed ||
    app.building ||
    app.blueprint.version !== request.blueprintVersion ||
    JSON.stringify(getPromptBoxSnapshot(app)) !== JSON.stringify(request.box)
  ) {
    throw new Error('The prompt-box changed since export. Export a new request before importing its result.')
  }
}

const authoringGuide = `# Hyperfy app authoring

Return a single generated.hyp, optionally packaged in result.zip alongside the unchanged manifest.json.
Use props.promptBoxRequestId from manifest.json.requestId to identify this request.
Do not keep props.promptBox or props.promptBoxRequest on the generated blueprint.

## Coordinates
Meters, right-handed axes: +X right, +Y up, -Z forward.
The generated app origin is the CENTER of the prompt-box. Build all geometry in its
local coordinates: X within +/- width/2, Y within +/- height/2, Z within +/- depth/2.
The base is Y = -height/2. Fit the complete object (including handles) in the box.
Do not bake the world position/rotation into geometry. Import applies those once,
with instance scale [1,1,1]. Dimensions are already baked into the authored geometry.

## Script-only apps (recommended)
blueprint.model = "script-only"; blueprint.script = "asset://<sha256>.js".
Scripts are plain JavaScript, not modules. No imports, DOM, filesystem, or raw THREE.
Create geometry with app.create('prim', options), then app.add(node).
Primitive origins are centered. Options include position: [x,y,z], rotation:
[radiansX,radiansY,radiansZ], scale: [x,y,z], color: '#rrggbb', metalness, roughness,
opacity (0..1), doubleside, castShadow, receiveShadow, emissive, emissiveIntensity.
For new decorative objects use physics: null (default).
Shapes and size arrays:
- box: [width,height,depth]
- sphere: [radius]
- cylinder: [radiusTop,radiusBottom,height]
- cone: [radius,height]
- torus: [majorRadius,tubeRadius], initially in the XY plane
- plane: [width,height]
- extrude: profile: [[x,y],...], depth, bevelEnabled. Simple polygons, no holes.
Groups: app.create('group', {position,rotation,scale}); group.add(child); app.add(group).
Create nodes once, never repeatedly in an update loop. The packaged prompt-box
script is a working example of the API. Keep every referenced asset in the .hyp.

## Binary .hyp format
[4-byte little-endian JSON header byte length][UTF-8 header][concatenated asset bytes]
Header: {blueprint: {name, model, script, props, unique: true, scene: false},
assets: [{type, url, size, mime}, ...]}.
Asset types include script, model, texture. Hash exact bytes using SHA-256, then use
asset://<hash>.<extension>. Each asset size is its exact byte count. Assets follow
header order. Scripts use .js and text/javascript; models use .glb.
Use a real object name. Preserve only props.promptBoxRequestId from the placeholder.
`

export async function exportPromptBox(app, request, resolveFile) {
  const hyp = await exportApp(app.blueprint, resolveFile)
  const prompt =
    `# Create a new Hyperfy object\n\n${request.box.prompt}\n\n` +
    `Read manifest.json and authoring.md. Use the box dimensions as the intended size.\n` +
    `Create generated.hyp to replace the placeholder, not the surrounding world.\n` +
    `Set blueprint.props.promptBoxRequestId to ${request.requestId}.\n` +
    `Return generated.hyp, or result.zip containing manifest.json and generated.hyp.\n`
  const bytes = zipSync({
    'prompt.md': strToU8(prompt),
    'authoring.md': strToU8(authoringGuide),
    'manifest.json': strToU8(JSON.stringify(request, null, 2)),
    'prompt-box.hyp': new Uint8Array(await hyp.arrayBuffer()),
  })
  return new File([bytes], `prompt-box-${request.requestId}.zip`, { type: 'application/zip' })
}

export async function readPromptBoxResult(file, request) {
  if (file.size > MAX_PACKAGE_SIZE) throw new Error('Result exceeds 50 MB.')
  if (file.name.toLowerCase().endsWith('.zip')) {
    let total = 0
    const files = unzipSync(new Uint8Array(await file.arrayBuffer()), {
      filter: entry => {
        total += entry.originalSize
        if (total > MAX_PACKAGE_SIZE) throw new Error('Expanded result exceeds 50 MB.')
        return entry.name === 'manifest.json' || entry.name.endsWith('.hyp')
      },
    })
    if (!files['manifest.json']) throw new Error('Result ZIP must contain manifest.json.')
    const manifest = JSON.parse(strFromU8(files['manifest.json']))
    if (!isEqual(manifest, request)) {
      throw new Error('Result manifest does not match this exported request.')
    }
    const apps = Object.keys(files).filter(name => name.endsWith('.hyp'))
    if (apps.length !== 1) throw new Error('Result ZIP must contain exactly one generated .hyp file.')
    file = new File([files[apps[0]]], 'generated.hyp')
  } else if (!file.name.toLowerCase().endsWith('.hyp')) {
    throw new Error('Choose a .hyp file or result ZIP.')
  }
  // importApp is intentionally permissive. Validate byte boundaries first here.
  const bytes = await file.arrayBuffer()
  if (bytes.byteLength < 4) throw new Error('Invalid .hyp header.')
  const headerSize = new DataView(bytes).getUint32(0, true)
  if (headerSize > bytes.byteLength - 4) throw new Error('Truncated .hyp header.')
  const header = JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + headerSize)))
  const bp = header.blueprint
  if (
    !bp ||
    !Array.isArray(header.assets) ||
    !bp.props ||
    bp.scene ||
    bp.disabled ||
    bp.props.promptBox ||
    bp.props.promptBoxRequestId !== request.requestId ||
    (!bp.script && (!bp.model || bp.model === 'script-only'))
  ) {
    throw new Error('Expected a generated object for this request, not a scene or prompt-box.')
  }
  let size = 4 + headerSize
  const urls = new Set()
  for (const asset of header.assets) {
    if (
      !Number.isSafeInteger(asset.size) ||
      asset.size < 0 ||
      typeof asset.url !== 'string' ||
      !/^asset:\/\/[^/]+\.[a-z0-9]+$/i.test(asset.url) ||
      urls.has(asset.url) ||
      !['script', 'model', 'texture', 'image', 'audio', 'video', 'avatar', 'hdr', 'emote'].includes(asset.type)
    ) {
      throw new Error('Invalid .hyp asset metadata.')
    }
    urls.add(asset.url)
    size += asset.size
  }
  if (size !== bytes.byteLength) throw new Error('Truncated .hyp assets or unexpected trailing bytes.')
  const refs = [
    bp.script,
    bp.model === 'script-only' ? null : bp.model,
    bp.image?.url,
    ...Object.values(bp.props).map(value => value?.url),
  ].filter(Boolean)
  if (refs.some(url => !urls.has(url))) throw new Error('The .hyp is missing a referenced asset.')
  if (bp.script && !header.assets.some(asset => asset.url === bp.script && asset.type === 'script')) {
    throw new Error('The script reference must point to a script asset.')
  }
  const info = await importApp(file)
  // Server uploads use content-addressed filenames. Rehash edited assets and
  // remap their references rather than trusting hashes supplied by the author.
  const remaps = new Map()
  for (const asset of info.assets) {
    const ext = asset.file.name.split('.').pop().toLowerCase()
    remaps.set(asset.url, `asset://${await hashFile(asset.file)}.${ext}`)
    asset.url = remaps.get(asset.url)
  }
  info.blueprint.script = remaps.get(bp.script) || bp.script
  info.blueprint.model = remaps.get(bp.model) || bp.model || 'script-only'
  if (bp.image?.url) info.blueprint.image.url = remaps.get(bp.image.url)
  for (const value of Object.values(info.blueprint.props)) {
    if (value?.url) value.url = remaps.get(value.url)
  }
  return info
}
