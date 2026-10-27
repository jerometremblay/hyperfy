// Executive work chair. Front faces local -Z; five twin-wheel casters touch Y=0.
const wheelAnchors = []
const casterRadius = 0.060
const casterTrail = 0.025
const casterHalfSpacing = 0.035
const casters = []
for (let i = 0; i < 5; i++) {
  const angle = i * Math.PI * 2 / 5 + Math.PI
  const x = Math.sin(angle) * 0.375, z = Math.cos(angle) * 0.375
  wheelAnchors.push([x, 0.060, z])
  cylinderBetween([0, 0.215, 0], [x, 0.145, z], 0.028,
    C.brass, 'five-spoke-base', { metalness: 0.82, roughness: 0.22 })
  cylinderBetween([x, 0.099, z], [x, 0.156, z], 0.014,
    C.brass, 'caster-stem', { metalness: 0.78 })
  // The vertical swivel is between the tires in X, ahead of their axle in Z.
  const swivel = app.create('group', {
    id: `caster-${i}-swivel`, position: [x, casterRadius, z], rotation: [0, angle, 0],
  })
  app.add(swivel)
  cylinderBetween([0, .044, 0], [0, .060, 0], .019,
    C.brass, 'caster-swivel-bearing', { metalness: .78 }, swivel)
  for (const side of [-1, 1]) {
    cylinderBetween([side * .018, .048, 0], [side * .018, .003, casterTrail], .006,
      C.brass, 'caster-fork', { metalness: .78 }, swivel)
  }
  cylinderBetween([-.049, 0, casterTrail], [.049, 0, casterTrail], .009,
    C.brass, 'caster-horizontal-axle', { metalness: .80 }, swivel)
  const caster = { swivel, wheels: [], yaw: angle, spin: [0, 0], turnSign: i % 2 ? -1 : 1 }
  casters.push(caster)
  for (const side of [-1, 1]) {
    const wheel = app.create('group', {
      id: `caster-${i}-wheel-${side}`, position: [side * casterHalfSpacing, 0, casterTrail],
    })
    swivel.add(wheel)
    caster.wheels.push(wheel)
    cylinderBetween([-.012, 0, 0], [.012, 0, 0], casterRadius,
      C.rubber, 'caster-wheel', { roughness: .83 }, wheel)
    const face = side * .0127
    cylinderBetween([face - .0008, 0, 0], [face + .0008, 0, 0], .025,
      C.brass, 'caster-hub', { metalness: .80, roughness: .23 }, wheel)
    // Asymmetric face details make rotation around the axle visible.
    cylinderBetween([face + side * .001, .006, 0], [face + side * .001, .022, 0], .0015,
      C.black, 'caster-hub-index', {}, wheel)
    prim('sphere', { size: [.003], position: [face, .043, 0], color: C.brass,
      metalness: .78, roughness: .28 }, 'caster-wheel-valve', wheel)
  }
}
cylinderBetween([0, 0.14, 0], [0, 0.26, 0], 0.063, C.black, 'lift-housing')
cylinderBetween([0, 0.22, 0], [0, 0.435, 0], 0.022, C.brass, 'gas-lift',
  { metalness: 0.88, roughness: 0.18 })
box([0.43, 0.055, 0.36], [0, 0.443, 0], C.black, 'tilt-mechanism')
cylinderBetween([0.10, 0.44, 0.015], [0.34, 0.425, 0.015],
  0.010, C.brass, 'adjustment-lever', { metalness: 0.75 })
box([0.075, 0.025, 0.045], [0.34, 0.425, 0.015], C.black, 'lever-grip')

// Beveled upholstery and a dark walnut seat shell.
horizontalPanel(roundedRect(0.585, 0.54, 0.065), 0.472, 0.028,
  C.walnutDark, 'seat-shell', { bevelSize: 0.013, bevelThickness: 0.005 })
horizontalPanel(roundedRect(0.60, 0.57, 0.075), 0.508, 0.067,
  C.leather, 'padded-seat', { bevelSize: 0.025, bevelThickness: 0.013, roughness: 0.53 })
for (const z of [-0.218, 0.218]) {
  cylinderBetween([-0.215, 0.555, z], [0.215, 0.555, z],
    0.0011, C.stitch, 'seat-stitching')
}

const backGroup = app.create('group', { id: 'chair-back', position: [0, 0.53, 0.205], rotation: [0.10, 0, 0] })
app.add(backGroup)
const backProfile = [
  [-0.25, 0], [-0.31, 0.15], [-0.30, 0.57], [-0.25, 0.74], [-0.18, 0.80],
  [0.18, 0.80], [0.25, 0.74], [0.30, 0.57], [0.31, 0.15], [0.25, 0],
]
extrude(backProfile, 0.038, [0, 0.40, 0.064], C.walnutDark, 'walnut-back-shell',
  { bevelSize: 0.024, bevelThickness: 0.008, roughness: 0.33 }, backGroup)
extrude(backProfile, 0.105, [0, 0.40, 0], C.leather, 'high-padded-back',
  { bevelSize: 0.018, bevelThickness: 0.015, roughness: 0.55 }, backGroup)
extrude(roundedRect(0.43, 0.145, 0.035), 0.040, [0, 0.18, -0.077],
  C.leatherDark, 'lumbar-cushion',
  { bevelSize: 0.017, bevelThickness: 0.012, roughness: 0.57 }, backGroup)
extrude(roundedRect(0.405, 0.16, 0.035), 0.035, [0, 0.695, -0.086],
  C.leatherDark, 'headrest',
  { bevelSize: 0.018, bevelThickness: 0.011, roughness: 0.55 }, backGroup)

// Diamond quilting on the front face, following the backrest's shared frame.
for (const y of [0.325, 0.485]) for (const x of [-0.15, 0, 0.15]) {
  const points = [[x, y - 0.072, -0.070], [x + 0.072, y, -0.070],
    [x, y + 0.072, -0.070], [x - 0.072, y, -0.070]]
  for (let j = 0; j < 4; j++) {
    cylinderBetween(points[j], points[(j + 1) % 4], 0.0009,
      C.stitch, 'diamond-stitching', { castShadow: false }, backGroup)
  }
  prim('sphere', { size: [0.006], position: [x, y, -0.074],
    scale: [1, 1, 0.4], color: C.leatherDark }, 'tuft-button', backGroup)
}
box([0.11, 0.027, 0.004], [0, 0.62, 0.094], C.brass, 'back-emblem',
  { metalness: 0.78, roughness: 0.24 }, backGroup)

for (const side of [-1, 1]) {
  const x = side * 0.323
  cylinderBetween([side * 0.21, 0.473, 0.11], [x, 0.715, 0.10],
    0.021, C.brass, 'arm-support', { metalness: 0.78, roughness: 0.23 })
  cylinderBetween([x, 0.715, 0.10], [x, 0.715, -0.18],
    0.018, C.brass, 'arm-rail', { metalness: 0.78, roughness: 0.23 })
  const pad = roundedRect(0.092, 0.40, 0.032).map(([px, pz]) => [px + x, pz - 0.04])
  horizontalPanel(pad, 0.743, 0.042, C.leatherDark, 'padded-armrest',
    { bevelSize: 0.009, bevelThickness: 0.008, roughness: 0.55 })
}
