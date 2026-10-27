from pathlib import Path


def patch(source):
    before = """  if (movable) for (const side of [-1, 1]) {
    doorPrim(group, [0.04, 0.24, 0.045],
      [direction * (width - 0.12), 1.12, side * 0.085], C.iron, id + '-handle',"""
    after = """  // Grips sit on the outer latch stile beside the jamb.
  if (movable) for (const side of [-1, 1]) {
    doorPrim(group, [0.04, 0.24, 0.045],
      [direction * 0.045, 1.12, side * 0.085], C.iron, id + '-handle',"""
    assert source.count(before) == 1, "Expected exactly one patio handle definition"
    return source.replace(before, after)


if __name__ == "__main__":
    directory = Path(__file__).parent
    source = patch((directory / "before.js").read_text())
    (directory.parent / "source.js").write_text(source)
    print(directory.parent / "source.js")
