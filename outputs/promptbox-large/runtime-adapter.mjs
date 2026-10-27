import * as THREE from 'three'
import { Action } from '../../src/core/nodes/Action.js'
import { Light } from '../../src/core/nodes/Light.js'
import { Prim } from '../../src/core/nodes/Prim.js'
import { Group } from '../../src/core/nodes/Group.js'
import { Portal } from '../../src/core/nodes/Portal.js'
import { getRef } from '../../src/core/nodes/Node.js'

// Actual constructors and primitive mount geometry; only the renderer/physics
// scene is replaced for the isolated audit and package preview.
export async function executeSource(source, suffix = '', options = {}) {
  const root = new Group({ id: 'house' })
  const configs = [], nodes = [], visuals = [], lights = [], handlers = new Map(), worldHandlers = new Map()
  const app = {
    position: root.position, quaternion: root.quaternion, scale: root.scale,
    state: structuredClone(options.state || {}), instanceId: 'HCzjtaVZFI',
    configure() {},
    send(name, data) { options.onSend?.(name, data) },
    emit(name, data) { options.onEmit?.(name, data) },
    create(kind, config = {}) {
      const Constructor = { prim: Prim, light: Light, group: Group, action: Action, portal: Portal }[kind]
      if (!Constructor) throw new Error(`Unexpected node ${kind}`)
      const node = new Constructor(config)
      configs.push({ kind, ...config })
      nodes.push(node)
      return node.getProxy()
    },
    add(proxy) { root.add(getRef(proxy)) },
    on(name, callback) {
      if (!handlers.has(name)) handlers.set(name, new Set())
      handlers.get(name).add(callback)
    },
    off(name, callback) { handlers.get(name)?.delete(callback) },
  }
  const world = {
    isClient: !options.server, isServer: !!options.server,
    on(name, callback) {
      if (!worldHandlers.has(name)) worldHandlers.set(name, new Set())
      worldHandlers.get(name).add(callback)
    },
    add() { throw new Error('Unexpected detached world node') },
  }
  const audit = new Function('app', 'world', 'props', source + suffix)(app, world, options.props || {})
  const context = {
    moving: false, entity: { data: { id: app.instanceId } },
    world: {
      loader: null, network: { isServer: !!options.server },
      isPreview: false,
      stage: {
        dirtyNodes: new Set(), scene: new THREE.Scene(),
        insertLinked(data) {
          const visual = { ...data, matrix: data.matrix.clone() }
          visuals.push(visual)
          return {
            setColor(value) { visual.color = value },
            setEmissive(value) { visual.emissive = value },
            setEmissiveIntensity(value) { visual.emissiveIntensity = value },
          }
        },
        octree: { insert() { throw new Error('Unexpected invisible mounted primitive') } },
      },
    },
  }
  root.ctx = context
  root.updateTransform()
  for (const node of nodes) {
    node.ctx = context
    node.updateTransform()
    if (node instanceof Prim && (node.opacity === 0 || node.physics)) continue
    if (node instanceof Portal || node instanceof Action) continue
    await node.mount()
    if (node instanceof Light) lights.push(node.light)
  }
  return { root, configs, nodes, visuals, lights, handlers, worldHandlers, app, audit }
}

export function parseHyp(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  const headerLength = view.getUint32(0, true)
  const header = JSON.parse(new TextDecoder().decode(bytes.slice(4, 4 + headerLength)))
  let offset = 4 + headerLength
  const assets = header.assets.map(info => {
    const data = bytes.slice(offset, offset + info.size)
    offset += info.size
    return { ...info, data }
  })
  if (offset !== bytes.length) throw new Error('Invalid package boundaries')
  const script = assets.find(asset => asset.url === header.blueprint.script)
  if (!script) throw new Error('Missing packaged source')
  return { header, assets, source: new TextDecoder().decode(script.data) }
}
