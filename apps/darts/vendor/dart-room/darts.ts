export const SEGMENTS = [
  20, 1, 18, 4, 13, 6, 10, 15, 2, 17,
  3, 19, 7, 16, 8, 11, 14, 9, 12, 5,
] as const;

export const CRICKET_TARGETS = [20, 19, 18, 17, 16, 15, 25] as const;

export const BOARD = Object.freeze({
  // Adaptation: regulation steel-tip radii, in metres.
  bull: 0.00635,
  outerBull: 0.0159,
  tripleInner: 0.099,
  tripleOuter: 0.107,
  doubleInner: 0.162,
  doubleOuter: 0.170,
});

export type GameMode = "countup" | "301" | "cricket";
export type Difficulty = "rookie" | "pub" | "pro";
export type Ring = "miss" | "single" | "double" | "triple" | "outer-bull" | "bull";

export type HitResult = Readonly<{
  x: number;
  y: number;
  base: number;
  multiplier: number;
  score: number;
  ring: Ring;
  label: string;
}>;

export type AimTarget = Readonly<{
  base: number;
  multiplier: 1 | 2 | 3;
}>;

export type CricketMarks = Readonly<Record<number, number>>;

export type PlayerForAi = Readonly<{
  score: number;
  marks: CricketMarks;
}>;

export type ThreeOhOneResult = Readonly<{
  score: number;
  bust: boolean;
  won: boolean;
}>;

export type CricketHitResult = Readonly<{
  score: number;
  marks: CricketMarks;
  overflow: number;
}>;

export function countUpWinnerIndex(scores: readonly number[]): number | null {
  if (scores.length === 0) return null;
  const highestScore = Math.max(...scores);
  const leaders = scores
    .map((score, index) => ({ score, index }))
    .filter(({ score }) => score === highestScore);
  return leaders.length === 1 ? leaders[0].index : null;
}

const FULL_CIRCLE = Math.PI * 2;
const SEGMENT_ANGLE = FULL_CIRCLE / SEGMENTS.length;

function normalizeAngle(angle: number): number {
  return ((angle % FULL_CIRCLE) + FULL_CIRCLE) % FULL_CIRCLE;
}

export function scoreImpact(x: number, y: number): HitResult {
  const radius = Math.hypot(x, y);

  if (radius > BOARD.doubleOuter) {
    return { x, y, base: 0, multiplier: 0, score: 0, ring: "miss", label: "Miss" };
  }

  if (radius <= BOARD.bull) {
    return { x, y, base: 25, multiplier: 2, score: 50, ring: "bull", label: "Bullseye · 50" };
  }

  if (radius <= BOARD.outerBull) {
    return { x, y, base: 25, multiplier: 1, score: 25, ring: "outer-bull", label: "Outer bull · 25" };
  }

  const clockwiseFromTop = normalizeAngle(Math.atan2(x, y));
  const segmentIndex = Math.floor((clockwiseFromTop + SEGMENT_ANGLE / 2) / SEGMENT_ANGLE) % SEGMENTS.length;
  const base = SEGMENTS[segmentIndex];

  if (radius >= BOARD.doubleInner) {
    return { x, y, base, multiplier: 2, score: base * 2, ring: "double", label: `Double ${base} · ${base * 2}` };
  }

  if (radius >= BOARD.tripleInner && radius <= BOARD.tripleOuter) {
    return { x, y, base, multiplier: 3, score: base * 3, ring: "triple", label: `Triple ${base} · ${base * 3}` };
  }

  return { x, y, base, multiplier: 1, score: base, ring: "single", label: `${base}` };
}

export function createCricketMarks(): CricketMarks {
  return Object.fromEntries(CRICKET_TARGETS.map((target) => [target, 0]));
}

export function isCricketTarget(base: number): base is (typeof CRICKET_TARGETS)[number] {
  return CRICKET_TARGETS.includes(base as (typeof CRICKET_TARGETS)[number]);
}

export function hasClosedCricket(marks: CricketMarks): boolean {
  return CRICKET_TARGETS.every((target) => (marks[target] ?? 0) >= 3);
}

export function applyThreeOhOneHit(
  currentScore: number,
  visitStartScore: number,
  hit: Pick<HitResult, "score" | "ring">,
  doubleOut: boolean,
): ThreeOhOneResult {
  const remaining = currentScore - hit.score;
  const validFinish = hit.ring === "double" || hit.ring === "bull";
  const bust = remaining < 0
    || (doubleOut && remaining === 1)
    || (remaining === 0 && doubleOut && !validFinish);

  return {
    score: bust ? visitStartScore : remaining,
    bust,
    won: !bust && remaining === 0,
  };
}

export function applyCricketHit(
  marks: CricketMarks,
  score: number,
  base: number,
  multiplier: number,
  canScore: boolean,
): CricketHitResult {
  if (!isCricketTarget(base)) return { marks, score, overflow: 0 };
  const before = marks[base] ?? 0;
  const afterRaw = before + multiplier;
  const nextMarks = Math.min(3, afterRaw);
  const overflow = Math.max(0, afterRaw - 3);

  return {
    score: score + (canScore ? overflow * base : 0),
    marks: { ...marks, [base]: nextMarks },
    overflow,
  };
}

export function targetCoordinates(target: AimTarget): Readonly<{ x: number; y: number }> {
  if (target.base === 25) {
    return { x: 0, y: target.multiplier === 2 ? 0 : 0.011 };
  }

  const index = SEGMENTS.indexOf(target.base as (typeof SEGMENTS)[number]);
  const safeIndex = index < 0 ? 0 : index;
  const clockwiseFromTop = safeIndex * SEGMENT_ANGLE;
  const radius = target.multiplier === 3
    ? (BOARD.tripleInner + BOARD.tripleOuter) / 2
    : target.multiplier === 2
      ? (BOARD.doubleInner + BOARD.doubleOuter) / 2
      : 0.135;

  return {
    x: Math.sin(clockwiseFromTop) * radius,
    y: Math.cos(clockwiseFromTop) * radius,
  };
}

export function chooseAiTarget(
  mode: GameMode,
  player: PlayerForAi,
  opponents: readonly PlayerForAi[],
  doubleOut = true,
): AimTarget {
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
      if (leaveForty > 0 && SEGMENTS.includes(leaveForty as (typeof SEGMENTS)[number])) {
        return { base: leaveForty, multiplier: 1 };
      }
    }
    if (player.score === 61) return { base: 11, multiplier: 1 };
    return { base: 20, multiplier: 3 };
  }

  const openTarget = CRICKET_TARGETS.find((target) => (player.marks[target] ?? 0) < 3);
  if (openTarget) {
    return openTarget === 25
      ? { base: 25, multiplier: 2 }
      : { base: openTarget, multiplier: 3 };
  }

  const scoringTarget = CRICKET_TARGETS.find((target) =>
    opponents.some((opponent) => (opponent.marks[target] ?? 0) < 3),
  );
  return scoringTarget === 25
    ? { base: 25, multiplier: 2 }
    : { base: scoringTarget ?? 20, multiplier: 3 };
}

function gaussian(random: () => number): number {
  const a = Math.max(Number.EPSILON, random());
  const b = Math.max(Number.EPSILON, random());
  return Math.sqrt(-2 * Math.log(a)) * Math.cos(FULL_CIRCLE * b);
}

export function makeAiImpact(
  target: AimTarget,
  difficulty: Difficulty,
  random: () => number = Math.random,
): Readonly<{ x: number; y: number }> {
  const center = targetCoordinates(target);
  const spread = difficulty === "pro" ? 0.006 : difficulty === "pub" ? 0.013 : 0.025;
  return {
    x: center.x + gaussian(random) * spread,
    y: center.y + gaussian(random) * spread,
  };
}

export function createSeededRandom(seed = 0x5f3759df): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

export function describeMarks(value: number): string {
  if (value <= 0) return "Open";
  if (value === 1) return "One mark";
  if (value === 2) return "Two marks";
  return "Closed";
}

export function formatMark(value: number): string {
  if (value <= 0) return "—";
  if (value === 1) return "/";
  if (value === 2) return "×";
  return "⊗";
}
