// A small native collision shell, independent of decorative mesh detail.
const collisionTag = `office-${OBJECT_NAME}:${app.instanceId}`
const collisionShapes = []
function collisionBox(size, position, name, parent = app, rotation = [0, 0, 0]) {
  const shape = app.create('prim', {
    id: `${OBJECT_NAME}:collision:${name}`, type: 'box', size, position, rotation,
    opacity: 0, physics: OBJECT_NAME === 'chair' ? 'kinematic' : 'static',
    // Native controller queries require the solid layer's reciprocal player
    // mask; the prop layer in this runtime deliberately excludes players.
    layer: 'environment', tag: collisionTag, castShadow: false, receiveShadow: false,
    staticFriction: 0.7, dynamicFriction: 0.5,
  })
  parent.add(shape)
  collisionShapes.push(shape)
}
let floorDestroyed = false
let watchingPlacement = false
let chairIsOccupied = () => false
let chairWasMoved = () => {}
if (!world.isPreview) {
  app.on('transform', changed => {
    if (!changed.scale) return
    // Native actor movement updates its pose, not its PhysX shape dimensions.
    // Rebuild the small collision shell once when the builder changes scale.
    for (const shape of collisionShapes) {
      const physics = shape.physics
      if (!physics) continue
      shape.physics = null
      shape.physics = physics
    }
  })
  const floorMask = world.createLayerMask('environment')
  const down = new Vector3(0, -1, 0)
  // Search through sloping roof faces, but support furniture on a level floor.
  function floorUnder(position, above = 0.5, distance = 20) {
    const origin = position.clone()
    origin.y += above
    for (let i = 0; i < 8 && distance > 0; i++) {
      const hit = world.raycast(origin, down, distance, floorMask)
      if (!hit) return null
      const furniture = typeof hit.tag === 'string' && hit.tag.startsWith('office-')
      if (!furniture && hit.normal.y > 0.95) return hit.point.clone()
      const travelled = hit.distance + 0.01
      origin.y -= travelled
      distance -= travelled
    }
    return null
  }
  function groundFurniture() {
    if (floorDestroyed || app.isMoving || chairIsOccupied()) return
    // The solid chair base can contain the downward ray's origin. Remove this
    // small shell synchronously for this one placement query, then restore it.
    // This happens after placement, never during an idle frame or a ride.
    const active = collisionShapes.map(shape => shape.active)
    collisionShapes.forEach(shape => { shape.active = false })
    let floor
    try {
      floor = floorUnder(app.position)
    } finally {
      collisionShapes.forEach((shape, i) => { shape.active = active[i] })
    }
    if (!floor) return
    const position = app.position.clone()
    position.y = floor.y + 0.002
    // Furniture rests upright; retain the yaw selected with the builder.
    const forward = new Vector3(0, 0, -1).applyQuaternion(app.quaternion)
    const yaw = Math.atan2(-forward.x, -forward.z)
    const quaternion = new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), yaw)
    if (position.distanceTo(app.position) < 0.0001 &&
        1 - Math.abs(quaternion.dot(app.quaternion)) < 0.00001) return
    app.setTransform(position, quaternion)
  }
  function placementFinished() {
    if (app.isMoving) return
    app.off('update', placementFinished)
    watchingPlacement = false
    // Native collider reactivation/transform commit precedes the floor query.
    setTimeout(groundFurniture, 0)
  }
  if (world.isServer) {
    app.on('transform', () => {
      if (app.isMoving) {
        chairWasMoved()
        if (!watchingPlacement) {
          watchingPlacement = true
          app.on('update', placementFinished)
        }
      } else if (!chairIsOccupied()) {
        setTimeout(groundFurniture, 0)
      }
    })
    setTimeout(groundFurniture, 0)
    // Also cover an app initially loaded during a builder move.
    if (app.isMoving) {
      watchingPlacement = true
      app.on('update', placementFinished)
    }
  }
  app.on('destroy', () => {
    floorDestroyed = true
    app.off('update', placementFinished)
  })
}
