(() => {
  const script = document.currentScript
  if (!script || window.parent === window) return
  if (window.HyperfyWebViewBridge?.version === 1) return

  const targetOrigin = script.dataset.hyperfyTargetOrigin || '*'
  const eventGroups = {
    click: ['click', 'dblclick', 'auxclick', 'contextmenu'],
    keyboard: ['keydown', 'keypress', 'keyup'],
    pointer: ['pointerdown', 'pointerup', 'pointercancel', 'pointerenter', 'pointerleave'],
    pointermove: ['pointermove'],
    wheel: ['wheel'],
    scroll: ['scroll', 'scrollend'],
    focus: ['focusin', 'focusout'],
    form: ['input', 'change', 'submit', 'reset'],
    dragdrop: ['dragstart', 'dragend', 'dragenter', 'dragleave', 'dragover', 'drop'],
    media: ['play', 'pause', 'ended', 'seeking', 'seeked'],
  }
  const configuredEvents = script.dataset.hyperfyEvents
  const categories = new Set((configuredEvents === undefined ? 'click,keyboard' : configuredEvents)
    .split(/[\s,]+/)
    .map(value => value.trim().toLowerCase())
    .filter(Boolean))
  const eventNames = new Set([...categories].flatMap(category => eventGroups[category] || []))
  const frameCoalescedEvents = new Set(['pointermove', 'scroll'])
  const pendingFrames = new Map()

  function send(name, detail = {}) {
    window.parent.postMessage({
      channel: 'hyperfy-webview',
      version: 1,
      type: 'event',
      name,
      detail,
    }, targetOrigin)
  }

  function elementFor(target) {
    if (target === document || target === window) return document.documentElement
    return target instanceof Element ? target : target?.parentElement
  }

  function describeTarget(target) {
    const element = elementFor(target)
    if (!element) return null
    const link = element.closest('a[href], area[href]')
    const interactive = element.closest(
      'a[href], area[href], button, input, select, textarea, summary, [role="link"], [role="button"], [contenteditable]:not([contenteditable="false"]), [data-hyperfy-interactive]'
    )
    const tagName = element.tagName.toLowerCase()
    return {
      tagName,
      id: element.id || null,
      name: element.getAttribute('name'),
      role: element.getAttribute('role'),
      inputType: element instanceof HTMLInputElement ? element.type : null,
      href: link?.href || null,
      linkTarget: link?.target || null,
      isInteractive: Boolean(interactive),
      isEditable: Boolean(element.isContentEditable || element.closest('input, textarea, select')),
    }
  }

  function eventDetail(event) {
    const detail = {
      isTrusted: event.isTrusted,
      defaultPrevented: event.defaultPrevented,
      target: describeTarget(event.target),
    }

    if (event instanceof MouseEvent) {
      Object.assign(detail, {
        button: event.button,
        buttons: event.buttons,
        clientX: event.clientX,
        clientY: event.clientY,
        screenX: event.screenX,
        screenY: event.screenY,
        clickCount: event.detail,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      })
    }

    if (event instanceof KeyboardEvent) {
      Object.assign(detail, {
        key: event.key,
        code: event.code,
        location: event.location,
        repeat: event.repeat,
        isComposing: event.isComposing,
        charCode: event.charCode,
        keyCode: event.keyCode,
        altKey: event.altKey,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      })
    }

    if (event instanceof PointerEvent) {
      Object.assign(detail, {
        pointerId: event.pointerId,
        pointerType: event.pointerType,
        isPrimary: event.isPrimary,
        pressure: event.pressure,
        width: event.width,
        height: event.height,
        tiltX: event.tiltX,
        tiltY: event.tiltY,
        twist: event.twist,
      })
    }

    if (event instanceof WheelEvent) {
      Object.assign(detail, {
        deltaX: event.deltaX,
        deltaY: event.deltaY,
        deltaZ: event.deltaZ,
        deltaMode: event.deltaMode,
      })
    }

    if (event instanceof InputEvent) {
      Object.assign(detail, {
        inputType: event.inputType,
        isComposing: event.isComposing,
      })
    }

    if (event instanceof FocusEvent) {
      detail.relatedTarget = describeTarget(event.relatedTarget)
    }

    if (event.type === 'scroll' || event.type === 'scrollend') {
      const target = event.target === document ? document.scrollingElement : event.target
      if (target instanceof Element) {
        detail.scroll = {
          left: target.scrollLeft,
          top: target.scrollTop,
          width: target.scrollWidth,
          height: target.scrollHeight,
          clientWidth: target.clientWidth,
          clientHeight: target.clientHeight,
        }
      }
    }

    if (event.target instanceof HTMLMediaElement) {
      Object.assign(detail, {
        currentTime: event.target.currentTime,
        duration: Number.isFinite(event.target.duration) ? event.target.duration : null,
        paused: event.target.paused,
        muted: event.target.muted,
      })
    }

    return detail
  }

  function forward(name, event) {
    if (!frameCoalescedEvents.has(name)) {
      send(name, eventDetail(event))
      return
    }

    const target = event.target || document
    let eventsForTarget = pendingFrames.get(target)
    if (!eventsForTarget) {
      eventsForTarget = new Map()
      pendingFrames.set(target, eventsForTarget)
    }

    const pending = eventsForTarget.get(name)
    if (pending) {
      pending.event = event
      return
    }

    const next = { event }
    eventsForTarget.set(name, next)
    requestAnimationFrame(() => {
      eventsForTarget.delete(name)
      if (eventsForTarget.size === 0) pendingFrames.delete(target)
      send(name, eventDetail(next.event))
    })
  }

  for (const name of eventNames) {
    document.addEventListener(name, event => forward(name, event), true)
  }

  window.HyperfyWebViewBridge = Object.freeze({
    version: 1,
    emit(name, detail = {}) {
      if (typeof name !== 'string' || !/^[a-z][a-z0-9._:-]{0,63}$/i.test(name)) return false
      let safeDetail
      try {
        const serialized = JSON.stringify(detail)
        if (serialized === undefined || serialized.length > 8192) return false
        safeDetail = JSON.parse(serialized)
      } catch {
        return false
      }
      send('custom', { name, detail: safeDetail })
      return true
    },
  })
})()
