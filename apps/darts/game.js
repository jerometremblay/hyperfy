// Standalone game: SI units, Y up, +X right, board front +Z; throws travel -Z.
// No Hyperfy, renderer, PhysX, network, timers, or browser dependencies.
import {
  scoreImpact,
  applyThreeOhOneHit,
  applyCricketHit,
  createCricketMarks,
  hasClosedCricket,
  CRICKET_TARGETS,
} from './vendor/dart-room/darts.ts'
import { boundaryTime, positionAt, velocityAt } from './vendor/bananadarts/flight.js'
import { THROW_RELEASE } from './throw.js'

export const MODES = ['countup', '301', '501', 'cricket']
export const BULL_HEIGHT = 1.73
export const STEP = 1 / 120
export const DEFAULT_AIM = { yaw: 0, pitch: 0.299, speed: 7 }
export const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n))

export function validAim(aim) {
  return (
    !!aim &&
    [aim.yaw, aim.pitch, aim.speed].every(Number.isFinite) &&
    Math.abs(aim.yaw) <= Math.PI &&
    Math.abs(aim.pitch) <= Math.PI / 2 &&
    aim.speed >= 4 &&
    aim.speed <= 12
  )
}

export function validPosition(position) {
  return Array.isArray(position) && position.length === 3 && position.every(Number.isFinite)
}

export function releaseFrom(position, aim) {
  if (!validPosition(position) || !validAim(aim)) return null
  return [position[0] + Math.sin(aim.yaw) * 0.27, position[1] + 1.55, position[2] - Math.cos(aim.yaw) * 0.27]
}

export function launch(aim, origin, floorHeight = 0) {
  if (!validAim(aim) || !validPosition(origin) || !Number.isFinite(floorHeight)) return null
  const velocity = [
    Math.sin(aim.yaw) * Math.cos(aim.pitch) * aim.speed,
    Math.sin(aim.pitch) * aim.speed,
    -Math.cos(aim.yaw) * Math.cos(aim.pitch) * aim.speed,
  ]
  const boundary = boundaryTime(origin, velocity, floorHeight)
  if (!Number.isFinite(boundary.time) || boundary.time < 0) return null
  const impact = positionAt(origin, velocity, boundary.time)
  impact[boundary.surface === 'board' ? 2 : 1] = boundary.surface === 'board' ? 0 : floorHeight
  if (!validPosition(impact)) return null
  return { origin: [...origin], velocity, duration: boundary.time, surface: boundary.surface, impact }
}

export function sampleFlight(shot, time) {
  const elapsed = clamp(time, 0, shot.duration)
  return {
    position: elapsed === shot.duration ? [...shot.impact] : positionAt(shot.origin, shot.velocity, elapsed),
    direction: velocityAt(shot.velocity, elapsed),
    landed: elapsed >= shot.duration,
  }
}

function newPlayer(id, name, mode) {
  return {
    id,
    name: String(name || 'Player').slice(0, 32),
    score: mode === '301' ? 301 : mode === '501' ? 501 : 0,
    marks: createCricketMarks(),
    throws: 0,
  }
}

export class DartsGame {
  constructor() {
    this.seq = 0
    this.mode = 'countup'
    this.phase = 'lobby'
    this.players = []
    this.turn = 0
    this.round = 1
    this.visit = 0
    this.visitStart = 0
    this.darts = []
    this.flight = null
    this.windup = null
    this.lastHit = null
    this.winner = null
    this.aim = { ...DEFAULT_AIM }
  }
  get activePlayer() {
    return this.players[this.turn]
  }
  get host() {
    return this.players[0]?.id
  }
  touch() {
    this.seq++
  }
  join(id, name) {
    if (this.players.some(p => p.id === id)) return true
    if (this.phase !== 'lobby' || this.players.length >= 4 || !id) return false
    this.players.push(newPlayer(id, name, this.mode))
    this.touch()
    return true
  }
  leave(id) {
    const index = this.players.findIndex(p => p.id === id)
    if (index < 0) return false
    // A departing thrower cannot leave a flight or stale turn behind.
    const activeLeft = index === this.turn
    this.players.splice(index, 1)
    if (index < this.turn) this.turn--
    if (this.turn >= this.players.length) this.turn = 0
    if (activeLeft) {
      this.flight = null
      this.windup = null
      this.visit = 0
      this.darts = []
      this.aim = { ...DEFAULT_AIM }
      this.visitStart = this.activePlayer?.score || 0
    }
    if (!this.players.length) this.reset()
    else this.touch()
    return true
  }
  configure(id, mode) {
    if (id !== this.host || this.phase !== 'lobby' || !MODES.includes(mode)) return false
    this.mode = mode
    this.players = this.players.map(p => newPlayer(p.id, p.name, mode))
    this.touch()
    return true
  }
  start(id) {
    if (id !== this.host || this.phase !== 'lobby' || !this.players.length) return false
    this.phase = 'playing'
    this.visitStart = this.activePlayer.score
    this.touch()
    return true
  }
  reset(id) {
    if (this.players.length && id !== this.host) return false
    this.phase = 'lobby'
    this.players = this.players.map(p => newPlayer(p.id, p.name, this.mode))
    this.turn = 0
    this.round = 1
    this.visit = 0
    this.visitStart = this.players[0]?.score || 0
    this.flight = null
    this.windup = null
    this.darts = []
    this.lastHit = null
    this.winner = null
    this.aim = { ...DEFAULT_AIM }
    this.touch()
    return true
  }
  setAim(id, aim) {
    if (
      this.phase !== 'playing' ||
      id !== this.activePlayer?.id ||
      this.flight ||
      this.windup ||
      this.visit >= 3 ||
      !validAim(aim)
    )
      return false
    this.aim = { yaw: aim.yaw, pitch: aim.pitch, speed: aim.speed }
    // Aim changes never invalidate the sequence of an in-flight throw request.
    return true
  }
  throw(id, aim, seq, origin, floorHeight = 0) {
    const shot = launch(aim, origin, floorHeight)
    if (!shot || seq !== this.seq || !this.setAim(id, aim)) return false
    this.flight = { ...shot, time: 0, playerId: id }
    this.touch()
    return true
  }
  beginThrow(id, aim, seq) {
    if (seq !== this.seq || !this.setAim(id, aim)) return false
    this.windup = { playerId: id, aim: { ...aim }, time: 0, duration: THROW_RELEASE, id: this.seq + 1 }
    this.touch()
    return true
  }
  stepWindup(dt, position) {
    if (!this.windup || !Number.isFinite(dt) || dt <= 0) return false
    this.windup.time = Math.min(this.windup.duration, this.windup.time + dt)
    if (this.windup.time + 1e-8 < this.windup.duration) return true
    const { playerId, aim } = this.windup
    this.windup = null
    if (!validPosition(position)) {
      this.touch()
      return false
    }
    return this.throw(playerId, aim, this.seq, releaseFrom(position, aim), position[1])
  }
  step(dt = STEP) {
    if (!this.flight || !Number.isFinite(dt) || dt <= 0) return false
    this.flight.time = Math.min(this.flight.duration, this.flight.time + dt)
    if (this.flight.time < this.flight.duration) return true
    const shot = this.flight
    const hit =
      shot.surface === 'board'
        ? scoreImpact(shot.impact[0], shot.impact[1] - BULL_HEIGHT)
        : { x: shot.impact[0], y: -BULL_HEIGHT, base: 0, multiplier: 0, score: 0, ring: 'miss', label: 'Miss' }
    const player = this.activePlayer
    player.throws++
    this.visit++
    this.darts.push({ ...shot, hit })
    this.flight = null
    this.lastHit = { ...hit, playerId: player.id }
    if (this.mode === '301' || this.mode === '501') {
      const result = applyThreeOhOneHit(player.score, this.visitStart, hit, true)
      player.score = result.score
      if (result.bust) {
        this.visit = 3
        this.lastHit.label = 'Bust · visit score restored'
      }
      if (result.won) this.finish(player.id)
    } else if (this.mode === 'cricket') {
      const canScore = this.players.some(p => p.id !== player.id && (p.marks[hit.base] || 0) < 3)
      const result = applyCricketHit(player.marks, player.score, hit.base, hit.multiplier, canScore)
      player.score = result.score
      player.marks = result.marks
      if (hasClosedCricket(player.marks) && this.players.every(p => p.score <= player.score)) this.finish(player.id)
    } else {
      player.score += hit.score
      if (this.round === 8 && this.visit === 3 && this.turn === this.players.length - 1) {
        const high = Math.max(...this.players.map(p => p.score))
        const leaders = this.players.filter(p => p.score === high)
        this.finish(leaders.length === 1 ? leaders[0].id : 'tie')
      }
    }
    this.touch()
    return true
  }
  finish(winner) {
    this.phase = 'complete'
    this.winner = winner
  }
  next(id, seq) {
    if (
      seq !== this.seq ||
      id !== this.activePlayer?.id ||
      this.phase !== 'playing' ||
      this.flight ||
      this.windup ||
      this.visit < 3
    )
      return false
    this.turn++
    if (this.turn >= this.players.length) {
      this.turn = 0
      this.round++
    }
    this.visit = 0
    this.visitStart = this.activePlayer.score
    this.darts = []
    this.aim = { ...DEFAULT_AIM }
    this.touch()
    return true
  }
  snapshot() {
    return {
      seq: this.seq,
      mode: this.mode,
      phase: this.phase,
      host: this.host || null,
      players: this.players.map(p => ({ ...p, marks: { ...p.marks } })),
      turn: this.turn,
      round: this.round,
      visit: this.visit,
      aim: { ...this.aim },
      windup: this.windup ? { ...this.windup, aim: { ...this.windup.aim } } : null,
      darts: this.darts.map(d => ({ ...d, origin: [...d.origin], velocity: [...d.velocity], impact: [...d.impact] })),
      flight: this.flight
        ? {
            ...this.flight,
            origin: [...this.flight.origin],
            velocity: [...this.flight.velocity],
            impact: [...this.flight.impact],
          }
        : null,
      lastHit: this.lastHit ? { ...this.lastHit } : null,
      winner: this.winner,
    }
  }
}

export function scoreboard(state) {
  if (!state) return 'DARTS\nPress E to join'
  const title = state.mode === 'countup' ? 'COUNT UP · 8 rounds' : state.mode.toUpperCase()
  const rows = state.players.map(
    (p, i) =>
      `${state.phase === 'playing' && i === state.turn ? '› ' : ''}${p.name}  ${p.score}` +
      (state.mode === 'cricket'
        ? '\n' + CRICKET_TARGETS.map(n => `${n === 25 ? 'B' : n}:${['–', '/', '×', '●'][p.marks[n]]}`).join(' ')
        : '')
  )
  let status =
    state.phase === 'lobby'
      ? 'Join, choose a mode, then start'
      : state.phase === 'complete'
        ? state.winner === 'tie'
          ? 'Draw'
          : `${state.players.find(p => p.id === state.winner)?.name || 'Player'} wins`
        : `Round ${state.round} · Dart ${Math.min(3, state.visit + 1)} / 3`
  if (state.phase === 'playing' && state.visit === 3) status = 'Visit complete · Space for next player'
  return [title, ...rows, status, state.lastHit?.label || ''].filter(Boolean).join('\n')
}
