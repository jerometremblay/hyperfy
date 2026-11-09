// The app's model is the saved Polyfork .mjs. Attach its generated geometry,
// then control its named door group without wrapping every model part.
const geometry = app.attachGeometry()
let open = app.state?.open === true
const actions = []

function applyDoor() {
  geometry.setPartRotation('door', 'y', open ? -105 * Math.PI / 180 : 0)
  for (const action of actions) {
    action.label = open ? 'Close door' : 'Open door'
    action.position.x = open ? -0.759 : 0
    action.position.z = open ? 0.728 : 0
  }
}

applyDoor()

if (world.isServer) {
  app.on('toggleDoor', () => {
    open = !open
    app.state = { open }
    applyDoor()
    app.send('doorChanged', { open })
  })
}

if (world.isClient) {
  for (const y of [0.55, 1.65]) {
    const action = app.create('action', {
      position: [0, y, 0],
      label: open ? 'Close door' : 'Open door',
      distance: 4,
      duration: 0,
      onTrigger: () => app.send('toggleDoor'),
    })
    actions.push(action)
    app.add(action)
  }
  applyDoor()
  app.on('doorChanged', state => {
    open = state.open === true
    applyDoor()
  })
}
