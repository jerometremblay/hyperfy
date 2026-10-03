import { cloneDeep } from 'lodash-es'
import { uuid } from '../utils'

export async function exportApp(blueprint, resolveFile) {
  blueprint = cloneDeep(blueprint)

  // get all asset urls
  const assets = []
  if (blueprint.model && blueprint.model !== 'script-only') {
    assets.push({
      type: blueprint.model.endsWith('.vrm') ? 'avatar' : 'model',
      url: blueprint.model,
      file: await resolveFile(blueprint.model),
    })
  }
  if (blueprint.script) {
    assets.push({
      type: 'script',
      url: blueprint.script,
      file: await resolveFile(blueprint.script),
    })
  }
  if (blueprint.image) {
    assets.push({
      type: 'texture',
      url: blueprint.image.url,
      file: await resolveFile(blueprint.image.url),
    })
  }
  for (const key in blueprint.props) {
    const value = blueprint.props[key]
    if (value?.url) {
      assets.push({
        type: value.type,
        url: value.url,
        file: await resolveFile(value.url),
      })
    }
  }

  if (blueprint.locked) {
    blueprint.frozen = true
  }
  if (blueprint.disabled) {
    blueprint.disabled = false
  }

  const filename = `${blueprint.name || 'app'}.hyp`

  // create header
  const header = {
    blueprint,
    assets: assets.map(asset => {
      return {
        type: asset.type,
        url: asset.url,
        size: asset.file.size,
        mime: asset.file.type,
      }
    }),
  }

  // convert header to Uint8Array
  const headerBytes = new TextEncoder().encode(JSON.stringify(header))

  // create header size prefix (4 bytes)
  const headerSize = new Uint8Array(4)
  new DataView(headerSize.buffer).setUint32(0, headerBytes.length, true)

  // combine all file data
  const fileBlobs = await Promise.all(assets.map(asset => asset.file.arrayBuffer()))

  // create final blob with header size + header + files
  const file = new File([headerSize, headerBytes, ...fileBlobs], filename, {
    type: 'application/octet-stream',
  })

  return file
}

export async function importApp(file) {
  // read as ArrayBuffer
  const buffer = await file.arrayBuffer()
  if (buffer.byteLength < 4) throw new Error('Invalid .hyp file header.')
  const view = new DataView(buffer)

  // read header size (first 4 bytes)
  const headerSize = view.getUint32(0, true)
  if (headerSize > buffer.byteLength - 4) throw new Error('Incomplete .hyp file header.')

  // read header
  const bytes = new Uint8Array(buffer.slice(4, 4 + headerSize))
  const header = JSON.parse(new TextDecoder().decode(bytes))
  if (
    !header?.blueprint ||
    typeof header.blueprint !== 'object' ||
    Array.isArray(header.blueprint) ||
    !Array.isArray(header.assets)
  ) {
    throw new Error('Invalid .hyp file contents.')
  }

  // extract files
  let position = 4 + headerSize
  const assets = []

  for (const assetInfo of header.assets) {
    if (
      !assetInfo ||
      typeof assetInfo.url !== 'string' ||
      !Number.isSafeInteger(assetInfo.size) ||
      assetInfo.size < 0 ||
      assetInfo.size > buffer.byteLength - position
    ) {
      throw new Error('Invalid or incomplete .hyp asset.')
    }
    const data = buffer.slice(position, position + assetInfo.size)
    const file = new File([data], assetInfo.url.split('/').pop(), {
      type: assetInfo.mime,
    })
    assets.push({
      type: assetInfo.type,
      url: assetInfo.url,
      file,
    })
    position += assetInfo.size
  }

  return {
    blueprint: header.blueprint,
    assets,
  }
}

// Give this instance its own blueprint so linked duplicates keep their original app.
export async function replaceApp(world, app, file) {
  if (!file) return false
  if (!file.name.toLowerCase().endsWith('.hyp')) throw new Error('Choose a .hyp file.')
  const originalBlueprint = app.data.blueprint
  const originalVersion = app.blueprint.version
  const check = () => {
    if (!world.builder.canBuild()) throw new Error('Builder permission is required.')
    if (!app.isApp || app.destroyed || world.entities.get(app.data.id) !== app) {
      throw new Error('This app is no longer available.')
    }
    if (app.blueprint.scene) throw new Error('Import a scene by dropping its .hyp file into the world.')
    if (app.building || app.data.mover || app.data.uploader) {
      throw new Error('Wait for this app to finish loading or moving.')
    }
    if (
      app.data.blueprint !== originalBlueprint ||
      world.blueprints.get(originalBlueprint)?.version !== originalVersion
    ) {
      throw new Error('This app changed during replacement. Try again.')
    }
  }
  check()
  const { blueprint: imported, assets } = await importApp(file)
  if (imported.scene) throw new Error('Choose an app .hyp file, rather than a scene.')
  if (imported.props != null && (typeof imported.props !== 'object' || Array.isArray(imported.props))) {
    throw new Error('Invalid .hyp app properties.')
  }
  check()
  await Promise.all(assets.map(asset => world.network.upload(asset.file)))
  check()
  for (const asset of assets) world.loader.insert(asset.type, asset.url, asset.file)
  await Promise.all(assets.map(asset => world.loader.load(asset.type, asset.url)))
  check()
  const blueprint = { ...imported, id: uuid(), version: 0, props: imported.props || {}, scene: false }
  const previous = { blueprint: originalBlueprint, state: cloneDeep(app.data.state || {}) }
  const change = { id: app.data.id, blueprint: blueprint.id, state: {} }
  world.blueprints.add(blueprint)
  try {
    app.scriptError = null
    await app.modify(change)
    if (app.scriptError) throw new Error('The replacement app failed to load. The original app has been restored.')
    if (!world.builder.canBuild()) throw new Error('Builder permission is required.')
  } catch (err) {
    if (!app.destroyed && app.data.blueprint === blueprint.id) await app.modify(previous)
    throw err
  }
  if (app.destroyed || app.data.blueprint !== blueprint.id) {
    throw new Error('This app changed during replacement. Try again.')
  }
  world.network.send('blueprintAdded', blueprint)
  world.network.send('entityModified', change)
  world.builder.addUndo({ name: 'replace-app', entityId: app.data.id, replacementBlueprintId: blueprint.id, previous })
  world.ui.setApp(null)
  world.emit('toast', 'App replaced. Use Undo to restore the original.')
  return true
}
