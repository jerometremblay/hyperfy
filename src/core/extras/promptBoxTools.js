import { zipSync, unzipSync, strToU8, strFromU8 } from 'fflate'
import { exportApp, importApp } from './appTools'
import { hashFile } from '../utils-client'
import { isEqual } from 'lodash-es'
import hyperfySkillFiles from 'hyperfy-skill-files'

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

Read and follow hyperfy-skill/SKILL.md and its relevant bundled references/tools.
For this request, the user's prompt and manifest.json/authoring.md contracts take
precedence over generic skill defaults, including origin, placement and delivery.
This target runtime supports blueprint.model = "script-only" without a GLB bootstrap.

Return the modified .hyp apps in result.zip alongside the unchanged manifest.json.
A single .hyp can also be imported directly.
Use props.promptBoxRequestId from manifest.json.requestId to identify this request.
Every returned app must set props.promptBoxTargetEntityId to the instance it replaces.
Use an intersected entityId to modify that construction, or box.entityId to create a new object.
Only return changed apps; do not return unchanged references or prompt-box.hyp.
Do not keep props.promptBox or props.promptBoxRequest on the generated blueprint.

## Decide what the request means
The prompt-box identifies intent and an approximate edit region; it is not an
absolute placement or clipping constraint for edits to an existing construction.
When the prompt clearly refers to an intersected construction, modify that app.
For example, a box intersecting a timber-frame house wall with "make a window"
means edit the HOUSE: create an actual wall opening and integrate its frame,
glazing, trim and any required timber changes into the existing house script/model.
Do not create a separate window-shaped object over an intact wall.
Inspect the supplied scripts/models and preserve the rest of the construction,
materials, style, behavior and relevant state. Do not recreate the entire house
from a guess. If the requested modification cannot be authored faithfully, explain
the limitation instead of returning an unrelated replacement.
A clearly standalone object request, such as "create a coffee mug", can still
replace the prompt-box, even if a nearby table or floor overlaps the box.
Choose targets from the prompt AND geometry, not from overlap or keywords alone.

## Coordinates for modifying an existing app
Author changes in the target app's ORIGINAL local coordinates and preserve its
origin and local units. The importer retains its world position, quaternion,
scale and instance ID. Never bake its world transform or the box transform into
the returned house; never recenter it at the prompt-box.
boxInAppMatrix is column-major and maps the centered UNIT cube (+/-0.5 on each
axis) into the original app-local frame, including box dimensions and inverse app
scale. Its translation gives the approximate edit center. boxLocalMatrix maps
app-local coordinates into the box-centered frame in meters.
Read the actual wall geometry, including child transforms, to determine its plane,
normal, thickness, vertical direction, usable boundaries and timber bay spacing.
Project the hinted center onto the chosen wall plane, align the window with that
wall and the house's vertical direction, and fit it between the relevant structural
members. Correct small lateral offsets and stray box rotation. Adjust dimensions
and placement as needed to stay within the wall and avoid unintended damage to
posts, beams, corners and adjacent openings. Follow explicit user placement or
structural-change instructions when they intentionally override those defaults.
Cut through the actual wall thickness; an opening cannot retain a solid wall behind
it. Slightly offside or rotated prompt-boxes must not produce a tilted or floating
window. For a house rotated/scaled in the world, solve this in house-local space.
The box's bottom face and axes are hints only for construction edits.

## Coordinates for a new standalone object
Meters, right-handed axes: +X right, +Y up, -Z forward.
The generated app origin is the CENTER of the prompt-box. Build all geometry in its
local coordinates: X within +/- width/2, Y within +/- height/2, Z within +/- depth/2.
The base is Y = -height/2. Fit the complete object (including handles) in the box.
Do not bake the world position/rotation into geometry. Import applies those once,
with instance scale [1,1,1]. Dimensions are already baked into the authored geometry.

## Intersected apps
manifest.intersections lists nearby apps whose geometry bounds overlap the box.
Each file in apps/ is the complete app blueprint and assets, not a cropped part.
IDs identify instances: two instances of one blueprint have separate entries.
position, quaternion, scale are the exact world transforms of their app roots.
boxLocalMatrix is a column-major 4x4 matrix mapping app-local geometry into the
prompt-box frame in meters. Apply it once when reasoning about the surrounding
geometry; the box dimensions are not a scale factor for this matrix.
Selection uses transformed bounds of individual geometry parts, including boxes
wholly inside solid bounds. Curved or hollow parts can include empty space inside
their bounds. Scene apps, other prompt-boxes, and invisible parts are excluded.
state records the exported instance state; keep it compatible with the edited app.
Only edit entries marked editable. Return each changed construction at its
manifest filename, with its target entityId tag. Each instance is replaced with a
fresh blueprint, so other instances sharing its original blueprint are unaffected.
If no file targets box.entityId, importing the edits removes the consumed
prompt-box. Undo restores the box and all edited apps together.

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

## Pre-save validator (required)
Before saving or returning any result, run the bundled validator in the chat:
python3 hyperfy-skill/tools/validate_result.py generated.js
python3 hyperfy-skill/tools/validate_result.py generated.hyp
After assembling result.zip, run:
python3 hyperfy-skill/tools/validate_result.py result.zip
The validator checks JavaScript syntax, Hyperfy primitive property types, packaged
asset hashes and byte boundaries, and prompt-box target metadata. Do not save or
return the ZIP if any command fails; fix the source, rebuild the .hyp hashes, and
run the validator again.

## Binary .hyp format
[4-byte little-endian JSON header byte length][UTF-8 header][concatenated asset bytes]
Header: {blueprint: {name, model, script, props, unique: true, scene: false},
assets: [{type, url, size, mime}, ...]}.
Asset types include script, model, texture. Hash exact bytes using SHA-256, then use
asset://<hash>.<extension>. Each asset size is its exact byte count. Assets follow
header order. Scripts use .js and text/javascript; models use .glb.
Use a real object name. Preserve an edited construction's relevant properties,
adding props.promptBoxRequestId and props.promptBoxTargetEntityId for this result.

## Rebuilding and validating a revised .hyp (required)
After ANY script/model/asset edit, including a follow-up fix of an earlier result:
1. Hash the final asset bytes and create its asset://<sha256>.<extension> URL.
2. Use that IDENTICAL URL in BOTH the blueprint reference (e.g. blueprint.script)
   and the corresponding header.assets entry's url. Update all other references
   to the edited asset as well, including blueprint.model, image.url and props URLs.
   Changing blueprint.script alone while keeping the old assets[].url is INVALID:
   the importer will reject it with "The .hyp is missing a referenced asset."
3. Set each asset's size to len(final_asset_bytes), measured in bytes, not characters.
   Serialize a fresh UTF-8 JSON header and recalculate its 4-byte length prefix.
   Rebuild the entire .hyp with the final asset bytes in header.assets order.
   A script that keeps the same byte length still needs its new hash in BOTH places.
4. Parse the newly rebuilt .hyp and assert before delivering it:
   - Every blueprint asset reference has exactly one matching assets[].url entry.
   - blueprint.script matches a packaged asset with type "script".
   - Each asset URL hash equals SHA-256 of its exact packaged byte slice.
   - Asset slices match declared sizes; 4 + header_byte_length + sum(asset sizes)
     equals the total .hyp byte length, with no missing or trailing bytes.
   - Request ID and target entity ID still match the unchanged manifest.json.
5. Validate every returned .hyp, then put those validated files into the final ZIP.
   Reopen the final ZIP and repeat the checks on its embedded .hyp bytes. A fixed
   filename does not repair a stale asset table. Keep manifest.json unchanged.
Deliver only after these checks pass. This applies to both first results and revisions.
`

export async function exportPromptBox(app, request, resolveFile, intersections = []) {
  const hyp = await exportApp(app.blueprint, resolveFile)
  const prompt =
    `# Hyperfy construction request\n\n${request.box.prompt}\n\n` +
    `Read manifest.json, authoring.md, and hyperfy-skill/SKILL.md before choosing which apps to change.\nFollow the bundled Hyperfy skill and its relevant references/tools; use authoring.md for request-specific overrides.\n` +
    `Use manifest.intersections and apps/ as spatial context (${intersections.length} intersected apps).\n` +
    `If this request refers to an intersected construction, edit that app in its original local frame.\n` +
    `Use the prompt-box as a region hint; align placement and openings to the actual construction.\n` +
    `For a standalone object, return generated.hyp targeting the prompt-box instead.\n` +
    `Set blueprint.props.promptBoxRequestId to ${request.requestId}.\n` +
    `Set blueprint.props.promptBoxTargetEntityId to each modified instance's entityId.\n` +
    `For every edited asset, update BOTH its blueprint reference and assets[].url to the same final SHA-256 URL.\n` +
    `Rebuild each .hyp header and asset payload, then run authoring.md's required package checks on the final ZIP.\n` +
    `Return a modified .hyp, or result.zip containing unchanged manifest.json and only the changed .hyp apps.\n`
  const files = {
    'prompt.md': strToU8(prompt),
    'authoring.md': strToU8(authoringGuide),
    'manifest.json': strToU8(JSON.stringify(request, null, 2)),
    'prompt-box.hyp': new Uint8Array(await hyp.arrayBuffer()),
  }
  for (const [name, base64] of Object.entries(hyperfySkillFiles)) {
    files[name] = Uint8Array.from(atob(base64), char => char.charCodeAt(0))
  }
  for (const { blueprint, snapshot } of intersections) {
    const file = await exportApp(
      {
        ...blueprint,
        props: {
          ...blueprint.props,
          promptBoxRequestId: request.requestId,
          promptBoxTargetEntityId: snapshot.entityId,
        },
      },
      resolveFile
    )
    files[snapshot.file] = new Uint8Array(await file.arrayBuffer())
  }
  const bytes = zipSync(files)
  return new File([bytes], `prompt-box-${request.requestId}.zip`, { type: 'application/zip' })
}

export async function readPromptBoxResult(file, request) {
  if (file.size > MAX_PACKAGE_SIZE) throw new Error('Result exceeds 50 MB.')
  let inputFiles
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
    if (!apps.length || apps.length > (request.intersections?.length || 0) + 1) {
      throw new Error('Return at least one .hyp and at most one file for each target.')
    }
    inputFiles = apps.map(name => new File([files[name]], name))
  } else if (!file.name.toLowerCase().endsWith('.hyp')) {
    throw new Error('Choose a .hyp file or result ZIP.')
  }
  const results = []
  const targets = new Set()
  for (const input of inputFiles || [file]) {
    const info = await readResultApp(input, request)
    const targetId = info.blueprint.props.promptBoxTargetEntityId ?? (request.version < 2 ? request.box.entityId : null)
    if (
      !targetId ||
      (targetId !== request.box.entityId && !request.intersections?.some(app => app.entityId === targetId))
    ) {
      throw new Error(
        'Each result must identify a prompt-box or intersected target using props.promptBoxTargetEntityId.'
      )
    }
    if (targets.has(targetId))
      throw new Error('Return exactly one .hyp for each changed target; duplicate target found.')
    targets.add(targetId)
    results.push({ ...info, targetEntityId: targetId })
  }
  return results
}

async function readResultApp(file, request) {
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
