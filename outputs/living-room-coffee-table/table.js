/* global app */
// Y up, +X right, -Z forward. The prompt-box frame is centered:
// local bounds [-0.5, 0.5] preserve its exact floor contact and placement.
function box(size, position, color, roughness = 0.62, metalness = 0) {
  const node = app.create('prim', {
    type: 'box', size, position, color, roughness, metalness,
    physics: null, castShadow: true, receiveShadow: true,
  })
  app.add(node)
  return node
}

// Seven solid walnut boards, with narrow recessed joints instead of overlaid grain.
const tones = ['#63402c', '#6b4630', '#704b34', '#68422d', '#755039', '#68442e', '#60402d']
const pitch = 1 / tones.length
for (let i = 0; i < tones.length; i++) {
  const width = pitch - (i === 0 || i === tones.length - 1 ? 0.00075 : 0.0015)
  const x = -0.5 + pitch * (i + 0.5) + (i === 0 ? -0.000375 : i === tones.length - 1 ? 0.000375 : 0)
  box([width, 0.12, 1], [x, 0.44, 0], tones[i], 0.48)
}
// Aprons sit directly beneath the top and join the four legs.
for (const z of [-0.4, 0.4]) box([0.8, 0.14, 0.06], [0, 0.31, z], '#4d3021')
for (const x of [-0.4, 0.4]) box([0.06, 0.14, 0.8], [x, 0.31, 0], '#4d3021')
for (const x of [-0.4, 0.4]) {
  for (const z of [-0.4, 0.4]) {
    box([0.08, 0.845, 0.08], [x, -0.0425, z], '#533523')
    box([0.08, 0.035, 0.08], [x, -0.4825, z], '#282522', 0.78)
  }
}
// A low shelf ties the legs together while leaving room underneath.
box([0.78, 0.05, 0.78], [0, -0.24, 0], '#61402c')
