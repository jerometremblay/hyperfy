import EventEmitter from 'eventemitter3'
import { World } from './World'
import { ClientLoader } from './systems/ClientLoader'
import { ClientEnvironment } from './systems/ClientEnvironment'
import { PreviewNetwork } from './systems/PreviewNetwork'

/** A scene replica: no canvas, animation loop, local player, PhysX or voice room. */
export function createPreviewWorld(primary, destinationURL) {
  const world = new World({ preview: true })
  world.destinationURL = destinationURL
  world.storage = new Map()
  world.xr = { session: null }
  world.livekit = { isMuted: () => true }
  world.prefs = new EventEmitter()
  world.prefs.shadows = 'none'
  world.graphics = new EventEmitter()
  world.graphics.renderer = primary.graphics.renderer
  world.graphics.maxAnisotropy = primary.graphics.maxAnisotropy
  world.graphics.worldToScreenFactor = primary.graphics.worldToScreenFactor
  world.graphics.portals = new Set()
  world.graphics.renderPortal = () => {}
  world.register('loader', ClientLoader)
  world.register('environment', ClientEnvironment)
  world.register('network', PreviewNetwork)
  const methods = world.apps.worldMethods
  methods.open = () => {}
  methods.setQueryParam = () => {}
  methods.getQueryParam = (_entity, key) => new URL(destinationURL).searchParams.get(key)
  methods.chat = () => {}
  methods.raycast = () => null
  methods.overlapSphere = () => []
  world.apps.appMethods.control = () => ({ release() {} })
  return world
}
