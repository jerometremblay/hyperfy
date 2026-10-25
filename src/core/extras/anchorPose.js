// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/anchorPose.js
import { Matrix4, Quaternion, Vector3 } from 'three'
import { TRANSFORM_LIMIT } from './entityModifyPolicy.js'

const matrix = new Matrix4()
const position = new Vector3()
const quaternion = new Quaternion()
const scale = new Vector3()

// Validate into scratch so a rejected anchor leaves both outputs untouched.
export function readAnchorPose(value, outPosition, outQuaternion) {
  const elements = value.elements
  for (let i = 0; i < 16; i++) {
    const v = elements[i]
    if (!Number.isFinite(v)) return false
    matrix.elements[i] = v
  }
  const e = matrix.elements
  const sx = Math.hypot(e[0], e[1], e[2])
  const sy = Math.hypot(e[4], e[5], e[6])
  const sz = Math.hypot(e[8], e[9], e[10])
  if (!Number.isFinite(sx) || sx <= 0 || !Number.isFinite(sy) || sy <= 0 || !Number.isFinite(sz) || sz <= 0)
    return false
  const determinant = matrix.determinant()
  if (!Number.isFinite(determinant) || Math.abs(determinant) / (sx * sy * sz) < 1e-6) return false
  matrix.decompose(position, quaternion, scale)
  if (
    !Number.isFinite(position.x) ||
    Math.abs(position.x) > TRANSFORM_LIMIT ||
    !Number.isFinite(position.y) ||
    Math.abs(position.y) > TRANSFORM_LIMIT ||
    !Number.isFinite(position.z) ||
    Math.abs(position.z) > TRANSFORM_LIMIT ||
    !Number.isFinite(scale.x) ||
    scale.x === 0 ||
    !Number.isFinite(scale.y) ||
    scale.y === 0 ||
    !Number.isFinite(scale.z) ||
    scale.z === 0
  )
    return false
  const n = Math.hypot(quaternion.x, quaternion.y, quaternion.z, quaternion.w)
  if (!Number.isFinite(n) || n === 0) return false
  quaternion.set(quaternion.x / n, quaternion.y / n, quaternion.z / n, quaternion.w / n)
  outPosition.copy(position)
  outQuaternion.copy(quaternion)
  return true
}
