// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/test/lib/physxHeap.mjs
// Counts the live allocations in the PhysX wasm heap exactly, for leak tests. The binding exposes no mallinfo, so this
// walks Emscripten's 32-bit dlmalloc chunks (prev_foot u32, head u32 with bit0 PINUSE and bit1 CINUSE, then the
// payload). The heap start is found once by chaining chunk headers back from a marker allocation. Live chunk counts
// are exact integers; byte totals move with PhysX's own pools, so tests compare chunk counts over a warmed window.
export function physxHeap(PHYSX) {
  const view = () => new Uint32Array(PHYSX.wasmMemory.buffer)
  let start = 0
  {
    const marker = PHYSX._webidl_malloc(40)
    const target = marker - 8
    const u32 = view()
    let best = null
    for (let s = 8; s < target; s += 8) {
      let c = s
      let k = 0
      let ok = true
      let prevInUse = null
      while (c < target) {
        const head = u32[(c + 4) >> 2]
        const size = head & ~7
        if (size < 16 || c + size > target) {
          ok = false
          break
        }
        if (prevInUse !== null && (head & 1) !== prevInUse) {
          ok = false
          break
        }
        prevInUse = (head >> 1) & 1
        c += size
        k++
      }
      if (ok && c === target && (!best || k > best.k)) best = { s, k }
    }
    PHYSX._webidl_free(marker)
    if (!best) throw new Error('physxHeap: heap start not found')
    start = best.s
  }
  // live (in-use) chunks right now
  return function liveChunks() {
    const u32 = view()
    const limit = u32.length * 4
    let c = start
    let live = 0
    while (c + 8 <= limit) {
      const head = u32[(c + 4) >> 2]
      const size = head & ~7
      if (size < 16) break
      if (head & 2) live++
      c += size
    }
    return live
  }
}
