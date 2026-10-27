export const ISOMETRIC_PITCH = -Math.atan(1 / Math.sqrt(2))
export const ISOMETRIC_YAW = Math.PI / 4
export const RETRO_PITCH = -0.88
export const ISOMETRIC_DISTANCE = 32
export const ISOMETRIC_VIEW_HEIGHT = 18

// Use up to 1024×768 pixels without stretching the viewport's aspect ratio.
export function getPixelViewport(width, height) {
  const scale = Math.max(1, width / 1024, height / 768)
  return {
    width: Math.max(1, Math.round(width / scale)),
    height: Math.max(1, Math.round(height / scale)),
  }
}
