// JPEG limits also apply to ordinary uploads so callers cannot bypass them by
// omitting a photo flag. Key by IP: the HTTP upload route has no socket identity.
export const MAX_PHOTO_BYTES = 1024 * 1024
const WINDOW = 60_000
const LIMIT = 20

function fail(message, statusCode) {
  throw Object.assign(new Error(message), { statusCode })
}

export function isJPEGUpload(part) {
  return /\.(jpe?g)$/i.test(part.filename) || part.mimetype === 'image/jpeg'
}

export class PhotoUploadLimits {
  constructor() {
    this.windows = new Map()
  }

  take(ip, now = Date.now()) {
    for (const [key, entry] of this.windows) if (entry.until <= now) this.windows.delete(key)
    let entry = this.windows.get(ip)
    if (!entry) {
      // Bound memory even under requests from many distinct addresses.
      if (this.windows.size >= 10000) fail('Photo uploads are busy; try again later', 429)
      entry = { until: now + WINDOW, count: 0 }
      this.windows.set(ip, entry)
    }
    if (++entry.count > LIMIT) fail('JPEG upload limit: 20 per minute per IP', 429)
  }
}

export function validatePhoto(buffer) {
  if (buffer.length > MAX_PHOTO_BYTES) fail('JPEG upload exceeds 1 MB', 413)
  if (
    buffer.length < 4 ||
    buffer[0] !== 0xff ||
    buffer[1] !== 0xd8 ||
    buffer[2] !== 0xff ||
    buffer[buffer.length - 2] !== 0xff ||
    buffer[buffer.length - 1] !== 0xd9
  ) {
    fail('Invalid JPEG upload', 415)
  }
}
