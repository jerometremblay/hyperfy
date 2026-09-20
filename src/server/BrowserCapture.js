const DEFAULT_CDP_URL = 'http://127.0.0.1:9222'
const CACHE_TIME = 500

export class BrowserCapture {
  constructor() {
    this.cdpUrl = (process.env.BROWSER_CDP_URL || DEFAULT_CDP_URL).replace(/\/+$/, '')
    this.page = null
    this.url = null
    this.cached = null
    this.cachedAt = 0
    this.capturePromise = null
    this.commandId = 0
  }

  async capture(url) {
    const normalizedUrl = normalizeURL(url)
    if (this.url !== normalizedUrl) {
      this.url = normalizedUrl
      this.page = null
      this.cached = null
      this.cachedAt = 0
    }

    if (this.cached && Date.now() - this.cachedAt < CACHE_TIME) {
      return this.cached
    }
    if (!this.capturePromise) {
      this.capturePromise = this.capturePage(normalizedUrl).finally(() => {
        this.capturePromise = null
      })
    }
    return this.capturePromise
  }

  async capturePage(url) {
    const page = await this.getPage(url)
    const WebSocketImpl = globalThis.WebSocket
    if (!WebSocketImpl) {
      throw new Error('This Node.js version does not provide WebSocket support')
    }
    if (!page.webSocketDebuggerUrl) {
      throw new Error('Chrome returned a page without a DevTools WebSocket')
    }
    const socket = new WebSocketImpl(page.webSocketDebuggerUrl)
    try {
      await waitForOpen(socket, WebSocketImpl)
      await sendCommand(socket, this.nextCommandId(), 'Page.enable')
      const result = await sendCommand(socket, this.nextCommandId(), 'Page.captureScreenshot', {
        format: 'jpeg',
        quality: 80,
        fromSurface: true,
      })
      if (!result.result?.data) {
        throw new Error('Chrome returned no screenshot data')
      }
      this.cached = Buffer.from(result.result.data, 'base64')
      this.cachedAt = Date.now()
      return this.cached
    } finally {
      socket.close()
    }
  }

  async getPage(url) {
    if (this.page) return this.page

    const response = await fetch(`${this.cdpUrl}/json/list`)
    if (!response.ok) {
      throw new Error(`Chrome DevTools endpoint returned ${response.status}`)
    }
    const pages = await response.json()
    this.page = pages.find(page => page.type === 'page' && page.url === url)

    if (!this.page) {
      const createResponse = await fetch(`${this.cdpUrl}/json/new?${url}`, { method: 'PUT' })
      if (!createResponse.ok) {
        throw new Error(`Chrome could not create a browser page (${createResponse.status})`)
      }
      this.page = await createResponse.json()
    }

    return this.page
  }

  nextCommandId() {
    this.commandId += 1
    return this.commandId
  }
}

function normalizeURL(value) {
  let url
  try {
    url = new URL(value).toString()
  } catch {
    throw new Error('Browser URL must be absolute')
  }
  if (url.startsWith('http://') || url.startsWith('https://')) return url
  throw new Error('Browser URL must use http or https')
}

function waitForOpen(socket, WebSocketImpl) {
  if (socket.readyState === WebSocketImpl.OPEN) return Promise.resolve()
  return new Promise((resolve, reject) => {
    const onOpen = () => {
      cleanup()
      resolve()
    }
    const onError = event => {
      cleanup()
      reject(new Error(`Chrome DevTools connection failed: ${event.message || 'unknown error'}`))
    }
    const cleanup = () => {
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('error', onError)
    }
    socket.addEventListener('open', onOpen)
    socket.addEventListener('error', onError)
  })
}

function sendCommand(socket, id, method, params) {
  return new Promise((resolve, reject) => {
    const onMessage = event => {
      const message = JSON.parse(event.data)
      if (message.id !== id) return
      cleanup()
      if (message.error) {
        reject(new Error(`${method}: ${message.error.message}`))
      } else {
        resolve(message)
      }
    }
    const onError = event => {
      cleanup()
      reject(new Error(`${method}: ${event.message || 'Chrome DevTools error'}`))
    }
    const cleanup = () => {
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('error', onError)
    }
    socket.addEventListener('message', onMessage)
    socket.addEventListener('error', onError)
    socket.send(JSON.stringify({ id, method, ...(params ? { params } : {}) }))
  })
}
