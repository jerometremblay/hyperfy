import { isBoolean, isNumber, isString } from 'lodash-es'
import * as THREE from '../extras/three'

import { Node } from './Node'

const defaults = {
  src: null,
  width: 2.4,
  height: 1.35,
  interval: 1000,
  doubleside: false,
}

let focusedBrowser = null

function getModifiers(event) {
  return (event.altKey ? 1 : 0) | (event.ctrlKey ? 2 : 0) | (event.metaKey ? 4 : 0) | (event.shiftKey ? 8 : 0)
}

export class Browser extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'browser'
    this.src = data.src
    this.width = data.width
    this.height = data.height
    this.interval = data.interval
    this.doubleside = data.doubleside
    this.pointerButtonsDown = new Set()
  }

  mount() {
    this.build()
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.build()
      return
    }
    if (didMove) {
      if (this.mesh) this.mesh.matrixWorld.copy(this.matrixWorld)
      if (this.sItem) this.ctx.world.stage.octree.move(this.sItem)
    }
  }

  unmount() {
    this.unbuild()
  }

  build() {
    this.needsRebuild = false
    if (this.ctx.world.network.isServer) return
    this.unbuild()

    const geometry = new THREE.PlaneGeometry(this._width, this._height)
    const material = new THREE.MeshBasicMaterial({
      color: 'white',
      side: this._doubleside ? THREE.DoubleSide : THREE.FrontSide,
    })
    this.ctx.world.setupMaterial(material)
    this.mesh = new THREE.Mesh(geometry, material)
    this.mesh.matrixWorld.copy(this.matrixWorld)
    this.mesh.matrixAutoUpdate = false
    this.mesh.matrixWorldAutoUpdate = false
    this.ctx.world.stage.scene.add(this.mesh)
    this.sItem = {
      matrix: this.matrixWorld,
      geometry,
      material,
      getEntity: () => this.ctx.entity,
      node: this,
    }
    this.ctx.world.stage.octree.insert(this.sItem)

    if (!this._src) return
    const apiUrl = this.ctx.world.network.apiUrl
    if (!apiUrl) return

    this.createKeyboardInput()
    window.addEventListener('wheel', this.onWheel, { passive: false, capture: true })

    const image = document.createElement('img')
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => {
      if (this.image !== image) return
      if (!this.texture) {
        this.texture = new THREE.Texture(image)
        this.texture.colorSpace = THREE.SRGBColorSpace
        this.texture.anisotropy = this.ctx.world.graphics.maxAnisotropy
        this.mesh.material.map = this.texture
        this.mesh.material.needsUpdate = true
      }
      this.texture.needsUpdate = true
    }
    image.onerror = () => {
      if (this.image === image) this.loadError = true
    }
    this.image = image
    this.loadImage = () => {
      const entityId = this.ctx.entity.data.id
      const url = `${apiUrl}/browser/screenshot?entityId=${encodeURIComponent(entityId)}&url=${encodeURIComponent(this._src)}&t=${Date.now()}`
      image.src = url
    }
    this.loadImage()
    this.poller = setInterval(this.loadImage, this._interval)
  }

  unbuild() {
    this.setMouseCapture(false)
    if (typeof window !== 'undefined' && typeof window.removeEventListener === 'function') {
      window.removeEventListener('wheel', this.onWheel, true)
    }
    if (focusedBrowser === this) {
      this.releaseKeys()
      focusedBrowser = null
    }
    if (this.keyboardInput) {
      this.keyboardInput.removeEventListener('keydown', this.onKeyDown)
      this.keyboardInput.removeEventListener('keyup', this.onKeyUp)
      this.keyboardInput.removeEventListener('beforeinput', this.onBeforeInput)
      this.keyboardInput.removeEventListener('compositionend', this.onCompositionEnd)
      this.keyboardInput.removeEventListener('paste', this.onPaste)
      this.keyboardInput.remove()
      this.keyboardInput = null
    }
    this.isHovered = false
    this.pointerButtonsDown.clear()
    this.lastUV = null
    if (this.poller) {
      clearInterval(this.poller)
      this.poller = null
    }
    if (this.image) {
      this.image.onload = null
      this.image.onerror = null
      this.image = null
    }
    this.loadImage = null
    this.loadError = false
    if (this.mesh) {
      this.ctx.world.stage.scene.remove(this.mesh)
      this.mesh.material.dispose()
      this.mesh.geometry.dispose()
      this.mesh = null
    }
    if (this.texture) {
      this.texture.dispose()
      this.texture = null
    }
    if (this.sItem) {
      this.ctx.world.stage.octree.remove(this.sItem)
      this.sItem = null
    }
  }

  createKeyboardInput() {
    const input = document.createElement('textarea')
    input.setAttribute('aria-label', 'Shared browser keyboard input')
    input.setAttribute('autocomplete', 'off')
    input.setAttribute('autocapitalize', 'off')
    input.spellcheck = false
    input.tabIndex = -1
    input.style.cssText = 'position:fixed;left:0;top:0;width:1px;height:1px;padding:0;border:0;opacity:0;z-index:-1;'
    input.addEventListener('keydown', this.onKeyDown)
    input.addEventListener('keyup', this.onKeyUp)
    input.addEventListener('beforeinput', this.onBeforeInput)
    input.addEventListener('compositionend', this.onCompositionEnd)
    input.addEventListener('paste', this.onPaste)
    document.body.appendChild(input)
    this.keyboardInput = input
    this.keysDown = new Map()
  }

  onPointerEnter(event) {
    this.isHovered = true
    this.setMouseCapture(this.isMouseMode())
    this.updatePointer(event.uv)
  }

  onPointerLeave() {
    this.isHovered = false
    this.setMouseCapture(false)
  }

  onPointerMove(event) {
    this.setMouseCapture(this.isMouseMode())
    const uv = this.updatePointer(event.uv)
    if (!uv) return
    const now = Date.now()
    if (now - (this.lastMoveAt || 0) < 40) return
    this.lastMoveAt = now
    this.sendInput({
      type: 'mouseMoved',
      ...uv,
      buttons: this.getMouseButtons(),
    })
  }

  onPointerDown(event) {
    if (!this._src || !this.isMouseMode()) {
      this.setMouseCapture(false)
      return
    }
    const uv = this.updatePointer(event.uv)
    if (!uv) return
    const button = event.button === 'right' ? 'right' : 'left'
    event.stopPropagation?.()
    if (button === 'left') this.focusKeyboard()
    this.sendInput({ type: 'mouseMoved', ...uv, buttons: this.getMouseButtons() })
    this.pointerButtonsDown.add(button)
    this.sendInput({ type: 'mousePressed', button, buttons: this.getMouseButtons(), ...uv })
  }

  onPointerUp(event) {
    const button = event.button === 'right' ? 'right' : 'left'
    if (!this.pointerButtonsDown.has(button) || !this.lastUV) return
    event.stopPropagation?.()
    this.pointerButtonsDown.delete(button)
    this.sendInput({ type: 'mouseReleased', button, buttons: this.getMouseButtons(), ...this.lastUV })
  }

  isMouseMode() {
    return !this.ctx?.world?.controls?.pointer?.locked
  }

  setMouseCapture(value) {
    const pointer = this.ctx?.world?.pointer
    const capture = !!value && !!this._src && this.isMouseMode()
    pointer?.setMouseCapture?.(capture)
    pointer?.setMouseCapture?.(capture, 'right')
  }

  getMouseButtons() {
    return (this.pointerButtonsDown.has('left') ? 1 : 0) | (this.pointerButtonsDown.has('right') ? 2 : 0)
  }

  updatePointer(uv) {
    if (!uv || !Number.isFinite(uv.x) || !Number.isFinite(uv.y)) return null
    this.lastUV = {
      u: Math.max(0, Math.min(1, uv.x)),
      v: Math.max(0, Math.min(1, uv.y)),
    }
    return this.lastUV
  }

  onWheel = event => {
    if (!this.isHovered || !this.lastUV) return
    event.preventDefault()
    event.stopPropagation()
    this.sendInput({
      type: 'mouseWheel',
      ...this.lastUV,
      deltaX: Math.max(-2000, Math.min(2000, event.deltaX)),
      deltaY: Math.max(-2000, Math.min(2000, event.deltaY)),
    })
  }

  focusKeyboard() {
    if (focusedBrowser && focusedBrowser !== this) focusedBrowser.releaseKeys()
    focusedBrowser = this
    this.keyboardInput?.focus({ preventScroll: true })
  }

  blurKeyboard() {
    this.releaseKeys()
    if (focusedBrowser === this) focusedBrowser = null
    this.keyboardInput?.blur()
  }

  onKeyDown = event => {
    if (focusedBrowser !== this || event.isComposing) return
    const key = { key: event.key, code: event.code, modifiers: getModifiers(event) }
    this.keysDown.set(event.code, key)
    this.sendInput({ type: 'keyDown', ...key, autoRepeat: event.repeat })
    const isText = event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey
    const isPaste = event.key.toLowerCase() === 'v' && (event.ctrlKey || event.metaKey)
    if (!isText && !isPaste) {
      event.preventDefault()
      event.stopPropagation()
    }
  }

  onKeyUp = event => {
    if (focusedBrowser !== this || event.isComposing) return
    const key = this.keysDown.get(event.code) || {
      key: event.key,
      code: event.code,
      modifiers: getModifiers(event),
    }
    this.keysDown.delete(event.code)
    this.sendInput({ type: 'keyUp', ...key })
    event.preventDefault()
    event.stopPropagation()
    if (event.key === 'Escape') this.blurKeyboard()
  }

  onBeforeInput = event => {
    if (focusedBrowser !== this) return
    if (event.isComposing) return
    if (event.inputType.startsWith('insert') && event.data) {
      this.sendText(event.data)
    }
    event.preventDefault()
    event.stopPropagation()
  }

  onCompositionEnd = event => {
    if (focusedBrowser !== this) return
    if (event.data) this.sendText(event.data)
    if (this.keyboardInput) this.keyboardInput.value = ''
  }

  onPaste = event => {
    if (focusedBrowser !== this) return
    const text = event.clipboardData?.getData('text/plain')
    if (text) this.sendText(text)
    event.preventDefault()
    event.stopPropagation()
  }

  releaseKeys() {
    for (const key of this.keysDown?.values() || []) {
      this.sendInput({ type: 'keyUp', ...key })
    }
    this.keysDown?.clear()
  }

  sendText(text) {
    const characters = Array.from(text)
    for (let i = 0; i < characters.length; i += 1024) {
      this.sendInput({ type: 'insertText', text: characters.slice(i, i + 1024).join('') })
    }
  }

  sendInput(input) {
    if (!this._src || !this.ctx?.world.network.isClient) return
    this.ctx.world.network.send('browserInput', {
      entityId: this.ctx.entity.data.id,
      url: this._src,
      input,
    })
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._src = source._src
    this._width = source._width
    this._height = source._height
    this._interval = source._interval
    this._doubleside = source._doubleside
    return this
  }

  get src() {
    return this._src
  }

  set src(value = defaults.src) {
    if (value !== null && !isString(value)) {
      throw new Error('[browser] src not null or string')
    }
    if (this._src === value) return
    this._src = value
    this.needsRebuild = true
    this.setDirty()
  }

  get width() {
    return this._width
  }

  set width(value = defaults.width) {
    if (!isNumber(value) || value <= 0) {
      throw new Error('[browser] width must be a positive number')
    }
    if (this._width === value) return
    this._width = value
    this.needsRebuild = true
    this.setDirty()
  }

  get height() {
    return this._height
  }

  set height(value = defaults.height) {
    if (!isNumber(value) || value <= 0) {
      throw new Error('[browser] height must be a positive number')
    }
    if (this._height === value) return
    this._height = value
    this.needsRebuild = true
    this.setDirty()
  }

  get interval() {
    return this._interval
  }

  set interval(value = defaults.interval) {
    if (!Number.isInteger(value) || value < 100) {
      throw new Error('[browser] interval must be an integer of at least 100ms')
    }
    if (this._interval === value) return
    this._interval = value
    this.needsRebuild = true
    this.setDirty()
  }

  get doubleside() {
    return this._doubleside
  }

  set doubleside(value = defaults.doubleside) {
    if (!isBoolean(value)) {
      throw new Error('[browser] doubleside not a boolean')
    }
    if (this._doubleside === value) return
    this._doubleside = value
    this.needsRebuild = true
    this.setDirty()
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get src() {
          return self.src
        },
        set src(value) {
          self.src = value
        },
        get width() {
          return self.width
        },
        set width(value) {
          self.width = value
        },
        get height() {
          return self.height
        },
        set height(value) {
          self.height = value
        },
        get interval() {
          return self.interval
        },
        set interval(value) {
          self.interval = value
        },
        get doubleside() {
          return self.doubleside
        },
        set doubleside(value) {
          self.doubleside = value
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy()))
      this.proxy = proxy
    }
    return this.proxy
  }
}
