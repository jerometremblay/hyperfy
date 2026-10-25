// Adapted from https://github.com/dwebxr/coo-world/commit/11e593c8695ac4db13d1a5b110468db3ddd407d8
import moment from 'moment'
import { uuid } from '../utils'
import { CHAT_BODY_MAX_LENGTH, chatEnvelope, cutText, sanitizeChatMessage } from '../extras/chatPolicy'
import { System } from './System'

/**
 * Chat System
 *
 * - Runs on both the server and client.
 * - Stores and handles chat messages
 * - Provides subscribe hooks for client UI
 *
 */

const CHAT_MAX_MESSAGES = 50

export class Chat extends System {
  constructor(world) {
    super(world)
    this.msgs = []
    this.listeners = new Set()
    this.commands = {} // cmd -> Function
  }

  add(msg, broadcast) {
    msg = chatEnvelope(msg)
    if (!msg) return
    if (!msg.id) msg.id = uuid()
    if (!msg.createdAt) msg.createdAt = moment().toISOString()
    // add to chat messages
    this.msgs = [...this.msgs, msg]
    if (this.msgs.length > CHAT_MAX_MESSAGES) {
      this.msgs.shift()
    }
    for (const callback of this.listeners) {
      callback(this.msgs)
    }
    if (msg.fromId) {
      const player = this.world.entities.getPlayer(msg.fromId)
      player?.chat(msg.body)
    }
    // emit chat event
    const readOnly = Object.freeze({ ...msg })
    this.world.events.emit('chat', readOnly)
    // maybe broadcast
    if (broadcast) {
      this.world.network.send('chatAdded', msg)
    }
  }

  command(text) {
    text = cutText(text, CHAT_BODY_MAX_LENGTH)
    if (this.world.network.isServer) return
    const playerId = this.world.network.id
    const cmd = text.slice(1).split(' ')[0] // "/foo bar" -> "foo"
    const value = text.slice(1 + cmd.length + 1) // "/foo bar" -> "bar"
    const args = text // "/foo bar" -> ["foo", "bar"]
      .slice(1)
      .split(' ')
      .map(str => str.trim())
      .filter(str => !!str)
    const callback = this.commands[cmd]
    if (callback) {
      return callback({ playerId, cmd, value, args })
    }
    if (cmd !== 'admin') {
      this.world.events.emit('command', { playerId, cmd, value, args })
    }
    const data = { cmd, value, args }
    this.world.network.send('command', data)
  }

  clear(broadcast) {
    this.msgs = []
    for (const callback of this.listeners) {
      callback(this.msgs)
    }
    if (broadcast) {
      this.world.network.send('chatCleared')
    }
  }

  send(text) {
    // only available as a client
    if (!this.world.network.isClient) return
    const safe = sanitizeChatMessage({ body: text })
    if (!safe) return
    const player = this.world.entities.player
    const data = {
      id: uuid(),
      from: player.data.name,
      fromId: player.data.id,
      body: safe.body,
      createdAt: moment().toISOString(),
    }
    this.add(data, true)
    return data
  }

  serialize() {
    return this.msgs
  }

  deserialize(msgs) {
    this.msgs = msgs
    for (const callback of this.listeners) {
      callback(msgs)
    }
  }

  subscribe(callback) {
    this.listeners.add(callback)
    callback(this.msgs)
    return () => {
      this.listeners.delete(callback)
    }
  }

  bindCommand(cmd, callback) {
    this.commands[cmd] = callback
  }

  destroy() {
    this.msgs = []
    this.listeners.clear()
  }
}
