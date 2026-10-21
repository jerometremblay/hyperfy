import { Vector3, Quaternion, Euler } from 'three'
import { BALL_RADIUS as R } from './simulation.js'

// All poses are table-local (+Y up, physics +Y maps to -Z).
export const AIM_ELEVATION = Math.atan2(0.14, 0.68)
export function avatarStance(position, angle, size, floorY) {
  const forward = new Vector3(Math.cos(angle), 0, -Math.sin(angle))
  const across = new Vector3(Math.sin(angle), 0, Math.cos(angle))
  const origin = new Vector3(position[0], floorY, -position[1]).addScaledVector(across, -0.32)
  const backward = forward.clone().negate()
  // Rail exterior is about 18 cm beyond the playing surface. Include the
  // native player's 30 cm capsule radius, then step beyond that rectangle.
  const halfX = size.length / 2 + 0.18 + 0.3
  const halfZ = size.width / 2 + 0.18 + 0.3
  const exitX = Math.abs(backward.x) < 1e-9 ? Infinity :
    (Math.sign(backward.x) * halfX - origin.x) / backward.x
  const exitZ = Math.abs(backward.z) < 1e-9 ? Infinity :
    (Math.sign(backward.z) * halfZ - origin.z) / backward.z
  const distance = Math.max(1.47 + R + 0.012 + 0.3, Math.min(exitX, exitZ) + 0.04)
  return {
    position: origin.addScaledVector(backward, distance),
    quaternion: new Quaternion().setFromEuler(new Euler(0, angle - Math.PI / 2, 0, 'YXZ')),
    distance,
  }
}

export function shotPose(position, angle, side = 0, top = 0, elevation = AIM_ELEVATION) {
  const ball = new Vector3(position[0], R + position[2], -position[1])
  const forward = new Vector3(Math.cos(angle), 0, -Math.sin(angle))
  const across = new Vector3(Math.sin(angle), 0, Math.cos(angle))
  const cameraPosition = ball.clone().addScaledVector(forward, -0.68)
  cameraPosition.y += Math.tan(elevation) * 0.68
  const look = ball.clone().sub(cameraPosition)
  const cameraQuaternion = new Quaternion().setFromEuler(new Euler(
    Math.atan2(look.y, Math.hypot(look.x, look.z)), Math.atan2(-look.x, -look.z), 0, 'YXZ'))
  const cueDirection = forward.clone()
  cueDirection.y = -0.045
  cueDirection.normalize()
  const contact = ball.clone().addScaledVector(across, side * R)
  contact.y += top * R
  // A 1.47 m cue, positive local Y toward the chalk tip. Its butt extends
  // backward along the chosen shot; keep the tip just behind the ball.
  const gap = R * Math.sqrt(Math.max(0, 1 - side * side - top * top)) + 0.012
  const cuePosition = contact.addScaledVector(cueDirection, -(0.735 + gap))
  const cueQuaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), cueDirection)
  return { cameraPosition, cameraQuaternion, cameraTarget: ball, cuePosition, cueQuaternion }
}
