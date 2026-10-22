// Coordinates: +Y up, +X long rail, -Z forward. Origin is the floor/contact plane.
// The visible table is the bundled upstream GLB. Balls belong to the game app.
const CLOTH_COLORS = [
  { label: 'Orange Peach', value: '#e99476' },
  { label: 'Academy Blue', value: '#426eaa' },
  { label: 'Black', value: '#1f2228' },
  { label: 'Brown', value: '#74523c' },
  { label: 'Burgundy', value: '#762e48' },
  { label: 'Camel', value: '#bc9965' },
  { label: 'Charcoal', value: '#4a4d50' },
  { label: 'Dark Green', value: '#174d39' },
  { label: 'Euro Blue', value: '#317fa6' },
  { label: 'Khaki', value: '#a99b72' },
  { label: 'Navy', value: '#263b5b' },
  { label: 'Olive', value: '#737844' },
  { label: 'Orange', value: '#d77939' },
  { label: 'Purple', value: '#694782' },
  { label: 'Red', value: '#a93438' },
  { label: 'Spruce', value: '#2e625c' },
  { label: 'Standard Green', value: '#2c764f' },
  { label: 'Steel Grey', value: '#7a7f83' },
  { label: 'Titanium', value: '#9a9ea1' },
  { label: 'Tournament Blue', value: '#225081' },
  { label: 'Tournament Green', value: '#165d34' },
  { label: 'Wine', value: '#602c40' },
  { label: 'Lilac', value: '#a08ab3' },
  { label: 'Merlot', value: '#7d3a57' },
]
const DEFAULT_CLOTH_COLOR = '#e99476'

app.configure([
  { key: 'soundVolume', type: 'range', label: 'Sound volume (1 = normal)', min: 0, max: 5, step: 0.1, initial: 1 },
  { key: 'poolChannel', type: 'text', label: 'Pool game channel', initial: 'classic-8-ft-pool-table' },
  {
    key: 'clothColor', type: 'select', label: 'Cloth color', initial: DEFAULT_CLOTH_COLOR,
    hint: 'Approximate colors from A.E. Schmidt Standard Cloth and Speedball options.',
    options: CLOTH_COLORS,
  },
])

if (world.isClient) {
  const selected = CLOTH_COLORS.find(color => color.value === props.clothColor)?.value || DEFAULT_CLOTH_COLOR
  const darken = (hex, factor) => `#${[1, 3, 5].map(i =>
    Math.round(parseInt(hex.slice(i, i + 2), 16) * factor).toString(16).padStart(2, '0')
  ).join('')}`
  const shade = selected === DEFAULT_CLOTH_COLOR ? '#cf7258' : darken(selected, 0.82)
  const cushion = selected === DEFAULT_CLOTH_COLOR ? '#b85d49' : darken(selected, 0.69)
  for (const [id, color] of [
    ['upstream-cloth', selected],
    ['upstream-clothshade', shade],
    ['upstream-CushionBlue', cushion],
  ]) {
    const mesh = app.get(id)
    if (mesh?.material) mesh.material.color = color
  }
}

if (world.isClient && !world.isPreview) {
  const channel = props.poolChannel || 'classic-8-ft-pool-table'
  const volumeEvent = `billard:volume:${channel}`
  const sendVolume = () => app.emit(volumeEvent, props.soundVolume ?? 1)
  world.on(`${volumeEvent}:request`, sendVolume)
  sendVolume()
  let holders = [], aiming = false
  const hasCue = () => holders.includes(world.getPlayer()?.id)
  const play = () => { if (hasCue() && !aiming) app.emit(`billard:play:${channel}`) }
  // Native actions require the pointer hit to be within one metre of their
  // position. Three positions cover the whole cloth and every rail.
  const actions = [-0.9, 0, 0.9].map(x => {
    const action = app.create('action', {
      label: 'Play', distance: 0, duration: 0.2, position: [x, 0.72, 0],
    })
    action.onTrigger = play
    app.add(action)
    return action
  })
  const refresh = () => {
    for (const action of actions) action.distance = hasCue() && !aiming ? 3 : 0
  }
  world.on(`billard:cues:${channel}`, next => {
    if (!Array.isArray(next)) return
    holders = next.filter(id => typeof id === 'string')
    refresh()
  })
  world.on(`billard:aiming:${channel}`, active => {
    aiming = active === true
    refresh()
  })
  const ready = () => {
    if (!world.getPlayer()) return
    app.off('update', ready)
    refresh()
    app.emit(`billard:cues:${channel}:request`)
    app.emit(`billard:aiming:${channel}:request`)
  }
  app.on('update', ready)
  ready()
  app.onPointerDown = play
  // One detached structural collider for avatars; ball physics stays numerical.
  const colliderSize = [2.72, 0.70, 1.53]
  const colliderTransform = () => {
    const position = app.position.clone()
    const offset = app.position.clone().set(0, colliderSize[1] / 2, 0)
      .multiply(app.scale).applyQuaternion(app.quaternion)
    position.add(offset)
    return { position, quaternion: app.quaternion.clone(), scale: app.scale.clone() }
  }
  const initial = colliderTransform()
  const collider = app.create('prim', {
    type: 'box', size: colliderSize,
    position: initial.position.toArray(),
    quaternion: initial.quaternion.toArray(),
    scale: initial.scale.toArray(),
    opacity: 0, castShadow: false, receiveShadow: false, physics: 'static',
  })
  world.add(collider)
  const previousScale = initial.scale.clone()
  const syncCollider = () => {
    const transform = colliderTransform()
    collider.position.copy(transform.position)
    collider.quaternion.copy(transform.quaternion)
    collider.scale.copy(transform.scale)
    if (!transform.scale.equals(previousScale)) {
      previousScale.copy(transform.scale)
      const physics = collider.physics
      collider.physics = null
      collider.physics = physics
    }
  }
  app.on('update', syncCollider)
  app.on('destroy', () => world.remove(collider))
}
