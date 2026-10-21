// Cabinet adapter for mumuy/pacman. Gameplay remains in the vendored implementation.
const canvas = document.getElementById('canvas')
const hint = document.getElementById('hint')
let ready = false
let suspended = null

function currentStage() {
  return window.arcadeGame.getStages().find(stage => stage.status !== 0)
}

function pause() {
  if (!ready) return
  const stage = currentStage()
  if (stage?.status === 1) {
    suspended = stage
    stage.status = 2
  }
  hint.textContent = 'CLICK SCREEN TO RESUME'
  hint.hidden = false
}

function play() {
  if (!ready) return
  const game = window.arcadeGame
  const stages = game.getStages()
  if (currentStage() === stages[stages.length - 1]) {
    // Reuse the game's own restart path, which resets both score and lives.
    window.dispatchEvent(new KeyboardEvent('keydown', { code: 'Enter', keyCode: 13 }))
    suspended = null
  }
  if (!currentStage()) game.setStage(1)
  if (suspended) {
    suspended.status = 1
    suspended = null
  }
  if (currentStage()?.status === 2) currentStage().status = 1
  // Let Enter/Space use the original restart behavior after Game Over.
  hint.hidden = true
  canvas.focus()
  window.parent.postMessage({ type: 'pacman-focus' }, window.location.origin)
}

window.addEventListener('pacman-ready', () => {
  ready = true
  hint.textContent = 'CLICK SCREEN TO PLAY'
})
canvas.addEventListener('click', event => {
  // The upstream canvas has a clickable credit; attribution lives in our footer.
  event.stopImmediatePropagation()
  play()
}, true)
window.addEventListener('keydown', event => {
  if (!ready) return
  if (event.code === 'Escape') {
    event.preventDefault()
    event.stopImmediatePropagation()
    pause()
    window.parent.postMessage({ type: 'pacman-exit' }, window.location.origin)
    canvas.blur()
  } else if (event.code === 'Enter' || event.code === 'Space') {
    hint.hidden = true
  }
}, true)
window.addEventListener('blur', pause)
