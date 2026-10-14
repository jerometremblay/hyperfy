const aliases = {
  a: 'aa',
  i: 'ih',
  u: 'ou',
  e: 'ee',
  o: 'oh',
  joy: 'happy',
  sorrow: 'sad',
  fun: 'relaxed',
  blink_l: 'blinkLeft',
  blink_r: 'blinkRight',
}
export const EXPRESSION_NAMES = [
  'blink',
  'blinkLeft',
  'blinkRight',
  'aa',
  'ih',
  'ou',
  'ee',
  'oh',
  'happy',
  'angry',
  'sad',
  'relaxed',
  'surprised',
  'neutral',
  'lookUp',
  'lookDown',
  'lookLeft',
  'lookRight',
]
const names = new Map(EXPRESSION_NAMES.map(name => [name.toLowerCase(), name]))
export function normalizeExpression(name) {
  if (typeof name !== 'string') return null
  const lower = name.toLowerCase()
  return aliases[lower] || names.get(lower) || null
}
export function validateExpressionRequest(request) {
  if (!request || typeof request !== 'object') return null
  if (request.clear === true) return { clear: true }
  const name = normalizeExpression(request.name)
  const { weight, duration } = request
  if (!name || !Number.isFinite(weight) || weight < 0 || weight > 1) return null
  if (duration !== undefined && (!Number.isFinite(duration) || duration < 0)) return null
  return { name, weight, duration }
}

// Server-owned state also lives in entity.data, so snapshots include active weights.
export function applyPlayerExpression(player, request) {
  request = validateExpressionRequest(request)
  if (!request) return false
  const now = Date.now()
  if (!player.expressionWindow || now - player.expressionWindow.start >= 1000) {
    player.expressionWindow = { start: now, count: 0 }
  }
  if (++player.expressionWindow.count > 20) return false
  player.expressionTimers ||= new Map()
  const publish = weights => {
    player.modify({ x: weights })
    player.world.network.send('entityModified', { id: player.data.id, x: weights })
  }
  if (request.clear) {
    for (const timer of player.expressionTimers.values()) clearTimeout(timer)
    player.expressionTimers.clear()
    if (Object.keys(player.data.x || {}).length) publish({})
    return true
  }
  const { name, weight, duration } = request
  clearTimeout(player.expressionTimers.get(name))
  player.expressionTimers.delete(name)
  const weights = { ...player.data.x }
  if (weight) weights[name] = weight
  else delete weights[name]
  if ((player.data.x?.[name] || 0) !== weight) publish(weights)
  if (weight && duration !== undefined) {
    player.expressionTimers.set(
      name,
      setTimeout(
        () => {
          player.expressionTimers.delete(name)
          const weights = { ...player.data.x }
          delete weights[name]
          publish(weights)
        },
        Math.min(duration * 1000, 2147483647)
      )
    )
  }
  return true
}
