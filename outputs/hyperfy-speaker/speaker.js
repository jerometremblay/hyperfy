// Audio is anchored to this app by Hyperfy's native LiveKit speaker integration.
app.configure([
  { key: 'volume', type: 'range', label: 'Volume',
    min: 0, max: 1, step: 0.05, initial: 1 },
  { key: 'spatial', type: 'toggle', label: 'Localized sound',
    trueLabel: 'Yes', falseLabel: 'No (stereo everywhere)', initial: true },
  { key: 'refDistance', type: 'range', label: 'Near — full volume & stereo (m)',
    min: 1, max: 20, step: 1, initial: 2 },
  { key: 'maxDistance', type: 'range', label: 'Far — maximum range (m)',
    min: 5, max: 100, step: 5, initial: 30 },
])
if (world.isClient) {
  const box = app.create('prim', {
    type: 'box', size: [0.45, 0.7, 0.3],
    color: '#202329', roughness: 0.85, position: [0, 0.35, 0],
  })
  app.add(box)
  for (const [height, radius] of [[0.24, 0.13], [0.52, 0.07]]) {
    const cone = app.create('prim', {
      type: 'sphere', size: [radius], color: '#07090c', roughness: 0.7,
      position: [0, height, 0.151], scale: [1, 1, 0.15],
    })
    app.add(cone)
  }
}