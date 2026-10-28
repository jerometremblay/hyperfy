import fs from 'node:fs/promises'
import vm from 'node:vm'
import { createHash } from 'node:crypto'
import { createRequire } from 'node:module'
import { packHyp, parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const bridge = await fs.readFile(new URL('../../hyperfy-webview-bridge.js', directory), 'utf8')
const source = (await fs.readFile(new URL('journal.js', directory), 'utf8'))
  .replace(/^const JOURNAL_BRIDGE_SOURCE = .*$/m, () => 'const JOURNAL_BRIDGE_SOURCE = ' + JSON.stringify(bridge))
await fs.writeFile(new URL('journal.js', directory), source)
const origin = 'https://hyperfy-news.jerometremblay.chatgpt.site'
const helpers = vm.runInNewContext(
  source.slice(source.indexOf('function localDocument'), source.indexOf('function validCachedIssue')) +
    ';({ localDocument, prepareIssueDocument, createPageDocument, selectIssues })',
  { NEWS_URL: origin + '/', JOURNAL_BRIDGE_SOURCE: bridge }
)
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
const browser = await chromium.launch({
  channel: 'chrome',
  headless: true,
})
try {
  const response = await fetch(origin + '/api/issues')
  if (!response.ok) throw new Error('Issue index download failed')
  const index = helpers.selectIssues(await response.json())
  const issues = {}
  const previous = JSON.parse(await fs.readFile(new URL('content.json', directory), 'utf8').catch(() => '{}'))
  for (const issue of index) {
    if (previous.issues?.[issue.id]?.updatedAt === issue.updated_at) {
      issues[issue.id] = previous.issues[issue.id]
      continue
    }
    const response = await fetch(origin + '/?issue=' + encodeURIComponent(issue.id) + '&texture=1&page=1&embed=1')
    if (!response.ok) throw new Error('Issue download failed: ' + issue.id)
    const document = helpers.prepareIssueDocument(await response.text(), issue.id)
    const page = await browser.newPage({ viewport: { width: 733, height: 994 } })
    await page.addInitScript(() => {
      window.addEventListener('message', event => {
        if (event.data?.type === 'journal-cached-issue') window.renderedIssue = event.data
      })
    })
    const errors = []
    page.on('pageerror', error => errors.push(error.message))
    await page.goto(helpers.localDocument(document))
    await page.waitForFunction(() => window.renderedIssue, { timeout: 30000 })
    const result = await page.evaluate(() => window.renderedIssue)
    if (errors.length) throw new Error(errors.join('\n'))
    // Portraits are the only image resources. Embed any publisher fallback images
    // so the downloaded archive needs no network requests while reading.
    for (let index = 0; index < result.pages.length; index++) {
      for (const match of result.pages[index].matchAll(/<img\b[^>]*\bsrc="(https:[^"]+)"/g)) {
        const url = match[1].replaceAll('&amp;', '&')
        const image = await fetch(url)
        if (!image.ok) throw new Error('Portrait download failed: ' + url)
        const data = 'data:' + image.headers.get('content-type').split(';')[0] +
          ';base64,' + Buffer.from(await image.arrayBuffer()).toString('base64')
        result.pages[index] = result.pages[index].replaceAll(match[1], data)
      }
    }
    issues[issue.id] = { updatedAt: issue.updated_at, style: result.style, pages: result.pages }
    console.log(issue.id + ': ' + result.pages.length + ' pages')
    await page.close()
  }
  const content = Buffer.from(JSON.stringify({ index, issues }))
  await fs.writeFile(new URL('content.json', directory), content)
  const catalog = new URL('../../tools/worldsync/catalog/objects/apps/hyperfy-news-folding-journal/', directory)
  await fs.writeFile(new URL('content.json', catalog), content)
  await fs.writeFile(new URL('script.js', catalog), source)
  const manifestUrl = new URL('object.json', catalog)
  const manifest = JSON.parse(await fs.readFile(manifestUrl, 'utf8'))
  manifest.blueprint.props.content = { type: 'other', url: 'file:./content.json' }
  await fs.writeFile(manifestUrl, JSON.stringify(manifest, null, 2) + '\n')

  const packageUrl = new URL('../../src/world/collections/default/HyperfyJournal.hyp', directory)
  const original = parseHyp(await fs.readFile(packageUrl))
  const scriptUrl = 'asset://' + createHash('sha256').update(source).digest('hex') + '.js'
  const contentUrl = 'asset://' + createHash('sha256').update(content).digest('hex') + '.json'
  const blueprint = { ...original.blueprint, script: scriptUrl,
    props: { ...original.blueprint.props, content: { type: 'other', url: contentUrl } } }
  const assets = original.assets.filter(asset => asset.type !== 'script' && asset.url !== original.blueprint.props.content?.url)
  assets.push({ type: 'script', url: scriptUrl, bytes: Buffer.from(source), mime: 'text/javascript' })
  assets.push({ type: 'other', url: contentUrl, bytes: content, mime: 'application/json' })
  const packed = packHyp(blueprint, assets)
  parseHyp(packed)
  await fs.writeFile(packageUrl, packed)
  console.log(JSON.stringify({ editions: index.length, pages: Object.values(issues).reduce((n, issue) => n + issue.pages.length, 0),
    contentBytes: content.length, script: scriptUrl, content: contentUrl }))
} finally {
  await browser.close()
}
