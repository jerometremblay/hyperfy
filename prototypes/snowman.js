/* global app, world */

// Prototype app: three clickable spheres that change color together.
// Edit this file while watch-snowman.mjs is running to update the placed app.

const colors = ['#f4f4f4', '#ef4444', '#3b82f6', '#22c55e', '#f59e0b', '#a855f7']
const storageKey = `snowman:${app.instanceId}:color`

function validColor(color) {
  return colors.includes(color) ? color : colors[0]
}

let initialColor = colors[0]

if (world.isServer) {
  initialColor = validColor(world.get(storageKey))
  app.state.color = initialColor
  app.state.ready = true
} else if (app.state && app.state.ready) {
  initialColor = validColor(app.state.color)
}

let colorIndex = colors.indexOf(initialColor)

const body = app.create('prim', {
  type: 'sphere',
  size: [0.55],
  position: [0, 0.55, 0],
  color: initialColor,
  roughness: 0.85,
})

const head = app.create('prim', {
  type: 'sphere',
  size: [0.42],
  position: [0, 1.52, 0],
  color: initialColor,
  roughness: 0.85,
})

const top = app.create('prim', {
  type: 'sphere',
  size: [0.28],
  position: [0, 2.22, 0],
  color: initialColor,
  roughness: 0.85,
})

app.add(body)
app.add(head)
app.add(top)

function setColor(color) {
  const nextIndex = colors.indexOf(color)
  if (nextIndex === -1) return
  colorIndex = nextIndex
  body.color = colors[colorIndex]
  head.color = colors[colorIndex]
  top.color = colors[colorIndex]
}

if (world.isServer) {
  app.on('cycleColor', () => {
    const nextColor = colors[(colors.indexOf(app.state.color) + 1) % colors.length]
    app.state.color = nextColor
    world.set(storageKey, nextColor)
    app.send('colorChanged', { color: nextColor })
  })

  app.send('init', { color: app.state.color })
}

if (world.isClient) {
  const applyColor = data => setColor(data?.color)

  if (app.state && app.state.ready) setColor(app.state.color)
  app.on('init', applyColor)
  app.on('colorChanged', applyColor)
}

function requestColorCycle() {
  if (world.isClient) app.send('cycleColor')
}

body.cursor = 'pointer'
head.cursor = 'pointer'
top.cursor = 'pointer'
body.onPointerDown = requestColorCycle
head.onPointerDown = requestColorCycle
top.onPointerDown = requestColorCycle
