import test from 'node:test'
import assert from 'node:assert/strict'
import { physics } from './helpers.mjs'
const { Simulation, STEP, BALL_RADIUS: R, dimensions, State } = physics
const advance = (sim, seconds) => {
  for (let t = 0; t < seconds; t += STEP) sim.step()
}
const isolate = sim => {
  for (const b of sim.table.balls.slice(1)) b.state = State.InPocket
}

test('WPA dimensions, ball size, rack spacing, stable IDs', () => {
  assert.deepEqual(dimensions(), { length: 2.54, width: 1.27 })
  assert.deepEqual(dimensions('8'), { length: 2.3368, width: 1.1684 })
  assert.equal(R * 2, 0.05715)
  const sim = new Simulation()
  assert.equal(sim.table.balls.length, 16)
  for (const a of sim.table.balls)
    for (const b of sim.table.balls) if (a.id !== b.id) assert.ok(a.pos.distanceTo(b.pos) >= 2 * R)
  assert.equal(sim.table.balls[8].pos.y, 0)
  assert.equal(sim.table.balls[0].pos.x, -2.54 / 4)
  sim.reset()
  assert.deepEqual(
    sim.table.balls.map(b => b.id),
    Array.from({ length: 16 }, (_, i) => i)
  )
})
test('reject malformed, overpowered, spin-limit and overlapping placement inputs', () => {
  const sim = new Simulation()
  for (const shot of [
    {},
    { angle: NaN, speed: 1 },
    { angle: 0, speed: 6 },
    { angle: 0, speed: 2, side: 0.5 },
    { angle: 0, speed: -1 },
  ])
    assert.equal(sim.shoot(shot), false)
  assert.equal(sim.place(0, 0), false)
  sim.table.cueball.state = State.InPocket
  assert.equal(sim.place(sim.table.balls[1].pos.x, 0), false)
  assert.equal(sim.place(Infinity, 0), false)
  assert.equal(sim.place(0, 0), true)
  assert.equal(sim.scratched, false)
})
test('head-on model transfers momentum with upstream 0.925 restitution', () => {
  const sim = new Simulation()
  isolate(sim)
  const a = sim.table.cueball,
    b = sim.table.balls[1]
  a.pos.set(-0.2, 0, 0)
  b.pos.set(0, 0, 0)
  b.state = State.Stationary
  sim.shoot({ angle: 0, speed: 1 })
  for (let i = 0; i < 120 && b.vel.length() === 0; i++) sim.step()
  assert.ok(b.vel.x > 0.6 && b.vel.x < 1)
  assert.ok(a.vel.x < 0.1)
  assert.equal(sim.error, null)
})
test('cushion rebound, pocket capture, friction and stop', () => {
  const sim = new Simulation()
  isolate(sim)
  sim.table.cueball.pos.set(0, 0.35, 0)
  assert.ok(sim.shoot({ angle: Math.PI / 2, speed: 1.5 }))
  advance(sim, 0.35)
  // At x=0 the centre pocket captures rather than rebounds.
  advance(sim, 4)
  assert.equal(sim.table.cueball.state, State.InPocket)
  assert.ok(sim.place(0.3, 0.35))
  sim.shoot({ angle: Math.PI / 2, speed: 1.5 })
  advance(sim, 0.35)
  assert.ok(sim.table.cueball.vel.y < 0)
  advance(sim, 30)
  assert.equal(sim.moving, false)
  assert.equal(sim.error, null)
})
test('full-rack maximum break remains finite, nonoverlapping and comes to rest', () => {
  const sim = new Simulation()
  sim.shoot({ angle: 0, speed: 5 })
  assert.equal(sim.shoot({ angle: 0, speed: 1 }), false)
  advance(sim, 60)
  assert.equal(sim.error, null)
  assert.equal(sim.moving, false)
  for (const a of sim.table.balls) {
    assert.ok(a.pos.toArray().every(Number.isFinite))
    for (const b of sim.table.balls)
      if (a.id !== b.id && a.onTable() && b.onTable()) assert.ok(a.pos.distanceTo(b.pos) >= 2 * R - 0.0001)
  }
})
test('deterministic repeated breaks with side/top spin', () => {
  const run = () => {
    const sim = new Simulation()
    sim.shoot({ angle: 0.01, speed: 4, side: 0.15, top: 0.2 })
    advance(sim, 20)
    assert.equal(sim.error, null)
    return sim.snapshot()
  }
  assert.deepEqual(run(), run())
})
