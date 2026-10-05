import { HTMLMesh } from 'three/examples/jsm/interactive/HTMLMesh.js'
import { Mesh, MeshBasicMaterial, SphereGeometry } from 'three'

// Keep the actual React sidebar and its handlers. HTMLMesh supplies the DOM
// texture; this bridge adds SVG icons and bubbling pointer events for React.
export class XRDOMSurface {
  constructor(element) {
    this.element = element
    this.mesh = new HTMLMesh(element)
    this.pointers = new Map()
    this.icons = new Map()
    this.cursorGeometry = new SphereGeometry(0.007, 12, 8)
    const texture = this.mesh.material.map
    const update = texture.update.bind(texture)
    texture.update = () => {
      if (this.disposed) return
      update()
      this.drawIcons()
    }
    texture.update()
    element.addEventListener('scroll', this.refresh, true)
    element.addEventListener('input', this.refresh, true)
  }

  refresh = () => this.mesh.material.map.update()

  drawIcons() {
    const root = this.element.getBoundingClientRect()
    const context = this.mesh.material.map.image.getContext('2d')
    for (const svg of this.element.querySelectorAll('svg')) {
      const rect = svg.getBoundingClientRect()
      if (!rect.width || !rect.height) continue
      const copy = svg.cloneNode(true)
      copy.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
      copy.setAttribute('width', rect.width)
      copy.setAttribute('height', rect.height)
      copy.style.color = getComputedStyle(svg).color
      const markup = new XMLSerializer().serializeToString(copy)
      let icon = this.icons.get(markup)
      if (!icon) {
        icon = new Image()
        icon.onload = this.refresh
        icon.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(markup)}`
        this.icons.set(markup, icon)
      }
      if (!icon.complete || !icon.naturalWidth) continue
      context.save()
      context.beginPath()
      context.rect(0, 0, root.width, root.height)
      context.clip()
      for (let parent = svg.parentElement; parent && parent !== this.element; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (['auto', 'scroll', 'hidden'].includes(style.overflowY)) {
          const clip = parent.getBoundingClientRect()
          context.beginPath()
          context.rect(clip.left - root.left, clip.top - root.top, clip.width, clip.height)
          context.clip()
        }
      }
      context.drawImage(icon, rect.left - root.left, rect.top - root.top, rect.width, rect.height)
      context.restore()
    }
  }

  hit(uv) {
    if (!uv) return null
    const rect = this.element.getBoundingClientRect()
    const x = rect.left + uv.x * rect.width
    const y = rect.top + uv.y * rect.height
    const elements = this.element.querySelectorAll('*')
    for (let i = elements.length - 1; i >= 0; i--) {
      const element = elements[i]
      if (!containsPoint(element, x, y)) continue
      const style = getComputedStyle(element)
      if (style.pointerEvents === 'none' || style.visibility === 'hidden' || style.display === 'none') continue
      let clipped = false
      for (let parent = element; parent && parent !== this.element; parent = parent.parentElement) {
        const style = getComputedStyle(parent)
        if (style.opacity === '0' || style.visibility === 'hidden') clipped = true
        if (['auto', 'scroll', 'hidden'].includes(style.overflowY) && !containsPoint(parent, x, y)) clipped = true
      }
      if (!clipped) return element
    }
    return null
  }

  event(target, type, id, uv, down, relatedTarget = null) {
    if (!target) return
    const rect = this.element.getBoundingClientRect()
    const options = {
      bubbles: true,
      cancelable: true,
      pointerId: id,
      pointerType: 'touch',
      button: 0,
      buttons: down ? 1 : 0,
      clientX: rect.left + (uv?.x || 0) * rect.width,
      clientY: rect.top + (uv?.y || 0) * rect.height,
      relatedTarget,
      view: this.element.ownerDocument.defaultView,
    }
    const event = type.startsWith('pointer') ? new PointerEvent(type, options) : new MouseEvent(type, options)
    const previous = this.pointers.get(id)?.uv
    if (type.endsWith('move') && previous && uv) {
      Object.defineProperties(event, {
        movementX: { value: (uv.x - previous.x) * rect.width },
        movementY: { value: (uv.y - previous.y) * rect.height },
      })
    }
    event.isCoreUI = true
    event.isXRUI = true
    target.dispatchEvent(event)
  }

  updatePointer(id, uv, down, activate = true) {
    let pointer = this.pointers.get(id)
    if (!pointer) {
      pointer = { hover: null, pressed: null, uv: null }
      this.pointers.set(id, pointer)
    }
    const hover = this.hit(uv)
    if (uv && !pointer.cursor) {
      pointer.cursor = new Mesh(this.cursorGeometry, new MeshBasicMaterial({ color: '#6ac4dc', toneMapped: false }))
      this.mesh.add(pointer.cursor)
    }
    if (pointer.cursor) {
      pointer.cursor.visible = !!uv
      if (uv) {
        const { width, height } = this.mesh.geometry.parameters
        pointer.cursor.position.set((uv.x - 0.5) * width, (0.5 - uv.y) * height, 0.006)
        pointer.cursor.material.color.set(down ? '#ffd60a' : '#6ac4dc')
      }
    }
    if (hover !== pointer.hover) {
      this.event(pointer.hover, 'pointerout', id, uv, down, hover)
      this.event(hover, 'pointerover', id, uv, down, pointer.hover)
      pointer.hover = hover
    }
    this.event(pointer.pressed || hover, 'pointermove', id, uv || pointer.uv, down)
    this.event(pointer.pressed || hover, 'mousemove', id, uv || pointer.uv, down)
    if (down && !pointer.pressed && hover) {
      pointer.pressed = hover
      pointer.clickTarget = this.clickTarget(hover)
      this.event(hover, 'pointerdown', id, uv, true)
      this.event(hover, 'mousedown', id, uv, true)
      const input = hover.closest('input, textarea')
      input?.focus()
      if (!input) this.element.ownerDocument.activeElement?.blur()
    } else if (!down && pointer.pressed) {
      const pressed = pointer.pressed
      pointer.pressed = null
      this.event(pressed, 'pointerup', id, uv || pointer.uv, false)
      this.event(pressed, 'mouseup', id, uv || pointer.uv, false)
      if (activate && uv && hover && pointer.clickTarget === this.clickTarget(hover)) {
        this.event(pointer.clickTarget, 'click', id, uv, false)
      }
    }
    pointer.uv = uv || pointer.uv
    return hover
  }

  clickTarget(element) {
    for (let target = element; target && target !== this.element; target = target.parentElement) {
      if (target.onclick || target.matches('button, input, a, label')) return target
    }
    return element
  }

  cancelPointers() {
    for (const [id, pointer] of this.pointers) {
      this.event(pointer.pressed, 'pointerup', id, pointer.uv, false)
      this.event(pointer.pressed, 'mouseup', id, pointer.uv, false)
      this.event(pointer.hover, 'pointerout', id, pointer.uv, false)
      pointer.cursor?.removeFromParent()
      pointer.cursor?.material.dispose()
    }
    this.pointers.clear()
  }

  dispose() {
    this.cancelPointers()
    this.disposed = true
    this.element.removeEventListener('scroll', this.refresh, true)
    this.element.removeEventListener('input', this.refresh, true)
    for (const icon of this.icons.values()) icon.onload = null
    this.icons.clear()
    this.cursorGeometry.dispose()
    this.mesh.removeFromParent()
    this.mesh.dispose()
  }
}

function containsPoint(element, x, y) {
  const rect = element.getBoundingClientRect()
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom && rect.width > 0 && rect.height > 0
}
