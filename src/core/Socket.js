import { writePacket } from './packets'

export class Socket {
  constructor({ id, ws, network, player }) {
    this.id = id
    this.ws = ws
    this.network = network

    this.player = player

    this.alive = true
    this.closed = false
    this.disconnected = false
    this.inbox = []
    this.inboxCost = 0
    this.inQueue = false

    this.ws.on('message', this.onMessage)
    this.ws.on('pong', this.onPong)
    this.ws.on('close', this.onClose)
  }

  send(name, data) {
    // console.log('->', name, data)
    const packet = writePacket(name, data)
    return this.network.write(this.ws, packet, { name })
  }

  sendPacket(packet) {
    return this.network.write(this.ws, packet)
  }

  get pingPending() {
    return this.network.writer.state(this.ws).pingPending
  }

  ping() {
    this.alive = false
    return this.network.write(this.ws, null)
  }

  // end(code) {
  //   this.send('end', code)
  //   this.disconnect()
  // }

  onPong = () => {
    this.alive = true
  }

  onMessage = packet => {
    const entry = this.network.admit(this, packet)
    if (!entry) return
    this.network.enqueue(this, packet, entry)
  }

  onClose = e => {
    this.closed = true
    this.disconnect(e?.code)
  }

  disconnect(code) {
    if (!this.closed) return this.ws.terminate()
    if (this.disconnected) return
    this.disconnected = true
    this.network.onDisconnect(this, code)
  }
}
