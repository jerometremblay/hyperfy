/* global app, world, Vector3, Euler */

const sky = app.create('sky', {
  bg: '__BACKGROUND__',
  sunDirection: new Vector3(8, -15, -7).normalize(),
  sunIntensity: 3,
  sunColor: '#fff1cf',
  fogNear: 200,
  fogFar: 300,
  fogColor: '#22372f',
})
app.add(sky)

// Primitive box collision also protects the river and the island's edge.
const ground = app.create('rigidbody', { type: 'static' })
ground.position.set(0, -0.3, 0)
ground.add(app.create('collider', { type: 'box', width: 18, height: 0.3, depth: 15 }))
app.add(ground)

// Catch falls beyond the island while the server sends the respawn.
const catchFloor = app.create('rigidbody', { type: 'static' })
catchFloor.position.set(0, -6, 0)
catchFloor.add(app.create('collider', { type: 'box', width: 128, height: 1, depth: 128 }))
app.add(catchFloor)

if (world.isServer) {
  const rotation = new Euler(0, 0, 0, 'YXZ')
  let elapsed = 0
  app.on('update', delta => {
    elapsed += delta
    if (elapsed < 0.25) return
    elapsed = 0
    for (const player of world.getPlayers()) {
      if (player.position.y >= -5) continue
      // Read it at recovery time, so /spawn set also changes the respawn point.
      const spawn = world.getSpawn()
      player.teleport(spawn.position, rotation.setFromQuaternion(spawn.quaternion, 'YXZ').y)
    }
  })
}
