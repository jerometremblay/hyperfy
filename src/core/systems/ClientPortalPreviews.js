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
      if ((!entry.remote || now >= entry.refreshAt) && !entry.loading && now >= entry.retryAt) this.load(entry)
      if (entry.remote) {
        if (entry.remote.network.ready) entry.retryCount = 0
        const subscriptions = JSON.stringify(ids)
        if (entry.subscriptions !== subscriptions) {
          entry.remote.network.setSubscriptions(ids)
          entry.subscriptions = subscriptions
        }
        entry.remote.tick(now)
        if (entry.remote.network.frozen) this.cullSnapshot(entry.remote)
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
    // Bound the complete capture too; legacy discovery can require several requests.
    const timeout = setTimeout(() => controller.abort(), 70000)
    let remote
    try {
      const url = new URL(entry.key)
      url.pathname = `${url.pathname.replace(/\/$/, '')}/api/portal-status`
      let status
      try {
        const response = await fetch(url.href, {
          credentials: 'omit',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]),
        })
        if (response.ok) status = await response.json()
      } catch {
        if (controller.signal.aborted) throw new Error('Remote preview cancelled')
      }
      let snapshot, wsUrl
      if (status?.preview?.version === 1) {
        wsUrl = new URL(status.preview.wsUrl)
        if (!['ws:', 'wss:'].includes(wsUrl.protocol)) throw new Error('Invalid remote preview address')
      } else {
        const snapshotURL = `${this.world.network.apiUrl}/portal-snapshot?url=${encodeURIComponent(entry.key)}`
        const response = await fetch(snapshotURL, { credentials: 'omit', signal: controller.signal })
        if (!response.ok) throw new Error('Remote snapshot unavailable')
        snapshot = await response.json()
      }
      remote = createPreviewWorld(this.world, entry.key)
      // Root-relative environment resources belong to the destination host.
      const baseEnvironment = {
        model: null,
        bg: null,
        hdr: new URL('/Clear_08_4pm_LDR.hdr', snapshot ? globalThis.location?.href || entry.key : entry.key).href,
        sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
        rotationY: 0,
        sunIntensity: 1,
        sunColor: 0xffffff,
        fogNear: null,
        fogFar: null,
        fogColor: null,
      }
      await remote.init({ wsUrl: wsUrl?.href, snapshot, baseEnvironment, storage: new Map() })
      if (this.destroyed || controller.signal.aborted || this.worlds.get(entry.key) !== entry) {
        remote.destroy()
        return
      }
      remote.network.apiUrl = status?.preview?.apiUrl
      entry.remote?.destroy()
      entry.remote = remote
      entry.refreshAt = snapshot
        ? performance.now() + Math.max(60000, (snapshot.refreshAt || Date.now() + 24 * 60 * 60 * 1000) - Date.now())
        : Infinity
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

  cullSnapshot(remote) {
    if (performance.now() < (remote.nextSnapshotCull || 0)) return
    remote.nextSnapshotCull = performance.now() + 1000
    const matrix = remote.network.endpoints.get('')
    if (!matrix) return
    const center = new THREE.Vector3().setFromMatrixPosition(matrix)
    const bounded = new Set(),
      nearby = new Set()
    const visit = node => {
      for (const item of node.items) {
        const entity = item.getEntity?.()
        if (!entity?.isApp) continue
        bounded.add(entity)
        if (center.distanceTo(item.sphere.center) <= 50 + item.sphere.radius) nearby.add(entity)
      }
      for (const child of node.children) visit(child)
    }
    if (remote.stage.octree?.root) visit(remote.stage.octree.root)
    for (const entity of bounded) {
      if (nearby.has(entity)) continue
      let global = false
      const inspect = node => {
        if (node.name === 'sky' || node.name === 'light') global = true
      }
      entity.root?.traverse(inspect)
      for (const node of entity.worldNodes || []) node.traverse(inspect)
      if (!global) remote.entities.remove(entity.data.id)
    }
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
