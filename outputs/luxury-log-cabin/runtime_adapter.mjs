// Uses this checkout's real primitive constructors AND real mount/geometry path.
// Only the world's rendering stage is replaced for isolated preview/validation.
import { Prim } from '../../src/core/nodes/Prim.js'
import { Group } from '../../src/core/nodes/Group.js'
import { getRef } from '../../src/core/nodes/Node.js'

export async function executeSource(source, auditSuffix = '') {
  const root = new Group({ id: 'cabin' })
  const configs = [], nodes = [], visuals = [], events = []
  const app = {
    create(kind, config) {
      if (kind !== 'prim') throw new Error(`Unexpected node ${kind}`)
      const node = new Prim(config)
      configs.push(config)
      nodes.push(node)
      return node.getProxy()
    },
    add(proxy) { root.add(getRef(proxy)) },
    on(name) { events.push(name); throw new Error(`Static model registered ${name}`) },
  }
  const world = { isClient: true, isServer: false, add() { throw new Error('Detached node') } }
  const audit = new Function('app', 'world', 'props', source + auditSuffix)(app, world, {})
  const context = {
    moving: false, entity: { data: { id: 'cabin' } },
    world: {
      loader: null,
      stage: {
        dirtyNodes: new Set(),
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
  root.updateTransform()
  for (const node of nodes) {
    node.ctx = context
    node.updateTransform()
    await node.mount()
  }
  return { root, configs, nodes, visuals, events, audit }
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
