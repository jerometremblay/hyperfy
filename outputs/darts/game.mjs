// apps/darts/vendor/dart-room/darts.ts
var SEGMENTS = [
  20,
  1,
  18,
  4,
  13,
  6,
  10,
  15,
  2,
  17,
  3,
  19,
  7,
  16,
  8,
  11,
  14,
  9,
  12,
  5
];
var CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25];
var BOARD = Object.freeze({
  // Adaptation: regulation steel-tip radii, in metres.
  bull: 635e-5,
  outerBull: 0.0159,
  tripleInner: 0.099,
  tripleOuter: 0.107,
  doubleInner: 0.162,
  doubleOuter: 0.17
});
function countUpWinnerIndex(scores) {
  if (scores.length === 0) return null;
  const highestScore = Math.max(...scores);
  const leaders = scores.map((score, index) => ({ score, index })).filter(({ score }) => score === highestScore);
  return leaders.length === 1 ? leaders[0].index : null;
}
var FULL_CIRCLE = Math.PI * 2;
var SEGMENT_ANGLE = FULL_CIRCLE / SEGMENTS.length;
function normalizeAngle(angle) {
  return (angle % FULL_CIRCLE + FULL_CIRCLE) % FULL_CIRCLE;
}
function scoreImpact(x, y) {
  const radius = Math.hypot(x, y);
  if (radius > BOARD.doubleOuter) {
    return { x, y, base: 0, multiplier: 0, score: 0, ring: "miss", label: "Miss" };
  }
  if (radius <= BOARD.bull) {
    return { x, y, base: 25, multiplier: 2, score: 50, ring: "bull", label: "Bullseye \xB7 50" };
  }
  if (radius <= BOARD.outerBull) {
    return { x, y, base: 25, multiplier: 1, score: 25, ring: "outer-bull", label: "Outer bull \xB7 25" };
  }
  const clockwiseFromTop = normalizeAngle(Math.atan2(x, y));
  const segmentIndex = Math.floor((clockwiseFromTop + SEGMENT_ANGLE / 2) / SEGMENT_ANGLE) % SEGMENTS.length;
  const base = SEGMENTS[segmentIndex];
  if (radius >= BOARD.doubleInner) {
    return { x, y, base, multiplier: 2, score: base * 2, ring: "double", label: `Double ${base} \xB7 ${base * 2}` };
  }
  if (radius >= BOARD.tripleInner && radius <= BOARD.tripleOuter) {
    return { x, y, base, multiplier: 3, score: base * 3, ring: "triple", label: `Triple ${base} \xB7 ${base * 3}` };
  }
  return { x, y, base, multiplier: 1, score: base, ring: "single", label: `${base}` };
}
function createCricketMarks() {
  return Object.fromEntries(CRICKET_TARGETS.map((target) => [target, 0]));
}
function isCricketTarget(base) {
  return CRICKET_TARGETS.includes(base);
}
function hasClosedCricket(marks) {
  return CRICKET_TARGETS.every((target) => (marks[target] ?? 0) >= 3);
}
function applyThreeOhOneHit(currentScore, visitStartScore, hit, doubleOut) {
  const remaining = currentScore - hit.score;
  const validFinish = hit.ring === "double" || hit.ring === "bull";
  const bust = remaining < 0 || doubleOut && remaining === 1 || remaining === 0 && doubleOut && !validFinish;
  return {
    score: bust ? visitStartScore : remaining,
    bust,
    won: !bust && remaining === 0
  };
}
function applyCricketHit(marks, score, base, multiplier, canScore) {
  if (!isCricketTarget(base)) return { marks, score, overflow: 0 };
  const before = marks[base] ?? 0;
  const afterRaw = before + multiplier;
  const nextMarks = Math.min(3, afterRaw);
  const overflow = Math.max(0, afterRaw - 3);
  return {
    score: score + (canScore ? overflow * base : 0),
    marks: { ...marks, [base]: nextMarks },
    overflow
  };
}
function targetCoordinates(target) {
  if (target.base === 25) {
    return { x: 0, y: target.multiplier === 2 ? 0 : 0.011 };
  }
  const index = SEGMENTS.indexOf(target.base);
  const safeIndex = index < 0 ? 0 : index;
  const clockwiseFromTop = safeIndex * SEGMENT_ANGLE;
  const radius = target.multiplier === 3 ? (BOARD.tripleInner + BOARD.tripleOuter) / 2 : target.multiplier === 2 ? (BOARD.doubleInner + BOARD.doubleOuter) / 2 : 0.135;
  return {
    x: Math.sin(clockwiseFromTop) * radius,
    y: Math.cos(clockwiseFromTop) * radius
  };
}
function chooseAiTarget(mode, player, opponents, doubleOut = true) {
  if (mode === "countup") return { base: 20, multiplier: 3 };
  if (mode === "301") {
    if (!doubleOut) {
      if (player.score <= 20) return { base: Math.max(1, player.score), multiplier: 1 };
      if (player.score === 25) return { base: 25, multiplier: 1 };
      if (player.score === 50) return { base: 25, multiplier: 2 };
      if (player.score <= 40 && player.score % 2 === 0) {
        return { base: player.score / 2, multiplier: 2 };
      }
      if (player.score <= 60 && player.score % 3 === 0) {
        return { base: player.score / 3, multiplier: 3 };
      }
      if (player.score <= 40) return { base: player.score - 20, multiplier: 1 };
      if (player.score <= 60) return { base: player.score - 40, multiplier: 1 };
      return { base: 20, multiplier: 3 };
    }
    if (player.score === 50) return { base: 25, multiplier: 2 };
    if (player.score > 1 && player.score <= 40 && player.score % 2 === 0) {
      return { base: player.score / 2, multiplier: 2 };
    }
    if (player.score > 1 && player.score <= 40) {
      return { base: 1, multiplier: 1 };
    }
    if (player.score <= 60) {
      const leaveForty = player.score - 40;
      if (leaveForty > 0 && SEGMENTS.includes(leaveForty)) {
        return { base: leaveForty, multiplier: 1 };
      }
    }
    if (player.score === 61) return { base: 11, multiplier: 1 };
    return { base: 20, multiplier: 3 };
  }
  const openTarget = CRICKET_TARGETS.find((target) => (player.marks[target] ?? 0) < 3);
  if (openTarget) {
    return openTarget === 25 ? { base: 25, multiplier: 2 } : { base: openTarget, multiplier: 3 };
  }
  const scoringTarget = CRICKET_TARGETS.find(
    (target) => opponents.some((opponent) => (opponent.marks[target] ?? 0) < 3)
  );
  return scoringTarget === 25 ? { base: 25, multiplier: 2 } : { base: scoringTarget ?? 20, multiplier: 3 };
}
function gaussian(random) {
  const a = Math.max(Number.EPSILON, random());
  const b = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(FULL_CIRCLE * b);
}
function makeAiImpact(target, difficulty, random = Math.random) {
  const center = targetCoordinates(target);
  const spread = difficulty === "pro" ? 6e-3 : difficulty === "pub" ? 0.013 : 0.025;
  return {
    x: center.x + gaussian(random) * spread,
    y: center.y + gaussian(random) * spread
  };
}
function createSeededRandom(seed = 1597463007) {
  let state = seed >>> 0;
  return () => {
    state = Math.imul(state, 1664525) + 1013904223 >>> 0;
    return state / 4294967296;
  };
}
function describeMarks(value) {
  if (value <= 0) return "Open";
  if (value === 1) return "One mark";
  if (value === 2) return "Two marks";
  return "Closed";
}
function formatMark(value) {
  if (value <= 0) return "\u2014";
  if (value === 1) return "/";
  if (value === 2) return "\xD7";
  return "\u2297";
}

// apps/darts/vendor/bananadarts/flight.js
var GRAVITY = 9.81;
function positionAt(origin, velocity, time) {
  return [
    origin[0] + velocity[0] * time,
    origin[1] + velocity[1] * time - GRAVITY * time * time / 2,
    origin[2] + velocity[2] * time
  ];
}
function velocityAt(velocity, time) {
  return [velocity[0], velocity[1] - GRAVITY * time, velocity[2]];
}
function boundaryTime(origin, velocity, floorHeight = 0) {
  const board = origin[2] > 0 && velocity[2] < -1e-9 ? -origin[2] / velocity[2] : Infinity;
  const height = Math.max(0, origin[1] - floorHeight);
  const floor = (velocity[1] + Math.sqrt(velocity[1] ** 2 + 2 * GRAVITY * height)) / GRAVITY;
  return { time: Math.min(board, floor), surface: board <= floor ? "board" : "floor" };
}

// apps/darts/throw.js
var THROW_RELEASE = 0.45;

// apps/darts/game.js
var MODES = ["countup", "301", "501", "cricket"];
var BULL_HEIGHT = 1.73;
var STEP = 1 / 120;
var DEFAULT_AIM = { yaw: 0, pitch: 0.299, speed: 7 };
var clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function validAim(aim) {
  return !!aim && [aim.yaw, aim.pitch, aim.speed].every(Number.isFinite) && Math.abs(aim.yaw) <= Math.PI && Math.abs(aim.pitch) <= Math.PI / 2 && aim.speed >= 4 && aim.speed <= 12;
}
function validPosition(position) {
  return Array.isArray(position) && position.length === 3 && position.every(Number.isFinite);
}
function releaseFrom(position, aim) {
  if (!validPosition(position) || !validAim(aim)) return null;
  return [position[0] + Math.sin(aim.yaw) * 0.27, position[1] + 1.55, position[2] - Math.cos(aim.yaw) * 0.27];
}
function launch(aim, origin, floorHeight = 0) {
  if (!validAim(aim) || !validPosition(origin) || !Number.isFinite(floorHeight)) return null;
  const velocity = [
    Math.sin(aim.yaw) * Math.cos(aim.pitch) * aim.speed,
    Math.sin(aim.pitch) * aim.speed,
    -Math.cos(aim.yaw) * Math.cos(aim.pitch) * aim.speed
  ];
  const boundary = boundaryTime(origin, velocity, floorHeight);
  if (!Number.isFinite(boundary.time) || boundary.time < 0) return null;
  const impact = positionAt(origin, velocity, boundary.time);
  impact[boundary.surface === "board" ? 2 : 1] = boundary.surface === "board" ? 0 : floorHeight;
  if (!validPosition(impact)) return null;
  return { origin: [...origin], velocity, duration: boundary.time, surface: boundary.surface, impact };
}
function sampleFlight(shot, time) {
  const elapsed = clamp(time, 0, shot.duration);
  return {
    position: elapsed === shot.duration ? [...shot.impact] : positionAt(shot.origin, shot.velocity, elapsed),
    direction: velocityAt(shot.velocity, elapsed),
    landed: elapsed >= shot.duration
  };
}
function newPlayer(id, name, mode) {
  return {
    id,
    name: String(name || "Player").slice(0, 32),
    score: mode === "301" ? 301 : mode === "501" ? 501 : 0,
    marks: createCricketMarks(),
    throws: 0
  };
}
var DartsGame = class {
  constructor() {
    this.seq = 0;
    this.mode = "countup";
    this.phase = "lobby";
    this.players = [];
    this.turn = 0;
    this.round = 1;
    this.visit = 0;
    this.visitStart = 0;
    this.darts = [];
    this.flight = null;
    this.windup = null;
    this.lastHit = null;
    this.winner = null;
    this.aim = { ...DEFAULT_AIM };
  }
  get activePlayer() {
    return this.players[this.turn];
  }
  get host() {
    return this.players[0]?.id;
  }
  touch() {
    this.seq++;
  }
  join(id, name) {
    if (this.players.some((p) => p.id === id)) return true;
    if (this.phase !== "lobby" || this.players.length >= 4 || !id) return false;
    this.players.push(newPlayer(id, name, this.mode));
    this.touch();
    return true;
  }
  leave(id) {
    const index = this.players.findIndex((p) => p.id === id);
    if (index < 0) return false;
    const activeLeft = index === this.turn;
    this.players.splice(index, 1);
    if (index < this.turn) this.turn--;
    if (this.turn >= this.players.length) this.turn = 0;
    if (activeLeft) {
      this.flight = null;
      this.windup = null;
      this.visit = 0;
      this.darts = [];
      this.aim = { ...DEFAULT_AIM };
      this.visitStart = this.activePlayer?.score || 0;
    }
    if (!this.players.length) this.reset();
    else this.touch();
    return true;
  }
  configure(id, mode) {
    if (id !== this.host || this.phase !== "lobby" || !MODES.includes(mode)) return false;
    this.mode = mode;
    this.players = this.players.map((p) => newPlayer(p.id, p.name, mode));
    this.touch();
    return true;
  }
  start(id) {
    if (id !== this.host || this.phase !== "lobby" || !this.players.length) return false;
    this.phase = "playing";
    this.visitStart = this.activePlayer.score;
    this.touch();
    return true;
  }
  reset(id) {
    if (this.players.length && id !== this.host) return false;
    this.phase = "lobby";
    this.players = this.players.map((p) => newPlayer(p.id, p.name, this.mode));
    this.turn = 0;
    this.round = 1;
    this.visit = 0;
    this.visitStart = this.players[0]?.score || 0;
    this.flight = null;
    this.windup = null;
    this.darts = [];
    this.lastHit = null;
    this.winner = null;
    this.aim = { ...DEFAULT_AIM };
    this.touch();
    return true;
  }
  setAim(id, aim) {
    if (this.phase !== "playing" || id !== this.activePlayer?.id || this.flight || this.windup || this.visit >= 3 || !validAim(aim))
      return false;
    this.aim = { yaw: aim.yaw, pitch: aim.pitch, speed: aim.speed };
    return true;
  }
  throw(id, aim, seq, origin, floorHeight = 0) {
    const shot = launch(aim, origin, floorHeight);
    if (!shot || seq !== this.seq || !this.setAim(id, aim)) return false;
    this.flight = { ...shot, time: 0, playerId: id };
    this.touch();
    return true;
  }
  beginThrow(id, aim, seq) {
    if (seq !== this.seq || !this.setAim(id, aim)) return false;
    this.windup = { playerId: id, aim: { ...aim }, time: 0, duration: THROW_RELEASE, id: this.seq + 1 };
    this.touch();
    return true;
  }
  stepWindup(dt, position) {
    if (!this.windup || !Number.isFinite(dt) || dt <= 0) return false;
    this.windup.time = Math.min(this.windup.duration, this.windup.time + dt);
    if (this.windup.time + 1e-8 < this.windup.duration) return true;
    const { playerId, aim } = this.windup;
    this.windup = null;
    if (!validPosition(position)) {
      this.touch();
      return false;
    }
    return this.throw(playerId, aim, this.seq, releaseFrom(position, aim), position[1]);
  }
  step(dt = STEP) {
    if (!this.flight || !Number.isFinite(dt) || dt <= 0) return false;
    this.flight.time = Math.min(this.flight.duration, this.flight.time + dt);
    if (this.flight.time < this.flight.duration) return true;
    const shot = this.flight;
    const hit = shot.surface === "board" ? scoreImpact(shot.impact[0], shot.impact[1] - BULL_HEIGHT) : { x: shot.impact[0], y: -BULL_HEIGHT, base: 0, multiplier: 0, score: 0, ring: "miss", label: "Miss" };
    const player = this.activePlayer;
    player.throws++;
    this.visit++;
    this.darts.push({ ...shot, hit });
    this.flight = null;
    this.lastHit = { ...hit, playerId: player.id };
    if (this.mode === "301" || this.mode === "501") {
      const result = applyThreeOhOneHit(player.score, this.visitStart, hit, true);
      player.score = result.score;
      if (result.bust) {
        this.visit = 3;
        this.lastHit.label = "Bust \xB7 visit score restored";
      }
      if (result.won) this.finish(player.id);
    } else if (this.mode === "cricket") {
      const canScore = this.players.some((p) => p.id !== player.id && (p.marks[hit.base] || 0) < 3);
      const result = applyCricketHit(player.marks, player.score, hit.base, hit.multiplier, canScore);
      player.score = result.score;
      player.marks = result.marks;
      if (hasClosedCricket(player.marks) && this.players.every((p) => p.score <= player.score)) this.finish(player.id);
    } else {
      player.score += hit.score;
      if (this.round === 8 && this.visit === 3 && this.turn === this.players.length - 1) {
        const high = Math.max(...this.players.map((p) => p.score));
        const leaders = this.players.filter((p) => p.score === high);
        this.finish(leaders.length === 1 ? leaders[0].id : "tie");
      }
    }
    this.touch();
    return true;
  }
  finish(winner) {
    this.phase = "complete";
    this.winner = winner;
  }
  next(id, seq) {
    if (seq !== this.seq || id !== this.activePlayer?.id || this.phase !== "playing" || this.flight || this.windup || this.visit < 3)
      return false;
    this.turn++;
    if (this.turn >= this.players.length) {
      this.turn = 0;
      this.round++;
    }
    this.visit = 0;
    this.visitStart = this.activePlayer.score;
    this.darts = [];
    this.aim = { ...DEFAULT_AIM };
    this.touch();
    return true;
  }
  snapshot() {
    return {
      seq: this.seq,
      mode: this.mode,
      phase: this.phase,
      host: this.host || null,
      players: this.players.map((p) => ({ ...p, marks: { ...p.marks } })),
      turn: this.turn,
      round: this.round,
      visit: this.visit,
      aim: { ...this.aim },
      windup: this.windup ? { ...this.windup, aim: { ...this.windup.aim } } : null,
      darts: this.darts.map((d) => ({ ...d, origin: [...d.origin], velocity: [...d.velocity], impact: [...d.impact] })),
      flight: this.flight ? {
        ...this.flight,
        origin: [...this.flight.origin],
        velocity: [...this.flight.velocity],
        impact: [...this.flight.impact]
      } : null,
      lastHit: this.lastHit ? { ...this.lastHit } : null,
      winner: this.winner
    };
  }
};
function scoreboard(state) {
  if (!state) return "DARTS\nPress E to join";
  const title = state.mode === "countup" ? "COUNT UP \xB7 8 rounds" : state.mode.toUpperCase();
  const rows = state.players.map(
    (p, i) => `${state.phase === "playing" && i === state.turn ? "\u203A " : ""}${p.name}  ${p.score}` + (state.mode === "cricket" ? "\n" + CRICKET_TARGETS.map((n) => `${n === 25 ? "B" : n}:${["\u2013", "/", "\xD7", "\u25CF"][p.marks[n]]}`).join(" ") : "")
  );
  let status = state.phase === "lobby" ? "Join, choose a mode, then start" : state.phase === "complete" ? state.winner === "tie" ? "Draw" : `${state.players.find((p) => p.id === state.winner)?.name || "Player"} wins` : `Round ${state.round} \xB7 Dart ${Math.min(3, state.visit + 1)} / 3`;
  if (state.phase === "playing" && state.visit === 3) status = "Visit complete \xB7 Space for next player";
  return [title, ...rows, status, state.lastHit?.label || ""].filter(Boolean).join("\n");
}

// apps/darts/controller.js
var DartsController = class {
  constructor(playerId) {
    this.playerId = playerId;
    this.state = null;
    this.focused = false;
    this.pending = false;
    this.aim = { ...DEFAULT_AIM };
    this.offset = { yaw: 0, pitch: DEFAULT_AIM.pitch };
    this.position = null;
    this.direction = [0, 0, -1];
  }
  receive(state) {
    if (!state || this.state && state.seq < this.state.seq) return false;
    if (this.state && state.seq > this.state.seq) this.pending = false;
    if (!this.state || this.state.turn !== state.turn || state.visit === 0 && this.state.visit !== 0)
      this.offset = { yaw: 0, pitch: DEFAULT_AIM.pitch };
    this.state = state;
    return true;
  }
  get member() {
    return this.state?.players.some((p) => p.id === this.playerId);
  }
  get canThrow() {
    const s = this.state;
    return this.focused && !!this.position && !this.pending && s?.phase === "playing" && s.players[s.turn]?.id === this.playerId && !s.flight && !s.windup && s.visit < 3;
  }
  focus() {
    this.focused = true;
    return this.member ? null : { type: "join" };
  }
  exit() {
    this.focused = false;
    this.pending = false;
  }
  command(key) {
    const s = this.state;
    if (!this.focused || !s || this.pending) return null;
    if (key === "leave") return { type: "leave" };
    if (key === "reset" && s.host === this.playerId && !s.flight && !s.windup) return { type: "reset", seq: s.seq };
    if (key === "mode" && s.host === this.playerId && s.phase === "lobby")
      return { type: "mode", mode: MODES[(MODES.indexOf(s.mode) + 1) % MODES.length], seq: s.seq };
    if (key !== "throw") return null;
    if (s.phase === "lobby" && s.host === this.playerId) return { type: "start", seq: s.seq };
    if (s.phase === "playing" && s.players[s.turn]?.id === this.playerId && !s.flight && !s.windup && s.visit >= 3)
      return { type: "next", seq: s.seq };
    if (!this.canThrow) return null;
    this.pending = true;
    return { type: "throw", seq: s.seq, aim: { ...this.aim } };
  }
  input(raw, dt) {
    if (validPosition(raw.position)) this.position = [...raw.position];
    if (validPosition(raw.direction) && Math.hypot(...raw.direction) > 0) this.direction = [...raw.direction];
    if (!Number.isFinite(dt) || dt < 0) return;
    const elapsed = Math.min(dt, 0.05);
    if (this.canThrow) {
      this.offset.yaw = clamp(this.offset.yaw + (raw.right || 0) * elapsed * 0.1, -Math.PI, Math.PI);
      this.offset.pitch = clamp(this.offset.pitch + (raw.up || 0) * elapsed * 0.1, -Math.PI / 2, Math.PI / 2);
      this.aim.speed = clamp(this.aim.speed + (raw.power || 0) * elapsed * 1.5, 4, 12);
    }
    const [x, y, z] = this.direction;
    const yaw = Math.atan2(x, -z) + this.offset.yaw;
    this.aim.yaw = Math.atan2(Math.sin(yaw), Math.cos(yaw));
    this.aim.pitch = clamp(Math.atan2(y, Math.hypot(x, z)) + this.offset.pitch, -Math.PI / 2, Math.PI / 2);
  }
  pose() {
    if (!this.position) return null;
    const shot = launch(this.aim, releaseFrom(this.position, this.aim), this.position[1]);
    return {
      reticle: [shot.impact[0], shot.impact[1] + (shot.surface === "floor" ? 3e-3 : 0), shot.impact[2] + 0.028],
      held: { position: shot.origin, direction: shot.velocity }
    };
  }
  frame(state, elapsed = 0) {
    const shots = [...state.darts];
    if (state.flight) shots.push({ ...state.flight, time: state.flight.time + elapsed });
    return shots.map((shot) => ({ ...sampleFlight(shot, shot.time), playerId: shot.playerId }));
  }
  hud() {
    const s = this.state;
    const help = s?.phase === "lobby" ? "Space: start \xB7 M: mode \xB7 Esc: exit \xB7 X: leave match" : s?.phase === "complete" ? "R: new match \xB7 Esc: exit \xB7 X: leave match" : this.canThrow ? `Look: aim \xB7 Arrows: adjust \xB7 Q/Z: power ${this.aim.speed.toFixed(1)} m/s
WASD: move \xB7 Wheel: camera zoom
Space: throw \xB7 Esc: exit \xB7 X: leave match` : s?.players[s.turn]?.id === this.playerId && s?.visit >= 3 ? "Space: next visit \xB7 Esc: exit" : "Watching \xB7 Esc: exit \xB7 X: leave match";
    const active = s?.players[s.turn];
    const status = s?.phase === "playing" ? `${s.mode.toUpperCase()} \xB7 ${active?.name || "Player"}: ${active?.score || 0} \xB7 Round ${s.round} \xB7 Dart ${Math.min(3, s.visit + 1)} / 3` : scoreboard(s);
    return [status, s?.phase === "playing" ? s.lastHit?.label : "", help].filter(Boolean).join("\n");
  }
};

// apps/darts/server.js
function startServer(world, app) {
  const game = new DartsGame();
  let updating = false;
  let accumulator = 0;
  let sincePublish = 0;
  const publish = () => {
    app.state.darts = game.snapshot();
    app.send("darts:state", app.state.darts);
  };
  const playerFor = (sender) => world.getPlayers().find((p) => p.networkId === sender);
  const playerPosition = (player) => {
    const local = player.position.clone().sub(app.position).applyQuaternion(app.quaternion.clone().invert());
    local.x /= app.scale.x;
    local.y /= app.scale.y;
    local.z /= app.scale.z;
    return local.toArray();
  };
  const update = (dt) => {
    if (!Number.isFinite(dt) || dt <= 0) return;
    accumulator = Math.min(accumulator + dt, 0.25);
    while (accumulator >= STEP && (game.flight || game.windup)) {
      if (game.windup) {
        const thrower = world.getPlayers().find((player) => player.id === game.windup.playerId);
        game.stepWindup(STEP, thrower ? playerPosition(thrower) : null);
      } else game.step();
      accumulator -= STEP;
    }
    sincePublish += dt;
    if (sincePublish >= 0.05 || !game.flight && !game.windup) {
      sincePublish = 0;
      publish();
    }
    if (!game.flight && !game.windup) {
      app.off("update", update);
      updating = false;
      accumulator = 0;
    }
  };
  const wake = () => {
    if ((game.flight || game.windup) && !updating) {
      updating = true;
      app.on("update", update);
    }
    if (!game.flight && !game.windup && updating) {
      updating = false;
      app.off("update", update);
      accumulator = 0;
    }
  };
  app.on("darts:command", (request, sender) => {
    const player = playerFor(sender);
    if (!player || !request || typeof request !== "object") return;
    if (request.type === "sync") {
      app.sendTo(player.id, "darts:state", game.snapshot());
      return;
    }
    let accepted = false;
    if (request.type === "leave") accepted = game.leave(player.id);
    else {
      if (request.type === "join") accepted = game.join(player.id, player.name);
      else if (request.type === "aim") accepted = game.setAim(player.id, request.aim);
      else if (request.seq === game.seq) {
        if (request.type === "mode") accepted = game.configure(player.id, request.mode);
        if (request.type === "start") accepted = game.start(player.id);
        if (request.type === "reset") accepted = game.reset(player.id);
        if (request.type === "next") accepted = game.next(player.id, request.seq);
        if (request.type === "throw") {
          accepted = game.beginThrow(player.id, request.aim, request.seq);
        }
      }
    }
    if (request.type === "aim") return;
    if (accepted) {
      publish();
      wake();
    } else
      app.sendTo(player.id, "darts:rejected", {
        state: game.snapshot(),
        message: request.type === "join" && game.phase !== "lobby" ? "Match in progress \xB7 watch or join the next lobby" : "Action unavailable \xB7 state refreshed"
      });
  });
  const onLeave = ({ playerId }) => {
    if (game.leave(playerId)) {
      publish();
      wake();
    }
  };
  world.on("leave", onLeave);
  app.on("destroy", () => {
    app.off("update", update);
    world.off("leave", onLeave);
  });
  publish();
  return game;
}
export {
  BOARD,
  BULL_HEIGHT,
  CRICKET_TARGETS,
  DEFAULT_AIM,
  DartsController,
  DartsGame,
  GRAVITY,
  MODES,
  SEGMENTS,
  STEP,
  applyCricketHit,
  applyThreeOhOneHit,
  boundaryTime,
  chooseAiTarget,
  clamp,
  countUpWinnerIndex,
  createCricketMarks,
  createSeededRandom,
  describeMarks,
  formatMark,
  hasClosedCricket,
  isCricketTarget,
  launch,
  makeAiImpact,
  positionAt,
  releaseFrom,
  sampleFlight,
  scoreImpact,
  scoreboard,
  startServer,
  targetCoordinates,
  validAim,
  validPosition,
  velocityAt
};
