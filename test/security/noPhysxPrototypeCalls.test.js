// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/noPhysxPrototypeCalls.test.js
import { test } from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

function* jsFiles(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filename = path.join(directory, entry.name)
    if (entry.isDirectory()) yield* jsFiles(filename)
    else if (entry.isFile() && filename.endsWith('.js')) yield filename
  }
}

test('src contains no PhysX prototype conversion calls or installation', () => {
  const root = fileURLToPath(new URL('../../src', import.meta.url))
  let count = 0
  for (const filename of jsFiles(root)) {
    const source = fs.readFileSync(filename, 'utf8').replace(/\/\*[\s\S]*?\*\/|\/\/[^\r\n]*/g, '')
    const label = path.relative(root, filename)
    assert.doesNotMatch(source, /\.(toPxVec3|toPxExtVec3|toPxTransform|fromPxVec3)\s*\(/, label)
    assert.doesNotMatch(source, /extendThreePhysX/, label)
    assert.doesNotMatch(source, /\bprototype\.(toPx|fromPx)/, label)
    count++
  }
  assert.ok(count > 0)
})
