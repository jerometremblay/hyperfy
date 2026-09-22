export function normalizeWebURL(value, label = 'URL') {
  const input = typeof value === 'string' ? value.trim() : ''
  if (!input) throw new Error(`${label} must be absolute`)

  let candidate = input
  if (input.startsWith('//')) {
    candidate = `https:${input}`
  } else if (!/^https?:\/\//i.test(input)) {
    if (/^[a-z][a-z\d+.-]*:/i.test(input)) throw new Error(`${label} must use http or https`)
    candidate = `https://${input}`
  }

  let url
  try {
    url = new URL(candidate)
  } catch {
    throw new Error(`${label} must be absolute`)
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new Error(`${label} must use http or https`)
  }
  return url.toString()
}
