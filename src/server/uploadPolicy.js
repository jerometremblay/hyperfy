// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/uploadPolicy.js
// Upload policy for /api/upload, /api/upload-check and the /assets/ response headers.
// Pure: no world, no sockets, no fs. The routes map the results here onto HTTP statuses.

// every extension a client picker or loader can produce; uploads are stored as `${sha256}.${ext}`
export const ALLOWED_EXTENSIONS = [
  'glb',
  'vrm',
  'js',
  'jpg',
  'jpeg',
  'png',
  'webp',
  'mp4',
  'mp3',
  'ogg',
  'hdr',
  'spz',
  'ply',
  'splat',
  'ksplat',
  'sog',
  'sogs',
  'sogszip',
  'zip',
  'gz',
]

// media the browser renders from its own tags (img/video/audio) or that loaders fetch as binary.
// everything else is served as an inert download so it can never run as a same-origin document.
export const INLINE_EXTENSIONS = ['jpg', 'jpeg', 'png', 'webp', 'mp4', 'mp3', 'ogg', 'glb', 'vrm']

const CONTENT_TYPES = {
  glb: 'model/gltf-binary',
  vrm: 'model/gltf-binary',
  hdr: 'image/vnd.radiance',
  js: 'text/javascript',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
}

const allowed = new Set(ALLOWED_EXTENSIONS)
const inline = new Set(INLINE_EXTENSIONS)
const uploadCheckFilename = new RegExp(`^[a-f0-9]{64}\\.(${ALLOWED_EXTENSIONS.join('|')})$`)

// the exact derivation used to name the stored file (see computeAssetFilename); no dot, no extension
export function extensionOf(filename) {
  if (typeof filename !== 'string') return ''
  const dot = filename.lastIndexOf('.')
  return dot < 0 ? '' : filename.slice(dot + 1).toLowerCase()
}

export function parseBearer(header) {
  if (typeof header !== 'string') return null
  const match = /^Bearer\s+(\S+)$/i.exec(header.trim())
  return match ? match[1] : null
}

// exact match only: nothing a path join could reinterpret (separators, dots, empty)
export function isAllowedExtension(ext) {
  return typeof ext === 'string' && /^[a-z0-9]+$/.test(ext) && allowed.has(ext)
}

export function isUploadCheckFilename(filename) {
  return typeof filename === 'string' && uploadCheckFilename.test(filename)
}

export function authorizeUpload({ player, settings, ext }) {
  if (player.isBuilder()) return { ok: true }
  // any connected user may upload an avatar while custom avatars are enabled
  if (ext === 'vrm' && settings.customAvatars) return { ok: true }
  return { ok: false, reason: 'builder rank required' }
}

const bytes = text => Array.from(text, ch => ch.charCodeAt(0))
const hasBytes = (buf, offset, expected) => {
  if (buf.length < offset + expected.length) return false
  for (let i = 0; i < expected.length; i++) {
    if (buf[offset + i] !== expected[i]) return false
  }
  return true
}

const GLTF = bytes('glTF')
const PNG = [0x89, 0x50, 0x4e, 0x47]
const JPEG = [0xff, 0xd8, 0xff]
const RIFF = bytes('RIFF')
const WEBP = bytes('WEBP')
const RADIANCE = bytes('#?')
const ID3 = bytes('ID3')
const MP4_BOXES = ['ftyp', 'moov', 'mdat', 'free', 'wide', 'skip'].map(bytes)
const MP3_SCAN_BYTES = 4096

// browsers sniff images, so any image signature is fine for any image extension
const isImage = buf =>
  hasBytes(buf, 0, PNG) || hasBytes(buf, 0, JPEG) || (hasBytes(buf, 0, RIFF) && hasBytes(buf, 8, WEBP))

// ID3 tag or an MPEG frame sync (0xFF followed by 0xE0..0xFF) within the first 4 KB
const isMp3 = buf => {
  const end = Math.min(buf.length, MP3_SCAN_BYTES)
  for (let i = 0; i + 1 < end; i++) {
    if (buf[i] === 0xff && (buf[i + 1] & 0xe0) === 0xe0) return true
    if (hasBytes(buf, i, ID3)) return true
  }
  return false
}

const signatures = {
  glb: buf => hasBytes(buf, 0, GLTF),
  vrm: buf => hasBytes(buf, 0, GLTF),
  jpg: isImage,
  jpeg: isImage,
  png: isImage,
  webp: isImage,
  hdr: buf => hasBytes(buf, 0, RADIANCE),
  mp4: buf => MP4_BOXES.some(box => hasBytes(buf, 4, box)),
  mp3: isMp3,
  ogg: buf => hasBytes(buf, 0, bytes('OggS')),
  ply: buf => hasBytes(buf, 0, bytes('ply')),
  spz: buf => hasBytes(buf, 0, [0x1f, 0x8b]),
  gz: buf => hasBytes(buf, 0, [0x1f, 0x8b]),
  zip: buf => hasBytes(buf, 0, [0x50, 0x4b, 0x03, 0x04]),
  sog: buf => hasBytes(buf, 0, [0x50, 0x4b, 0x03, 0x04]),
  sogszip: buf => hasBytes(buf, 0, [0x50, 0x4b, 0x03, 0x04]),
  splat: buf => buf.length > 0 && buf.length % 32 === 0,
}

// `js` has no signature: scripts are text, made inert by the /assets/ headers instead
export function matchesSignature(ext, buffer) {
  const check = signatures[ext]
  if (!check || check(buffer)) return { ok: true }
  return { ok: false, reason: `file content does not match .${ext}` }
}

export function assetHeaders(ext) {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'Content-Type': CONTENT_TYPES[ext] || 'application/octet-stream',
  }
  if (!inline.has(ext)) {
    headers['Content-Security-Policy'] = "sandbox; default-src 'none'"
    headers['Content-Disposition'] = 'attachment'
  }
  return headers
}
