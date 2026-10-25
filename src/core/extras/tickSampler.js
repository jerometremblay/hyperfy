// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/tickSampler.js
// Tick-time sampler for the server monitor (enabled with MONITOR_TICK=1).
//
// Collects the duration of every world tick and, once per window, reports count, mean, median,
// p90 and max in milliseconds. The last completed window is kept for /status.

function percentile(sorted, p) {
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))]
}

export function createTickSampler({ windowMs = 60000, now = () => performance.now(), log } = {}) {
  let samples = []
  let windowStart = now()
  let last = null
  const round = n => Math.round(n * 1000) / 1000
  const flush = () => {
    const end = now()
    if (samples.length) {
      const sorted = samples.slice().sort((a, b) => a - b)
      last = {
        count: sorted.length,
        seconds: round((end - windowStart) / 1000),
        mean: round(sorted.reduce((sum, n) => sum + n, 0) / sorted.length),
        median: round(percentile(sorted, 0.5)),
        p90: round(percentile(sorted, 0.9)),
        max: round(sorted[sorted.length - 1]),
      }
      log?.(
        `[monitor] tick ms over ${last.seconds}s: n=${last.count} mean=${last.mean} median=${last.median} p90=${last.p90} max=${last.max}`
      )
    }
    samples = []
    windowStart = end
  }
  return {
    sample(ms) {
      samples.push(ms)
      if (now() - windowStart >= windowMs) flush()
    },
    flush,
    get last() {
      return last
    },
  }
}
