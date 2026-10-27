/*
 * Adapted from Lightstreamer BananaDarts Dart.js, Apache-2.0.
 * Copyright (c) Lightstreamer Srl. See LICENSE and ../../THIRD_PARTY.md.
 * Retains calculateAxisPos/calculateYPosition and boundary-time calculations.
 * Renderer, wall clock and custom units removed; SI units and Earth gravity.
 */
export const GRAVITY = 9.81

export function positionAt(origin, velocity, time) {
  return [
    origin[0] + velocity[0] * time,
    origin[1] + velocity[1] * time - GRAVITY * time * time / 2,
    origin[2] + velocity[2] * time,
  ]
}

export function velocityAt(velocity, time) {
  return [velocity[0], velocity[1] - GRAVITY * time, velocity[2]]
}

export function boundaryTime(origin, velocity, floorHeight = 0) {
  // Only a forward-time crossing of the front face can hit the board.
  const board = origin[2] > 0 && velocity[2] < -1e-9 ? -origin[2] / velocity[2] : Infinity
  const height = Math.max(0, origin[1] - floorHeight)
  const floor = (velocity[1] + Math.sqrt(velocity[1] ** 2 + 2 * GRAVITY * height)) / GRAVITY
  return { time: Math.min(board, floor), surface: board <= floor ? 'board' : 'floor' }
}
