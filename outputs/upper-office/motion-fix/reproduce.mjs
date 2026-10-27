import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { world, clean, flush, events, THREE, simpleCamLerp, destroyWorlds } from './runtime-harness.mjs'

const measurements = {}
try {
  const client = await world({ client: true })
  client.addPlayer('p1')
  const chair = client.addFurniture('chair')
  await flush(client)
  const action = chair.root.get('executive-seat-action')
  action.onTrigger()
  const request = events(client, 'seat-claim').at(-1).args[1][3].request
  chair.emit('seat-slot', { owner: 'p1', token: 'ride', pose: {
    position: chair.root.position.toArray(), quaternion: [0, 0, 0, 1],
  } })
  chair.emit('seat-reply', { request, accepted: true, owner: 'p1', token: 'ride' })
  await flush(client)
  const camera = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion(), zoom: 2 }
  const target = { position: new THREE.Vector3(.30, 1.28, -.025), quaternion: new THREE.Quaternion(), zoom: 2 }
  simpleCamLerp(client, camera, target, 1 / 60)
  measurements.camera = { desiredZoom: target.zoom, actualZoom: camera.zoom, chairBlocksCamera: camera.zoom < .2 }
  const control = client.controlsMade.at(-1)
  control.keyW.down = true
  control.keyW.onPress()
  await flush(client)
  const start = chair.root.position.clone()
  const shapes = [...chair.root.children, ...chair.root.get('chair-back').children].filter(n => n._physics)
  const expected = shapes.map(n => n.position.clone())
  let accumulator = 0
  let maxLocalDrift = 0
  let timeToMove = null
  let previousZ = chair.root.position.z
  let maxFrameStep = 0
  let sends = 0
  for (let frame = 1; frame <= 240; frame++) {
    const time = frame / 60
    client.time = time
    // Rider packets reach the server after 80ms; replies take another 80ms.
    // Jitter alternates snapshot intervals between 50 and 83ms.
    if (time >= .16 && (frame % 4 === 0 || frame % 13 === 0)) {
      const targetZ = -1.25 * Math.max(0, time - .16)
      chair.emit('chair-pose', { token: 'ride', position: [0, .002, targetZ],
        quaternion: [0, 0, 0, 1], casters: Array.from({ length: 5 }, () => [0, targetZ / .06, targetZ / .06]) })
      sends++
    }
    accumulator += 1 / 60
    client.physics.preFixedUpdate(accumulator >= .02)
    while (accumulator >= .02) {
      chair.fixedUpdate(.02)
      client.physics.postFixedUpdate(.02)
      accumulator -= .02
    }
    client.physics.preUpdate(accumulator / .02)
    chair.update(1 / 60)
    clean(client)
    chair.lateUpdate(1 / 60)
    clean(client)
    shapes.forEach((shape, i) => { maxLocalDrift = Math.max(maxLocalDrift, shape.position.distanceTo(expected[i])) })
    if (timeToMove === null && chair.root.position.distanceTo(start) > .005) timeToMove = time
    maxFrameStep = Math.max(maxFrameStep, Math.abs(chair.root.position.z - previousZ))
    previousZ = chair.root.position.z
    assert.equal(chair.scriptError, null)
  }
  measurements.networkedRide = { maxLocalDrift, timeToMove, maxFrameStep, sends,
    shapePositions: shapes.map(s => s.position.toArray()) }
  await fs.writeFile('outputs/upper-office/motion-fix/reproduction.json', JSON.stringify(measurements, null, 2))
  console.log(JSON.stringify(measurements, null, 2))
} finally {
  await destroyWorlds()
}
