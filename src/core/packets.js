import { Packr } from 'msgpackr'

export const PROTOCOL_VERSION = 2

const packr = new Packr({ structuredClone: true })
const clientPackr = new Packr({ useRecords: false, structuredClone: false, moreTypes: false, bundleStrings: false })

// External agents (Coo: dwebxr/coo-hyperliza lib/world-protocol.ts) pin PROTOCOL_VERSION and a copy of this table.
// Append new names at the end only; inserting or reordering shifts their ids, and a version bump kicks them.
// prettier-ignore
const names = [
  'snapshot',
  'command',
  'chatAdded',
  'chatCleared',
  'blueprintAdded',
  'blueprintModified',
  'entityAdded',
  'entityModified',
  'entityEvent',
  'entityRemoved',
  'playerTeleport',
  'playerPush',
  'playerSessionAvatar',
  'liveKitLevel',
  'mute',
  'settingsModified',
  'spawnModified',
  'modifyRank',
  'kick',
  'ai',
  'ping',
  'pong',
  'browserInput',
  'playerSeatPose',
  'playerSeatPoseResult',
  'playerSeatPoseStyles',
  'playerSeatPoseStylesResult',
  'playerExpression',
  'profilerReport',
  'profilerControl',
  'playerSession',
]

const byName = {}
const byId = {}

let ids = -1

for (const name of names) {
  const id = ++ids
  const info = {
    id,
    name,
    method: `on${capitalize(name)}`, // eg 'connect' -> 'onConnect'
  }
  byName[name] = info
  byId[id] = info
}

// peekPacketId reads the id from the second byte, which holds as long as every id is a positive fixint
if (names.length > 128) throw new Error('packets: more than 128 names; peekPacketId relies on fixint ids')

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

// the id of a packet without decoding it. msgpackr writes `[id, data]` as a 2-element fixarray whose first
// element is a positive fixint for every id this table can hold; anything else is not a packet of this protocol
export function peekPacketId(packet) {
  if (!packet || packet.length < 2 || packet[0] !== 0x92 || packet[1] > 0x7f) return -1
  return byId[packet[1]] ? packet[1] : -1
}

export function packetNameById(id) {
  return byId[id]?.name
}

export function packetMethodById(id) {
  return byId[id]?.method
}

export function writePacket(name, data) {
  const info = byName[name]
  if (!info) throw new Error(`writePacket failed: ${name} (name not found)`)
  const packet = packr.pack([info.id, data])
  return packet
}

export function writeClientPacket(name, data) {
  const info = byName[name]
  if (!info) throw new Error(`writeClientPacket failed: ${name} (name not found)`)
  const packet = clientPackr.pack([info.id, data])
  return packet
}

export function readPacket(packet) {
  try {
    const [id, data] = packr.unpack(packet)
    const info = byId[id]
    if (!info) throw new Error(`readPacket failed: ${id} (id not found)`)
    return [info.method, data]
  } catch (err) {
    // Do not log untrusted packet contents.
    return []
  }
}
