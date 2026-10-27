// Hyperfy display adapter. Y up, +X right, board front +Z; root rests on floor.
// All game geometry is visual-only. The standalone game owns dart collisions.
import { BULL_HEIGHT, scoreboard } from './game.js'
import { textLines } from './text.js'

const COLOURS = ['#c8483d', '#4e91bd', '#dec266', '#54a480']

export function createDisplay(app, texture) {
  const prim = (type, size, position, color, extra = {}, parent = app) => {
    const node = app.create('prim', {
      type,
      size,
      position,
      color,
      physics: null,
      roughness: 0.6,
      castShadow: false,
      receiveShadow: true,
      ...extra,
    })
    parent.add(node)
    return node
  }
  // Pub cabinet: a deep walnut body, green board surround and recessed screen.
  const wood = '#4a2e22'
  const green = '#18312c'
  const brass = '#a88956'
  const brassMaterial = { metalness: 0.65, roughness: 0.32 }
  prim('box', [0.9, 0.045, 0.6], [0, 0.0225, -0.24], '#171a18')
  prim('box', [0.83, 0.12, 0.53], [0, 0.105, -0.26], '#202622')
  prim('box', [0.73, 2.08, 0.045], [0, 1.12, -0.505], wood)
  prim('box', [0.73, 1.25, 0.405], [0, 0.705, -0.2625], '#31251f')
  for (const side of [-1, 1]) {
    prim('box', [0.055, 2.12, 0.5], [side * 0.3925, 1.13, -0.25], wood)
    prim('box', [0.006, 0.96, 0.33], [side * 0.423, 0.82, -0.27], green)
    prim('box', [0.006, 0.7, 0.33], [side * 0.423, 1.73, -0.27], green)
    prim('box', [0.01, 2.08, 0.012], [side * 0.405, 1.13, 0.006], brass, brassMaterial)
    prim('box', [0.038, 0.81, 0.045], [side * 0.347, BULL_HEIGHT, -0.003], wood)
    prim('box', [0.042, 0.61, 0.084], [side * 0.35, 0.975, -0.005], wood)
  }
  prim('box', [0.72, 0.78, 0.032], [0, BULL_HEIGHT, -0.043], green)
  for (const y of [1.325, 2.135]) {
    prim('box', [0.73, 0.04, 0.045], [0, y, -0.003], wood)
  }
  prim('cylinder', [0.228, 0.228, 0.026], [0, BULL_HEIGHT, -0.015], '#131817', { rotation: [Math.PI / 2, 0, 0] })
  const face = prim('plane', [0.46, 0.46], [0, BULL_HEIGHT, 0.0005], '#ffffff', {
    texture,
    doubleside: false,
    roughness: 1,
  })
  prim('box', [0.88, 0.15, 0.54], [0, 2.195, -0.235], wood)
  prim('box', [0.89, 0.02, 0.57], [0, 2.11, -0.225], brass, brassMaterial)
  prim('box', [0.63, 0.012, 0.065], [0, 2.094, -0.01], '#fff0cc', {
    emissive: '#ffe0a1',
    emissiveIntensity: 2,
  })
  const marquee = app.create('ui', {
    width: 440,
    height: 72,
    size: 0.0016,
    position: [0, 2.197, 0.041],
    backgroundColor: green,
    borderColor: brass,
    borderWidth: 2,
    padding: 9,
    justifyContent: 'center',
    pointerEvents: false,
    doubleside: false,
  })
  textLines(app, marquee, 1, { color: '#ffe2a2', fontSize: 40, textAlign: 'center', lineHeight: 1 })('DARTS')
  app.add(marquee)
  const lamp = app.create('light', {
    type: 'point',
    color: '#fff1d2',
    intensity: 1.4,
    distance: 2.5,
    decay: 2,
    castShadow: false,
    position: [0, 2.065, 0.18],
  })
  app.add(lamp)
  // A shallow ledge separates the playing compartment from the score console.
  prim('box', [0.87, 0.045, 0.17], [0, 1.338, 0.008], wood)
  prim('box', [0.84, 0.01, 0.018], [0, 1.32, 0.089], brass, brassMaterial)
  prim('box', [0.008, 0.004, 2.37], [-0.42, 0.004, 1.185], '#887457')
  prim('box', [0.008, 0.004, 2.37], [0.42, 0.004, 1.185], '#887457')
  prim('box', [0.85, 0.006, 0.025], [0, 0.004, 2.37], '#ddc384')
  for (const y of [0.6715, 1.2785]) {
    prim('box', [0.73, 0.042, 0.084], [0, y, -0.005], wood)
  }
  prim('box', [0.68, 0.56, 0.018], [0, 0.975, -0.038], '#101a16')
  const panel = app.create('ui', {
    width: 420,
    height: 340,
    size: 0.0015,
    position: [0, 0.975, -0.025],
    backgroundColor: '#101a16',
    borderColor: brass,
    borderWidth: 4,
    padding: 18,
    gap: 4,
    pointerEvents: false,
    doubleside: false,
  })
  const score = textLines(app, panel, 11, { color: '#f4e9d2', fontSize: 20, textAlign: 'left', lineHeight: 1.1 })
  score('DARTS\nPress E to join')
  app.add(panel)
  const label = app.create('ui', {
    width: 380,
    height: 40,
    size: 0.0016,
    position: [0, 0.585, -0.025],
    backgroundColor: green,
    padding: 7,
    justifyContent: 'center',
    pointerEvents: false,
    doubleside: false,
  })
  textLines(app, label, 1, { color: '#dbc8a4', fontSize: 20, textAlign: 'center', lineHeight: 1 })(
    'E: play · 1–4 players'
  )
  app.add(label)
  // Service door, coin slot, lock and ventilation are fixed cabinet details.
  prim('box', [0.64, 0.4, 0.018], [0, 0.335, -0.036], '#141b17')
  prim('box', [0.59, 0.35, 0.012], [0, 0.335, -0.02], wood)
  prim('box', [0.085, 0.075, 0.015], [0.21, 0.455, -0.005], brass, brassMaterial)
  prim('box', [0.006, 0.045, 0.006], [0.21, 0.455, 0.005], '#101413')
  prim('cylinder', [0.012, 0.012, 0.008], [0.22, 0.235, -0.005], brass, {
    ...brassMaterial,
    rotation: [Math.PI / 2, 0, 0],
  })
  for (let i = 0; i < 5; i++) {
    prim('box', [0.27, 0.008, 0.008], [-0.12, 0.285 + i * 0.025, -0.009], '#101413')
  }
  const makeDart = color => {
    const group = app.create('group')
    app.add(group)
    // Tip at origin; the body runs backward along +Z.
    prim('cone', [0.0017, 0.026], [0, 0, 0.013], '#aab6b9', { rotation: [-Math.PI / 2, 0, 0], metalness: 0.8 }, group)
    prim(
      'cylinder',
      [0.0035, 0.0035, 0.048],
      [0, 0, 0.05],
      '#bcc4bd',
      { rotation: [Math.PI / 2, 0, 0], metalness: 0.8, roughness: 0.28 },
      group
    )
    prim('cylinder', [0.0017, 0.0017, 0.055], [0, 0, 0.1], '#262f32', { rotation: [Math.PI / 2, 0, 0] }, group)
    prim('box', [0.031, 0.0006, 0.036], [0, 0, 0.141], color, {}, group)
    prim('box', [0.0006, 0.031, 0.036], [0, 0, 0.141], color, {}, group)
    group.active = false
    return group
  }
  const darts = Array.from({ length: 3 }, () => COLOURS.map(makeDart))
  const held = makeDart('#c8483d')
  const reticle = app.create('group')
  app.add(reticle)
  prim('box', [0.013, 0.0012, 0.001], [0, 0, 0], '#ffc967', { emissive: '#ffc967', emissiveIntensity: 0.5 }, reticle)
  prim('box', [0.0012, 0.013, 0.001], [0, 0, 0], '#ffc967', { emissive: '#ffc967', emissiveIntensity: 0.5 }, reticle)
  reticle.active = false
  const direction = new Vector3()
  const forward = new Vector3(0, 0, -1)
  const positionDart = (node, pose) => {
    node.position.fromArray(pose.position)
    direction.fromArray(pose.direction).normalize()
    node.quaternion.setFromUnitVectors(forward, direction)
  }
  const show = (state, frames = []) => {
    const nextText = scoreboard(state)
    score(nextText)
    const visible = new Set()
    frames.forEach((pose, index) => {
      if (index >= darts.length) return
      const colour = Math.max(
        0,
        state.players.findIndex(p => p.id === pose.playerId)
      )
      const node = darts[index][colour]
      visible.add(node)
      positionDart(node, pose)
    })
    for (const row of darts)
      for (const node of row) {
        const active = visible.has(node)
        if (node.active !== active) node.active = active
      }
  }
  return { face, held, reticle, show, positionDart }
}
