import { createRequire } from 'node:module'
import fs from 'node:fs/promises'
import path from 'node:path'

// Local artifact rendering, isolated from user browsers and the live world.
const require = createRequire('/Users/jerome/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/package.json')
const { chromium } = require('playwright')
const browser = await chromium.launch({
  headless: true,
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  args: ['--use-angle=metal', '--enable-webgl'],
})
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('file://' + path.resolve('outputs/promptbox-large/door-hinges/preview.html'))
  await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 })
  const views = ['Front', 'Rear', 'Left', 'Right', 'Plan', 'Exterior', 'Entrance open', 'Room doors open', 'Left door open', 'Right door open']
  for (const name of views) {
    await page.getByRole('button', { name, exact: true }).click()
    await page.screenshot({
      path: 'outputs/promptbox-large/door-hinges/' + name.toLowerCase().replaceAll(' ', '-') + '.png',
    })
  }
  await page.goto('about:blank')
  await page.goto('file://' + path.resolve('outputs/promptbox-large/door-hinges/preview.html') + '#closed')
  await page.waitForSelector('body[data-ready="true"]', { timeout: 30000 })
  for (const name of ['Entrance open', 'Room doors open', 'Left door open', 'Right door open']) {
    await page.getByRole('button', { name, exact: true }).click()
    const closed = name.replace('open', 'closed')
    views.push(closed)
    await page.screenshot({
      path: 'outputs/promptbox-large/door-hinges/' + closed.toLowerCase().replaceAll(' ', '-') + '.png',
    })
  }
  if (errors.length) throw new Error(errors.join('\n'))
  await fs.writeFile('outputs/promptbox-large/door-hinges/visual-validation.json',
    JSON.stringify({ valid: true, exactPackageRendered: true, views, errors }, null, 2))
  console.log(JSON.stringify({ rendered: views.length, errors }))
} finally {
  await browser.close()
}
