import * as THREE from './three'
import { isPromptBox } from './promptBoxTools'

const unitScale = new THREE.Vector3(1, 1, 1)
const boxAxes = [new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 1, 0), new THREE.Vector3(0, 0, 1)]
const splatBounds = new WeakMap()

function boxFrame(app) {
  return new THREE.Matrix4().compose(app.root.position, app.root.quaternion, unitScale)
}

// Separating-axis test between the prompt volume and a transformed geometry
// bound. Half-edges retain nested nonuniform scales, reflections, and shear.
function intersectsBounds(bounds, matrix, halfSize) {
  if (bounds.isEmpty()) return false
  const center = bounds.getCenter(new THREE.Vector3()).applyMatrix4(matrix)
  const size = bounds.getSize(new THREE.Vector3()).multiplyScalar(0.5)
  const edges = boxAxes.map((_, axis) =>
    new THREE.Vector3().setFromMatrixColumn(matrix, axis).multiplyScalar(size.getComponent(axis))
  )
  if (![...center.toArray(), ...edges.flatMap(edge => edge.toArray())].every(Number.isFinite)) return false
  const overlaps = axis => {
    const boxRadius = Math.abs(axis.x) * halfSize.x + Math.abs(axis.y) * halfSize.y + Math.abs(axis.z) * halfSize.z
    const partRadius = edges.reduce((sum, edge) => sum + Math.abs(axis.dot(edge)), 0)
    return Math.abs(axis.dot(center)) <= boxRadius + partRadius + 1e-8 * axis.length()
  }
  if (!boxAxes.every(overlaps)) return false
  const axes = []
  for (let i = 0; i < 3; i++) {
    axes.push(new THREE.Vector3().crossVectors(edges[i], edges[(i + 1) % 3]))
    for (const axis of boxAxes) axes.push(new THREE.Vector3().crossVectors(axis, edges[i]))
  }
  return axes.every(overlaps)
}

export function getPromptBoxIntersections(world, box) {
  const inverse = boxFrame(box).invert()
  const halfSize = box.root.scale.clone().multiplyScalar(0.5)
  const found = new Map()
  const eligible = app =>
    app?.isApp &&
    app !== box &&
    !app.destroyed &&
    !app.blueprint?.scene &&
    !app.blueprint?.disabled &&
    !isPromptBox(app.blueprint)
  const check = (app, bounds, matrix) => {
    if (!eligible(app) || found.has(app.data.id)) return
    if (intersectsBounds(bounds, new THREE.Matrix4().multiplyMatrices(inverse, matrix), halfSize)) {
      found.set(app.data.id, app)
    }
  }
  // Reuse mounted geometry and its actual world matrices, but do not prune by
  // picking spheres: those underestimate some sheared bounds.
  const visitOctree = node => {
    for (const item of node.items) {
      const app = item.getEntity()
      if (!eligible(app) || found.has(app.data.id) || item.node?.visible === false || item.node?.opacity === 0) continue
      if (!item.geometry.boundingBox) item.geometry.computeBoundingBox()
      check(app, item.geometry.boundingBox, item.matrix)
    }
    for (const child of node.children) visitOctree(child)
  }
  visitOctree(world.stage.octree.root)
  // These renderers do not participate in the picking octree.
  for (const app of world.entities.items.values()) {
    if (!eligible(app) || found.has(app.data.id)) continue
    const visit = node => {
      if (node.name === 'skinnedmesh' && node.obj) {
        node.obj.traverse(mesh => {
          if (!mesh.isMesh || !mesh.visible) return
          mesh.computeBoundingBox?.()
          if (!mesh.geometry.boundingBox) mesh.geometry.computeBoundingBox()
          check(app, mesh.boundingBox || mesh.geometry.boundingBox, mesh.matrixWorld)
        })
      }
      if (node.name === 'ui' && node.mesh?.visible) {
        if (!node.geometry.boundingBox) node.geometry.computeBoundingBox()
        check(app, node.geometry.boundingBox, node.mesh.matrixWorld)
      }
    }
    app.root.traverse(visit)
    for (const node of app.worldNodes) node.traverse(visit)
  }
  for (const mesh of world.stage.splatMeshes.values()) {
    if (!mesh.isInitialized || !mesh.visible || mesh.opacity === 0) continue
    const app = mesh._hyperfyNode?.ctx.entity
    if (!eligible(app) || found.has(app.data.id)) continue
    // Packed splat geometry is immutable for a mounted mesh; only its world
    // transform changes. Avoid scanning millions of splats on every UI poll.
    if (!splatBounds.has(mesh)) splatBounds.set(mesh, mesh.getBoundingBox(false))
    check(app, splatBounds.get(mesh), mesh.matrixWorld)
  }
  return [...found.values()].sort((a, b) => a.data.id.localeCompare(b.data.id))
}

export function getIntersectionSnapshot(app, box) {
  const { position, quaternion, scale } = app.root
  const appMatrix = new THREE.Matrix4().compose(position, quaternion, scale)
  return {
    entityId: app.data.id,
    blueprintId: app.data.blueprint,
    blueprintVersion: app.blueprint.version,
    name: app.blueprint.name || 'App',
    file: `apps/${encodeURIComponent(app.data.id)}.hyp`,
    position: position.toArray(),
    quaternion: quaternion.toArray(),
    scale: scale.toArray(),
    state: structuredClone(app.data.state || {}),
    editable: !app.blueprint.locked && !app.blueprint.frozen && Math.abs(appMatrix.determinant()) > 1e-12,
    boxLocalMatrix: boxFrame(box).invert().multiply(appMatrix).toArray(),
    // Maps the unit cube into the target app's original local coordinates.
    boxInAppMatrix: appMatrix
      .clone()
      .invert()
      .multiply(new THREE.Matrix4().compose(box.root.position, box.root.quaternion, box.root.scale))
      .toArray(),
  }
}
