// Three slabs preserve the concave U. A convex extrusion would close the bay.
collisionBox([4.20, 0.074, 0.75], [0, 0.742, 0.825], 'rear-desktop')
for (const side of [-1, 1]) {
  collisionBox([0.75, 0.074, 1.60], [side * 1.725, 0.742, -0.35], `return-${side}`)
  collisionBox([0.64, 0.69, 0.90], [side * 1.735, 0.345, -0.55], `pedestal-${side}`)
  collisionBox([0.085, 0.70, 0.085], [side * 1.56, 0.35, 1.01], `rear-leg-${side}`)
}
collisionBox([3.38, 0.32, 0.038], [0, 0.43, 1.055], 'modesty-panel')
