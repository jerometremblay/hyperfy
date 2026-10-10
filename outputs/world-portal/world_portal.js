// Coordinate system: +Y up, +X right, -Z forward.
// The portal root sits on the floor; its surface faces local +Z.

app.resetOnMove = false

app.configure([
  {
    key: 'destination',
    type: 'text',
    label: 'Destination world URL',
    placeholder: 'https://…',
    hint: 'Leave blank to link to another portal in this world.',
    initial: '',
  },
  {
    key: 'destinationPortalId',
    type: 'text',
    label: 'Destination portal ID',
    placeholder: 'Paste a portal ID',
    hint: 'Copy the ID from the destination portal. Add a world URL for another world.',
    initial: '',
  },
  {
    key: 'portalId',
    type: 'copy',
    label: 'Copy portal ID',
    value: app.instanceId,
    hint: 'Copies this portal’s unique ID to the clipboard.',
  },
])

const width = 1.6
const height = 2.4
const surfacePosition = [0, height / 2, 0]

const surface = app.create('prim', {
  type: 'plane',
  size: [width, height],
  position: surfacePosition,
  color: '#46a9b8',
  emissive: '#1b6974',
  emissiveIntensity: 0.25,
  opacity: 0.78,
  roughness: 0.35,
  doubleside: true,
  castShadow: false,
  receiveShadow: false,
  physics: null,
})
app.add(surface)

const localPosition = surface.position.clone()

function getTriggerTransform() {
  const position = localPosition
    .clone()
    .multiply(app.scale)
    .applyQuaternion(app.quaternion)
    .add(app.position)
  return {
    position,
    quaternion: app.quaternion.clone(),
    scale: app.scale.clone(),
  }
}

const initialTransform = getTriggerTransform()
let opening = false
let pendingTravel = null
let travelSequence = 0

function showToast(message) {
  app.emit('toast', message)
}

function getArrivalPosition() {
  return new Vector3(0, 0, 1)
    .multiply(app.scale)
    .applyQuaternion(app.quaternion)
    .add(app.position)
}

function arriveAtPortal() {
  const player = world.getPlayer()
  if (!player?.local || !player.ready) return false

  player.teleport(getArrivalPosition(), app.rotation.y + Math.PI)
  return true
}

function appendPortalId(url, portalId) {
  const hashIndex = url.indexOf('#')
  const hash = hashIndex === -1 ? '' : url.slice(hashIndex)
  const withoutHash = hashIndex === -1 ? url : url.slice(0, hashIndex)
  const queryIndex = withoutHash.indexOf('?')
  const path = queryIndex === -1 ? withoutHash : withoutHash.slice(0, queryIndex)
  const query = queryIndex === -1 ? '' : withoutHash.slice(queryIndex + 1)
  const params = query
    .split('&')
    .filter(Boolean)
    .filter(param => {
      const key = param.split('=')[0].replace(/\+/g, ' ')
      try {
        return decodeURIComponent(key) !== 'portalId'
      } catch {
        return true
      }
    })
  params.push(`portalId=${encodeURIComponent(portalId)}`)
  return `${path}?${params.join('&')}${hash}`
}

world.on('world-portal:travel', request => {
  if (!world.isClient || request?.targetId !== app.instanceId) return
  if (!arriveAtPortal()) return
  app.emit('world-portal:arrived', {
    sourceId: request.sourceId,
    requestId: request.requestId,
  })
})

world.on('world-portal:arrived', response => {
  if (!pendingTravel) return
  if (response?.sourceId !== app.instanceId || response.requestId !== pendingTravel) return
  pendingTravel = null
})

if (world.isClient && world.getQueryParam('portalId') === app.instanceId) {
  let arrived = false
  let arrivalAttempts = 0
  const tryArrival = () => {
    if (arrived) return
    if (!arriveAtPortal()) {
      if (arrivalAttempts++ < 300) setTimeout(tryArrival, 100)
      return
    }
    arrived = true
    world.setQueryParam('portalId', null)
    showToast('Arrived at destination portal')
  }

  tryArrival()
}

const trigger = app.create('prim', {
  type: 'box',
  size: [width, height, 0.3],
  position: initialTransform.position.toArray(),
  quaternion: initialTransform.quaternion.toArray(),
  scale: initialTransform.scale.toArray(),
  opacity: 0,
  castShadow: false,
  receiveShadow: false,
  physics: 'static',
  trigger: true,
  tag: 'world-portal',
  onTriggerEnter: event => {
    const destination = typeof props.destination === 'string' ? props.destination.trim() : ''
    const destinationPortalId =
      typeof props.destinationPortalId === 'string' ? props.destinationPortalId.trim() : ''
    if (!world.isClient || !event.isLocalPlayer || opening) return

    if (destination) {
      if (!/^https?:\/\//i.test(destination)) return
      opening = true
      world.open(
        destinationPortalId ? appendPortalId(destination, destinationPortalId) : destination,
        false
      )
      return
    }

    if (!destinationPortalId || pendingTravel) return
    const requestId = `${app.instanceId}:${++travelSequence}`
    pendingTravel = requestId
    app.emit('world-portal:travel', {
      sourceId: app.instanceId,
      targetId: destinationPortalId,
      requestId,
    })
    setTimeout(() => {
      if (pendingTravel !== requestId) return
      pendingTravel = null
      showToast('Destination portal not found')
    }, 1000)
  },
})
world.add(trigger)

const lastScale = initialTransform.scale.clone()

app.on('update', () => {
  const transform = getTriggerTransform()
  const scaleChanged = !lastScale.equals(transform.scale)

  trigger.position.copy(transform.position)
  trigger.quaternion.copy(transform.quaternion)
  trigger.scale.copy(transform.scale)

  if (scaleChanged) {
    lastScale.copy(transform.scale)
    const physics = trigger.physics
    trigger.physics = null
    trigger.physics = physics
  }
})

app.on('destroy', () => world.remove(trigger))
