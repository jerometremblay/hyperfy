import fs from 'node:fs/promises'
import crypto from 'node:crypto'

// Same native .hyp container as exportApp; fixed blueprint ID makes rebuilds reproducible.
const script = await fs.readFile(new URL('./profiler-switch.js', import.meta.url))
const hash = crypto.createHash('sha256').update(script).digest('hex')
const header = Buffer.from(
  JSON.stringify({
    blueprint: {
      id: 'ce7bc0f2-56ab-437b-853e-d50d83dd14b5',
      version: 0,
      name: 'Performance Switch',
      model: 'script-only',
      script: `asset://${hash}.js`,
      props: {},
      preload: false,
      public: false,
    },
    assets: [{ type: 'script', url: `asset://${hash}.js`, size: script.length, mime: 'text/javascript' }],
  })
)
const prefix = Buffer.alloc(4)
prefix.writeUInt32LE(header.length)
await fs.writeFile(
  new URL('../src/world/collections/default/PerformanceSwitch.hyp', import.meta.url),
  Buffer.concat([prefix, header, script])
)
