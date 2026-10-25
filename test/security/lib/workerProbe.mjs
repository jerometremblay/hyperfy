// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/workerProbe.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import * as esbuild from 'esbuild'

const root = fileURLToPath(new URL('../../../', import.meta.url))

// Match stageContainment's bundling of the runtime's extensionless modules.
export async function bundleProbe(contents) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'worker-probe-'))
  const outfile = path.join(dir, 'probe.mjs')
  await esbuild.build({
    stdin: { contents, resolveDir: root, sourcefile: 'probe-entry.js' },
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    external: ['*physx-js-webidl.js'],
    define: { 'process.env.CLIENT': 'false', 'process.env.SERVER': 'true' },
    logLevel: 'silent',
  })
  return {
    url: pathToFileURL(outfile).href,
    destroy: () => fs.rmSync(dir, { recursive: true, force: true }),
  }
}

export function runProbe(bundle, probe, args) {
  const source = `
    import assert from 'node:assert/strict'
    import { parentPort, workerData } from 'node:worker_threads'
    globalThis.self = { postMessage() {} }
    if (workerData.args?.browser) globalThis.window = {}
    // no top-level await: terminating a worker while its entry module settles aborts V8 (Node 22)
    import(workerData.url)
      .then(module => (${probe.toString()})(module, workerData.args))
      .then(() => parentPort.postMessage('done'))
  `
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`), {
      workerData: { url: bundle.url, args },
    })
    let settled = false
    let done = false
    let grace
    const finish = async (error, exited = false) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      clearTimeout(grace)
      if (!exited) await worker.terminate()
      if (error) reject(error)
      else resolve()
    }
    const timer = setTimeout(() => finish(new Error('worker probe exceeded 2 s deadline')), 2000)
    // a finished probe exits on its own; terminate only if it lingers
    worker.once('message', () => {
      done = true
      clearTimeout(timer)
      grace = setTimeout(() => finish(), 1000)
    })
    worker.once('error', err => finish(err))
    worker.once('exit', code =>
      finish(done ? null : new Error(`worker exited before completing probe (${code})`), true)
    )
  })
}
