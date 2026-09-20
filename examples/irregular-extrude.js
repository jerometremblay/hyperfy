const shape = app.create('prim', {
  type: 'extrude',
  profile: [
    [-0.75, -0.5],
    [0.55, -0.5],
    [0.7, -0.18],
    [0.22, -0.05],
    [0.36, 0.62],
    [-0.15, 0.72],
    [-0.28, 0.16],
    [-0.72, 0.32],
  ],
  depth: 0.3,
  bevelEnabled: true,
  bevelThickness: 0.03,
  bevelSize: 0.04,
  bevelSegments: 2,
  curveSegments: 6,
  position: [0, 0.35, 0],
  color: '#d47a45',
  metalness: 0.15,
  roughness: 0.7,
})

app.add(shape)
