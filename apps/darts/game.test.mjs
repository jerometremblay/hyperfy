import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DartsGame,
  DartsController,
  launch,
  sampleFlight,
  scoreImpact,
  BULL_HEIGHT,
  releaseFrom,
  DEFAULT_AIM,
  GRAVITY,
  SEGMENTS,
  BOARD,
  STEP,
  CRICKET_TARGETS,
} from '../../outputs/darts/game.mjs'

const close = (a, b, tolerance = 1e-9) => assert.ok(Math.abs(a - b) < tolerance, `${a} != ${b}`)
const RELEASE = [0, 1.55, 2.1] // A test stance; the game has no fixed release position.
// Independent inverse projectile equation, used to exercise actual flight → impact → score.
export function aimAt(x, y, speed = 7) {
  const distance = Math.hypot(RELEASE[2], x)
  const height = y + BULL_HEIGHT - RELEASE[1]
  const pitch = Math.atan(
    (speed ** 2 - Math.sqrt(speed ** 4 - GRAVITY * (GRAVITY * distance ** 2 + 2 * height * speed ** 2))) /
      (GRAVITY * distance)
  )
  return { yaw: Math.atan2(x, RELEASE[2]), pitch, speed }
}
function ready(mode = 'countup', count = 1) {
  const g = new DartsGame()
  for (let i = 0; i < count; i++) assert.equal(g.join(`p${i}`, `Player ${i}`), true)
  assert.equal(g.configure('p0', mode), true)
  assert.equal(g.start('p0'), true)
  return g
}
function hit(g, x, y) {
  assert.equal(g.throw(g.activePlayer.id, aimAt(x, y), g.seq, RELEASE), true)
  let guard = 0
  while (g.flight && guard++ < 200) g.step()
  assert.ok(guard < 200)
}
test('wind-up rejects repeated throws and launches once from the stance at release', () => {
  const g = ready()
  const seq = g.seq
  assert.equal(g.beginThrow('p1', DEFAULT_AIM, seq), false)
  assert.equal(g.beginThrow('p0', DEFAULT_AIM, seq), true)
  assert.equal(g.beginThrow('p0', DEFAULT_AIM, seq), false)
  assert.equal(g.beginThrow('p0', DEFAULT_AIM, g.seq), false)
  assert.equal(g.flight, null)
  assert.equal(g.setAim('p0', { ...DEFAULT_AIM, speed: 10 }), false)
  g.stepWindup(0.4, [0, 0, 3])
  assert.equal(g.flight, null)
  g.stepWindup(0.05, [0.8, 0.2, 6])
  assert.equal(g.windup, null)
  assert.deepEqual(g.flight.origin, releaseFrom([0.8, 0.2, 6], DEFAULT_AIM))
  const shot = g.flight
  assert.equal(g.stepWindup(1, [20, 0, 3]), false)
  assert.equal(g.flight, shot)
})
test('disconnect and reset cancel a wind-up without launching or scoring', () => {
  for (const cancel of [g => g.leave('p0'), g => g.reset('p0')]) {
    const g = ready('countup', 2)
    assert.ok(g.beginThrow('p0', DEFAULT_AIM, g.seq))
    cancel(g)
    assert.equal(g.windup, null)
    assert.equal(g.flight, null)
    assert.equal(g.stepWindup(1, [0, 0, 3]), false)
    assert.equal(g.players[0].throws, 0)
  }
})
function segmentPoint(number, radius) {
  const angle = (SEGMENTS.indexOf(number) * Math.PI) / 10
  return [Math.sin(angle) * radius, Math.cos(angle) * radius]
}

test('ballistic model agrees with projectile equations and terminates exactly at the first boundary', () => {
  const shot = launch(aimAt(0.06, 0.08), RELEASE)
  close(shot.impact[0], 0.06)
  close(shot.impact[1], BULL_HEIGHT + 0.08)
  close(shot.impact[2], 0)
  const at = sampleFlight(shot, 0.1)
  close(at.position[1], RELEASE[1] + shot.velocity[1] * 0.1 - (GRAVITY * 0.01) / 2)
  const slower = launch({ ...DEFAULT_AIM, speed: 4 }, RELEASE)
  assert.ok(slower.impact[1] < launch(DEFAULT_AIM, RELEASE).impact[1])
  const floor = launch({ yaw: 0, pitch: -0.5, speed: 4 }, RELEASE)
  assert.equal(floor.surface, 'floor')
  close(floor.impact[1], 0)
  assert.ok(floor.impact[2] > 0)
  assert.equal(sampleFlight(shot, 999).landed, true)
  assert.deepEqual(sampleFlight(shot, 999).position, shot.impact)
})
test('every segment, bull and ring scores at regulation metre coordinates', () => {
  assert.equal(scoreImpact(0, 0).score, 50)
  assert.equal(scoreImpact(0.011, 0).score, 25)
  for (const n of SEGMENTS) {
    for (const [radius, multiplier] of [
      [0.07, 1],
      [0.103, 3],
      [0.13, 1],
      [0.166, 2],
    ])
      assert.equal(scoreImpact(...segmentPoint(n, radius)).score, n * multiplier)
  }
  assert.equal(scoreImpact(0.171, 0).score, 0)
  assert.equal(BOARD.doubleOuter, 0.17)
})
test('full throw path scores a triple and rejects duplicate, stale, wrong-player and nonfinite throws', () => {
  const g = ready('501', 2)
  const seq = g.seq
  assert.equal(g.throw('p1', DEFAULT_AIM, seq, RELEASE), false)
  for (const aim of [
    { ...DEFAULT_AIM, yaw: NaN },
    { ...DEFAULT_AIM, speed: Infinity },
    { ...DEFAULT_AIM, pitch: 3 },
    { ...DEFAULT_AIM, speed: 3 },
  ])
    assert.equal(g.throw('p0', aim, seq, RELEASE), false)
  hit(g, 0, 0.103)
  assert.equal(g.players[0].score, 441)
  assert.equal(g.lastHit.score, 60)
  assert.equal(g.throw('p0', DEFAULT_AIM, seq, RELEASE), false)
  assert.equal(g.visit, 1)
  const snapshot = g.snapshot()
  snapshot.players[0].score = 99
  snapshot.darts[0].impact[0] = 99
  assert.equal(g.players[0].score, 441)
  assert.notEqual(g.darts[0].impact[0], 99)
})
test('301 bust restores the visit start, including points from earlier darts', () => {
  const g = ready('301')
  g.players[0].score = g.visitStart = 61
  hit(g, 0, 0.07) // S20 → 41
  hit(g, 0, 0.103) // T20 → bust
  assert.equal(g.players[0].score, 61)
  assert.equal(g.visit, 3)
  assert.match(g.lastHit.label, /Bust/)
  assert.equal(g.throw('p0', DEFAULT_AIM, g.seq, RELEASE), false)
})
test('countdown rejects single-out and a leave of one, and permits double-out/bull', () => {
  for (const mode of ['301', '501']) {
    const g = ready(mode)
    g.players[0].score = g.visitStart = 20
    hit(g, 0, 0.07)
    assert.equal(g.phase, 'playing')
    assert.equal(g.players[0].score, 20)
    assert.equal(g.next('p0', g.seq), true)
    g.players[0].score = g.visitStart = 21
    hit(g, 0, 0.07)
    assert.equal(g.players[0].score, 21)
    assert.equal(g.visit, 3)
    assert.equal(g.next('p0', g.seq), true)
    g.players[0].score = g.visitStart = 40
    hit(g, 0, 0.166)
    assert.equal(g.phase, 'complete')
    assert.equal(g.winner, 'p0')
  }
  const bull = ready('501')
  bull.players[0].score = bull.visitStart = 50
  hit(bull, 0, 0)
  assert.equal(bull.winner, 'p0')
})
test('three darts advance multiplayer turns once and preserve each score', () => {
  const g = ready('countup', 4)
  for (let p = 0; p < 4; p++) {
    assert.equal(g.activePlayer.id, `p${p}`)
    for (let i = 0; i < 3; i++) hit(g, 0, 0.07)
    assert.equal(g.next(`p${(p + 1) % 4}`, g.seq), false)
    const seq = g.seq
    assert.equal(g.next(`p${p}`, seq), true)
    assert.equal(g.next(`p${p}`, seq), false)
    assert.equal(g.darts.length, 0)
  }
  assert.equal(g.round, 2)
  assert.equal(g.turn, 0)
  assert.deepEqual(
    g.players.map(p => p.score),
    [60, 60, 60, 60]
  )
})
test('Count Up completes exactly eight rounds and detects tied winners', () => {
  const g = ready('countup', 2)
  for (let turn = 0; turn < 16; turn++) {
    for (let i = 0; i < 3; i++) hit(g, 0, 0.07)
    if (turn < 15) {
      assert.equal(g.phase, 'playing')
      g.next(g.activePlayer.id, g.seq)
    }
  }
  assert.equal(g.phase, 'complete')
  assert.equal(g.winner, 'tie')
  assert.equal(g.players[0].throws, 24)
  assert.equal(g.players[0].score, 480)
})
test('Cricket closes all targets, scores overflow only against open opponents and requires score leadership', () => {
  const g = ready('cricket', 2)
  hit(g, 0, 0.103)
  assert.equal(g.players[0].marks[20], 3)
  hit(g, 0, 0.103)
  assert.equal(g.players[0].score, 60)
  g.players[1].marks[20] = 3
  hit(g, 0, 0.103)
  assert.equal(g.players[0].score, 60)
  g.next('p0', g.seq)
  for (let i = 0; i < 3; i++) hit(g, 0.2, 0)
  g.next('p1', g.seq)
  g.players[0].marks = Object.fromEntries(CRICKET_TARGETS.map(n => [n, 3]))
  g.players[0].marks[25] = 1
  g.players[1].score = 200
  hit(g, 0, 0)
  assert.equal(g.phase, 'playing')
  g.players[0].score = 200
  hit(g, 0, 0)
  assert.equal(g.winner, 'p0')
})
test('leaving/disconnecting during flight cancels it and transfers host/turn safely', () => {
  const g = ready('countup', 2)
  assert.equal(g.throw('p0', DEFAULT_AIM, g.seq, RELEASE), true)
  assert.equal(g.leave('p0'), true)
  assert.equal(g.flight, null)
  assert.equal(g.activePlayer.id, 'p1')
  assert.equal(g.host, 'p1')
  assert.equal(g.leave('p1'), true)
  assert.equal(g.phase, 'lobby')
  assert.equal(g.players.length, 0)
  assert.equal(g.join('p2', 'New host'), true)
  assert.equal(g.start('p2'), true)
})
test('game controller uses the current stance/view, clamps power and emits sequence-checked commands', () => {
  const g = ready()
  const c = new DartsController('p0')
  c.receive(g.snapshot())
  c.focus()
  c.input({ position: [0, 0, 2.37], direction: [0, 0, -1] }, 0)
  const before = c.pose().reticle
  c.input({ right: 1, up: 1, power: 1000 }, 0.05)
  assert.equal(c.aim.speed, 12)
  assert.ok(c.aim.yaw > 0)
  assert.ok(c.aim.pitch > DEFAULT_AIM.pitch)
  assert.notDeepEqual(c.pose().reticle, before)
  const command = c.command('throw')
  assert.equal(command.type, 'throw')
  assert.equal(command.seq, g.seq)
  assert.equal(c.command('throw'), null)
  assert.equal(g.throw('p0', command.aim, command.seq, c.pose().held.position), true)
  c.receive(g.snapshot())
  assert.equal(c.canThrow, false)
  c.exit()
  assert.equal(c.command('throw'), null)
})
test('flight results are independent of renderer frame rate', () => {
  const a = ready()
  const b = ready()
  for (const g of [a, b]) assert.equal(g.throw('p0', aimAt(0.08, -0.06), g.seq, RELEASE), true)
  while (a.flight) a.step(STEP)
  while (b.flight) b.step(1 / 27)
  assert.deepEqual(a.lastHit, b.lastHit)
  assert.deepEqual(a.darts[0].impact, b.darts[0].impact)
})

test('changing stance changes actual flight; distance and sideways position are unrestricted', () => {
  const near = releaseFrom([0, 0, 1.5], DEFAULT_AIM)
  const far = releaseFrom([0.6, 0, 8], DEFAULT_AIM)
  const a = launch(DEFAULT_AIM, near)
  const b = launch(DEFAULT_AIM, far)
  assert.notDeepEqual(a.origin, b.origin)
  assert.notDeepEqual(a.impact, b.impact)
  close(b.origin[0], 0.6)
  close(b.origin[2], 7.73)
  assert.equal(b.surface, 'floor')
  const game = ready()
  assert.equal(game.throw('p0', DEFAULT_AIM, game.seq, far), true)
  assert.deepEqual(game.flight.origin, far)
  assert.equal(launch(DEFAULT_AIM), null)
  assert.equal(launch(DEFAULT_AIM, [NaN, 1.55, 2]), null)
})

test('looking away, sideways or standing behind the board never produces a negative flight time or scores a rear hit', () => {
  for (const [origin, yaw] of [
    [[0, 1.55, 2], Math.PI],
    [[0, 1.55, 2], Math.PI / 2],
    [[0, 1.55, -2], Math.PI],
  ]) {
    const shot = launch({ ...DEFAULT_AIM, yaw }, origin)
    assert.ok(shot.duration > 0 && Number.isFinite(shot.duration))
    assert.equal(shot.surface, 'floor')
    assert.equal(sampleFlight(shot, shot.duration).landed, true)
  }
  const elevated = launch(DEFAULT_AIM, releaseFrom([0, 3, 12], DEFAULT_AIM), 3)
  assert.equal(elevated.surface, 'floor')
  close(elevated.impact[1], 3)
})
