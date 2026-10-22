import https from 'node:https'
import { lookup } from 'node:dns/promises'
import { isIP, BlockList } from 'node:net'
import { createHash } from 'node:crypto'
import { importApp } from '../core/extras/appTools'

export const digest = bytes => `sha256:${createHash('sha256').update(bytes).digest('hex')}`
const forbidden = new BlockList()
for (const [ip, prefix] of [
  ['0.0.0.0', 8],
  ['10.0.0.0', 8],
  ['100.64.0.0', 10],
  ['127.0.0.0', 8],
  ['169.254.0.0', 16],
  ['172.16.0.0', 12],
  ['192.0.0.0', 24],
  ['192.0.2.0', 24],
  ['192.88.99.0', 24],
  ['192.168.0.0', 16],
  ['198.18.0.0', 15],
  ['198.51.100.0', 24],
  ['203.0.113.0', 24],
  ['224.0.0.0', 3],
])
  forbidden.addSubnet(ip, prefix, 'ipv4')
for (const [ip, prefix] of [
  ['2001::', 23],
  ['2001:db8::', 32],
  ['2002::', 16],
  ['3fff::', 20],
])
  forbidden.addSubnet(ip, prefix, 'ipv6')
export function publicAddress(address) {
  const family = isIP(address)
  if (family === 4) return !forbidden.check(address, 'ipv4')
  if (family === 6) return /^[23]/i.test(address) && !forbidden.check(address, 'ipv6')
  return false
}
export function sourceURL(input) {
  if (typeof input !== 'string' || input.length > 2048) throw new Error('Enter one public HTTPS .hyp URL.')
  const url = new URL(input)
  if (
    url.protocol !== 'https:' ||
    url.username ||
    url.password ||
    isIP(url.hostname.replace(/^\[|\]$/g, '')) ||
    (url.port && url.port !== '443')
  )
    throw new Error('Use a public HTTPS hostname without credentials or a custom port.')
  url.hash = ''
  return url.href
}
const types = {
  model: ['glb'],
  avatar: ['vrm'],
  script: ['js'],
  texture: ['png', 'jpg', 'jpeg', 'webp', 'ktx2'],
  image: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'],
  emote: ['glb'],
  hdr: ['hdr'],
  audio: ['mp3', 'wav', 'ogg', 'm4a'],
  video: ['mp4', 'webm'],
  splat: ['ply', 'splat', 'ksplat', 'spz'],
}
const assetURL = /^asset:\/\/([a-f0-9]{64})\.([a-z0-9]+)$/
export async function validatePublishedPackage(bytes, maxBytes) {
  if (bytes.length > maxBytes) throw new Error('Package exceeds the download/upload limit.')
  if (bytes.length < 4 || bytes.readUInt32LE(0) > 1024 * 1024) throw new Error('Invalid or oversized package header.')
  const info = await importApp(new File([bytes], 'published.hyp'))
  if (info.assets.length > 1024) throw new Error('Package contains too many assets.')
  const bp = info.blueprint
  if (bp.scene || bp.id === '$scene') throw new Error('Choose a single app .hyp, rather than a scene.')
  if (!bp.props || typeof bp.props !== 'object' || Array.isArray(bp.props))
    throw new Error('Invalid package properties.')
  if (typeof bp.model !== 'string' || (bp.model !== 'script-only' && !assetURL.test(bp.model)))
    throw new Error('Invalid package model.')
  const urls = new Map()
  let length = 4 + bytes.readUInt32LE(0)
  for (const asset of info.assets) {
    const match = asset.url.match(assetURL)
    if (!match || !types[asset.type]?.includes(match[2])) throw new Error('Invalid package asset path or type.')
    const data = Buffer.from(await asset.file.arrayBuffer())
    if (createHash('sha256').update(data).digest('hex') !== match[1])
      throw new Error('Package asset hash does not match its bytes.')
    if (urls.has(asset.url) && urls.get(asset.url) !== asset.type) throw new Error('Conflicting package asset type.')
    urls.set(asset.url, asset.type)
    length += data.length
  }
  if (length !== bytes.length) throw new Error('Unexpected trailing package bytes.')
  const requireAsset = (url, type) => {
    if (!assetURL.test(url) || !urls.has(url) || (type && urls.get(url) !== type))
      throw new Error('Package is missing a referenced asset or has an invalid asset type.')
  }
  if (bp.model !== 'script-only')
    requireAsset(
      bp.model,
      /\.(ply|splat|ksplat|spz)$/.test(bp.model) ? 'splat' : bp.model.endsWith('.vrm') ? 'avatar' : 'model'
    )
  if (bp.script) requireAsset(bp.script, 'script')
  if (bp.image?.url) requireAsset(bp.image.url, 'texture')
  for (const value of Object.values(bp.props))
    if (value && typeof value === 'object' && 'url' in value) requireAsset(value.url, value.type)
  return info
}

// DNS is checked once per hop and pinned into the actual TLS connection's lookup.
export async function downloadSource(
  input,
  headers = {},
  { maxBytes, timeout = 20000, resolve = lookup, requestSource = https.get, deadline = Date.now() + timeout } = {},
  redirects = 0
) {
  const url = new URL(sourceURL(input))
  const remaining = deadline - Date.now()
  if (remaining <= 0) throw new Error('Source download timed out.')
  let dnsTimer
  const addresses = await Promise.race([
    resolve(url.hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => {
      dnsTimer = setTimeout(() => reject(new Error('Source DNS lookup timed out.')), remaining)
    }),
  ]).finally(() => clearTimeout(dnsTimer))
  if (!addresses.length || addresses.some(item => !publicAddress(item.address)))
    throw new Error('Source resolves to a non-public address.')
  const pinned = addresses[0]
  return new Promise((resolveResult, reject) => {
    const request = requestSource(
      url,
      {
        agent: false,
        headers: { ...headers, 'accept-encoding': 'identity' },
        lookup: (_host, options, done) => done(null, ...(options.all ? [[pinned]] : [pinned.address, pinned.family])),
      },
      response => {
        const status = response.statusCode
        if ([301, 302, 303, 307, 308].includes(status)) {
          response.resume()
          clearTimeout(timer)
          if (redirects >= 4 || !response.headers.location) return reject(new Error('Too many source redirects.'))
          downloadSource(
            new URL(response.headers.location, url).href,
            {},
            { maxBytes, timeout, resolve, requestSource, deadline },
            redirects + 1
          ).then(resolveResult, reject)
          return
        }
        if (status === 304) {
          response.resume()
          clearTimeout(timer)
          resolveResult({ notModified: true })
          return
        }
        if (
          status !== 200 ||
          /text\/html/i.test(response.headers['content-type'] || '') ||
          (response.headers['content-encoding'] && response.headers['content-encoding'] !== 'identity')
        ) {
          response.destroy()
          reject(new Error(`Source must return an uncompressed .hyp download (HTTP ${status}).`))
          return
        }
        if (Number(response.headers['content-length']) > maxBytes) {
          response.destroy()
          reject(new Error('Package exceeds the download limit.'))
          return
        }
        const chunks = []
        let size = 0
        response.on('data', chunk => {
          size += chunk.length
          if (size > maxBytes) response.destroy(new Error('Package exceeds the download limit.'))
          else chunks.push(chunk)
        })
        response.on('error', reject)
        response.on('end', () => {
          clearTimeout(timer)
          resolveResult({
            bytes: Buffer.concat(chunks),
            etag: response.headers.etag,
            lastModified: response.headers['last-modified'],
            finalUrl: url.href,
          })
        })
      }
    )
    const timer = setTimeout(
      () => request.destroy(new Error('Source download timed out.')),
      Math.max(1, deadline - Date.now())
    )
    request.setTimeout(Math.min(timeout, 10000), () => request.destroy(new Error('Source connection timed out.')))
    request.on('error', error => {
      clearTimeout(timer)
      reject(error)
    })
    request.on('close', () => clearTimeout(timer))
  })
}

export class PublishedSourceResolver {
  constructor({ maxBytes = 32 * 1024 * 1024, interval = 6 * 3600000, fetcher = downloadSource, maxEntries = 16 } = {}) {
    this.maxBytes = maxBytes
    this.interval = interval
    this.fetcher = fetcher
    this.maxEntries = maxEntries
    this.maxCacheBytes = Math.max(maxBytes, 64 * 1024 * 1024)
    this.cache = new Map()
    this.history = new Map()
    this.pending = new Map()
    this.active = 0
  }
  status(url) {
    const entry = this.cache.get(url) || this.history.get(url)
    return { hash: entry?.hash, checkedAt: entry?.checkedAt, error: entry?.error, checking: this.pending.has(url) }
  }
  remember(url, entry) {
    this.history.set(url, {
      hash: entry.hash,
      checkedAt: entry.checkedAt,
      error: entry.error,
      nextCheck: entry.nextCheck,
      attemptAt: entry.attemptAt,
      failures: entry.failures,
    })
    while (this.history.size > 1024) this.history.delete(this.history.keys().next().value)
  }
  async check(input, force = false, needBody = false) {
    const url = sourceURL(input)
    if (this.pending.has(url)) return this.pending.get(url)
    let entry = this.cache.get(url) || this.history.get(url)
    const now = Date.now()
    if (entry && (!needBody || entry.bytes) && now < (force ? entry.attemptAt + 10000 : entry.nextCheck)) return entry
    if (this.active >= 3 || this.pending.size >= 3) throw new Error('Source checks are busy; retry shortly.')
    if (!this.cache.has(url)) {
      if (this.cache.size >= this.maxEntries) {
        const oldest = [...this.cache.keys()].find(key => !this.pending.has(key))
        if (!oldest) throw new Error('Source cache is busy.')
        this.remember(oldest, this.cache.get(oldest))
        this.cache.delete(oldest)
      }
      entry = entry || {}
      this.cache.set(url, entry)
    }
    entry.attemptAt = now
    const run = async () => {
      this.active++
      try {
        const headers = {}
        if (entry.bytes && entry.etag) headers['if-none-match'] = entry.etag
        if (entry.bytes && entry.lastModified) headers['if-modified-since'] = entry.lastModified
        const response = await this.fetcher(url, headers, { maxBytes: this.maxBytes })
        if (response.notModified) {
          if (!entry.bytes || !entry.hash) throw new Error('Source returned 304 without a cached package.')
        } else {
          const info = await validatePublishedPackage(response.bytes, this.maxBytes)
          Object.assign(entry, response, { info, hash: digest(response.bytes) })
          let total = [...this.cache.values()].reduce((sum, item) => sum + (item.bytes?.length || 0), 0)
          for (const [key, item] of this.cache) {
            if (total <= this.maxCacheBytes) break
            if (key === url || this.pending.has(key)) continue
            total -= item.bytes?.length || 0
            this.remember(key, item)
            this.cache.delete(key)
          }
        }
        entry.error = null
        entry.failures = 0
        entry.nextCheck = now + this.interval * (0.9 + Math.random() * 0.2)
      } catch (error) {
        entry.error = error.message
        entry.failures = (entry.failures || 0) + 1
        entry.nextCheck = now + Math.min(this.interval, 60000 * 2 ** Math.min(entry.failures, 8))
      } finally {
        entry.checkedAt = new Date().toISOString()
        this.active--
        this.pending.delete(url)
      }
      return entry
    }
    const promise = Promise.resolve().then(run)
    this.pending.set(url, promise)
    return promise
  }
  start(getURLs) {
    const tick = async () => {
      for (const url of new Set(getURLs())) {
        if (this.stopped) return
        try {
          await this.check(url)
        } catch {
          // Busy URLs retry on the next scheduler tick; source failures carry their own backoff.
        }
      }
    }
    this.timer = setInterval(tick, 60000)
    this.timer.unref?.()
    void tick()
  }
  destroy() {
    this.stopped = true
    clearInterval(this.timer)
  }
}
