import { briefError } from '../extras/logOnce.js'
import { System } from './System'

const TICK_RATE = 1 / 30

/**
 * Server System
 *
 * - Runs on the server
 * - Ticks!
 *
 */
export class Server extends System {
  constructor(world) {
    super(world)
    this.timerId = null
    this.running = false
    this.tickErrors = new Set()
  }

  start() {
    if (this.running || this.world.fatalError) return
    this.running = true
    this.tick()
  }

  tick = () => {
    if (!this.running || this.world.fatalError) return
    try {
      this.world.tick(performance.now())
    } catch (err) {
      this.world.accumulator = 0
      const message = briefError(err)
      if (this.tickErrors.size < 32 && !this.tickErrors.has(message)) {
        this.tickErrors.add(message)
        console.error(`[server] tick failed: ${message}`, err)
      }
    } finally {
      if (this.running && !this.world.fatalError) this.timerId = setTimeout(this.tick, TICK_RATE * 1000)
    }
  }

  destroy() {
    this.running = false
    clearTimeout(this.timerId)
    this.timerId = null
  }
}
