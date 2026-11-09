import { Node } from './Node.js'
import { Group } from 'three'

// One engine node owns the complete native Three.js hierarchy.
export class NativeGeometry extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'nativegeometry'
    this.object = data.object
    this.container = new Group()
    if (this.object) this.container.add(this.object)
    this.raycastHandles = []
  }

  mount() {
    if (!this.object) return
    this.container.matrixAutoUpdate = false
    this.container.matrixWorldAutoUpdate = false
    this.container.matrixWorld.copy(this.matrixWorld)
    this.object.traverse(object => {
      if (object.isMesh) {
        object.castShadow = true
        object.receiveShadow = true
        this.raycastHandles.push(this.ctx.world.stage.insertRaycastObject({ object, node: this }))
      }
    })
    this.ctx.world.stage.scene.add(this.container)
    this.container.updateMatrixWorld(true)
  }

  commit(didMove) {
    if (didMove && this.object) {
      this.container.matrixWorld.copy(this.matrixWorld)
      this.container.updateMatrixWorld(true)
    }
  }

  unmount() {
    for (const handle of this.raycastHandles) handle.destroy()
    this.raycastHandles = []
    if (this.object) this.ctx.world.stage.scene.remove(this.container)
  }
}
