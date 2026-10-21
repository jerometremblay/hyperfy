import { deflateSync } from 'node:zlib'
// Deterministic equirectangular textures: no downloaded art or font dependency.
const colors = ['fffaf0', 'edc62c', '2450bc', 'b52a32', '71358f', 'ed7c29', '16814d', '81353b', '161b24']
const digits = [
  '111101101101111',
  '010110010010111',
  '111001111100111',
  '111001111001111',
  '101101111001001',
  '111100111001111',
  '111100111101111',
  '111001001001001',
  '111101111101111',
  '111101111001111',
]
function crc32(bytes) {
  let crc = -1
  for (const byte of bytes) {
    crc ^= byte
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1))
  }
  return (crc ^ -1) >>> 0
}
function chunk(type, bytes) {
  const name = Buffer.from(type),
    size = Buffer.alloc(4),
    crc = Buffer.alloc(4)
  size.writeUInt32BE(bytes.length)
  crc.writeUInt32BE(crc32(Buffer.concat([name, bytes])))
  return Buffer.concat([size, name, bytes, crc])
}
export function ballTexture(id) {
  const width = 256,
    height = 128,
    raw = Buffer.alloc((width * 3 + 1) * height)
  const color = colors[id > 8 ? id - 8 : id].match(/../g).map(hex => parseInt(hex, 16))
  for (let y = 0; y < height; y++)
    for (let x = 0; x < width; x++) {
      const white = id > 8 && (y < 43 || y > 85)
      const dx = Math.min(Math.abs(x - 64), Math.abs(x - 192)),
        dy = y - 64
      let pixel = white || dx * dx + dy * dy < 14 * 14 ? [255, 250, 240] : color
      const label = String(id),
        glyphX = x - (x < 128 ? 64 : 192) + (label.length * 8 - 2) / 2
      const glyphY = y - 59,
        n = Math.floor(glyphX / 8),
        gx = Math.floor((glyphX % 8) / 2),
        gy = Math.floor(glyphY / 2)
      if (
        glyphX >= 0 &&
        glyphY >= 0 &&
        gy < 5 &&
        gx < 3 &&
        n < label.length &&
        digits[Number(label[n])][gy * 3 + gx] === '1'
      )
        pixel = [15, 20, 26]
      const offset = y * (width * 3 + 1) + 1 + x * 3
      raw.set(pixel, offset)
    }
  const ihdr = Buffer.alloc(13)
  ihdr.writeUInt32BE(width)
  ihdr.writeUInt32BE(height, 4)
  ihdr[8] = 8
  ihdr[9] = 2
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ])
}
