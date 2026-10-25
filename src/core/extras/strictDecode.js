// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/strictDecode.js
// The same parser counts untrusted input at admission and builds the admitted copy at dispatch.
// Container slots are charged at their header, before allocation or traversal.
const textDecoder = new TextDecoder('utf-8', { ignoreBOM: true }) // non-fatal: invalid sequences and lone surrogates become U+FFFD
const BIN_EXTRA_NODES = 3 // a bin costs 4 nodes in total: its slot plus these
const fromCharCode = String.fromCharCode

export function strictDecode(buf, { maxNodes = 4096, maxDepth = 32, build = true } = {}) {
  const len = buf.length
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength)
  let pos = 0
  let nodes = 1
  const fail = reason => {
    const err = new Error(reason)
    err.pos = pos
    err.nodes = nodes
    throw err
  }
  const need = n => {
    if (pos + n > len) fail('truncated')
  }
  const charge = n => {
    nodes += n
    if (nodes > maxNodes) fail('node budget exceeded')
  }
  const readStr = count => {
    need(count)
    const start = pos
    pos += count
    if (!build) return undefined
    if (count < 13) {
      let ascii = true
      for (let i = start; i < pos; i++) {
        if (buf[i] > 0x7f) {
          ascii = false
          break
        }
      }
      if (ascii) {
        let value = ''
        for (let i = start; i < pos; i++) value += fromCharCode(buf[i])
        return value
      }
    }
    return textDecoder.decode(buf.subarray(start, pos))
  }
  const setKey = (obj, key, value) => {
    obj[key === '__proto__' ? '__proto_' : key] = value // the rename msgpackr applies, so no [[Set]] copy can repoint a prototype
  }
  const readValue = (depth, key = false) => {
    if (depth > maxDepth) fail('too deep')
    need(1)
    const b = buf[pos]
    const string = (b >= 0xa0 && b <= 0xbf) || b === 0xd9 || b === 0xda || b === 0xdb
    if (key && !string) fail('map key is not a string')
    if (b === 0xc1 || (b >= 0xc7 && b <= 0xc9) || (b >= 0xd5 && b <= 0xd8)) {
      fail(`byte 0x${b.toString(16)} refused`)
    }
    pos++
    if (b <= 0x7f) return b
    if (b >= 0xe0) return b - 0x100
    if (b >= 0xa0 && b <= 0xbf) return readStr(b & 0x1f)
    if (b >= 0x90 && b <= 0x9f) return readArray(b & 0x0f, depth)
    if (b >= 0x80 && b <= 0x8f) return readMap(b & 0x0f, depth)
    switch (b) {
      case 0xc0:
        return null
      case 0xc2:
        return false
      case 0xc3:
        return true
      case 0xc4:
        need(1)
        return readBin(buf[pos++])
      case 0xc5:
        need(2)
        return readBin(view.getUint16((pos += 2) - 2))
      case 0xc6:
        need(4)
        return readBin(view.getUint32((pos += 4) - 4))
      case 0xca:
        need(4)
        return view.getFloat32((pos += 4) - 4)
      case 0xcb:
        need(8)
        return view.getFloat64((pos += 8) - 8)
      case 0xcc:
        need(1)
        return buf[pos++]
      case 0xcd:
        need(2)
        return view.getUint16((pos += 2) - 2)
      case 0xce:
        need(4)
        return view.getUint32((pos += 4) - 4)
      case 0xcf: {
        need(8)
        const hi = view.getUint32(pos)
        const lo = view.getUint32(pos + 4)
        pos += 8
        return hi * 0x100000000 + lo // same as msgpackr int64AsType: 'number'; exact up to 2^53
      }
      case 0xd0:
        need(1)
        return view.getInt8(pos++)
      case 0xd1:
        need(2)
        return view.getInt16((pos += 2) - 2)
      case 0xd2:
        need(4)
        return view.getInt32((pos += 4) - 4)
      case 0xd3: {
        need(8)
        const hi = view.getInt32(pos)
        const lo = view.getUint32(pos + 4)
        pos += 8
        return hi * 0x100000000 + lo
      }
      case 0xd4:
        need(1)
        if (buf[pos] !== 0x00) fail(`ext type 0x${buf[pos].toString(16)} refused`)
        need(2)
        pos += 2
        return undefined
      case 0xd9:
        need(1)
        return readStr(buf[pos++])
      case 0xda:
        need(2)
        return readStr(view.getUint16((pos += 2) - 2))
      case 0xdb:
        need(4)
        return readStr(view.getUint32((pos += 4) - 4))
      case 0xdc:
        need(2)
        return readArray(view.getUint16((pos += 2) - 2), depth)
      case 0xdd:
        need(4)
        return readArray(view.getUint32((pos += 4) - 4), depth)
      case 0xde:
        need(2)
        return readMap(view.getUint16((pos += 2) - 2), depth)
      case 0xdf:
        need(4)
        return readMap(view.getUint32((pos += 4) - 4), depth)
      default:
        fail(`byte 0x${b.toString(16)} refused`)
    }
  }
  const readBin = count => {
    charge(BIN_EXTRA_NODES)
    need(count)
    if (!build) {
      pos += count
      return undefined
    }
    const out = new Uint8Array(count)
    out.set(buf.subarray(pos, pos + count))
    pos += count
    return out
  }
  const readArray = (count, depth) => {
    charge(count)
    if (count > len - pos) fail('declared length exceeds remaining bytes')
    const arr = build ? new Array(count) : undefined
    for (let i = 0; i < count; i++) {
      const value = readValue(depth + 1)
      if (build) arr[i] = value
    }
    return arr
  }
  const readMap = (count, depth) => {
    charge(count * 2)
    if (count * 2 > len - pos) fail('declared length exceeds remaining bytes')
    const obj = build ? {} : undefined
    for (let i = 0; i < count; i++) {
      const key = readValue(depth + 1, true)
      const value = readValue(depth + 1)
      if (build) setKey(obj, key, value)
    }
    return obj
  }
  try {
    charge(0)
    const value = readValue(1)
    if (pos !== len) fail('trailing bytes')
    return { ok: true, nodes, pos, reason: null, value: build ? value : undefined }
  } catch (err) {
    if (err.nodes === undefined) throw err
    return { ok: false, nodes, pos, reason: err.message }
  }
}
