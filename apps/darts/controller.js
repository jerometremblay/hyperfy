// The game owns control semantics. Adapters supply raw input and consume poses/commands.
import { clamp, DEFAULT_AIM, MODES, launch, releaseFrom, validPosition, sampleFlight, scoreboard } from './game.js'

export class DartsController {
  constructor(playerId) {
    this.playerId = playerId
    this.state = null
    this.focused = false
    this.pending = false
    this.aim = { ...DEFAULT_AIM }
    this.offset = { yaw: 0, pitch: DEFAULT_AIM.pitch }
    this.position = null
    this.direction = [0, 0, -1]
  }
  receive(state) {
    if (!state || (this.state && state.seq < this.state.seq)) return false
    if (this.state && state.seq > this.state.seq) this.pending = false
    if (!this.state || this.state.turn !== state.turn || (state.visit === 0 && this.state.visit !== 0))
      this.offset = { yaw: 0, pitch: DEFAULT_AIM.pitch }
    this.state = state
    return true
  }
  get member() {
    return this.state?.players.some(p => p.id === this.playerId)
  }
  get canThrow() {
    const s = this.state
    return (
      this.focused &&
      !!this.position &&
      !this.pending &&
      s?.phase === 'playing' &&
      s.players[s.turn]?.id === this.playerId &&
      !s.flight &&
      !s.windup &&
      s.visit < 3
    )
  }
  focus() {
    this.focused = true
    return this.member ? null : { type: 'join' }
  }
  exit() {
    this.focused = false
    this.pending = false
  }
  command(key) {
    const s = this.state
    if (!this.focused || !s || this.pending) return null
    if (key === 'leave') return { type: 'leave' }
    if (key === 'reset' && s.host === this.playerId && !s.flight && !s.windup) return { type: 'reset', seq: s.seq }
    if (key === 'mode' && s.host === this.playerId && s.phase === 'lobby')
      return { type: 'mode', mode: MODES[(MODES.indexOf(s.mode) + 1) % MODES.length], seq: s.seq }
    if (key !== 'throw') return null
    if (s.phase === 'lobby' && s.host === this.playerId) return { type: 'start', seq: s.seq }
    if (s.phase === 'playing' && s.players[s.turn]?.id === this.playerId && !s.flight && !s.windup && s.visit >= 3)
      return { type: 'next', seq: s.seq }
    if (!this.canThrow) return null
    this.pending = true
    return { type: 'throw', seq: s.seq, aim: { ...this.aim } }
  }
  input(raw, dt) {
    if (validPosition(raw.position)) this.position = [...raw.position]
    if (validPosition(raw.direction) && Math.hypot(...raw.direction) > 0) this.direction = [...raw.direction]
    if (!Number.isFinite(dt) || dt < 0) return
    const elapsed = Math.min(dt, 0.05)
    if (this.canThrow) {
      this.offset.yaw = clamp(this.offset.yaw + (raw.right || 0) * elapsed * 0.1, -Math.PI, Math.PI)
      this.offset.pitch = clamp(this.offset.pitch + (raw.up || 0) * elapsed * 0.1, -Math.PI / 2, Math.PI / 2)
      this.aim.speed = clamp(this.aim.speed + (raw.power || 0) * elapsed * 1.5, 4, 12)
    }
    const [x, y, z] = this.direction
    const yaw = Math.atan2(x, -z) + this.offset.yaw
    this.aim.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw))
    this.aim.pitch = clamp(Math.atan2(y, Math.hypot(x, z)) + this.offset.pitch, -Math.PI / 2, Math.PI / 2)
  }
  pose() {
    if (!this.position) return null
    const shot = launch(this.aim, releaseFrom(this.position, this.aim), this.position[1])
    // Aim preview is computed by the same ballistic model as the real throw.
    return {
      reticle: [shot.impact[0], shot.impact[1] + (shot.surface === 'floor' ? 0.003 : 0), shot.impact[2] + 0.028],
      held: { position: shot.origin, direction: shot.velocity },
    }
  }
  frame(state, elapsed = 0) {
    const shots = [...state.darts]
    if (state.flight) shots.push({ ...state.flight, time: state.flight.time + elapsed })
    return shots.map(shot => ({ ...sampleFlight(shot, shot.time), playerId: shot.playerId }))
  }
  hud() {
    const s = this.state
    const help =
      s?.phase === 'lobby'
        ? 'Space: start · M: mode · Esc: exit · X: leave match'
        : s?.phase === 'complete'
          ? 'R: new match · Esc: exit · X: leave match'
          : this.canThrow
            ? `Look: aim · Arrows: adjust · Q/Z: power ${this.aim.speed.toFixed(1)} m/s\nWASD: move · Wheel: camera zoom\nSpace: throw · Esc: exit · X: leave match`
            : s?.players[s.turn]?.id === this.playerId && s?.visit >= 3
              ? 'Space: next visit · Esc: exit'
              : 'Watching · Esc: exit · X: leave match'
    const active = s?.players[s.turn]
    const status =
      s?.phase === 'playing'
        ? `${s.mode.toUpperCase()} · ${active?.name || 'Player'}: ${active?.score || 0} · Round ${s.round} · Dart ${Math.min(3, s.visit + 1)} / 3`
        : scoreboard(s)
    return [status, s?.phase === 'playing' ? s.lastHit?.label : '', help].filter(Boolean).join('\n')
  }
}
