import { createHash } from 'node:crypto'

const KEY = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/

export function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0
}

export function assertKey(value, label = 'key') {
  if (typeof value !== 'string' || !KEY.test(value)) {
    throw new Error(label + ' must be lowercase path segments using letters, numbers, and hyphens')
  }
  return value
}

export function sortValue(value) {
  if (Array.isArray(value)) return value.map(sortValue)
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, sortValue(value[key])]))
  }
  return value
}

export function stableJson(value) {
  return JSON.stringify(sortValue(value), null, 2) + '\n'
}

export function sha256(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function normalizeQuaternion(value, label = 'quaternion') {
  if (
    !Array.isArray(value) ||
    value.length !== 4 ||
    !value.every(Number.isFinite) ||
    Math.abs(Math.hypot(...value) - 1) > 0.001
  ) {
    throw new Error(label + ' must be a finite unit quaternion [x, y, z, w]')
  }
  const normalized = value.map(component => (Object.is(component, -0) ? 0 : component))
  const first = normalized.find(component => component !== 0)
  return first < 0
    ? normalized.map(component => (component === 0 ? 0 : -component))
    : normalized
}

export function validateTransform(instance) {
  for (const [field, length] of [
    ['position', 3],
    ['quaternion', 4],
    ['scale', 3],
  ]) {
    const value = instance[field]
    if (!Array.isArray(value) || value.length !== length || !value.every(Number.isFinite)) {
      throw new Error('instance ' + instance.key + ' has an invalid ' + field)
    }
  }
  normalizeQuaternion(instance.quaternion, 'instance ' + instance.key + ' quaternion')
  if (instance.scale.some(component => component <= 0)) {
    throw new Error('instance ' + instance.key + ' scale values must be positive')
  }
  if (typeof instance.pinned !== 'boolean') {
    throw new Error('instance ' + instance.key + ' pinned must be a boolean')
  }
}

export function canonicalScene(scene) {
  return {
    ...scene,
    instances: scene.instances
      .map(instance => ({
        ...instance,
        quaternion: normalizeQuaternion(instance.quaternion, 'instance ' + instance.key + ' quaternion'),
      }))
      .sort((left, right) => compareText(left.key, right.key)),
  }
}
