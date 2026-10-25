// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/chatPolicy.js
// Shared chat validation. Client-sent messages use the text-only sanitizer; producer envelopes also keep
// bounded metadata. The server stamps the id, sender identity and time on messages received from clients.
import { isPlainObject, sanitizeName } from './entityModifyPolicy.js'

export const CHAT_BODY_MAX_LENGTH = 500

const segmenter = typeof Intl?.Segmenter === 'function' ? new Intl.Segmenter() : null

// `text` cut to at most `max` UTF-16 units without splitting a grapheme (an emoji with modifiers, a flag, a
// ZWJ family), or a surrogate pair where the runtime has no segmenter. the work is O(max) however long the
// text: a cluster that crosses `max` still crosses it in the slice, and cutting never moves a boundary earlier.
// the slice carries two extra units so a pair that starts at `max` is seen whole
export function cutText(text, max) {
  if (text.length <= max) return text
  if (segmenter) {
    let end = 0
    for (const { index, segment } of segmenter.segment(text.slice(0, max + 2))) {
      if (index + segment.length > max) break
      end = index + segment.length
    }
    if (end > 0) return text.slice(0, end)
  }
  // no segmenter, or a single cluster longer than max: cut at max, stepping back off a high surrogate
  const code = text.charCodeAt(max - 1)
  return text.slice(0, code >= 0xd800 && code <= 0xdbff ? max - 1 : max)
}

// `body` must be text: trimmed, cut to CHAT_BODY_MAX_LENGTH, non-empty. each property is read once, so the
// value checked is the value kept
export function sanitizeChatMessage(msg) {
  if (!isPlainObject(msg)) return null
  const body = msg.body
  if (typeof body !== 'string') return null
  const text = cutText(body.trim(), CHAT_BODY_MAX_LENGTH).trimEnd()
  if (!text) return null
  return { body: text }
}

export function chatEnvelope(msg) {
  if (!isPlainObject(msg)) return null
  const body = msg.body
  const safe = sanitizeChatMessage({ body: typeof body === 'number' ? String(body) : body })
  if (!safe) return null
  for (const key of ['id', 'fromId', 'createdAt']) {
    const value = msg[key]
    if (typeof value === 'string') safe[key] = cutText(value, 64)
  }
  const from = sanitizeName(msg.from)
  if (from !== undefined) safe.from = from
  return safe
}
