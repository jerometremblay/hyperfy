from pathlib import Path


def patch(source):
    def replace(before, after):
        nonlocal source
        assert source.count(before) == 1, before
        source = source.replace(before, after)

    dimensions = """const E = { halfWidth: 3, front: 7.5, back: 12.35, eave: 6,
  ridge: 6 + 3 * (D.ridge - D.eave) / D.halfWidth }
"""
    replace(dimensions, "")
    replace(
        "const D = { halfWidth: 9, halfDepth: 7.5, floor: 0.12, upper: 3.3, eave: 6, ridge: 9.8 }\n",
        "const D = { halfWidth: 9, halfDepth: 7.5, floor: 0.12, upper: 3.3, eave: 6, ridge: 9.8 }\n"
        + dimensions,
    )
    replace(
        """  for (let i = 0; i < n; i++) box([width - 0.005, 0.05, z1 - z0],
    [x0 + (i + 0.5) * width, y - 0.023, (z0 + z1) / 2], C.floor[i % 4], [0, 0, 0], { castShadow: true }, prefix + '-board')""",
        """  for (let i = 0; i < n; i++) {
    const x = x0 + (i + 0.5) * width
    // Continue the original rear mezzanine boards through the enlarged bedroom.
    const back = prefix === 'rear' && Math.abs(x) + width / 2 <= E.halfWidth
      ? E.back - 0.16 : z1
    box([width - 0.005, 0.05, back - z0],
      [x, y - 0.023, (z0 + back) / 2], C.floor[i % 4], [0, 0, 0], { castShadow: true }, prefix + '-board')
  }""",
    )
    replace(
        "for (let i = 0; i < 60; i++) box([0.295, 0.04, 15], [-8.85 + i * 0.3, 0.10, 0], C.floor[i % 4], [0, 0, 0], {}, 'floorboard')",
        """for (let i = 0; i < 60; i++) {
  const x = -8.85 + i * 0.3
  const back = Math.abs(x) < E.halfWidth ? E.back : D.halfDepth
  box([0.295, 0.04, back + D.halfDepth], [x, 0.10, (back - D.halfDepth) / 2],
    C.floor[i % 4], [0, 0, 0], {}, 'floorboard')
}""",
    )
    replace(
        """for (let i = 0; i < 20; i++) {
  box([0.295, 0.04, E.back - 7.35], [-2.85 + i * 0.3, 0.10, (7.35 + E.back) / 2],
    C.floor[i % 4], [0, 0, 0], {}, 'floorboard')
}
floorDeck(-2.84, 2.84, 7.35, E.back - 0.16, D.upper, 'extension-upper')""",
        """// Only the supporting slab and deck are added here. The original boards
// above already continue through both rooms, preserving their spacing and tones.
box([5.68, 0.21, E.back - 0.16 - 7.35],
  [0, D.upper - 0.155, (7.35 + E.back - 0.16) / 2],
  C.trim, [0, 0, 0], { castShadow: true }, 'extension-upper-deck')""",
    )
    return source


if __name__ == "__main__":
    directory = Path(__file__).parent
    source = patch((directory / "before.js").read_text())
    (directory.parent / "source.js").write_text(source)
    print(directory.parent / "source.js")
