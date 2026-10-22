// Coordinates: +Y up, +X along the long rail, -Z forward. SI units.
// Origin = centre of the cloth surface, so this can overlay any table model.
import { startServer } from './server.js'
import { BALL_RADIUS as R, dimensions, rackPositions } from './simulation.js'
import { startClient } from './client.js'

app.configure?.([
  {
    key: 'tableSize',
    type: 'switch',
    label: 'WPA playing surface',
    options: [
      { label: '9 ft (2.54 × 1.27 m)', value: '9' },
      { label: '8 ft (2.3368 × 1.1684 m)', value: '8' },
    ],
    initial: '9',
  },
  ...[['Hit', 'Cue strike'], ['Collision', 'Ball collision'], ['Cushion', 'Cushion hit'], ['Pot', 'Pocket drop']]
    .map(([type, label]) => ({ key: `sound${type}`, type: 'file', kind: 'audio', label: `${label} sound` })),
  { key: 'showSurface', type: 'toggle', label: 'Show practice surface', initial: true },
  { key: 'playChannel', type: 'text', label: 'Table and cue rack channel', initial: 'classic-8-ft-pool-table' },
])
const preset = props.tableSize === '8' ? '8' : '9'
if (world.isServer) {
  startServer(world, app, preset, props.playChannel || 'classic-8-ft-pool-table')
} else {
  const size = dimensions(preset)
  const { length: L, width: W } = size
  const prim = (type, size, position, color, extra = {}) => {
    const node = app.create('prim', { type, size, position, color, physics: null, roughness: 0.5, ...extra })
    app.add(node)
    return node
  }
  // Geometry only: balls and cloth never enter PhysX.
  if (props.showSurface !== false) {
    prim('box', [L + 0.24, 0.05, W + 0.24], [0, -0.065, 0], '#142730')
    prim('box', [L, 0.015, W], [0, -0.0075, 0], '#16746a')
    // Rail gaps use the same scaled pocket geometry as the physics core.
    // Configure from dimensions without starting a simulation on clients.
    const inset = R * 3.2,
      mid = R * 2.77
    const segment = (a, b, z) => prim('box', [b - a, 0.035, 0.05], [(a + b) / 2, 0.0175, z], '#0c4845')
    for (const s of [-1, 1]) {
      segment(-L / 2 + inset, -mid, s * (W / 2 + 0.025))
      segment(mid, L / 2 - inset, s * (W / 2 + 0.025))
      prim('box', [0.05, 0.035, W - 2 * inset], [s * (L / 2 + 0.025), 0.0175, 0], '#0c4845')
      for (const x of [-L / 2, 0, L / 2]) {
        prim(
          'cylinder',
          [x === 0 ? R * 1.8 : R * 2.2, x === 0 ? R * 1.8 : R * 2.2, 0.006],
          [x === 0 ? 0 : x + Math.sign(x) * 0.6 * R, 0.003, s * (W / 2 + (x === 0 ? 2 : 0.6) * R)],
          '#070e15'
        )
      }
    }
    for (let i = -3; i <= 3; i++) {
      if (!i) continue
      for (const s of [-1, 1]) prim('sphere', [0.004], [(i * L) / 8, 0.04, s * (W / 2 + 0.03)], '#c5d3c4')
    }
  }
  const positions = rackPositions(preset)
  const balls = positions.map((p, id) => {
    const group = app.create('group', { position: [p[0], R + p[2], -p[1]] })
    app.add(group)
    const sphere = app.create('prim', {
      type: 'sphere',
      size: [R],
      color: '#ffffff',
      texture: props[`ball${id}`]?.url || BILLARD_TEXTURES[id] || null,
      physics: null,
      roughness: 0.18,
    })
    group.add(sphere)

    return group
  })
  const ghost = prim('sphere', [R], [-L / 4, R, 0], '#ffffff', { opacity: 0.4 })
  ghost.active = false
  const action = app.create('action', { label: 'Play', distance: 3, duration: 0.2, position: [0, 0.25, W / 2] })
  app.add(action)
  if (!world.isPreview)
    startClient(world, app, {
      soundSources: Object.fromEntries(['Hit', 'Collision', 'Cushion', 'Pot'].map(type =>
        [type, props[`sound${type}`]?.url || BILLARD_SOUNDS[type]])),
      balls,
      ghost,
      action,
      size,
      playChannel: props.playChannel || 'classic-8-ft-pool-table',
    })
}
