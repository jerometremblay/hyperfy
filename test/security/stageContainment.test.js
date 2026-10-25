// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/stageContainment.test.js
import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import * as esbuild from 'esbuild'

// Stage and Node use the repo's extensionless imports, so they are bundled the way the server build does it
const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '../..')
let Stage
let Node
let bundleDir

before(async () => {
  bundleDir = fs.mkdtempSync(path.join(os.tmpdir(), 'stage-containment-'))
  const outfile = path.join(bundleDir, 'stage.mjs')
  await esbuild.build({
    stdin: {
      contents: `export { Stage } from './src/core/systems/Stage'\nexport { Node } from './src/core/nodes/Node'`,
      resolveDir: root,
      sourcefile: 'stage-entry.js',
    },
    outfile,
    bundle: true,
    platform: 'node',
    format: 'esm',
    external: ['*physx-js-webidl.js'],
    define: { 'process.env.CLIENT': 'false', 'process.env.SERVER': 'true' },
    logLevel: 'silent',
  })
  ;({ Stage, Node } = await import(pathToFileURL(outfile)))
})

after(() => {
  fs.rmSync(bundleDir, { recursive: true, force: true })
})

// a node whose commit throws while `failures` is positive (one failure consumed per commit)
function makeFailing() {
  class Failing extends Node {
    constructor(data) {
      super(data)
      this.failures = 0
      this.commits = 0
    }
    commit() {
      this.commits++
      if (this.failures > 0) {
        this.failures--
        throw new Error('commit failed')
      }
    }
  }
  return Failing
}

function captureErrors(fn) {
  const lines = []
  const original = console.error
  console.error = (...args) => lines.push(args.map(String).join(' '))
  try {
    return [fn(), lines]
  } finally {
    console.error = original
  }
}

// parent -> [failing child, plain child]; activated for a host-owned (non-app) entity unless given
function makeTree(entity = { data: { id: 'host' } }) {
  const stage = new Stage({})
  const world = { stage }
  const Failing = makeFailing()
  const parent = new Node({ id: 'parent' })
  const failing = new Failing({ id: 'failing' })
  const plain = new Node({ id: 'plain' })
  parent.add(failing)
  parent.add(plain)
  parent.activate({ world, entity })
  return { stage, parent, failing, plain }
}

const worldX = node => node.matrixWorld.elements[12]

test('Stage.clean: a retried failure recomputes the descendants the failed traversal never reached', () => {
  const { stage, parent, failing, plain } = makeTree()
  parent.position.x = 5
  assert.equal(stage.dirtyNodes.has(parent), true)
  failing.failures = 1
  const [, lines] = captureErrors(() => stage.clean())
  assert.equal(
    lines.some(l => l.includes('[stage] node update failed (node parent, entity host)')),
    true
  )
  // the sibling after the failure was never visited: still stale, and the parent is tracked again
  assert.equal(worldX(plain), 0)
  assert.equal(stage.dirtyNodes.has(parent), true)
  assert.equal(stage.dirtyNodes.size, 1)
  // the retry succeeds and brings every descendant up to date
  stage.clean()
  assert.equal(worldX(parent), 5)
  assert.equal(worldX(failing), 5)
  assert.equal(worldX(plain), 5)
  assert.equal(stage.dirtyNodes.size, 0)
  assert.equal(parent._cleanFailures, 0)
  assert.equal(failing.commits, 2)
  // a later write to a descendant still composes against the fresh parent matrix
  plain.position.x = 7
  stage.clean()
  assert.equal(worldX(plain), 12)
})

test('Stage.clean: a failure deeper in the chain re-tracks the top of the dirty chain', () => {
  const { stage, parent, failing, plain } = makeTree()
  const grandchild = new Node({ id: 'grandchild' })
  failing.add(grandchild)
  parent.position.x = 3
  failing.position.x = 1
  failing.failures = 1
  captureErrors(() => stage.clean())
  assert.deepEqual(
    [...stage.dirtyNodes].map(n => n.id),
    ['parent']
  )
  stage.clean()
  assert.equal(worldX(failing), 4)
  assert.equal(worldX(grandchild), 4)
  assert.equal(worldX(plain), 3)
})

test('Stage.clean: giving up logs once, releases the subtree with consistent matrices, and later writes re-track it', () => {
  const { stage, parent, failing, plain } = makeTree()
  parent.position.x = 5
  plain.position.x = 7
  failing.failures = Infinity
  const [, lines] = captureErrors(() => {
    for (let i = 0; i < 10; i++) stage.clean()
  })
  assert.equal(lines.filter(l => l.includes('node update failed')).length, 1)
  assert.equal(lines.filter(l => l.includes('giving up on node parent')).length, 1)
  assert.equal(stage.dirtyNodes.size, 0)
  // matrices were recomputed from the pending transforms before the flags were released
  assert.equal(worldX(parent), 5)
  assert.equal(worldX(plain), 12)
  assert.equal(parent.isDirty, false)
  assert.equal(parent.isTransformed, false)
  assert.equal(plain.isTransformed, false)
  // the subtree stays untracked (no retry work per pass) ...
  const commitsBefore = failing.commits
  captureErrors(() => stage.clean())
  assert.equal(failing.commits, commitsBefore)
  // ... until a write tracks it again, with a fresh cap and no second give-up line while it keeps failing
  parent.position.x = 9
  assert.equal(stage.dirtyNodes.has(parent), true)
  const [, again] = captureErrors(() => {
    for (let i = 0; i < 10; i++) stage.clean()
  })
  assert.equal(again.filter(l => l.includes('giving up')).length, 0)
  assert.equal(worldX(plain), 16)
  // once the failure stops, a write from a descendant works against consistent matrices
  failing.failures = 0
  plain.position.x = 1
  stage.clean()
  assert.equal(worldX(plain), 10)
})

test('Stage.clean: an app-owned failure crashes the app once per pass and is never retried', () => {
  let crashes = 0
  const app = {
    isApp: true,
    data: { id: 'app-1' },
    scriptError: null,
    crash() {
      crashes++
    },
  }
  const { stage, parent, failing } = makeTree(app)
  const other = new Node({ id: 'other' })
  other.activate({ world: { stage }, entity: app })
  parent.position.x = 2
  other.position.x = 4
  failing.failures = Infinity
  captureErrors(() => stage.clean())
  assert.equal(crashes, 1)
  assert.equal(app.scriptError?.message, 'commit failed')
  assert.equal(stage.dirtyNodes.size, 0)
  captureErrors(() => stage.clean())
  assert.equal(crashes, 1)
})

test('Stage.clean: a hostile error object does not break the containment', () => {
  class Hostile extends Node {
    commit() {
      throw new Proxy(
        {},
        {
          get() {
            throw new Error('trap')
          },
        }
      )
    }
  }
  let crashes = 0
  const app = { isApp: true, data: { id: 'app-2' }, scriptError: null, crash: () => crashes++ }
  const stage = new Stage({})
  const node = new Hostile({ id: 'hostile' })
  node.activate({ world: { stage }, entity: app })
  node.position.x = 1
  assert.doesNotThrow(() => captureErrors(() => stage.clean()))
  assert.equal(crashes, 1)
})
