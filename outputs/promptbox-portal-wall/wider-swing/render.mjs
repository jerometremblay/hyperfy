import assert from 'node:assert/strict'
import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

const require = createRequire('/Users/jerome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const { chromium } = require('playwright')
const directory = 'outputs/promptbox-portal-wall/wider-swing'
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-webgl'],
})
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', error => { errors.push(error.message); console.error('Preview error: ' + error.message) })
  const views = []
  for (const state of ['closed', 'left', 'right', 'both']) {
    await page.goto('file://' + path.resolve(directory + '/preview.html') + '?state=' + state + '#doors=' + state)
    assert.equal(errors.length, 0, errors.join('\n'))
    await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 })
    await page.getByRole('button', { name: 'Pool side', exact: true }).click()
    await page.screenshot({ path: directory + '/' + state + '.png' })
    views.push(state)
    console.log('Rendered ' + state)
  }
  for (const name of ['Wall front', 'Wall back', 'Wall left', 'Wall right', 'Wall top', 'Wall isometric', 'Right recess']) {
    await page.getByRole('button', { name, exact: true }).click()
    await page.screenshot({ path: directory + '/' + name.toLowerCase().replaceAll(' ', '-') + '.png' })
    views.push(name)
  }
  assert.equal(errors.length, 0, errors.join('\n'))
  const validation = JSON.parse(await fs.readFile(directory + '/validation.json'))
  await fs.writeFile(directory + '/visual-validation.json', JSON.stringify({
    valid: true, exactPackageRendered: true, source: validation.source, views, errors,
  }, null, 2))
  console.log(JSON.stringify({ rendered: views.length, errors }))
} finally {
  await browser.close()
}
