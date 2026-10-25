// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/inboundDecode.js
import { packetMethodById } from '../core/packets.js'
import { strictDecode } from '../core/extras/strictDecode.js'

// Only the strict plain subset reaches handlers. No process-wide msgpackr extensions are installed.
export function decodeInbound(packet, options = {}) {
  const result = strictDecode(packet, { ...options, build: true })
  if (!result.ok) {
    const err = new Error(result.reason)
    err.pos = result.pos
    err.nodes = result.nodes
    throw err
  }
  return result.value
}

export function readInboundPacket(packet, options) {
  const value = decodeInbound(packet, options)
  if (!Array.isArray(value) || value.length !== 2) throw new Error('not a packet tuple')
  const method = packetMethodById(value[0])
  if (!method) throw new Error('unknown packet id')
  return [method, value[1]]
}
