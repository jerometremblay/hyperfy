// Hyperfy primitive-only app template.
// Coordinate system: +Y up, +X right, -Z forward.
// Native app ownership propagates transforms; static objects need no update loop.
// Collision is opt-in. See docs/physics.md for exceptional detached physics.

function prim(type, size, position, color, rotation = [0, 0, 0], extra = {}) {
  const node = app.create('prim', {
    type,
    size,
    position,
    rotation,
    color,
    castShadow: true,
    receiveShadow: true,
    roughness: 0.68,
    metalness: 0.08,
    physics: null,
    ...extra,
  })
  app.add(node)
  return node
}

const box = (size, pos, color, rot = [0, 0, 0], extra = {}) => prim('box', size, pos, color, rot, extra)
const sphere = (r, pos, color, extra = {}) => prim('sphere', [r], pos, color, [0, 0, 0], extra)
const cylinder = (rt, rb, h, pos, color, rot = [0, 0, 0], extra = {}) => prim('cylinder', [rt, rb, h], pos, color, rot, extra)
const cone = (r, h, pos, color, rot = [0, 0, 0], extra = {}) => prim('cone', [r, h], pos, color, rot, extra)
const torus = (r, tube, pos, color, rot = [0, 0, 0], extra = {}) => prim('torus', [r, tube], pos, color, rot, extra)

// Copy templates/orientation_helpers.js for diagonal members.
// Add { physics: 'static' } only when collision is required.
box([1, 1, 1], [0, 0.5, 0], '#7f8c8d')
