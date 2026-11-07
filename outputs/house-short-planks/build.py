from pathlib import Path
p = Path(__file__).parent
s = (p / 'before.js').read_text()
helper = '''// Fixed seed keeps board cuts and tones identical on every client and reload.
let floorSeed = 74193
function floorRandom() {
  floorSeed = (Math.imul(floorSeed, 1664525) + 1013904223) >>> 0
  return floorSeed / 4294967296
}
function floorBoardRun(x, width, z0, z1, y, thickness, extra, name) {
  let start = z0
  let first = true
  while (start < z1 - 0.001) {
    // Short starter boards stagger the joints between neighbouring rows.
    let length = first ? 0.55 + floorRandom() * 1.45 : 1.2 + floorRandom() * 1.2
    length = Math.min(length, z1 - start)
    // Avoid a tiny offcut at the far wall by sharing it with the final board.
    const remaining = z1 - start - length
    if (remaining > 0 && remaining < 0.45) length = (z1 - start) / 2
    const color = C.floor[Math.floor(floorRandom() * C.floor.length)]
    const end = start + length
    const frontGap = start === z0 ? 0 : 0.002
    const backGap = end >= z1 - 0.001 ? 0 : 0.002
    box([width, thickness, length - frontGap - backGap],
      [x, y, (start + end + frontGap - backGap) / 2], color, [0, 0, 0], extra, name)
    start = end
    first = false
  }
}
'''
s = s.replace('function floorDeck(', helper + 'function floorDeck(', 1)
a = '''    box([width - 0.005, 0.05, back - z0],
      [x, y - 0.023, (z0 + back) / 2], C.floor[i % 4], [0, 0, 0], { castShadow: true }, prefix + '-board')'''
b = '''    floorBoardRun(x, width - 0.005, z0, back, y - 0.023, 0.05,
      { castShadow: true }, prefix + '-board')'''
assert s.count(a)==1
s=s.replace(a,b)
a='''  box([0.295, 0.04, back + D.halfDepth], [x, 0.10, (back - D.halfDepth) / 2],
    C.floor[i % 4], [0, 0, 0], {}, 'floorboard')'''
b="  floorBoardRun(x, 0.295, -D.halfDepth, back, 0.10, 0.04, {}, 'floorboard')"
assert s.count(a)==1
s=s.replace(a,b)
(p/'source.js').write_text(s)
