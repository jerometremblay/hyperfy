// Menu indices from the WebXR Input Profiles Registry. Older Touch profiles
// reserve the menu button; never guess an index for an unknown controller.
export function getXRMenuButton(source) {
  if (source.handedness !== 'left' || source.hand) return null
  const profiles = source.profiles || []
  if (profiles.includes('meta-quest-touch-plus') || profiles.includes('oculus-touch-v3')) {
    return source.gamepad?.buttons[7] || null
  }
  return null
}

export class XRPoke {
  constructor() {
    this.armed = false
    this.down = false
  }

  update(point, width, height) {
    const inside = point && Math.abs(point.x) <= width / 2 && Math.abs(point.y) <= height / 2
    const near = inside && point.z >= -0.06 && point.z <= 0.1
    const wasDown = this.down
    if (!near) {
      this.armed = false
      this.down = false
    } else if (point.z >= 0.025) {
      this.armed = true
      this.down = false
    } else if (this.armed && point.z <= 0.008) {
      this.down = true
      this.armed = false
    }
    return {
      uv: near ? { x: point.x / width + 0.5, y: 0.5 - point.y / height } : null,
      down: this.down,
      pressed: this.down && !wasDown,
      released: !this.down && wasDown,
    }
  }
}
