import fs from 'node:fs/promises'
import path from 'node:path'
import { assertKey, validateTransform } from './canonical.mjs'
import { assertSafeDirectory, readBoundedFile, resolveLocalReference } from './paths.mjs'

const SCENE_FIELDS = new Set(['schemaVersion', 'sceneKey', 'title', 'environment', 'settingsFile', 'instances'])
const SETTINGS_FIELDS = new Set([
  'schemaVersion',
  'title',
  'description',
  'desc',
  'image',
  'avatar',
  'dayNightCycle',
  'constellationLines',
  'skyAppearance',
  'bortleClass',
  'latitude',
  'longitude',
  'timeZone',
  'spawn',
])
const INSTANCE_FIELDS = new Set(['key', 'object', 'position', 'quaternion', 'scale', 'pinned'])

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function validateSettings(settings, sceneKey) {
  if (!isObject(settings)) throw new Error('settings for scene ' + sceneKey + ' must be a JSON object')
  for (const field of Object.keys(settings)) {
    if (!SETTINGS_FIELDS.has(field)) {
      throw new Error('settings field ' + field + ' is not in the portable allowlist')
    }
  }
  if (settings.schemaVersion !== undefined && settings.schemaVersion !== 1) {
    throw new Error('settings.schemaVersion must be 1 when present')
  }
  if (Object.hasOwn(settings, 'desc') && Object.hasOwn(settings, 'description')) {
    throw new Error('settings must use desc or description, not both')
  }
  if (settings.description !== undefined) {
    settings.desc = settings.description
    delete settings.description
  }
  delete settings.schemaVersion
  if (settings.title !== undefined && settings.title !== null && typeof settings.title !== 'string') {
    throw new Error('settings.title must be a string or null')
  }
  if (settings.desc !== undefined && settings.desc !== null && typeof settings.desc !== 'string') {
    throw new Error('settings.desc must be a string or null')
  }
  if (settings.latitude !== undefined && (!Number.isFinite(settings.latitude) || Math.abs(settings.latitude) > 90)) {
    throw new Error('settings.latitude must be between -90 and 90')
  }
  if (settings.longitude !== undefined && (!Number.isFinite(settings.longitude) || Math.abs(settings.longitude) > 180)) {
    throw new Error('settings.longitude must be between -180 and 180')
  }
  if (settings.dayNightCycle !== undefined && typeof settings.dayNightCycle !== 'boolean') {
    throw new Error('settings.dayNightCycle must be a boolean')
  }
  if (settings.constellationLines !== undefined && typeof settings.constellationLines !== 'boolean') {
    throw new Error('settings.constellationLines must be a boolean')
  }
  if (settings.timeZone !== undefined && settings.timeZone !== null && typeof settings.timeZone !== 'string') {
    throw new Error('settings.timeZone must be a string or null')
  }
  for (const field of ['skyAppearance', 'bortleClass']) {
    if (settings[field] !== undefined && !Number.isFinite(settings[field])) {
      throw new Error('settings.' + field + ' must be a finite number')
    }
  }
  if (settings.spawn !== undefined) {
    if (
      !isObject(settings.spawn) ||
      Object.keys(settings.spawn).some(field => !['position', 'quaternion'].includes(field)) ||
      !Array.isArray(settings.spawn.position) ||
      settings.spawn.position.length !== 3 ||
      !settings.spawn.position.every(Number.isFinite)
    ) {
      throw new Error('settings.spawn must contain a finite position and unit quaternion')
    }
    const spawn = { key: 'spawn', ...settings.spawn, scale: [1, 1, 1], pinned: false }
    validateTransform(spawn)
  }
  for (const field of ['image', 'avatar']) {
    const value = settings[field]
    if (value !== undefined && (!isObject(value) || typeof value.url !== 'string')) {
      throw new Error('settings.' + field + ' must be an asset descriptor with a url')
    }
  }
  return settings
}

export async function loadScene(root, sceneKey) {
  assertKey(sceneKey, 'scene key')
  const sceneDir = path.join(root, 'scenes', ...sceneKey.split('/'))
  await assertSafeDirectory(root, sceneDir, 'scene directory')
  const manifestPath = path.join(sceneDir, 'scene.json')
  const sceneBytes = await readBoundedFile(manifestPath, { maxBytes: 4 * 1024 * 1024, label: manifestPath })
  let scene
  try {
    scene = JSON.parse(sceneBytes.toString('utf8'))
  } catch (error) {
    throw new Error('Invalid JSON in ' + manifestPath + ': ' + error.message)
  }
  if (!isObject(scene)) throw new Error(manifestPath + ' must contain a JSON object')
  for (const field of Object.keys(scene)) {
    if (!SCENE_FIELDS.has(field)) throw new Error(manifestPath + ' has unsupported field ' + field)
  }
  if (scene.schemaVersion !== 1) throw new Error(manifestPath + ' schemaVersion must be 1')
  if (scene.sceneKey !== sceneKey) throw new Error(manifestPath + ' sceneKey does not match its path')
  if (scene.title !== undefined && (typeof scene.title !== 'string' || scene.title.length > 256)) {
    throw new Error(manifestPath + ' title must be a string of at most 256 characters')
  }
  if (scene.environment !== undefined) assertKey(scene.environment, manifestPath + ' environment')
  if (!Array.isArray(scene.instances)) throw new Error(manifestPath + ' instances must be an array')
  const instanceKeys = new Set()
  for (const [index, instance] of scene.instances.entries()) {
    if (!isObject(instance)) throw new Error(manifestPath + ' instances[' + index + '] must be an object')
    for (const field of Object.keys(instance)) {
      if (!INSTANCE_FIELDS.has(field)) throw new Error(manifestPath + ' instances[' + index + '] has unsupported field ' + field)
    }
    assertKey(instance.key, manifestPath + ' instances[' + index + '] key')
    assertKey(instance.object, manifestPath + ' instances[' + index + '] object')
    if (instanceKeys.has(instance.key)) throw new Error('Duplicate instance key: ' + instance.key)
    instanceKeys.add(instance.key)
    validateTransform(instance)
  }
  const settingsFile = scene.settingsFile || 'settings.json'
  const settingsPath = await resolveLocalReference(root, sceneDir, 'file:./' + settingsFile, 'scene settingsFile')
  const settingsBytes = await readBoundedFile(settingsPath.absolutePath, {
    maxBytes: 1024 * 1024,
    label: settingsPath.relativePath,
  })
  let settings
  try {
    settings = JSON.parse(settingsBytes.toString('utf8'))
  } catch (error) {
    throw new Error('Invalid JSON in ' + settingsPath.relativePath + ': ' + error.message)
  }
  validateSettings(settings, sceneKey)
  return {
    scene,
    sceneBytes,
    sceneDir,
    settings,
    settingsBytes,
    settingsPath: settingsPath.relativePath,
  }
}

export { validateSettings }
