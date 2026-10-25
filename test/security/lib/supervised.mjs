// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/supervised.mjs
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'

// Keep failures in a small child heap, and distinguish a V8 OOM from an assertion or a timeout.
export function runSupervised(file, { heapMb = 64, args = [], timeout = 30_000 } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [`--max-old-space-size=${heapMb}`, '--expose-gc', file instanceof URL ? fileURLToPath(file) : file, ...args],
      { stdio: ['ignore', 'pipe', 'pipe'] }
    )
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let oom = false
    const timer = setTimeout(() => {
      timedOut = true
      child.kill('SIGKILL')
    }, timeout)
    child.stdout.on('data', chunk => {
      stdout = (stdout + chunk).slice(-64 * 1024)
    })
    child.stderr.on('data', chunk => {
      stderr = (stderr + chunk).slice(-64 * 1024)
      oom ||= /heap out of memory|Allocation failed|Fatal process out of memory/i.test(stderr)
    })
    child.on('error', err => {
      clearTimeout(timer)
      reject(err)
    })
    child.on('close', (code, signal) => {
      clearTimeout(timer)
      if (code === 0 && !timedOut && !oom) return resolve({ stdout, stderr, code, signal })
      const kind = oom ? 'oom' : timedOut ? 'timeout' : 'failure'
      const err = new Error(`supervised ${kind}: ${file} (exit ${code}, signal ${signal})\n${stderr}\n${stdout}`)
      Object.assign(err, { kind, code, signal, stdout, stderr })
      reject(err)
    })
  })
}
