import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import test from 'node:test'
import { watchClientBuild } from './clientBuild.js'

test('announces ready client builds, ignores incomplete output and cleans up', async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'client-build-'))
  const file = path.join(dir, 'index.html')
  const shell = id => `<script src="${id}" type="module"></script>`
  const builds = []
  let stop
  try {
    await writeFile(file, shell('/index-first.js'))
    stop = watchClientBuild(file, id => builds.push(id))
    assert.deepEqual(builds, ['/index-first.js'])
    await writeFile(file, shell('{jsPath}'))
    await new Promise(resolve => setTimeout(resolve, 1200))
    assert.deepEqual(builds, ['/index-first.js'])
    await writeFile(file, shell('/index-next.js'))
    const deadline = Date.now() + 4000
    while (builds.length < 2 && Date.now() < deadline) await new Promise(resolve => setTimeout(resolve, 50))
    assert.deepEqual(builds, ['/index-first.js', '/index-next.js'])
  } finally {
    stop?.()
    await rm(dir, { recursive: true, force: true })
  }
})
