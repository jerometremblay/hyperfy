import { System } from './System'
import { sanitizeSeatProfileId } from '../extras/seatPose'

/**
 * Anchor System
 *
 * - Runs on both the server and client.
 * - Keeps track of anchors for easy access by player entities
 *
 */
export class Anchors extends System {
  constructor(world) {
    super(world)
    this.matrices = new Map()
    this.profileIds = new Map()
  }

  get(id) {
    return this.matrices.get(id)
  }

  getProfileId(id) {
    return this.profileIds.get(id) || null
  }

  add(id, matrix, profileId = null) {
    this.matrices.set(id, matrix)
    const normalizedProfileId = sanitizeSeatProfileId(profileId)
    if (normalizedProfileId) this.profileIds.set(id, normalizedProfileId)
    else this.profileIds.delete(id)
  }

  remove(id) {
    this.matrices.delete(id)
    this.profileIds.delete(id)
  }

  destroy() {
    this.matrices.clear()
    this.profileIds.clear()
  }
}
