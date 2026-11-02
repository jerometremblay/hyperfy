import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { hyperfySkillPlugin } from '../../../scripts/hyperfy-skill-plugin.mjs'
import { loadProfile, makeClient } from '../../../tools/worldsync/src/deployment.mjs'

const require = createRequire('/Users/jerome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const { chromium } = require('playwright')
const profile = await loadProfile('../hyperfy-world-jerome', 'online-world')
const client = makeClient(profile)
const houseId = 'HCzjtaVZFI'
const doorIds = ['billiards-portal-left', 'billiards-portal-right']
const portalIds = ['f7dada59-f925-4fcd-9fb9-4a6253d86890', '7b846fcc-2366-4782-8259-4390855b234e']
const before = await client.request('/entities/' + houseId)
await fs.writeFile(new URL('live-state-before-test.json', import.meta.url), JSON.stringify(before.state, null, 2))
const bundle = await build({
  entryPoints: ['src/client/index.js'],
  bundle: true, platform: 'browser', format: 'esm', write: false,
  jsx: 'automatic', jsxImportSource: '@firebolt-dev/jsx', loader: { '.js': 'jsx' },
  define: { 'process.env.NODE_ENV': '"production"' },
  plugins: [
    {
      name: 'expose-isolated-test-world',
      setup(build) {
        build.onLoad({ filter: /\/client\/world-client\.js$/ }, async ({ path }) => {
          const source = await fs.readFile(path, 'utf8')
          const marker = 'onSetup?.(world, config)'
          assert(source.includes(marker))
          return { contents: source.replace(marker, 'globalThis.__portalTestWorld = world; ' + marker), loader: 'jsx' }
        })
      },
    },
    hyperfySkillPlugin(), polyfillNode({}),
  ],
})
// The diagnostic hook exists only in this isolated browser's response.
// No live engine file or other client's response is changed.
const browser = await chromium.launch({
  headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-webgl'],
})
const page = await browser.newPage({ viewport: { width: 960, height: 640 } })
const pageErrors = []
const intercepted = []
const changed = new Set()
page.on('pageerror', error => pageErrors.push(error.message))
await page.route(/\/index-[^/]+\.js(?:\?.*)?$/, route => {
  intercepted.push(route.request().url())
  return route.fulfill({ status: 200, contentType: 'text/javascript', body: bundle.outputFiles[0].text })
})
const checks = []
async function toggle(id) {
  await page.evaluate(({ houseId, id }) => {
    const world = globalThis.__portalTestWorld
    const house = world.entities.get(houseId)
    let action
    house.root.traverse(node => {
      if (!action && node.name === 'action' && node.id.startsWith('doors:' + id + '-action-')) action = node
    })
    if (!action) throw new Error('Door action not found: ' + id)
    action.onTrigger({ playerId: world.entities.player.data.id })
  }, { houseId, id })
  changed.add(id)
}
async function waitPreview(index, enabled) {
  await page.waitForFunction(({ portalId, enabled }) => {
    const portal = [...globalThis.__portalTestWorld.graphics.portals].find(p => p.portalId === portalId)
    return portal?.previewFront === enabled
  }, { portalId: portalIds[index], enabled }, { timeout: 30000 })
}
try {
  await page.goto(new URL('/', profile.apiUrl).href, { waitUntil: 'domcontentloaded', timeout: 60000 })
  await page.waitForFunction(({ houseId, portalIds }) => {
    const world = globalThis.__portalTestWorld
    const house = world?.entities.get(houseId)
    return house?.script && !house.building &&
      portalIds.every(id => [...world.graphics.portals].some(p => p.portalId === id && p.ctx.entity?.script))
  }, { houseId, portalIds }, { timeout: 60000 })
  console.log('Live house and both scripted portal endpoints loaded')
  const initial = await page.evaluate(({ houseId, portalIds }) => {
    const world = globalThis.__portalTestWorld
    const house = world.entities.get(houseId)
    const portals = portalIds.map(id => [...world.graphics.portals].find(p => p.portalId === id))
    return {
      houseVersion: house.blueprint.version,
      crashed: [house, ...portals.map(p => p.ctx.entity)].map(e => ({ id: e.data.id, crashed: e.crashed, error: e.scriptError })),
      previews: portals.map(p => ({ front: p.previewFront, back: p.previewBack, target: p.target, url: p.url })),
    }
  }, { houseId, portalIds })
  for (const entity of initial.crashed) assert(!entity.crashed && !entity.error, JSON.stringify(entity))
  assert.equal(initial.houseVersion, 28)
  for (let index = 0; index < 2; index++) {
    assert.equal(initial.previews[index].front, before.state.doors[doorIds[index]])
    assert.equal(initial.previews[index].back, true)
    let open = before.state.doors[doorIds[index]]
    for (const enabled of [false, true]) {
      if (open !== enabled) await toggle(doorIds[index])
      await waitPreview(index, enabled)
      assert.equal((await client.request('/entities/' + houseId)).state.doors[doorIds[index]], enabled)
      open = enabled
      const other = await page.evaluate(portalId => [...globalThis.__portalTestWorld.graphics.portals]
        .find(p => p.portalId === portalId).previewFront, portalIds[1 - index])
      assert.equal(other, before.state.doors[doorIds[1 - index]])
      checks.push({ door: doorIds[index], previewFront: enabled, serverStateMatches: true, otherDoorPreserved: true })
      console.log(JSON.stringify(checks.at(-1)))
    }
    if (open !== before.state.doors[doorIds[index]]) {
      await toggle(doorIds[index])
      await waitPreview(index, before.state.doors[doorIds[index]])
    }
  }
  const report = { valid: true, actualLiveClientAndServer: true, nativeDoorActions: true,
    initial, checks, pageErrors, originalStateRestored: true }
  await fs.writeFile(new URL('live-validation.json', import.meta.url), JSON.stringify(report, null, 2))
  console.log(JSON.stringify(report))
} catch (error) {
  const diagnostics = { error: error.message, url: page.url(), pageErrors, intercepted, checks }
  await fs.writeFile(new URL('live-attempt.json', import.meta.url), JSON.stringify(diagnostics, null, 2))
  console.log(JSON.stringify(diagnostics))
  throw error
} finally {
  // Restore through the same native actions, including when a check fails.
  const current = await client.request('/entities/' + houseId)
  for (let index = 0; index < 2; index++) {
    if (changed.has(doorIds[index]) && current.state.doors[doorIds[index]] !== before.state.doors[doorIds[index]]) {
      await toggle(doorIds[index])
      await waitPreview(index, before.state.doors[doorIds[index]])
    }
  }
  if (changed.size) assert.deepEqual((await client.request('/entities/' + houseId)).state, before.state)
  await browser.close()
}
