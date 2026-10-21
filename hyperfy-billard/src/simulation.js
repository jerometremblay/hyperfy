import { Vector3 } from 'three'
import { Ball, State } from '../vendor/tailuge/model/ball.ts'
import { Table } from '../vendor/tailuge/model/table.ts'
import { R, setR, setm, setmu } from '../vendor/tailuge/model/physics/constants.ts'
import { cueStrike } from '../vendor/tailuge/model/physics/physics.ts'
import { TableGeometry } from '../vendor/tailuge/view/tablegeometry.ts'
import { PocketGeometry } from '../vendor/tailuge/view/pocketgeometry.ts'

export const BALL_RADIUS = 0.028575
export const STEP = 1 / 480
export const MAX_SPEED = 5
export function dimensions(preset = '9') {
  return preset === '8' ? { length: 2.3368, width: 1.1684 } : { length: 2.54, width: 1.27 }
}
export function rackPositions(preset) {
  const { length } = dimensions(preset)
  const positions = [[-length / 4, 0, 0]]
  const order = [1, 9, 2, 3, 8, 10, 11, 4, 12, 5, 6, 13, 7, 14, 15]
  let n = 0
  for (let row = 0; row < 5; row++) {
    for (let col = 0; col <= row; col++) {
      positions[order[n++]] = [
        length / 4 + row * Math.sqrt(3) * (BALL_RADIUS + 0.00005),
        (2 * col - row) * (BALL_RADIUS + 0.00005),
        0,
      ]
    }
  }
  return positions
}
export class Simulation {
  constructor(preset = '9') {
    this.preset = preset
    this.size = dimensions(preset)
    setR(BALL_RADIUS)
    setm(0.17)
    setmu(0.007)
    Object.assign(TableGeometry, {
      X: this.size.length / 2,
      Y: this.size.width / 2,
      tableX: this.size.length / 2 - R,
      tableY: this.size.width / 2 - R,
      hasPockets: true,
    })
    PocketGeometry.scaleToRadius(R)
    this.reset()
  }
  reset() {
    this.table = new Table(
      rackPositions(this.preset).map((p, id) => {
        const ball = new Ball(new Vector3(...p), undefined, id)
        // Upstream uses a process-wide ID; IDs here are stable within each table.
        Object.defineProperty(ball, 'id', { value: id })
        return ball
      })
    )
    this.shots = 0
    this.error = null
  }
  get moving() {
    return !this.table.allStationary()
  }
  get scratched() {
    return !this.table.cueball.onTable()
  }
  shoot({ angle, speed, side = 0, top = 0 } = {}) {
    if (
      this.error ||
      this.moving ||
      this.scratched ||
      ![angle, speed, side, top].every(Number.isFinite) ||
      Math.abs(angle) > Math.PI * 2 ||
      speed < 0.1 ||
      speed > MAX_SPEED ||
      Math.hypot(side, top) > 0.45
    )
      return false
    const strike = cueStrike(angle, speed, new Vector3(side, top, 0), 0)
    this.table.cueball.vel.copy(strike.vel)
    this.table.cueball.rvel.copy(strike.rvel)
    this.table.cueball.state = State.Sliding
    this.table.outcome.length = 0
    this.shots++
    return true
  }
  place(x, y) {
    if (
      this.error ||
      this.moving ||
      !this.scratched ||
      ![x, y].every(Number.isFinite) ||
      Math.abs(x) > this.size.length / 2 - 2 * R ||
      Math.abs(y) > this.size.width / 2 - 2 * R
    )
      return false
    const position = new Vector3(x, y, 0)
    if (this.table.balls.slice(1).some(b => b.onTable() && b.pos.distanceTo(position) < 2 * R + 0.0001)) return false
    this.table.cueball.pos.copy(position)
    this.table.cueball.setStationary()
    return true
  }
  step() {
    if (!this.moving || this.error) return
    try {
      this.table.advance(STEP)
      // Outcomes are diagnostic, not a growing match history.
      this.table.outcome.length = 0
      if (
        this.table.balls.some(
          b => ![...b.pos.toArray(), ...b.vel.toArray(), ...b.rvel.toArray()].every(Number.isFinite)
        )
      )
        throw Error('Non-finite physics state')
    } catch (error) {
      this.error = `Simulation stopped: ${error.message}. Re-rack to recover.`
      for (const ball of this.table.balls) {
        const state = ball.state
        ball.setStationary()
        if (state === State.InPocket || state === State.Falling) ball.state = State.InPocket
      }
    }
  }
  snapshot() {
    return {
      shots: this.shots,
      moving: this.moving,
      scratched: this.scratched,
      error: this.error,
      balls: this.table.balls.map(b => ({ id: b.label, p: b.pos.toArray(), w: b.rvel.toArray(), state: b.state })),
    }
  }
}
export { State, TableGeometry, PocketGeometry }
