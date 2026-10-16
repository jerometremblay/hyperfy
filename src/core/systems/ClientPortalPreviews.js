import * as THREE from '../extras/three'
import { System } from './System'
import { createPreviewWorld } from '../createPreviewWorld'

const position = new THREE.Vector3()
const INITIAL_RETRY_DELAY = 5000
const MAX_RETRY_DELAY = 60000

function scheduleRetry(entry, now) {
  entry.retryCount++
  entry.retryAt = now + Math.min(INITIAL_RETRY_DELAY * 2 ** (entry.retryCount - 1), MAX_RETRY_DELAY)
}

export class ClientPortalPreviews extends System {
  constructor(world) {
    super(world)
    this.worlds = new Map()
    this.destinations = new Map()
    this.destroyed = false
  }

  update() {
    if (this.destroyed) return
    const now = performance.now()
    const wanted = new Map()
    for (const portal of this.world.graphics.portals) {
      if (!portal.url || portal.ctx.entity?.data.mover) continue
      position.setFromMatrixPosition(portal.matrixWorld)
      if (position.distanceTo(this.world.rig.position) > 30) continue
      const url = new URL(portal.url)
      url.search = ''
      url.hash = ''
      url.pathname = url.pathname.replace(/\/$/, '')
      const key = url.href
      if (!wanted.has(key)) wanted.set(key, [])
      wanted.get(key).push(portal)
    }
    this.destinations.clear()
    for (const [key, portals] of wanted) {
      let entry = this.worlds.get(key)
      if (!entry) {
        entry = { key, lastUsed: now, portals, retryAt: 0, retryCount: 0 }
        this.worlds.set(key, entry)
      }
      entry.lastUsed = now
      entry.portals = portals
      const ids = [...new Set(portals.map(portal => portal.target))].sort()
      if (entry.remote?.network.error) {
        entry.error = entry.remote.network.error
        entry.remote.destroy()
        entry.remote = null
        scheduleRetry(entry, now)
      }
      if (!entry.remote && !entry.loading && now >= entry.retryAt) this.load(entry)
      if (entry.remote) {
        if (entry.remote.network.ready) entry.retryCount = 0
        const subscriptions = JSON.stringify(ids)
        if (entry.subscriptions !== subscriptions) {
          entry.remote.network.setSubscriptions(ids)
          entry.subscriptions = subscriptions
        }
        entry.remote.tick(now)
        for (const portal of portals) {
          const matrix = entry.remote.network.endpoints.get(portal.target)
          if (matrix && entry.remote.network.ready) {
            let destination = entry.endpoints.get(portal.target)
            if (!destination) {
              destination = { matrixWorld: matrix, world: entry.remote }
              entry.endpoints.set(portal.target, destination)
            }
            destination.matrixWorld = matrix
            this.destinations.set(portal, destination)
          }
        }
      }
    }
    for (const [key, entry] of this.worlds) {
      if (now - entry.lastUsed > 10000) {
        entry.controller?.abort()
        entry.remote?.destroy()
        this.worlds.delete(key)
      }
    }
  }

  async load(entry) {
    entry.loading = true
    entry.error = ''
    const controller = new AbortController()
    entry.controller = controller
    const timeout = setTimeout(() => controller.abort(), 5000)
    let remote
    try {
      const url = new URL(entry.key)
      url.pathname = `${url.pathname.replace(/\/$/, '')}/api/portal-status`
      const response = await fetch(url.href, { credentials: 'omit', signal: controller.signal })
      if (!response.ok) throw new Error('Remote preview unavailable')
      const status = await response.json()
      if (status.preview?.version !== 1) throw new Error('Remote world does not support previews')
      const wsUrl = new URL(status.preview.wsUrl)
      if (!['ws:', 'wss:'].includes(wsUrl.protocol)) throw new Error('Invalid remote preview address')
      remote = createPreviewWorld(this.world, entry.key)
      // Root-relative environment resources belong to the destination host.
      const baseEnvironment = {
        model: null,
        bg: null,
        hdr: new URL('/Clear_08_4pm_LDR.hdr', entry.key).href,
        sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
        rotationY: 0,
        sunIntensity: 1,
        sunColor: 0xffffff,
        fogNear: null,
        fogFar: null,
        fogColor: null,
      }
      await remote.init({ wsUrl: wsUrl.href, baseEnvironment, storage: new Map() })
      if (this.destroyed || controller.signal.aborted || this.worlds.get(entry.key) !== entry) {
        remote.destroy()
        return
      }
      remote.network.apiUrl = status.preview.apiUrl
      entry.remote = remote
      entry.endpoints = new Map()
      entry.subscriptions = null
      entry.error = ''
    } catch (error) {
      remote?.destroy()
      entry.error = error.message
      scheduleRetry(entry, performance.now())
    } finally {
      clearTimeout(timeout)
      entry.loading = false
    }
  }

  get(portal) {
    return this.destinations.get(portal)
  }

  destroy() {
    this.destroyed = true
    for (const entry of this.worlds.values()) {
      entry.controller?.abort()
      entry.remote?.destroy()
    }
    this.worlds.clear()
    this.destinations.clear()
  }
}
