import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { createServer } from 'node:http'
import { createRequire } from 'node:module'
import { build } from 'esbuild'
import { polyfillNode } from 'esbuild-plugin-polyfill-node'
import { parseHyp } from '../../tools/worldsync/src/hyp-format.mjs'

const directory = new URL('./', import.meta.url)
const { blueprint, assets } = parseHyp(await fs.readFile(new URL('../../src/world/collections/default/HyperfyJournal.hyp', directory)))
const source = Buffer.from(assets.find(asset => asset.url === blueprint.script).bytes).toString()
const content = Buffer.from(assets.find(asset => asset.url === blueprint.props.content.url).bytes)
const archive = JSON.parse(content)
const bundle = await build({
  stdin: { resolveDir: new URL('../../', directory).pathname, contents: `
    import { Node, getRef } from './src/core/nodes/Node.js'
    import { WebView } from './src/core/nodes/WebView.js'
    import { Vector3, Quaternion, Matrix4 } from './src/core/extras/three.js'
    import { storage } from './src/core/storage.js'
    import { createClientScriptStorage } from './src/core/extras/clientScriptStorage.js'
    const compile = new Function('app','world','fetch','props','setTimeout','Vector3','Quaternion','Matrix4',
      ${JSON.stringify(source)} + '\\nreturn { get firstPage(){return firstPage}, get ready(){return pageCountReady} }')
    const objects = new Set(), dirtyNodes = new Set(), updates = new Set()
    const player = {id:'alice',position:new Vector3(0,0,1),quaternion:new Quaternion(),height:1.7,headToHeight:0.1}
    const controls = {pointer:{locked:false},unlockPointer(){}}
    const nodeWorld = { network:{isServer:false},controls,stage:{dirtyNodes,
      scene:{add(){},remove(){}},octree:{insert(){},remove(){},move(){}}},
      css:{add(object){objects.add(object);document.querySelector('main').append(object.element)},
        remove(object){objects.delete(object);object.element.remove()}},on(){},off(){}}
    const root = new Node()
    root.activate({world:nodeWorld})
    const scriptStorage = createClientScriptStorage(storage)
    const world = {isClient:true,isServer:false,isBuilding:false,
      getPlayer:()=>player,getTime:()=>performance.now()/1000,on(){},
      get:key=>scriptStorage.get(key),set:(key,value)=>scriptStorage.set(key,value)}
    const events = new Map(), serverEvents = new Map(), serverUpdates = new Set()
    const makeApp = (server) => ({
      state:{open:false},position:server?new Vector3():root.position,
      quaternion:server?new Quaternion():root.quaternion,scale:server?new Vector3(1,1,1):root.scale,
      create:(type,data)=>server?new Node(data).getProxy():(type==='webview'?new WebView(data):new Node(data)).getProxy(),
      add:node=>{if(!server)root.add(getRef(node))},
      on:(name,fn)=>name==='update'?(server?serverUpdates:updates).add(fn):(server?serverEvents:events).set(name,fn),
      off:(name,fn)=>{if(name==='update')(server?serverUpdates:updates).delete(fn)},
      send:(name,data)=>queueMicrotask(()=>{if(server)events.get(name)?.(structuredClone(data));
        else serverEvents.get(name)?.(structuredClone(data),'alice')}),
      control:()=>({camera:{position:new Vector3(0,1.6,1),quaternion:new Quaternion(),zoom:0},
        pointer:controls.pointer,keyX:{},escape:{},setActions(){}})
    })
    const server = makeApp(true), client = makeApp(false)
    compile(server,{...world,isClient:false,isServer:true},fetch,{},setTimeout,Vector3,Quaternion,Matrix4)
    const reading = compile(client,world,fetch,${JSON.stringify(blueprint.props)},setTimeout,Vector3,Quaternion,Matrix4)
    let previous = performance.now()
    function tick(){
      const now=performance.now(),dt=(now-previous)/1000;previous=now
      for(const fn of [...updates,...serverUpdates])fn(dt)
      for(const node of dirtyNodes)node.clean()
      dirtyNodes.clear()
      for(const object of objects){object.element.style.position=object.position.y < -1000?'absolute':'relative';
        object.element.style.left=object.position.y < -1000?'-10000px':'0'}
      requestAnimationFrame(tick)
    }
    tick()
    window.journal = {open:()=>serverEvents.get('journal:toggle')({eye:[0,1.6,1]},'alice'),
      close:()=>serverEvents.get('journal:toggle')(undefined,'alice'),
      turn:()=>serverEvents.get('journal:turn-request')({direction:1},'alice'),
      get openState(){return client.state.open},get ready(){return reading.ready},
      get firstPage(){return reading.firstPage},get updates(){return updates.size}}
  ` },
  bundle: true, format: 'esm', write: false, plugins: [polyfillNode({})],
})
const requests = []
let offline = false
const server = createServer((request, response) => {
  requests.push(request.url)
  if (request.url === '/test.js') {
    response.setHeader('Content-Type', 'text/javascript')
    response.end(bundle.outputFiles[0].contents)
  } else if (request.url === '/assets/' + blueprint.props.content.url.slice(8)) {
    response.setHeader('Content-Type', 'application/json')
    response.end(content)
  } else if (request.url.startsWith('/api/webview/proxy?')) {
    response.setHeader('Content-Type', 'application/json')
    if (offline) response.writeHead(502).end('{}')
    else response.end(JSON.stringify(archive.index))
  } else {
    response.setHeader('Content-Type', 'text/html')
    response.end('<!doctype html><meta charset="utf-8"><style>body{margin:0;background:#29231f}main{display:flex}</style><main></main><script type="module" src="/test.js"></script>')
  }
})
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
const require = createRequire(import.meta.url)
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright')
let browser
try {
  browser = await chromium.launch({ channel: 'chrome', headless: true })
  const page = await browser.newPage({ viewport: { width: 1467, height: 994 } })
  page.setDefaultTimeout(15000)
  const errors = []
  const external = []
  page.on('pageerror', error => { errors.push(error.message); console.error(error.message) })
  page.on('request', request => {
    if (request.url().startsWith('http') && !request.url().startsWith('http://127.0.0.1:')) external.push(request.url())
  })
  const url = 'http://127.0.0.1:' + server.address().port
  await page.goto(url)
  await page.waitForFunction(() => window.journal)
  assert.equal(await page.locator('iframe').count(), 0)
  const start = performance.now()
  await page.evaluate(() => journal.open())
  await page.waitForFunction(() => journal.ready && journal.updates === 0)
  await page.waitForFunction(() => Array.from(document.querySelectorAll('iframe')).length === 2)
  const firstOpenMs = performance.now() - start
  const frame = page.frames().find(frame => frame.url().startsWith('data:text/html'))
  await frame.waitForSelector('.page')
  assert.ok((await frame.locator('h2').first().innerText()).length > 0)
  await page.screenshot({ path: new URL('cached-spread.png', directory).pathname })
  const articleLink = frame.locator('a[href^="https://github.com/"]').first()
  assert.equal(await articleLink.getAttribute('target'), '_blank')
  const before = requests.length
  await page.evaluate(() => journal.turn())
  await page.waitForFunction(() => journal.firstPage === 3 && journal.updates === 0)
  assert.equal(requests.length, before, 'turning must not issue HTTP requests')
  await page.evaluate(() => journal.close())
  await page.waitForFunction(() => document.querySelectorAll('iframe').length === 0 && journal.updates === 0)
  const reopenStart = performance.now()
  await page.evaluate(() => journal.open())
  await page.waitForFunction(() => journal.ready && journal.updates === 0)
  const reopenMs = performance.now() - reopenStart
  assert.equal(requests.length, before + 1, 'reopening requests only metadata')
  const rightFrame = page.frames().filter(frame => frame.url().startsWith('data:text/html')).at(-1)
  await rightFrame.waitForSelector('.page')
  // Native WebView mouseenter enables the free cursor; its original bridge then
  // reports a real click on paper to the server-authoritative page-turn handler.
  async function hoverPage() {
    const box = await page.locator('iframe').last().boundingBox()
    await page.mouse.move(box.x + 15, box.y + 15)
  }
  await hoverPage()
  await rightFrame.locator('.folio').click()
  await page.waitForFunction(() => journal.firstPage === 5 && journal.updates === 0)
  const keyboardFrame = page.frames().filter(frame => frame.url().startsWith('data:text/html')).at(-1)
  await hoverPage()
  await keyboardFrame.locator('.folio').click()
  await page.waitForFunction(() => journal.updates === 0)
  await hoverPage()
  await page.locator('iframe').last().click({ position: { x: 10, y: 10 } })
  await page.keyboard.press('x')
  await page.waitForFunction(() => !journal.openState && document.querySelectorAll('iframe').length === 0)
  offline = true
  await page.reload()
  await page.waitForFunction(() => window.journal)
  const reloadRequests = requests.length
  await page.evaluate(() => journal.open())
  await page.waitForFunction(() => journal.ready && journal.updates === 0)
  assert.equal(requests.length, reloadRequests + 1, 'persistent pages avoid downloading the archive again')
  assert.deepEqual(external, [], 'cached pages fetch no remote documents, scripts, or portraits')
  assert.deepEqual(errors, [])
  console.log(JSON.stringify({ firstOpenMs: Math.round(firstOpenMs), reopenMs: Math.round(reopenMs),
    pages: 54, remotePageRequests: external.length, closedIframes: 0, errors }))
} finally {
  await browser?.close()
  await new Promise(resolve => server.close(resolve))
}
