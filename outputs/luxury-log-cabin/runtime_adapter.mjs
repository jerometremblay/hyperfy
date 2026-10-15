// Uses this checkout's real primitive constructors AND real mount/geometry path.
// Only the world's rendering stage is replaced for isolated preview/validation.
import * as THREE from 'three'
import { Action } from '../../src/core/nodes/Action.js'
import { Light } from '../../src/core/nodes/Light.js'
import { Prim } from '../../src/core/nodes/Prim.js'
import { Group } from '../../src/core/nodes/Group.js'
import { getRef } from '../../src/core/nodes/Node.js'

export async function executeSource(source, auditSuffix = '', options = {}) {
  const root = new Group({ id: 'cabin' })
  const configs = [], nodes = [], visuals = [], lights = [], events = [], handlers = new Map(), detached = []
  const app = {
    position: root.position, quaternion: root.quaternion, scale: root.scale, state: options.state || {},
    configure() {},
    send(name, data) { options.onSend?.(name, data) },
    create(kind, config) {
      if (!['prim', 'light', 'group', 'action'].includes(kind)) throw new Error(`Unexpected node ${kind}`)
      const constructors = { prim: Prim, light: Light, group: Group, action: Action }
      const node = new constructors[kind](config)
      if (kind === 'prim') configs.push(config)
      nodes.push(node)
      return node.getProxy()
    },
    add(proxy) { root.add(getRef(proxy)) },
    on(name, callback) { events.push(name); if (!handlers.has(name)) handlers.set(name, []); handlers.get(name).push(callback) },
  }
  const world = { isClient: !options.server, isServer: !!options.server,
    add(proxy) { detached.push(getRef(proxy)) }, remove(proxy) { detached.splice(detached.indexOf(getRef(proxy)), 1) } }
  const audit = new Function('app', 'world', 'props', source + auditSuffix)(app, world, options.props || {})
  const context = {
    moving: false, entity: { data: { id: 'cabin' } },
    world: {
      loader: null, network: { isServer: false },
      isPreview: false,
      stage: {
        dirtyNodes: new Set(),
        scene: new THREE.Scene(),
        insertLinked(data) {
          const visual = { ...data, matrix: data.matrix.clone() }
          visuals.push(visual)
          return {
            setColor(value) { visual.color = value },
            setEmissive(value) { visual.emissive = value },
            setEmissiveIntensity(value) { visual.emissiveIntensity = value },
          }
        },
        octree: { insert() { throw new Error('Unexpected invisible primitive') } },
      },
    },
  }
  root.ctx = context
  root.updateTransform()
  for (const node of nodes) {
    node.ctx = context
    node.updateTransform()
    // Physics is audited through collider transforms; isolated preview has no PhysX scene.
    if (node instanceof Prim && (node.opacity === 0 || node.physics)) continue
    await node.mount()
    if (node instanceof Light) lights.push(node.light)
  }
  return { root, configs, nodes, visuals, lights, events, handlers, detached, app, audit }
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
  if (offset !== bytes.length) throw new Error('Invalid package byte boundaries')
  const script = assets.find(asset => asset.url === header.blueprint.script)
  if (!script) throw new Error('Missing packaged script')
  return { header, assets, source: new TextDecoder().decode(script.data) }
}
