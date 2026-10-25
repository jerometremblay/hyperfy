// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/nodes/refs.js
// Reference helpers shared by the script-facing node proxies.
//
// Scripts only ever hold proxies. Host code unwraps a proxy to its node (or a geometry
// value) through `_ref`, which only yields a value while the gate below is open. The gate
// is opened only around getters this module itself created, so a script-defined accessor
// never runs while it is open.

const gate = { open: false }
const nodeRefGetters = new WeakSet() // `_ref` getters created by Node.getProxy()
const valueRefGetters = new WeakSet() // `_ref` getters created by secureRef()
const appProxies = new WeakMap() // host-created app proxy -> resolver for its root node proxy

export function isRefAllowed() {
  return gate.open
}

// Node.getProxy() calls this on its proxy literal. Subclass proxies copy the descriptor,
// which keeps the same getter function, so one registration covers them all.
export function registerNodeRefGetter(proxy) {
  const desc = Object.getOwnPropertyDescriptor(proxy, '_ref')
  if (desc && typeof desc.get === 'function') nodeRefGetters.add(desc.get)
  return proxy
}

// App.getAppProxy() calls this so the app proxy keeps standing in for its root node
// (the app inherits all Node properties).
export function registerAppProxy(proxy, getRootProxy) {
  appProxies.set(proxy, getRootProxy)
  return proxy
}

export function secureRef(obj = {}, resolve) {
  const get = () => (gate.open ? resolve() : null)
  valueRefGetters.add(get)
  obj._isRef = true
  Object.defineProperty(obj, '_ref', { get, enumerable: true, configurable: true })
  return obj
}

function isObjectLike(value) {
  return value !== null && (typeof value === 'object' || typeof value === 'function')
}

// Resolves an object produced by secureRef (e.g. a node's `geometry` getter) to its target.
// The `_ref` descriptor is read once and that same getter is invoked, so the result is the
// value the host getter returned, never the script object. Null for anything else.
export function resolveValueRef(value) {
  if (!isObjectLike(value)) return null
  const desc = Object.getOwnPropertyDescriptor(value, '_ref')
  if (!desc || !valueRefGetters.has(desc.get)) return null
  gate.open = true
  try {
    return { value: desc.get() }
  } finally {
    gate.open = false
  }
}

// Reads the own `_ref` descriptor with the gate closed and invokes the getter only when
// it is one of ours. The gate always closes again, even if the getter throws.
function resolveRef(pNode) {
  const getRootProxy = appProxies.get(pNode)
  if (getRootProxy) pNode = getRootProxy()
  if (!isObjectLike(pNode)) return null
  const desc = Object.getOwnPropertyDescriptor(pNode, '_ref')
  if (!desc || typeof desc.get !== 'function') return null
  const isNode = nodeRefGetters.has(desc.get)
  const isValue = !isNode && valueRefGetters.has(desc.get)
  if (!isNode && !isValue) return null
  gate.open = true
  let value
  try {
    value = desc.get()
  } finally {
    gate.open = false
  }
  if (isNode) {
    // the proxy must be the node's own proxy
    if (!value || typeof value.getProxy !== 'function' || value.getProxy() !== pNode) return null
  }
  return { value, isNode }
}

// Strict, script-facing: the verified node behind a proxy, or null.
export function getNodeRef(pNode) {
  if (!isObjectLike(pNode)) return null
  const ref = resolveRef(pNode)
  return ref && ref.isNode ? ref.value : null
}

// Lenient, host-internal (geometry setters): unwraps a node or value ref and passes
// anything else through unchanged.
export function getRef(pNode) {
  if (!isObjectLike(pNode)) return pNode
  const ref = resolveRef(pNode)
  return ref ? ref.value : pNode
}
