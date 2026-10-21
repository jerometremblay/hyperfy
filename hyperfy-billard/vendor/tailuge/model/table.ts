import { Cushion } from "./physics/cushion"
import { Collision } from "./physics/collision"
import { Knuckle } from "./physics/knuckle"
import { Pocket } from "./physics/pocket"
import { Ball, State } from "./ball"
import { TableGeometry } from "../view/tablegeometry"
import { Outcome } from "./outcome"
import { PocketGeometry } from "../view/pocketgeometry"
import { bounceHanBlend } from "./physics/physics"
import { zero } from "../utils/three-utils"
import { R } from "./physics/constants"

interface Pair {
  a: Ball
  b: Ball
}

export class Table {
  balls: Ball[]
  cue: any
  proximityIndicator: any
  proximityEnabled = false
  pairs: Pair[]
  outcome: Outcome[] = []
  time = 0
  cueball: Ball
  cushionModel = bounceHanBlend
  mesh
  /** Initial conditions of the current shot, captured in `hit()` so a depth-
   * exceeded exception can print a recreation link. Undefined until a shot
   * starts. Capture/build/report logic lives in `ShotStartUtils`. */
  shotStartConditions?: unknown

  constructor(balls: Ball[]) {
    this.cueball = balls[0]
    this.initialiseBalls(balls)

  }

  initialiseBalls(balls: Ball[]) {
    this.balls = balls
    this.pairs = []
    for (let a = 0; a < balls.length; a++) {
      for (let b = 0; b < balls.length; b++) {
        if (a < b) {
          this.pairs.push({ a: balls[a], b: balls[b] })
        }
      }
    }
  }

  updateBallMesh(t) {
    this.balls.forEach((a) => {
      a.updateMesh(t)
    })
  }

  advance(t: number) {
    this.time += t * 1000
    let depth = 0
    while (!this.prepareAdvanceAll(t)) {
      if (depth++ > 100) {
        throw new Error("Depth exceeded resolving collisions")
      }
    }
    this.balls.forEach((a) => {
      a.update(t)
      a.fround()
    })

  }

  /**
   * Returns true if all balls can advance by t without collision
   *
   */
  prepareAdvanceAll(t: number) {
    return (
      this.pairs.every((pair) => this.prepareAdvancePair(pair.a, pair.b, t)) &&
      this.balls.every((ball) => this.prepareAdvanceToCushions(ball, t))
    )
  }

  /**
   * Returns true if a pair of balls can advance by t without any collision.
   * If there is a collision, adjust velocity appropriately.
   *
   */
  private prepareAdvancePair(a: Ball, b: Ball, t: number) {
    if (Collision.willCollide(a, b, t)) {
      const incidentSpeed = Collision.collide(a, b)
      this.outcome.push(Outcome.collision(a, b, incidentSpeed, this.time))
      return false
    }
    return true
  }

  /**
   * Returns true if ball can advance by t without hitting cushion, knuckle or pocket.
   * If there is a collision, adjust velocity appropriately.
   *
   */
  private prepareAdvanceToCushions(a: Ball, t: number): boolean {
    if (!a.onTable()) {
      return true
    }
    const futurePosition = a.futurePosition(t)
    if (
      Math.abs(futurePosition.y) < TableGeometry.tableY &&
      Math.abs(futurePosition.x) < TableGeometry.tableX
    ) {
      return true
    }

    const result = Cushion.bounceAny(
      a,
      t,
      TableGeometry.hasPockets,
      this.cushionModel
    )
    if (result && result.incidentSpeed) {
      this.outcome.push(
        Outcome.cushion(a, result.incidentSpeed, this.time, result.cushion)
      )
      return false
    }

    if (TableGeometry.hasPockets) {
      const k = Knuckle.findBouncing(a, t)
      if (k) {
        const knuckleIncidentSpeed = k.bounce(a)
        this.outcome.push(Outcome.cushion(a, knuckleIncidentSpeed, this.time))
        return false
      }
      const p = Pocket.findPocket(PocketGeometry.pocketCenters, a, t)
      if (p) {
        const pocketIncidentSpeed = p.fall(a, t)
        this.outcome.push(Outcome.pot(a, pocketIncidentSpeed, this.time))
        return false
      }
    }

    return true
  }

  allStationary() {
    return this.balls.every((b) => !b.inMotion())
  }

  inPockets(): number {
    return this.balls.reduce((acc, b) => (b.onTable() ? acc : acc + 1), 0)
  }

}
