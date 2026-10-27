// Keep local and remote chat bubbles consistent when the view changes.
export function stylePlayerBubble(player) {
  const pixel = !!player.world.camera.isOrthographicCamera
  player.bubble.width = pixel ? 200 : 300
  player.bubble.height = pixel ? 256 : 512
  player.bubbleBox.padding = pixel ? 6 : 10
  player.bubbleBox.borderRadius = pixel ? 2 : 10
  player.bubbleText.fontSize = pixel ? 12 : 16
  player.bubbleText.fontFamily = pixel ? '"Press Start 2P", monospace' : 'Rubik'
  player.bubbleText.fontWeight = pixel ? 400 : 100
  player.bubbleText.lineHeight = pixel ? 1.2 : 1.4
  player.bubble.position.y = (player.avatar?.getHeadToHeight() || 0) + (pixel ? 0.08 : 0.2)
  if (pixel && typeof document !== 'undefined') {
    document.fonts
      ?.load('12px "Press Start 2P"')
      .then(() => {
        if (!player.destroyed) player.bubble.redraw()
      })
      .catch(() => {})
  }
}
