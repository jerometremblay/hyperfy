// Hyperfy primitive-only app template.
// Coordinate system: +Y up, +X right, -Z forward.
//
// Transform-safe physics is the default: if a primitive is created with
// { physics: 'static' | 'kinematic' | 'dynamic' }, the visible primitive stays
// attached to the app, while an invisible exact primitive collider is detached
// into world space with world.add(). Its transform follows the app and its PhysX
// geometry is rebuilt whenever scale changes, including non-uniform builder scale.

app.resetOnMove = false

const PHYSICS_KEYS = [
  'mass',
  'linearDamping',
  'angularDamping',
  'staticFriction',
  'dynamicFriction',
  'restitution',
  'layer',
  'trigger',
  'tag',
  'onContactStart',
  'onContactEnd',
  'onTriggerEnter',
  'onTriggerLeave',
]

function rebuildPhysics(prim) {
  const physics = prim.physics
  if (!physics) return
  prim.physics = null
  prim.physics = physics
}

function pickPhysicsOptions(extra) {
  const out = {}
  for (const key of PHYSICS_KEYS) {
    if (extra[key] !== undefined) out[key] = extra[key]
  }
  return out
}

function exactWorldTransform(node) {
  const position = node.position.clone().multiply(app.scale).applyQuaternion(app.quaternion).add(app.position)
  const quaternion = app.quaternion.clone().multiply(node.quaternion)
  const scale = node.scale.clone().multiply(app.scale)
  return { position, quaternion, scale }
}

function attachTransformSafePhysics(node, type, size, physics, extra = {}) {
  const initial = exactWorldTransform(node)
  const collider = app.create('prim', {
    type,
    size,
    position: initial.position.toArray(),
    quaternion: initial.quaternion.toArray(),
    scale: initial.scale.toArray(),
    opacity: 0,
    castShadow: false,
    receiveShadow: false,
    physics,
    ...pickPhysicsOptions(extra),
  })

  // world.add() activates the collider outside the app's moving context, so
  // Hyperfy is allowed to mount/rebuild its PhysX shape while the app is selected.
  world.add(collider)

  const lastScale = initial.scale.clone()

  function syncCollider() {
    const t = exactWorldTransform(node)
    const scaleChanged = !lastScale.equals(t.scale)

    collider.position.copy(t.position)
    collider.quaternion.copy(t.quaternion)
    collider.scale.copy(t.scale)

    if (scaleChanged) {
      lastScale.copy(t.scale)
      rebuildPhysics(collider)
    }
  }

  app.on('update', syncCollider)
  app.on('destroy', () => world.remove(collider))
  return collider
}

function prim(type, size, position, color, rotation = [0, 0, 0], extra = {}) {
  const { physics = null, ...visualExtra } = extra
  const node = app.create('prim', {
    type,
    size,
    position,
    rotation,
    color,
    castShadow: true,
    receiveShadow: true,
    roughness: 0.68,
    metalness: 0.08,
    ...visualExtra,
    // Never mount physics on the app-attached visual primitive by default.
    physics: null,
  })
  app.add(node)

  if (physics) attachTransformSafePhysics(node, type, size, physics, extra)
  return node
}

const box = (size, pos, color, rot = [0, 0, 0], extra = {}) => prim('box', size, pos, color, rot, extra)
const sphere = (r, pos, color, extra = {}) => prim('sphere', [r], pos, color, [0, 0, 0], extra)
const cylinder = (rt, rb, h, pos, color, rot = [0, 0, 0], extra = {}) => prim('cylinder', [rt, rb, h], pos, color, rot, extra)
const cone = (r, h, pos, color, rot = [0, 0, 0], extra = {}) => prim('cone', [r, h], pos, color, rot, extra)
const torus = (r, tube, pos, color, rot = [0, 0, 0], extra = {}) => prim('torus', [r, tube], pos, color, rot, extra)

// Copy the endpoint helpers from templates/orientation_helpers.js for diagonal members.
// The sample keeps collision enabled so the transform-safe path is exercised by default.
box([1, 1, 1], [0, 0.5, 0], '#7f8c8d', [0, 0, 0], { physics: 'static' })
