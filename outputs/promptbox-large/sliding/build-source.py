from pathlib import Path


def patch(source):
    def replace(before, after):
        nonlocal source
        assert source.count(before) == 1, before
        source = source.replace(before, after)

    helper = """function patioPanel(group, id, direction, width, height, movable = true) {
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
  if (movable) for (const side of [-1, 1]) {
    doorPrim(group, [0.04, 0.24, 0.045],
      [direction * (width - 0.12), 1.12, side * 0.085], C.iron, id + '-handle',
      { metalness: 0.55 })
  }
}
"""
    signature = "function registerDoor(id, hingeX, hingeY, hingeZ, direction, width, height, openAngle, face = 'room') {"
    replace(signature, helper + signature.replace("face = 'room'", "face = 'room', slideDistance = 0"))
    replace("    face, angle: 0, target: 0, collider: null }",
            "    face, slideDistance, slide: 0, angle: 0, target: 0, collider: null }")
    start = source.index("  } else if (face === 'patio') {")
    end = source.index("  } else {\n    // A flat closed panel", start)
    source = source[:start] + """  } else if (face === 'patio') {
    patioPanel(group, id, direction, width, height)
""" + source[end:]
    replace(
        """registerDoor('patio-left', -1.40, 0.18, E.back, 1, 1.385, 2.42, -1.55, 'patio')
registerDoor('patio-right', 1.40, 0.18, E.back, -1, 1.385, 2.42, 1.55, 'patio')""",
        """// Standard two-track patio door: the left panel slides behind the fixed right
// panel. Travel ends within the existing jambs; no leaf swings into the room.
registerDoor('patio-left', -1.395, 0.18, E.back - 0.10,
  1, 1.425, 2.42, 0, 'patio', 1.365)
const fixedPatioPanel = app.create('group', { position: [-0.03, 0.18, E.back + 0.10] })
app.add(fixedPatioPanel)
patioPanel(fixedPatioPanel, 'patio-fixed', 1, 1.425, 2.42, false)
collisionBox([1.417, 2.405, 0.105], [0.6825, 1.39, E.back + 0.10],
  [0, 0, 0], 'patio-fixed')
for (const z of [-0.10, 0.10]) {
  box([2.90, 0.014, 0.026], [0, 0.137, E.back + z], C.iron,
    [0, 0, 0], { metalness: 0.55 }, 'patio-bottom-track')
}
box([2.96, 0.055, 0.28], [0, 2.635, E.back], C.iron,
  [0, 0, 0], { metalness: 0.55 }, 'patio-top-track')""",
    )
    replace("// 17. Animated, server-authoritative hinged doors.",
            "// 17. Server-authoritative hinged doors and the sliding patio panel.")
    replace(
        """function setDoorGeometry(door, angle) {
  door.angle = angle""",
        """function setDoorGeometry(door, angle) {
  if (door.slideDistance) {
    door.slide = angle
    if (world.isClient) door.group.position.x = door.hingeX + angle
    if (door.collider) {
      door.collider.position.set(door.hingeX + angle + door.direction * door.width / 2,
        door.hingeY + door.height / 2, door.hingeZ)
    }
    return
  }
  door.angle = angle""",
    )
    replace("door.target = isOpen ? door.openAngle : 0",
            "door.target = isOpen ? (door.slideDistance || door.openAngle) : 0")
    replace("if (door.action) door.action.label = isOpen ? 'Close door' : 'Open door'",
            "if (door.action) door.action.label = door.slideDistance ? (isOpen ? 'Slide closed' : 'Slide open') : (isOpen ? 'Close door' : 'Open door')")
    replace(
        """  const step = Math.min(Math.max(delta || 0, 0), 0.08) * 3.2
  if (!step) return""",
        """  const dt = Math.min(Math.max(delta || 0, 0), 0.08)
  if (!dt) return""",
    )
    replace(
        """    const diff = door.target - door.angle
    if (Math.abs(diff) < 0.0001) continue
    const next = Math.abs(diff) <= step ? door.target : door.angle + Math.sign(diff) * step""",
        """    const current = door.slideDistance ? door.slide : door.angle
    const diff = door.target - current
    if (Math.abs(diff) < 0.0001) continue
    const step = dt * (door.slideDistance ? 1.2 : 3.2)
    const next = Math.abs(diff) <= step ? door.target : current + Math.sign(diff) * step""",
    )
    replace("Math.abs(door.target - door.angle) < 0.0001",
            "Math.abs(door.target - (door.slideDistance ? door.slide : door.angle)) < 0.0001")
    replace("door.target = data.open ? door.openAngle : 0",
            "door.target = data.open ? (door.slideDistance || door.openAngle) : 0")
    replace("if (door.action) door.action.label = data.open ? 'Close door' : 'Open door'",
            "if (door.action) door.action.label = door.slideDistance ? (data.open ? 'Slide closed' : 'Slide open') : (data.open ? 'Close door' : 'Open door')")
    replace("Math.abs(door.target - door.angle) >= 0.0001",
            "Math.abs(door.target - (door.slideDistance ? door.slide : door.angle)) >= 0.0001")
    return source


if __name__ == '__main__':
    directory = Path(__file__).parent
    source = patch((directory / 'before.js').read_text())
    (directory.parent / 'source.js').write_text(source)
    (directory / 'source.js').write_text(source)
