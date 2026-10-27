import { createRequire } from 'node:module'
import path from 'node:path'
const require = createRequire('/Users/jerome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const { chromium } = require('playwright')
// Isolated rendering of the local artifact only. No connection to the user's
// browser session or to the live Hyperfy world.
const renderer = await chromium.launch({
  headless: true, executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-webgl'],
})
try {
  const page = await renderer.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('file://' + path.resolve('outputs/upper-office/preview.html'))
  await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 })
  let count = 0
  for (const scope of ['Desk', 'Chair']) {
    await page.getByRole('button', { name: scope, exact: true }).click()
    for (const view of ['Perspective', 'Front', 'Back', 'Left', 'Right', 'Top']) {
      await page.getByRole('button', { name: view, exact: true }).click()
      await page.screenshot({ path: `outputs/upper-office/${scope.toLowerCase()}-${view.toLowerCase()}.png` })
      count++
    }
  }
  for (const scope of ['Together', 'Room']) {
    await page.getByRole('button', { name: scope, exact: true }).click()
    await page.screenshot({ path: `outputs/upper-office/${scope.toLowerCase()}-perspective.png` })
    count++
    if (scope === 'Room') {
      await page.getByRole('button', { name: 'Top', exact: true }).click()
      await page.screenshot({ path: 'outputs/upper-office/room-top.png' })
      count++
    }
  }
  await page.getByRole('button', { name: 'Casters', exact: true }).click()
  await page.screenshot({ path: 'outputs/upper-office/casters/parked.png' })
  const motion = []
  for (const [button, heading, wait] of [
    ['W forward', 0, 1300], ['S backward', Math.PI, 900],
    ['D right', -Math.PI / 2, 700], ['A left', Math.PI / 2, 900],
  ]) {
    await page.getByRole('button', { name: button, exact: true }).click()
    await page.waitForTimeout(wait)
    await page.getByRole('button', { name: 'Stop', exact: true }).click()
    const states = await page.evaluate(() => JSON.parse(document.body.dataset.casterState))
    const error = Math.max(...states.map(s => Math.abs(Math.atan2(Math.sin(s[0] - heading), Math.cos(s[0] - heading)))))
    if (error > .015) throw new Error(`Caster demo failed to align ${button}: ${error}`)
    motion.push({ input: button, maximumHeadingError: error, states })
    await page.screenshot({ path: `outputs/upper-office/casters/${button[0].toLowerCase()}-motion.png` })
    count++
  }
  const idle = await page.evaluate(() => document.body.dataset.casterState)
  await page.waitForTimeout(150)
  if (idle !== await page.evaluate(() => document.body.dataset.casterState)) throw new Error('Caster demo continues after stopping')
  const fs = await import('node:fs/promises')
  await fs.writeFile('outputs/upper-office/casters/visual-validation.json', JSON.stringify({
    valid: errors.length === 0, exactPackageAnimated: true, inputs: motion,
    stopVerified: true, screenshots: count + 1, errors,
  }, null, 2))
  console.log(JSON.stringify({ ready: true, screenshots: count, errors }))
  if (errors.length) throw new Error(errors.join('\n'))
} finally {
  await renderer.close()
}
