// Planar rolling kinematics. Swivel Y; both wheel axles X; forward is -Z.
// The axle trails the swivel by casterTrail. No lateral slip at its midpoint
// gives d(yaw)/ds = -sin(yaw - travelHeading)/casterTrail.
function wrapCasterAngle(angle) {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}
function getCasterState() {
  return casters.map(caster => [caster.yaw, caster.spin[0], caster.spin[1]])
}
function setCasterState(state) {
  if (!Array.isArray(state) || state.length !== casters.length ||
      state.some(value => !Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite))) return
  state.forEach((value, i) => {
    casters[i].yaw = value[0]
    casters[i].spin[0] = value[1]
    casters[i].spin[1] = value[2]
  })
}
function drawCasters() {
  if (!world.isClient) return
  for (const caster of casters) {
    if (caster.swivel.rotation.y !== caster.yaw) caster.swivel.rotation.y = caster.yaw
    caster.wheels.forEach((wheel, i) => {
      if (wheel.rotation.x !== caster.spin[i]) wheel.rotation.x = caster.spin[i]
    })
  }
}
function advanceCasters(dx, dz, chairTurn = 0) {
  if (Math.hypot(dx, dz) < 0.000001 && Math.abs(chairTurn) < 0.000001) return
  const sine = Math.sin(chairTurn), cosine = Math.cos(chairTurn)
  for (const caster of casters) {
    // Each swivel traces its own arc when the base turns. Express its travel
    // in the new chair frame; the tire's world heading initially stays fixed.
    const pivot = caster.swivel.position
    const x = dx + (1 - cosine) * pivot.x + sine * pivot.z
    const z = dz - sine * pivot.x + (1 - cosine) * pivot.z
    const distance = Math.hypot(x, z)
    const previousYaw = caster.yaw - chairTurn
    if (distance < 0.000001) { caster.yaw = previousYaw; continue }
    const heading = Math.atan2(-x, -z)
    let error = wrapCasterAngle(previousYaw - heading)
    // Perfectly reversed casters are an unstable equilibrium. A small,
    // deterministic perturbation lets them swing either way rather than stick.
    if (Math.PI - Math.abs(error) < .002) error = caster.turnSign * (Math.PI - .035)
    const before = Math.tan(error / 2)
    const after = before * Math.exp(-distance / casterTrail)
    const nextYaw = heading + 2 * Math.atan(after)
    const turn = wrapCasterAngle(nextYaw - previousYaw)
    caster.yaw = previousYaw + turn
    if (Math.abs(turn) > .00001) caster.turnSign = Math.sign(turn)
    // Exact travel of the axle midpoint for this constant-direction segment.
    const travel = distance + casterTrail * Math.log((1 + after * after) / (1 + before * before))
    // Differential wheel travel during swivel: inner and outer tire differ.
    caster.spin[0] -= (travel - casterHalfSpacing * turn) / casterRadius
    caster.spin[1] -= (travel + casterHalfSpacing * turn) / casterRadius
  }
}
if (app.state.casters) setCasterState(app.state.casters)
drawCasters()
