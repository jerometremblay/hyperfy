import { createRequire } from 'node:module'
import path from 'node:path'

// Isolated, local-only artifact rendering. This never attaches to the user's
// Chrome session or visits the live world.
const require = createRequire('/Users/jerome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const { chromium } = require('playwright')
const renderer = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-webgl'],
})
try {
  const page = await renderer.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('file://' + path.resolve('outputs/promptbox-large/preview.html'))
  try {
    await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 })
  } catch (error) {
    console.log(JSON.stringify({ errors, text: await page.locator('body').innerText() }))
    await page.screenshot({ path: 'outputs/promptbox-large/preview-error.png' })
    throw error
  }
  for (const view of ['Front', 'Rear', 'Left', 'Right', 'Plan', 'Rear extension', 'Upper connection', 'Lower connection', 'Patio doors']) {
    await page.getByRole('button', { name: view, exact: true }).click()
    await page.screenshot({ path: 'outputs/promptbox-large/view-' + view.toLowerCase().replaceAll(' ', '-') + '.png' })
  }
  console.log(JSON.stringify({ errors, ready: true, screenshots: 9 }))
  if (errors.length) throw new Error(errors.join('\n'))
} finally {
  await renderer.close()
}
