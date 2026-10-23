// Portable script source for the bundled Performance Switch.hyp.
// Profiling state belongs to this browser; nothing is broadcast or persisted.
if (world.isClient) {
  const base = app.create('prim', {
    type: 'box',
    size: [0.35, 0.08, 0.25],
    color: '#222936',
    position: [0, 1, 0],
    physics: 'static',
  })
  const lamp = app.create('prim', { type: 'sphere', size: [0.075], color: '#687080', position: [0, 1.1, 0] })
  base.onPointerDown = () => {
    world.toggleProfiler()
  }
  app.add(base)
  app.add(lamp)
  const action = app.create('action', {
    label: 'Toggle object profiler (admin)',
    position: [0, 1.1, 0],
    distance: 4,
    duration: 0,
  })
  action.onTrigger = () => {
    world.toggleProfiler()
  }
  app.add(action)
  let elapsed = 0
  app.on('update', delta => {
    elapsed += delta
    if (elapsed < 0.5) return
    elapsed = 0
    lamp.color = world.isProfiling ? '#44ee88' : '#687080'
    action.label = world.isProfiling ? 'Turn object profiler off' : 'Turn object profiler on (admin)'
  })
}
