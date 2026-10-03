// Reusable orbit-viewer navigation snippet.
// WASD moves the orbit target horizontally; Space/Shift move vertically.
const keys = new Set()
addEventListener('keydown', event => {
  const key = event.key.toLowerCase()
  if (['w', 'a', 's', 'd', 'shift', ' '].includes(key)) {
    keys.add(key)
    event.preventDefault()
  }
})
addEventListener('keyup', event => keys.delete(event.key.toLowerCase()))
addEventListener('blur', () => keys.clear())
