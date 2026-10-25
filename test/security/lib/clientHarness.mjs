// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/clientHarness.mjs
import fs from 'node:fs'
import { internalEvents } from '../../../src/core/extras/internalEvents.js'
import { EventEmitter } from 'node:events'
import * as THREE from 'three'
import { isEqual, cloneDeep, isBoolean, isNumber, throttle } from 'lodash-es'
import moment from 'moment'
import { uuid, clamp } from '../../../src/core/utils.js'
import { createUploadQueue } from '../../../src/core/extras/uploadQueue.js'
import { writeClientPacket, writePacket } from '../../../src/core/packets.js'
import { BUILDER_ONLY_PACKETS, packetByteLimit, packetNodeLimit } from '../../../src/core/extras/inboundPolicy.js'
import { strictDecode } from '../../../src/core/extras/strictDecode.js'
import { CHANGE_TOO_LARGE, preflightPacket } from '../../../src/core/extras/clientPreflight.js'
import {
  sanitizeBlueprintAdd,
  sanitizeBlueprintModify,
  WORLD_BLUEPRINT_BYTES,
} from '../../../src/core/extras/blueprintPolicy.js'
import {
  CHAT_BODY_MAX_LENGTH,
  chatEnvelope,
  cutText,
  sanitizeChatMessage,
} from '../../../src/core/extras/chatPolicy.js'
import { sanitizeName, sanitizePlayerSelfModify, isEmoteUrl } from '../../../src/core/extras/entityModifyPolicy.js'
import { normalizeSettingValue } from '../../../src/core/extras/settingsPolicy.js'
import { createEventLedger } from '../../../src/core/extras/appEventQueue.js'

class System extends EventEmitter {
  constructor(world) {
    super()
    this.world = world
  }
}

// Run the actual classes with explicit dependencies, without booting the renderer, physics or storage.
// Use the host realm so the policies' plain-object checks match production.
export function loadClient(file, name, context = {}) {
  const source = fs.readFileSync(new URL(`../../../src/${file}`, import.meta.url), 'utf8')
  const dependencies = {
    System,
    Entity: class {},
    THREE,
    DEG2RAD: Math.PI / 180,
    RAD2DEG: 180 / Math.PI,
    isEqual,
    cloneDeep,
    isBoolean,
    isNumber,
    throttle,
    emoteUrls: {},
    moment,
    uuid,
    clamp,
    createUploadQueue,
    writeClientPacket,
    writePacket,
    WORLD_BLUEPRINT_BYTES,
    BUILDER_ONLY_PACKETS,
    packetByteLimit,
    packetNodeLimit,
    strictDecode,
    CHANGE_TOO_LARGE,
    preflightPacket,
    sanitizeBlueprintAdd,
    sanitizeBlueprintModify,
    CHAT_BODY_MAX_LENGTH,
    chatEnvelope,
    cutText,
    sanitizeChatMessage,
    sanitizeName,
    sanitizePlayerSelfModify,
    isEmoteUrl,
    normalizeSettingValue,
    createEventLedger,
    internalEvents,
    ...context,
  }
  const code = source.replace(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm, '').replace(/^export /gm, '')
  return new Function(...Object.keys(dependencies), `${code}\nreturn ${name}`)(...Object.values(dependencies))
}

export const ClientNetwork = loadClient('core/systems/ClientNetwork.js', 'ClientNetwork')
export const Blueprints = loadClient('core/systems/Blueprints.js', 'Blueprints')

export function clientWorld() {
  const world = new EventEmitter()
  world.entities = { items: new Map() }
  world.network = new ClientNetwork(world)
  world.network.id = 'player'
  world.packets = []
  world.network.ws = { readyState: 1, send: packet => world.packets.push(Uint8Array.from(packet)) }
  world.toasts = []
  world.on('toast', text => world.toasts.push(text))
  world.blueprints = new Blueprints(world)
  return world
}
