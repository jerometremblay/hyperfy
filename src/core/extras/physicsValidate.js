// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/src/core/extras/physicsValidate.js
// Physics preflight: the values that reach PhysX are checked before any native allocation. A builder script or a
// model file can otherwise hand PhysX an Infinity radius, a NaN or huge scale, a denormal mass or a far controller
// position, and PhysX answers with NaN poses that spread to unrelated actors in the shared scene. A node whose
// inputs fail is skipped (its visual stays) with one warning per node and reason.
import { createLogOnce } from './logOnce.js'

// one window for every length, scale axis and position that reaches PhysX (= PX_MESH_SCALE_MIN/MAX)
export const MIN_LENGTH = 1e-6
export const MAX_LENGTH = 1e6
// below this a mass rounds to 0 with an infinite inverse mass inside PhysX, and a body that hits it goes NaN
export const MIN_MASS = 1e-9

export function finiteNumber(value) {
  return typeof value === 'number' && Number.isFinite(Math.fround(value))
}

// the bounds are compared as float32 too, so 1e-6 and 1e6 themselves are inside (Math.fround(1e-6) < 1e-6)
const MIN_LENGTH_F32 = Math.fround(MIN_LENGTH)
const MAX_LENGTH_F32 = Math.fround(MAX_LENGTH)
const MIN_MASS_F32 = Math.fround(MIN_MASS)

export function lengthOk(value) {
  if (typeof value !== 'number') return false
  const length = Math.abs(Math.fround(value))
  return Number.isFinite(length) && length >= MIN_LENGTH_F32 && length <= MAX_LENGTH_F32
}

// each axis in the length window; a negative axis (a mirror) only when allowed
export function scaleOk(scale, allowNegative = false) {
  for (const axis of [scale.x, scale.y, scale.z]) {
    if (!lengthOk(axis)) return false
    if (!allowNegative && axis < 0) return false
  }
  return true
}

// the physical extent of a mesh: its largest |vertex coordinate| per axis (scanned from the vertices, never from a
// file's bounding box) times the absolute scale
export function extentOk(maxAbs, absScale) {
  if (!maxAbs) return false
  const products = [maxAbs[0] * absScale.x, maxAbs[1] * absScale.y, maxAbs[2] * absScale.z]
  return products.every(value => Number.isFinite(Math.fround(value)) && Math.fround(value) <= MAX_LENGTH_F32)
}

export function positionOk(position) {
  for (const value of [position.x, position.y, position.z]) {
    if (!finiteNumber(value) || Math.abs(Math.fround(value)) > MAX_LENGTH_F32) return false
  }
  return true
}

export function massOk(value) {
  return finiteNumber(value) && (value === 0 || Math.fround(value) >= MIN_MASS_F32)
}

// normalises a quaternion in place; false for a zero, denormal or non-finite length (PhysX turns those into NaN
// poses, and a kinematic target with one spreads NaN to the bodies it touches)
export function normalizeQuat(quat) {
  const length = Math.hypot(quat.x, quat.y, quat.z, quat.w)
  if (!Number.isFinite(length) || length <= MIN_LENGTH) return false
  quat.set(quat.x / length, quat.y / length, quat.z / length, quat.w / length)
  return true
}

// how hard a body can be pushed within one physics step, summed over every call: a velocity change of at most
// MAX_PUSH m/s (and rad/s). Per-call finiteness is not enough: four pushes of 3e38 each pass it and overflow
// together, and float32 rounding of the operands overflows before the product does.
export const MAX_PUSH = 1e6

const f32Length = vector => Math.hypot(Math.fround(vector.x), Math.fround(vector.y), Math.fround(vector.z))

// the velocity change one call causes. In the force and impulse modes PhysX scales by the inverse mass (and, for
// the torque a lever makes, by the inverse inertia); force and acceleration act over a step shorter than a second,
// so treating them like impulse and velocity change only overestimates. `lever` is the distance from the centre
// of mass to the point of application (0 for a plain force); `torque` is a torque vector instead of a force.
export function pushDelta(actor, massModes, { force = null, lever = 0, torque = null }) {
  if (!actor?.getInvMass) return { linear: 0, angular: 0 }
  const invMass = massModes ? actor.getInvMass() : 1
  let invInertia = 1
  if (massModes) {
    const tensor = actor.getMassSpaceInvInertiaTensor()
    invInertia = Math.max(tensor.x, tensor.y, tensor.z)
  }
  const forceLength = force ? f32Length(force) : 0
  const torqueLength = torque ? f32Length(torque) : Math.fround(lever) * forceLength
  return { linear: forceLength * invMass, angular: torqueLength * invInertia }
}

export function geometryOk(pxGeometry) {
  try {
    return globalThis.PHYSX.PxGeometryQuery.prototype.isValid(pxGeometry) === true
  } catch {
    return false
  }
}

const warnNode = createLogOnce(console.warn)

export function warnPhysicsOnce(node, reason, message) {
  warnNode(node, reason, message)
}
