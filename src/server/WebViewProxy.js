import { lookup } from 'node:dns/promises'
import net from 'node:net'

import { normalizeWebURL } from './webURL.js'

const MAX_RESPONSE_BYTES = 20 * 1024 * 1024
const MAX_REDIRECTS = 5
const REQUEST_TIMEOUT = 15000
const PROXY_PATH = '/api/webview/proxy'

export async function proxyWebViewRequest(value, fetchImpl = globalThis.fetch, lookupImpl = lookup) {
  if (typeof fetchImpl !== 'function') throw new Error('WebView proxy requires fetch')
  const targetURL = normalizeWebURL(value, 'WebView URL')
  await assertSafeWebURL(targetURL, lookupImpl)

  const { response, url } = await fetchWithRedirects(targetURL, fetchImpl, lookupImpl)
  const contentType = response.headers.get('content-type') || 'application/octet-stream'
  const body = await readResponseBody(response)
  const textType = contentType.toLowerCase()

  let output = body
  if (textType.includes('text/html') || textType.includes('application/xhtml+xml')) {
    output = Buffer.from(rewriteWebViewDocument(body.toString('utf8'), url), 'utf8')
  } else if (textType.includes('text/css')) {
    output = Buffer.from(rewriteWebViewStylesheet(body.toString('utf8'), url), 'utf8')
  }

  return {
    status: response.status,
    contentType,
    body: output,
  }
}

export function rewriteWebViewDocument(html, baseURL, proxyPath = PROXY_PATH) {
  let rewritten = html
    .replace(/<base\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*http-equiv\s*=\s*(["']?)content-security-policy(?:-report-only)?\1[^>]*>/gi, '')
    .replace(
      /(\s(?:src|href|action|poster|cite|formaction)\s*=\s*)(["'])(.*?)\2/gi,
      (match, prefix, quote, value) => {
        const url = toProxyURL(value, baseURL, proxyPath)
        return `${prefix}${quote}${escapeAttribute(url)}${quote}`
      }
    )

  const baseTag = `<base href="${escapeAttribute(baseURL)}">`
  if (/<head\b[^>]*>/i.test(rewritten)) {
    rewritten = rewritten.replace(/(<head\b[^>]*>)/i, `$1${baseTag}`)
  } else {
    rewritten = `${baseTag}${rewritten}`
  }
  return rewritten
}

export function rewriteWebViewStylesheet(css, baseURL, proxyPath = PROXY_PATH) {
  return css.replace(/url\(\s*(["']?)(.*?)\1\s*\)/gi, (match, quote, value) => {
    const url = toProxyURL(value, baseURL, proxyPath)
    return `url(${quote}${escapeAttribute(url)}${quote})`
  })
}

async function assertSafeWebURL(value, lookupImpl = lookup) {
  const url = new URL(value)
  if (url.username || url.password) throw new Error('WebView URL must not contain credentials')

  const hostname = url.hostname.toLowerCase().replace(/^\[|\]$/g, '').replace(/\.$/, '')
  if (isBlockedHostname(hostname)) throw new Error('WebView URL must target a public host')

  const ipVersion = net.isIP(hostname)
  if (ipVersion) {
    if (isPrivateIPAddress(hostname, ipVersion)) throw new Error('WebView URL must target a public host')
    return
  }

  const addresses = await lookupImpl(hostname, { all: true, verbatim: true })
  if (!addresses.length || addresses.some(address => isPrivateIPAddress(address.address, address.family))) {
    throw new Error('WebView URL must target a public host')
  }
}

function isBlockedHostname(hostname) {
  return (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === 'metadata.google.internal' ||
    hostname === 'metadata.google'
  )
}

function isPrivateIPAddress(value, family) {
  if (family === 4 || net.isIP(value) === 4) {
    const octets = value.split('.').map(Number)
    if (octets.length !== 4 || octets.some(octet => !Number.isInteger(octet) || octet < 0 || octet > 255)) return true
    const [first, second] = octets
    return (
      first === 0 ||
      first === 10 ||
      first === 127 ||
      (first === 100 && second >= 64 && second <= 127) ||
      (first === 169 && second === 254) ||
      (first === 172 && second >= 16 && second <= 31) ||
      (first === 192 && second === 0) ||
      (first === 192 && second === 168) ||
      (first === 198 && second >= 18 && second <= 19) ||
      (first === 198 && second === 51) ||
      (first === 203 && second === 0) ||
      first >= 224
    )
  }

  const normalized = value.toLowerCase()
  if (normalized === '::' || normalized === '::1') return true
  if (normalized.startsWith('fc') || normalized.startsWith('fd') || normalized.startsWith('fe8') || normalized.startsWith('fe9')) return true
  if (normalized.startsWith('fea') || normalized.startsWith('feb') || normalized.startsWith('2001:db8:')) return true

  const mappedIPv4 = normalized.match(/::ffff:(\d+\.\d+\.\d+\.\d+)$/)
  return mappedIPv4 ? isPrivateIPAddress(mappedIPv4[1], 4) : false
}

function toProxyURL(value, baseURL, proxyPath) {
  const input = value.trim()
  if (!input || input.startsWith('#') || /^(?:data|blob|javascript|mailto|tel|about):/i.test(input)) return value

  let resolved
  try {
    resolved = new URL(input, baseURL)
  } catch {
    return value
  }
  if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return value
  return `${proxyPath}?url=${encodeURIComponent(resolved.toString())}`
}

function escapeAttribute(value) {
  return value.replaceAll('&', '&amp;').replaceAll('"', '&quot;')
}

async function fetchWithRedirects(initialURL, fetchImpl, lookupImpl) {
  let url = initialURL
  for (let redirects = 0; redirects <= MAX_REDIRECTS; redirects++) {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT)
    let response
    try {
      response = await fetchImpl(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: { 'user-agent': 'Hyperfy WebView proxy' },
      })
    } finally {
      clearTimeout(timeout)
    }

    const location = response.headers.get('location')
    if (location && response.status >= 300 && response.status < 400) {
      if (redirects === MAX_REDIRECTS) throw new Error('WebView proxy followed too many redirects')
      url = normalizeWebURL(new URL(location, url).toString(), 'WebView URL')
      await assertSafeWebURL(url, lookupImpl)
      continue
    }
    return { response, url }
  }
  throw new Error('WebView proxy followed too many redirects')
}

async function readResponseBody(response) {
  const declaredLength = Number(response.headers.get('content-length'))
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    throw new Error('WebView proxy response is too large')
  }
  if (!response.body) return Buffer.alloc(0)

  const reader = response.body.getReader()
  const chunks = []
  let total = 0
  let result = await reader.read()
  while (!result.done) {
    total += result.value.byteLength
    if (total > MAX_RESPONSE_BYTES) {
      await reader.cancel()
      throw new Error('WebView proxy response is too large')
    }
    chunks.push(Buffer.from(result.value))
    result = await reader.read()
  }
  return Buffer.concat(chunks, total)
}
