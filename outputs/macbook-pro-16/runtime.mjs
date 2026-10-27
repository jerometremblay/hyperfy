import * as THREE from 'three'
import { Prim } from '../../src/core/nodes/Prim.js'
import { Group } from '../../src/core/nodes/Group.js'
import { Action } from '../../src/core/nodes/Action.js'
import { UI } from '../../src/core/nodes/UI.js'
import { UIText } from '../../src/core/nodes/UIText.js'
import { Image } from '../../src/core/nodes/Image.js'
import { getRef } from '../../src/core/nodes/Node.js'

// Native node constructors and extrusion geometry, with an isolated renderer.
export function execute(source, { server = false, preview = false, state = {}, onSend } = {}) {
  const root = new Group()
  const nodes = [],
    configs = [],
    visuals = [],
    handlers = new Map()
  const app = {
    state: structuredClone(state),
    position: root.position,
    quaternion: root.quaternion,
    scale: root.scale,
    create(kind, data) {
      const Constructor = {
        prim: Prim,
        group: Group,
        action: Action,
        ui: UI,
        uitext: UIText,
        image: Image,
      }[kind]
      const node = new Constructor(data)
      nodes.push(node)
      configs.push({ kind, ...data })
      return node.getProxy()
    },
    add(proxy) {
      root.add(getRef(proxy))
    },
    on(name, callback) {
      if (!handlers.has(name)) handlers.set(name, new Set())
      handlers.get(name).add(callback)
    },
    off(name, callback) {
      handlers.get(name)?.delete(callback)
    },
    send(name, data) {
      onSend?.(name, data)
    },
  }
  const world = {
    isServer: server,
    isClient: !server,
    isPreview: preview,
    getPlayer: id => world.players?.[id],
  }
  new Function('app', 'world', source)(app, world)
  const ctx = {
    moving: false,
    entity: { data: { id: 'macbook-audit' } },
    world: {
      loader: null,
      network: { isServer: server },
      stage: {
        scene: new THREE.Scene(),
        dirtyNodes: new Set(),
        insertLinked(data) {
          const visual = { ...data, matrix: data.matrix.clone() }
          visuals.push(visual)
          return {
            setColor(value) {
              visual.color = value
            },
            setEmissive(value) {
              visual.emissive = value
            },
            setEmissiveIntensity(value) {
              visual.emissiveIntensity = value
            },
          }
        },
      },
    },
  }
  root.ctx = ctx
  function updateTransforms() {
    root.updateTransform()
    for (const node of nodes) {
      node.ctx = ctx
      node.updateTransform()
      node.updateMatrixWorldOffset?.()
    }
  }
  updateTransforms()
  for (const node of nodes) if (node instanceof Prim) node.mount()
  return {
    root,
    app,
    world,
    nodes,
    configs,
    visuals,
    handlers,
    updateTransforms,
    event(name, ...args) {
      for (const callback of handlers.get(name) || []) callback(...args)
    },
    tick(delta) {
      for (const callback of [...(handlers.get('update') || [])]) callback(delta)
      updateTransforms()
    },
  }
}
