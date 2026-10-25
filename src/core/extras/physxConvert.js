// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/physxConvert.js
import { Vector3 as StockVector3, Quaternion, Matrix4 } from 'three'
import { Vector3Enhanced } from './Vector3Enhanced.js'

const apply = Reflect.apply
const hasInstance = Function.prototype[Symbol.hasInstance]
const enhancedSet = Vector3Enhanced.prototype.set
const stockVec3Set = StockVector3.prototype.set
const quatSet = Quaternion.prototype.set
const decompose = Matrix4.prototype.decompose
const determinant = Matrix4.prototype.determinant

const pos = new StockVector3()
const qua = new Quaternion()
const sca = new StockVector3()
const warnings = new Set()
let pxVec3
let pxExtVec3

export function isVector3(value) {
  return apply(hasInstance, Vector3Enhanced, [value]) || apply(hasInstance, StockVector3, [value])
}

export function isQuaternion(value) {
  return apply(hasInstance, Quaternion, [value])
}

export function isFiniteF32(value) {
  return typeof value === 'number' && Number.isFinite(Math.fround(value))
}

export function readVec3(value, out, message) {
  if (!isVector3(value)) throw new Error(message)
  const x = value.x
  const y = value.y
  const z = value.z
  if (!isFiniteF32(x) || !isFiniteF32(y) || !isFiniteF32(z)) return false
  writeVec3(out, x, y, z)
  return true
}

export function readQuat(value, out, message) {
  if (!isQuaternion(value)) throw new Error(message)
  const x = value.x
  const y = value.y
  const z = value.z
  const w = value.w
  if (!isFiniteF32(x) || !isFiniteF32(y) || !isFiniteF32(z) || !isFiniteF32(w)) return false
  writeQuat(out, x, y, z, w)
  return true
}

export function writeVec3(target, x, y, z) {
  if (apply(hasInstance, Vector3Enhanced, [target])) {
    return apply(enhancedSet, target, [x, y, z])
  }
  if (apply(hasInstance, StockVector3, [target])) {
    return apply(stockVec3Set, target, [x, y, z])
  }
  throw new TypeError('expected Vector3')
}

export function writeQuat(target, x, y, z, w) {
  if (!isQuaternion(target)) throw new TypeError('expected Quaternion')
  return apply(quatSet, target, [x, y, z, w])
}

export function vec3ToPx(value, px) {
  const x = value.x
  const y = value.y
  const z = value.z
  const valid = isFiniteF32(x) && isFiniteF32(y) && isFiniteF32(z)
  px.x = valid ? x : 0
  px.y = valid ? y : 0
  px.z = valid ? z : 0
  return valid
}

export function vec3ToPxPos(value, tm) {
  return vec3ToPx(value, tm.p)
}

export function quatToPxRot(value, tm) {
  const x = value.x
  const y = value.y
  const z = value.z
  const w = value.w
  const valid = isFiniteF32(x) && isFiniteF32(y) && isFiniteF32(z) && isFiniteF32(w)
  const q = tm.q
  q.x = valid ? x : 0
  q.y = valid ? y : 0
  q.z = valid ? z : 0
  q.w = valid ? w : 1
  return valid
}

export function matrixToPxTransform(matrix, tm) {
  for (const value of matrix.elements) if (!isFiniteF32(value)) return false
  const det = apply(determinant, matrix, [])
  if (!Number.isFinite(det) || det === 0) return false
  // Decompose still dispatches to THREE methods internally, with host scratch only.
  apply(decompose, matrix, [pos, qua, sca])
  const x = pos.x
  const y = pos.y
  const z = pos.z
  const qx = qua.x
  const qy = qua.y
  const qz = qua.z
  const qw = qua.w
  if (
    !isFiniteF32(sca.x) ||
    sca.x === 0 ||
    !isFiniteF32(sca.y) ||
    sca.y === 0 ||
    !isFiniteF32(sca.z) ||
    sca.z === 0 ||
    !isFiniteF32(x) ||
    !isFiniteF32(y) ||
    !isFiniteF32(z) ||
    !isFiniteF32(qx) ||
    !isFiniteF32(qy) ||
    !isFiniteF32(qz) ||
    !isFiniteF32(qw)
  )
    return false
  const p = tm.p
  const q = tm.q
  p.x = x
  p.y = y
  p.z = z
  q.x = qx
  q.y = qy
  q.z = qz
  q.w = qw
  return true
}

export function decomposeMatrix(matrix, position, quaternion, scale) {
  return apply(decompose, matrix, [position, quaternion, scale])
}

export function pxToVec3(target, px) {
  return writeVec3(target, px.x, px.y, px.z)
}

export function pxToQuat(target, px) {
  return writeQuat(target, px.x, px.y, px.z, px.w)
}

export function scratchPxVec3() {
  if (!pxVec3) pxVec3 = new globalThis.PHYSX.PxVec3()
  return pxVec3
}

export function scratchPxExtVec3() {
  if (!pxExtVec3) pxExtVec3 = new globalThis.PHYSX.PxExtendedVec3()
  return pxExtVec3
}

export function warnOnce(key, message = key) {
  if (warnings.has(key)) return
  warnings.add(key)
  console.warn(message)
}
