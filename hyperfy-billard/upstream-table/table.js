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
  { key: 'poolChannel', type: 'text', label: 'Pool game channel', initial: '', hint: 'Blank = automatic per table. A shared channel shares volume only; games stay independent.' },
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
  // Physics-only nodes never enter the stage octree used for action clicks.
  // A continuous floor-to-rail box gives avatars no intermediate steps.
  const colliderSize = [2.72, 0.76, 1.53]
  const body = app.create('rigidbody', { type: 'static' })
  const collider = app.create('collider', { type: 'box' })
  body.add(collider)
  const previousScale = app.scale.clone().set(0, 0, 0)
  const syncCollider = () => {
    body.position.copy(app.position)
    body.quaternion.copy(app.quaternion)
    if (!app.scale.equals(previousScale)) {
      previousScale.copy(app.scale)
      collider.width = colliderSize[0] * app.scale.x
      collider.height = colliderSize[1] * app.scale.y
      collider.depth = colliderSize[2] * app.scale.z
      collider.position.set(0, collider.height / 2, 0)
    }
  }
  syncCollider()
  world.add(body)
  app.on('update', syncCollider)
  app.on('destroy', () => world.remove(body))
}
