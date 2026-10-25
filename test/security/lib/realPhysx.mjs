// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/realPhysx.mjs
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { Worker } from 'node:worker_threads'
import * as esbuild from 'esbuild'

const root = fileURLToPath(new URL('../../../', import.meta.url))

export async function bundleRealPhysx({ sourceRoot = process.env.REAL_PHYSX_SOURCE_ROOT } = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'real-physx-'))
  try {
    // The bundle imports ./physx-js-webidl.js externally. That ESM module locates
    // physx-js-webidl.wasm beside itself via import.meta.url, just as in production.
    fs.writeFileSync(path.join(dir, 'package.json'), '{"type":"module"}')
    for (const name of ['physx-js-webidl.js', 'physx-js-webidl.wasm']) {
      fs.copyFileSync(path.join(root, 'src/core', name), path.join(dir, name))
    }
    const outfile = path.join(dir, 'runtime.mjs')
    await esbuild.build({
      stdin: {
        contents: `
          export { loadPhysX } from './src/core/loadPhysX.js'
          export { Physics } from './src/core/systems/Physics.js'
          export { Node } from './src/core/nodes/Node.js'
          export { RigidBody } from './src/core/nodes/RigidBody.js'
          export { Collider } from './src/core/nodes/Collider.js'
          export { Prim } from './src/core/nodes/Prim.js'
          export { Controller } from './src/core/nodes/Controller.js'
          export { NodeClient } from './src/core/systems/NodeClient.js'
          export { Server } from './src/core/systems/Server.js'
          export { ClientControls } from './src/core/systems/ClientControls.js'
          export { Client } from './src/core/systems/Client.js'
          export { ClientNetwork } from './src/core/systems/ClientNetwork.js'
          export { Stage } from './src/core/systems/Stage.js'
          export { createEntityProxy } from './src/core/extras/createEntityProxy.js'
          export { createPlayerProxy } from './src/core/extras/createPlayerProxy.js'
          export * from './src/core/extras/physicsFailure.js'
          export { World } from './src/core/World.js'
          export { callForScript } from './src/core/extras/scriptValues.js'
          export { App } from './src/core/entities/App.js'
          export * as THREE from './src/core/extras/three.js'
        `,
        resolveDir: root,
        sourcefile: 'real-physx-entry.js',
      },
      outfile,
      bundle: true,
      platform: 'node',
      format: 'esm',
      external: ['*physx-js-webidl.js'],
      define: { 'process.env.CLIENT': 'false', 'process.env.SERVER': 'true' },
      logLevel: 'silent',
      plugins: [
        {
          name: 'browser-input-utils',
          setup(build) {
            build.onLoad({ filter: /\/src\/client\/utils\.js$/ }, () => ({ contents: 'export const isTouch = false' }))
          },
        },
        ...(sourceRoot
          ? [
              {
                name: 'baseline-sources',
                setup(build) {
                  build.onLoad({ filter: /\/src\/core\/.*\.js$/ }, args => {
                    const baseline = path.join(sourceRoot, path.relative(root, args.path))
                    if (fs.existsSync(baseline)) return { contents: fs.readFileSync(baseline, 'utf8'), loader: 'js' }
                  })
                },
              },
            ]
          : []),
      ],
    })
    return { url: pathToFileURL(outfile).href, destroy: () => fs.rmSync(dir, { recursive: true, force: true }) }
  } catch (err) {
    fs.rmSync(dir, { recursive: true, force: true })
    throw err
  }
}

export function runRealPhysx(bundle, probe, args, { deadline = 20000 } = {}) {
  const source = `
    import assert from 'node:assert/strict'
    import { parentPort, workerData } from 'node:worker_threads'
    import ${JSON.stringify(pathToFileURL(path.join(root, 'node_modules/ses/index.js')).href)}
    import { makeWorld } from ${JSON.stringify(new URL('./realPhysxWorld.mjs', import.meta.url).href)}
    lockdown({ errorTaming: 'unsafe', consoleTaming: 'unsafe', overrideTaming: 'severe' })
    globalThis.self = { postMessage() {} }
    // Avoid terminating a worker during top-level await settlement on Node 22.
    import(workerData.url)
      .then(async B => (${probe.toString()})(await makeWorld(B), workerData.args))
      .then(() => parentPort.postMessage('done'))
      .catch(err => parentPort.postMessage({ error: String(err), stack: err.stack?.replace(/data:text[^\\s]+/g, '<probe>') }))
  `
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL(`data:text/javascript,${encodeURIComponent(source)}`), {
      workerData: { url: bundle.url, args },
      stdout: true,
      stderr: true,
    })
    let output = ''
    const capture = data => {
      output = (output + data).slice(-4000)
    }
    worker.stdout.on('data', capture)
    worker.stderr.on('data', capture)
    let settled = false
    const finish = async err => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      await worker.terminate()
      if (err) {
        if (output) err.message += `\nWorker output: ${output}`
        reject(err)
      } else resolve()
    }
    const timer = setTimeout(() => finish(new Error(`real PhysX exceeded ${deadline} ms deadline`)), deadline)
    worker.once('message', message => {
      const err = message?.error ? new Error(message.error) : null
      if (err && message.stack) err.stack = message.stack
      finish(err)
    })
    worker.once('error', err => finish(err))
    worker.once('exit', code => finish(new Error(`real PhysX exited before completing (${code})`)))
  })
}
