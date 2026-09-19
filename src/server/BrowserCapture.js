import { spawn } from 'child_process'
import { mkdtemp, rm } from 'fs/promises'
import os from 'os'
import path from 'path'

const DEFAULT_CDP_URL = 'http://127.0.0.1:9222'
const CACHE_TIME = 500
const START_TIMEOUT = 15000
const RETRY_INTERVAL = 250
const COMMAND_TIMEOUT = 10000

export class BrowserCapture {
  constructor() {
    this.cdpUrl = (process.env.BROWSER_CDP_URL || DEFAULT_CDP_URL).replace(/\/+$/, '')
    this.sessions = new Map()
    this.cachedBrowser = null
    this.commandId = 0
    this.chromeProcess = null
    this.chromeError = null
    this.chromeProfiles = new Set()
  }

  async capture(entityId, url) {
    if (entityId === undefined || entityId === null || String(entityId) === '') {
      throw new Error('Browser capture requires an app instance id')
    }
    const normalizedUrl = normalizeURL(url)
    const session = await this.getSession(String(entityId), normalizedUrl)
    if (session.cached && Date.now() - session.cachedAt < CACHE_TIME) return session.cached
    if (!session.capturePromise) {
      const promise = this.capturePage(session).finally(() => {
        if (session.capturePromise === promise) session.capturePromise = null
      })
      session.capturePromise = promise
    }
    return session.capturePromise
  }

  async getSession(entityId, url) {
    let session = this.sessions.get(entityId)
    if (!session) {
      session = {
        url,
        cached: null,
        cachedAt: 0,
        capturePromise: null,
        navigation: null,
        ready: null,
      }
      const ready = this.openSession(url).then(opened => {
        Object.assign(session, opened)
        return session
      }).catch(error => {
        if (this.sessions.get(entityId) === session) this.sessions.delete(entityId)
        throw error
      })
      session.ready = ready
      this.sessions.set(entityId, session)
    }

    if (session.ready) {
      const ready = session.ready
      await ready
      if (session.ready === ready) session.ready = null
    }
    if (this.sessions.get(entityId) !== session) {
      throw new Error('Browser app instance was closed')
    }
    if (session.url !== url) await this.navigate(session, url)
    return session
  }

  async openSession(url) {
    const browser = await this.getBrowser()
    const WebSocketImpl = globalThis.WebSocket
    if (!WebSocketImpl) throw new Error('This Node.js version does not provide WebSocket support')
    if (!browser.webSocketDebuggerUrl) throw new Error('Chrome returned no browser DevTools WebSocket')

    const socket = new WebSocketImpl(browser.webSocketDebuggerUrl)
    let browserContextId
    try {
      await waitForOpen(socket, WebSocketImpl)
      const contextResponse = await sendCommand(
        socket,
        this.nextCommandId(),
        'Target.createBrowserContext',
        { disposeOnDetach: false }
      )
      browserContextId = contextResponse.result?.browserContextId
      if (!browserContextId) throw new Error('Chrome returned no browser context id')

      const targetResponse = await sendCommand(
        socket,
        this.nextCommandId(),
        'Target.createTarget',
        { url, browserContextId, background: true }
      )
      const targetId = targetResponse.result?.targetId
      if (!targetId) throw new Error('Chrome returned no page target id')

      const attachResponse = await sendCommand(
        socket,
        this.nextCommandId(),
        'Target.attachToTarget',
        { targetId, flatten: true }
      )
      const sessionId = attachResponse.result?.sessionId
      if (!sessionId) throw new Error('Chrome returned no page session id')

      await sendCommand(socket, this.nextCommandId(), 'Page.enable', {}, sessionId)
      return { socket, WebSocketImpl, browserContextId, targetId, sessionId }
    } catch (error) {
      if (browserContextId && socket.readyState === WebSocketImpl.OPEN) {
        try {
          await sendCommand(
            socket,
            this.nextCommandId(),
            'Target.disposeBrowserContext',
            { browserContextId }
          )
        } catch (cleanupError) {
          console.error('[browser] incomplete context cleanup failed:', cleanupError.message)
        }
      }
      socket.close()
      throw error
    }
  }

  async navigate(session, url) {
    if (session.navigation) await session.navigation
    if (session.url === url) return

    const navigation = (async () => {
      if (session.capturePromise) await session.capturePromise.catch(() => {})
      const response = await sendCommand(
        session.socket,
        this.nextCommandId(),
        'Page.navigate',
        { url },
        session.sessionId
      )
      if (response.result?.errorText) throw new Error(response.result.errorText)
      session.url = url
      session.cached = null
      session.cachedAt = 0
    })()
    session.navigation = navigation
    try {
      await navigation
    } finally {
      if (session.navigation === navigation) session.navigation = null
    }
  }

  async capturePage(session) {
    const response = await sendCommand(
      session.socket,
      this.nextCommandId(),
      'Page.captureScreenshot',
      { format: 'jpeg', quality: 80, fromSurface: true },
      session.sessionId
    )
    if (!response.result?.data) throw new Error('Chrome returned no screenshot data')
    session.cached = Buffer.from(response.result.data, 'base64')
    session.cachedAt = Date.now()
    return session.cached
  }

  async getBrowser() {
    if (!this.cachedBrowser) {
      const ready = this.startBrowser().catch(error => {
        if (this.cachedBrowser === ready) this.cachedBrowser = null
        throw error
      })
      this.cachedBrowser = ready
    }
    return this.cachedBrowser
  }

  async startBrowser() {
    try {
      return await this.readBrowser()
    } catch (connectError) {
      if (process.env.BROWSER_CDP_URL) {
        throw new Error(
          'Could not connect to configured Chrome DevTools endpoint at ' +
          this.cdpUrl + ': ' + connectError.message
        )
      }
    }

    if (this.chromeProcess && this.chromeProcess.exitCode === null && this.chromeProcess.signalCode === null) {
      return this.waitForBrowser()
    }
    await this.launchChrome()
    return this.waitForBrowser()
  }

  async readBrowser() {
    const response = await fetch(this.cdpUrl + '/json/version', {
      signal: AbortSignal.timeout(2000),
    })
    if (!response.ok) throw new Error('Chrome DevTools endpoint returned ' + response.status)
    const browser = await response.json()
    if (!browser.webSocketDebuggerUrl) throw new Error('Chrome returned no browser DevTools WebSocket')
    return browser
  }

  async launchChrome() {
    const endpoint = new URL(this.cdpUrl)
    const host = endpoint.hostname.toLowerCase()
    if (!['127.0.0.1', 'localhost', '::1', '[::1]'].includes(host) || endpoint.protocol !== 'http:') {
      throw new Error('Automatic Chrome startup requires a local HTTP Chrome DevTools endpoint')
    }

    const isRoot = process.platform === 'linux' && process.getuid?.() === 0
    const allowNoSandbox = process.env.BROWSER_ALLOW_UNSANDBOXED_CHROME === 'true'
    if (isRoot && !allowNoSandbox) {
      throw new Error('Refusing to launch Chrome as root without its sandbox')
    }

    const defaultExecutable = process.platform === 'darwin'
      ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      : process.platform === 'win32'
        ? 'chrome.exe'
        : 'google-chrome'
    const executable = process.env.BROWSER_CHROME_PATH || process.env.CHROME_PATH || defaultExecutable
    const profile = await mkdtemp(path.join(os.tmpdir(), 'hyperfy-browser-'))
    this.chromeProfiles.add(profile)

    const args = [
      '--remote-debugging-port=' + (endpoint.port || '9222'),
      '--user-data-dir=' + profile,
      '--no-first-run',
      '--no-default-browser-check',
    ]
    if (process.env.BROWSER_HEADLESS !== 'false') args.push('--headless=new')
    if (isRoot && allowNoSandbox) args.push('--no-sandbox')
    args.push('about:blank')

    this.chromeError = null
    const chromeProcess = spawn(executable, args, { stdio: 'ignore' })
    this.chromeProcess = chromeProcess
    chromeProcess.once('error', error => {
      this.chromeError = error
      if (this.chromeProcess === chromeProcess) this.chromeProcess = null
    })
    chromeProcess.once('exit', () => {
      if (this.chromeProcess === chromeProcess) {
        this.chromeProcess = null
        this.cachedBrowser = null
      }
    })
  }

  async waitForBrowser() {
    const deadline = Date.now() + START_TIMEOUT
    let lastError
    while (Date.now() < deadline) {
      if (this.chromeError) {
        throw new Error('Could not start system Chrome: ' + this.chromeError.message)
      }
      try {
        return await this.readBrowser()
      } catch (error) {
        lastError = error
      }
      await delay(RETRY_INTERVAL)
    }
    throw new Error(
      'Timed out waiting for system Chrome at ' + this.cdpUrl +
      (lastError ? ': ' + lastError.message : '')
    )
  }

  async close(entityId) {
    const key = String(entityId)
    const session = this.sessions.get(key)
    if (!session) return
    this.sessions.delete(key)

    try {
      if (session.ready) await session.ready
      if (session.capturePromise) await session.capturePromise.catch(() => {})
      if (session.navigation) await session.navigation.catch(() => {})
      if (session.socket?.readyState === session.WebSocketImpl?.OPEN) {
        await sendCommand(
          session.socket,
          this.nextCommandId(),
          'Target.disposeBrowserContext',
          { browserContextId: session.browserContextId }
        )
      }
    } catch (error) {
      console.error('[browser] app context cleanup failed:', error.message)
    }
    session.socket?.close()
  }

  async closeAll() {
    await Promise.all(Array.from(this.sessions.keys(), id => this.close(id)))

    const chromeProcess = this.chromeProcess
    this.chromeProcess = null
    if (chromeProcess && chromeProcess.exitCode === null && chromeProcess.signalCode === null) {
      chromeProcess.kill('SIGTERM')
      await waitForExit(chromeProcess, 3000)
      if (chromeProcess.exitCode === null && chromeProcess.signalCode === null) {
        chromeProcess.kill('SIGKILL')
        await waitForExit(chromeProcess, 1000)
      }
    }

    await Promise.all(Array.from(this.chromeProfiles, profile =>
      rm(profile, { recursive: true, force: true }).catch(() => {})
    ))
    this.chromeProfiles.clear()
    this.cachedBrowser = null
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
    const cleanup = () => {
      clearTimeout(timeout)
      socket.removeEventListener('open', onOpen)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('close', onClose)
    }
    const onOpen = () => {
      cleanup()
      resolve()
    }
    const onError = event => {
      cleanup()
      reject(new Error('Chrome DevTools connection failed: ' + (event.message || 'unknown error')))
    }
    const onClose = () => {
      cleanup()
      reject(new Error('Chrome DevTools connection closed before opening'))
    }
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error('Timed out opening the Chrome DevTools connection'))
    }, COMMAND_TIMEOUT)
    socket.addEventListener('open', onOpen)
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)
  })
}

function sendCommand(socket, id, method, params, sessionId) {
  return new Promise((resolve, reject) => {
    const cleanup = () => {
      clearTimeout(timeout)
      socket.removeEventListener('message', onMessage)
      socket.removeEventListener('error', onError)
      socket.removeEventListener('close', onClose)
    }
    const onMessage = event => {
      let message
      try {
        message = JSON.parse(event.data)
      } catch {
        return
      }
      if (message.id !== id) return
      cleanup()
      if (message.error) reject(new Error(method + ': ' + message.error.message))
      else resolve(message)
    }
    const onError = event => {
      cleanup()
      reject(new Error(method + ': ' + (event.message || 'Chrome DevTools error')))
    }
    const onClose = () => {
      cleanup()
      reject(new Error(method + ': Chrome DevTools connection closed'))
    }
    const timeout = setTimeout(() => {
      cleanup()
      reject(new Error(method + ': timed out'))
    }, COMMAND_TIMEOUT)
    socket.addEventListener('message', onMessage)
    socket.addEventListener('error', onError)
    socket.addEventListener('close', onClose)
    try {
      socket.send(JSON.stringify({
        id,
        method,
        ...(params ? { params } : {}),
        ...(sessionId ? { sessionId } : {}),
      }))
    } catch (error) {
      cleanup()
      reject(error)
    }
  })
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function waitForExit(child, timeoutMs) {
  if (child.exitCode !== null || child.signalCode !== null) return Promise.resolve()
  return new Promise(resolve => {
    const timeout = setTimeout(() => {
      child.removeListener('exit', onExit)
      resolve()
    }, timeoutMs)
    const onExit = () => {
      clearTimeout(timeout)
      resolve()
    }
    child.once('exit', onExit)
  })
}
