import { Node } from './Node'
import { sanitizeSeatProfileId } from '../extras/seatPose'

export class Anchor extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'anchor'
    this.profileId = sanitizeSeatProfileId(data.profileId)
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this.profileId = source.profileId
    return this
  }

  mount() {
    this.anchorId = `${this.ctx?.entity?.data.id || ''}:${this.id}`
    this.ctx.world.anchors.add(this.anchorId, this.matrixWorld, this.profileId)
  }

  unmount() {
    this.ctx.world.anchors.remove(this.anchorId)
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get anchorId() {
          return self.anchorId
        },
        get profileId() {
          return self.profileId
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}
