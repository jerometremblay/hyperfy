// Y up, +X right, -Z forward. Origin is the floor under the stool.
const wood = '#5a3220'
const edge = '#38221a'
const leather = '#633b29'
function prim(type, size, position, color, extra = {}) {
  const node = app.create('prim', { type, size, position, color, roughness: 0.8, ...extra })
  app.add(node)
  return node
}
// Compact pub stool: four solid legs and a leather padded circular seat.
for (const x of [-0.19, 0.19]) for (const z of [-0.19, 0.19]) {
  prim('box', [0.055, 0.68, 0.055], [x, 0.34, z], wood)
  prim('box', [0.062, 0.025, 0.062], [x, 0.0125, z], edge)
}
for (const z of [-0.19, 0.19]) prim('box', [0.38, 0.045, 0.045], [0, 0.25, z], wood)
for (const x of [-0.19, 0.19]) prim('box', [0.045, 0.045, 0.38], [x, 0.25, 0], wood)
prim('cylinder', [0.255, 0.255, 0.07], [0, 0.685, 0], edge)
prim('cylinder', [0.245, 0.245, 0.07], [0, 0.755, 0], leather)
const anchor = app.create('anchor', { id: 'pool-stool-seat', position: [0, 0.83, 0] })
app.add(anchor)
const exit = app.create('group', { position: [0, 0.05, -0.75] })
app.add(exit)
if (world.isServer) {
  let owner = null
  app.state.stoolOwner = null
  const publish = () => { app.state.stoolOwner = owner; app.send('stool:owner', owner) }
  const identify = id => world.getPlayers().find(p => p.networkId === id)
  app.on('stool:claim', (data, networkId) => {
    const player = identify(networkId)
    if (!player || !data) return
    const accepted = !owner || owner === player.id
    if (accepted) { owner = player.id; publish() }
    app.send('stool:answer', { playerId: player.id, token: data.token, accepted })
  })
  app.on('stool:release', (_, networkId) => {
    const player = identify(networkId)
    if (player && owner === player.id) { owner = null; publish() }
  })
  const onLeave = ({ playerId }) => { if (owner === playerId) { owner = null; publish() } }
  world.on('leave', onLeave)
  app.on('destroy', () => world.off('leave', onLeave))
}
if (world.isClient && typeof world.getPlayer === 'function') {
  const player = world.getPlayer()
  let owner = app.state.stoolOwner || null, pending = null, current = null, token = 0, destroyed = false
  const action = app.create('action', {
    label: 'Sit', position: [0, 0.8, -0.25], distance: 1.65, duration: 0.12,
    onTrigger: () => {
      if (!player || owner || pending !== null || current || destroyed) return
      pending = ++token; updateAction(); app.send('stool:claim', { token: pending })
    },
  })
  function updateAction() { action.active = !destroyed && !owner && pending === null && !current }
  app.add(action)
  app.on('stool:owner', value => { owner = value; updateAction() })
  app.on('stool:answer', answer => {
    if (!answer || !player || answer.playerId !== player.id || answer.token !== pending) return
    pending = null
    if (!answer.accepted) { updateAction(); return }
    const entry = {}; current = entry; updateAction()
    try {
      entry.effect = player.applyEffect({ anchor, snare: 1, cancellable: true, onEnd: () => {
        if (current !== entry) return
        current = null
        if (!destroyed) {
          app.send('stool:release', {})
          player.teleport(exit.position.clone().multiply(app.scale).applyQuaternion(app.quaternion).add(app.position))
        }
        updateAction()
      } })
      if (!entry.effect) { current = null; app.send('stool:release', {}); updateAction() }
    } catch (error) { current = null; app.send('stool:release', {}); updateAction(); throw error }
  })
  app.on('destroy', () => { destroyed = true; if (current?.effect) current.effect.cancel(); updateAction() })
  updateAction()
}
