from pathlib import Path

directory = Path(__file__).parent
source = (directory / 'original.js').read_text()


def replace(before, after):
    global source
    assert source.count(before) == 1, before
    source = source.replace(before, after)


replace(
    "box([17.70, 0.27, 0.30], [0, 0.255, 7.5], C.trim)",
    """// The central rear sill is removed along with the wall, at both floors.
for (const x of [-6, 6]) box([5.70, 0.27, 0.30], [x, 0.255, 7.5], C.trim)""",
)
replace(
    """  { u: 0, width: 2.5, bottom: 0.94, top: 2.65 },
  { u: 5.85, width: 2.8, bottom: 0.94, top: 2.65 },
  ...[-5.95, 0, 5.95].map(u => ({ u, width: 2.25, bottom: 4.23, top: 5.66 })),""",
    """  { u: 5.85, width: 2.8, bottom: 0.94, top: 2.65 },
  ...[-5.95, 5.95].map(u => ({ u, width: 2.25, bottom: 4.23, top: 5.66 })),
  // A real full-height opening joins the ground floor and center bedroom
  // to the extension. Do not glaze this former exterior wall.
  { u: 0, width: 6, bottom: 0.12, top: 6.15, passage: true },""",
)
replace(
    """  } else {
    // A flat closed panel, visibly inset from the wall logs and jambs.""",
    """  } else if (face === 'patio') {
    // Glazed patio leaves use the existing authoritative hinge/door lifecycle.
    for (const x of [0.045, width - 0.045]) {
      doorPrim(group, [0.09, height, 0.11],
        [direction * x, height / 2, 0], C.trim, id + '-stile')
    }
    for (const y of [0.055, height - 0.055]) {
      doorPrim(group, [width, 0.11, 0.11],
        [direction * width / 2, y, 0], C.trim, id + '-rail')
    }
    doorPrim(group, [width - 0.18, height - 0.22, 0.035],
      [direction * width / 2, height / 2, 0], C.glass, id + '-glass',
      { opacity: 0.18, roughness: 0.12, castShadow: false })
    for (const side of [-1, 1]) {
      doorPrim(group, [0.04, 0.24, 0.045],
        [direction * (width - 0.12), 1.12, side * 0.085], C.iron, id + '-handle',
        { metalness: 0.55 })
    }
  } else {
    // A flat closed panel, visibly inset from the wall logs and jambs.""",
)
replace(
    """]) for (const o of openings) windowFrame(axis, fixed, o, options)""",
    """]) for (const o of openings) if (!o.passage) windowFrame(axis, fixed, o, options)""",
)
replace(
    "collisionBox([18, 5.88, 0.34], [0, 3.06, 7.5], [0, 0, 0], 'rear-wall')",
    """wallCollisionWithOpenings('x', 7.5, -9, 9, 0.12, 6,
  [{ u: 0, width: 6, bottom: 0.12, top: 6.15 }], 0.34, 'rear-wall')""",
)

extension = """
// Rear extension, aligned to the existing center-bedroom partitions rather
// than the approximate prompt-box edges. +Y up, +X right, -Z forward.
// Two connected floors; the original house root, stairs, portals and roof stay.
const E = { halfWidth: 3, front: 7.5, back: 12.35, eave: 6,
  ridge: 6 + 3 * (D.ridge - D.eave) / D.halfWidth }
const extensionRoofY = x => E.ridge - Math.abs(x) * (D.ridge - D.eave) / D.halfWidth
const extensionSideWindows = [
  { u: 9.92, width: 3.15, bottom: 0.88, top: 2.72 },
  { u: 9.92, width: 3.15, bottom: 3.89, top: 5.67 },
]
const extensionRearOpenings = [
  { u: 0, width: 3, bottom: D.floor, top: 2.80, patio: true },
  { u: 0, width: 4.60, bottom: 3.89, top: 5.67 },
]

section = 'extension-floor'
box([6, 0.077, E.back - 7.35], [0, 0.0385, (7.35 + E.back) / 2],
  C.trim, [0, 0, 0], {}, 'contact-slab')
for (let i = 0; i < 20; i++) {
  box([0.295, 0.04, E.back - 7.35], [-2.85 + i * 0.3, 0.10, (7.35 + E.back) / 2],
    C.floor[i % 4], [0, 0, 0], {}, 'floorboard')
}
floorDeck(-2.84, 2.84, 7.35, E.back - 0.16, D.upper, 'extension-upper')
for (let x = -2.65; x <= 2.7; x += 0.88) {
  box([0.15, 0.24, E.back - 7.35], [x, 2.947, (7.35 + E.back) / 2],
    C.trim, [0, 0, 0], {}, 'joist')
}
box([5.70, 0.14, E.back - 7.35], [0, 5.98, (7.35 + E.back) / 2],
  C.soffit, [0, 0, 0], {}, 'bedroom-ceiling')

section = 'extension-logs'
for (const x of [-E.halfWidth, E.halfWidth]) {
  wallLogsWithOpening('z', x, E.front, E.back, D.floor, E.eave,
    extensionSideWindows, { phase: 0.145, tone: x < 0 ? 2 : 3 })
  box([0.30, 0.27, E.back - E.front], [x, 0.255, (E.front + E.back) / 2], C.trim)
}
wallLogsWithOpening('x', E.back, -3, 3, D.floor, E.eave,
  extensionRearOpenings, { tone: 1 })
for (const x of [-2.25, 2.25]) box([1.5, 0.27, 0.30], [x, 0.255, E.back], C.trim)

section = 'extension-frame'
for (const x of [-2.84, 2.84]) {
  for (const z of [7.68, E.back - 0.17]) {
    box([0.25, 5.78, 0.25], [x, 3.01, z], C.timber, [0, 0, 0], {}, 'corner-post')
  }
  beamBetween([x, 5.86, E.front], [x, 5.86, E.back], 0.28, C.timber, 'wall-plate')
}
beamBetween([-2.84, 3.01, E.back - 0.17], [2.84, 3.01, E.back - 0.17],
  0.30, C.timber, 'floor-bearing-beam')
// The existing center bedroom's side partitions continue into these side walls.
// Their rear corner posts sit outside the new circulation passage.

section = 'extension-windows'
for (const x of [-3, 3]) for (const opening of extensionSideWindows) {
  windowFrame('z', x, opening, { phase: 0.145 })
}
windowFrame('x', E.back, extensionRearOpenings[1])
doorFrame('x', E.back, 0, D.floor, 3, 2.62)
registerDoor('patio-left', -1.40, 0.18, E.back, 1, 1.385, 2.42, -1.55, 'patio')
registerDoor('patio-right', 1.40, 0.18, E.back, -1, 1.385, 2.42, 1.55, 'patio')

section = 'extension-roof'
// A lower gable uses the main roof's pitch and materials, joining the original
// rear wall below its gable. The original 9.8 m ridge and observation deck remain.
for (const [x0, x1] of [[-3.50, 0], [0, 3.50]]) {
  const profile = lower => [
    [x0, extensionRoofY(x0) + lower], [x1, extensionRoofY(x1) + lower],
    [x1, extensionRoofY(x1) + lower + 0.14], [x0, extensionRoofY(x0) + lower + 0.14],
  ]
  extrude(profile(-0.14), 5.50, 10.15, C.soffit, 0, 'roof-deck')
  extrude(profile(0.015), 5.50, 10.15, C.roof, 0, 'roof-cover')
}
for (const z of [8.15, 10.2, 12.55]) for (const side of [-1, 1]) {
  beamBetween([side * 3.42, extensionRoofY(3.42) - 0.22, z],
    [0, E.ridge - 0.22, z], 0.20, C.timber, 'rafter')
}
for (const side of [-1, 1]) {
  beamBetween([side * 3.52, extensionRoofY(3.52) + 0.005, 12.92],
    [0, E.ridge + 0.005, 12.92], 0.22, C.timber, 'rake-fascia')
  box([0.18, 0.25, 5.62], [side * 3.51, extensionRoofY(3.51) - 0.015, 10.15],
    C.timber, [0, 0, 0], {}, 'eave-fascia')
}
box([0.20, 0.12, 5.54], [0, E.ridge + 0.18, 10.15],
  C.roof, [0, 0, 0], {}, 'ridge-cap')
for (let z = 8.15; z <= 12.6; z += 1.28) for (const side of [-1, 1]) {
  beamBetween([side * 3.45, extensionRoofY(3.45) + 0.17, z],
    [side * 0.08, extensionRoofY(0.08) + 0.17, z], 0.035, '#444b48', 'roof-seam')
}
// A real glazed gable; its triangle is not hidden behind a solid wall core.
extrude([[-2.86, 6.08], [2.86, 6.08], [0, E.ridge - 0.10]],
  0.035, E.back, C.glass, 0, 'gable-glass',
  { opacity: 0.18, roughness: 0.12, castShadow: false })
beamBetween([-3, 6.0, E.back], [3, 6.0, E.back], 0.23, C.timber, 'gable-bottom')
for (const side of [-1, 1]) {
  beamBetween([side * 3, 6.0, E.back], [0, E.ridge, E.back], 0.20, C.timber, 'gable-frame')
}
beamBetween([0, 6.08, E.back], [0, E.ridge - 0.10, E.back], 0.09, C.trim, 'gable-mullion')

section = 'extension-physics'
collisionBox([6, 0.12, E.back - 7.35], [0, 0.06, (7.35 + E.back) / 2],
  [0, 0, 0], 'extension-ground-floor')
collisionBox([5.68, 0.20, E.back - 0.16 - 7.35],
  [0, 3.20, (7.35 + E.back - 0.16) / 2], [0, 0, 0], 'extension-upper-floor')
for (const x of [-3, 3]) {
  collisionBox([0.34, 5.88, E.back - E.front], [x, 3.06, (E.front + E.back) / 2],
    [0, 0, 0], 'extension-side-wall')
}
wallCollisionWithOpenings('x', E.back, -3, 3, D.floor, E.eave,
  [{ u: 0, width: 2.81, bottom: D.floor, top: 2.615 }], 0.34, 'extension-rear-wall')
const extensionPitch = Math.atan2(D.ridge - D.eave, D.halfWidth)
for (const side of [-1, 1]) {
  collisionBox([3.50 / Math.cos(extensionPitch), 0.22, 5.50],
    [side * 1.75, extensionRoofY(1.75), 10.15],
    [0, 0, -side * extensionPitch], 'extension-roof')
}
// One level threshold outside the patio; no per-detail collision.
section = 'extension-patio'
box([3.35, 0.12, 0.88], [0, 0.06, E.back + 0.50], C.hearth, [0, 0, 0], {}, 'patio-step')
collisionBox([3.35, 0.12, 0.88], [0, 0.06, E.back + 0.50], [0, 0, 0], 'patio-step')
"""
replace(
    "// 16. Compact structural collision shell.",
    extension + "\n// 16. Compact structural collision shell.",
)

lighting = """
// Three static fixtures extend the existing switch circuits, without new
// frame callbacks or shadow maps.
section = 'extension-lighting'
for (const [y, circuit] of [
  [3.00, 'house-interior-lower'], [5.82, 'house-interior-upper'],
  [5.72, 'house-exterior'],
]) {
  const z = circuit === 'house-exterior' ? E.back + 0.38 : 10.0
  prim('cylinder', { size: [0.16, 0.16, 0.045], position: [0, y, z],
    color: C.iron, metalness: 0.55 }, 'ceiling-trim')
  const lens = prim('cylinder', { size: [0.115, 0.115, 0.012],
    position: [0, y - 0.03, z], color: '#ffe0af', emissive: '#ffd29a',
    emissiveIntensity: 0.5, castShadow: false }, 'ceiling-lens')
  addCircuitLens(circuit, lens, 0.5)
  spot([0, y - 0.045, z], false, 10, 10, 'extension-downlight', null, circuit)
}
"""
replace(
    "// Three independent, persistent circuits for the new wall controls.",
    lighting + "\n// Three independent, persistent circuits for the new wall controls.",
)
replace(
    "app.state = { ...(app.state || {}), doors: {} }",
    "app.state = { ...(app.state || {}), doors: { ...(props.initialDoors || {}) } }",
)
replace(
    "const isOpen = app.state?.doors?.[door.id] === true",
    "const isOpen = (app.state?.doors?.[door.id] ?? props.initialDoors?.[door.id]) === true",
)
replace(
    "app.state = { ...(app.state || {}), lighting: defaultLighting }",
    "app.state = { ...(app.state || {}), lighting: { ...defaultLighting, ...(props.initialLighting || {}) } }",
)
replace(
    "applyHouseLighting({ ...defaultLighting, ...(app.state?.lighting || {}) })",
    "applyHouseLighting({ ...defaultLighting, ...(props.initialLighting || {}), ...(app.state?.lighting || {}) })",
)
import runpy
source = runpy.run_path(str(directory / 'sliding/build-source.py'))['patch'](source)
source = runpy.run_path(str(directory / 'floorboards/build-source.py'))['patch'](source)
source = runpy.run_path(str(directory / 'handles/build-source.py'))['patch'](source)
(directory / 'source.js').write_text(source)
print(directory / 'source.js')
