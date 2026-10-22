import { cloneDeep, isEqual } from 'lodash-es'

export function canonical(value) {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .filter(key => value[key] !== undefined)
      .map(key => `${JSON.stringify(key)}:${canonical(value[key])}`)
      .join(',')}}`
  }
  return JSON.stringify(value)
}

export function implementationDescriptor(blueprint) {
  return Object.fromEntries(
    ['model', 'script', 'preload', 'public', 'locked', 'frozen', 'unique', 'disabled'].map(key => [
      key,
      ['model', 'script'].includes(key) ? (blueprint[key] ?? null) : !!blueprint[key],
    ])
  )
}

// Runtime state changes during ordinary execution are not implementation edits.
export function publishedExpectation(app, blueprints) {
  const bp = blueprints.get(app.data.blueprint)
  return canonical({
    blueprint: bp,
    published: app.data.published ?? null,
    revision: app.data.publishedRevision || 0,
    position: app.data.position,
    quaternion: app.data.quaternion,
    scale: app.data.scale,
    pinned: app.data.pinned,
    mover: app.data.mover ?? null,
    uploader: app.data.uploader ?? null,
  })
}

export function compatible(value, next) {
  if (value === null || next === null) return value === next
  if (Array.isArray(next))
    return Array.isArray(value) && value.every(item => next.length === 0 || compatible(item, next[0]))
  if (typeof value !== typeof next) return false
  if (typeof next !== 'object') return typeof value !== 'number' || Number.isFinite(value)
  if (next.url)
    return (
      typeof value.url === 'string' &&
      value.type === next.type &&
      /^asset:\/\/[a-zA-Z0-9_-]+\.[a-z0-9]+$/.test(value.url)
    )
  return (
    Object.keys(value).every(key => Object.hasOwn(next, key) && compatible(value[key], next[key])) &&
    Object.keys(next).every(key => Object.hasOwn(value, key))
  )
}

export function mergePublishedProps(current, baseline, defaults) {
  const props = cloneDeep(defaults)
  const reset = []
  for (const key of Object.keys(current || {})) {
    if (!Object.hasOwn(defaults, key)) {
      reset.push(key)
      continue
    }
    const override = baseline == null || (Object.hasOwn(baseline, key) && !isEqual(current[key], baseline[key]))
    if (!override) continue
    if (compatible(current[key], defaults[key])) props[key] = cloneDeep(current[key])
    else reset.push(key)
  }
  return { props, reset }
}

export function publishedStatus(published, source) {
  if (!published) return 'local'
  if (source?.checking) return 'checking'
  if (source?.error) return 'check-failed'
  if (!published.verified) return 'unverified'
  if (!source?.hash) return 'checking'
  return source.hash === published.installedHash ? 'current' : 'update-available'
}
