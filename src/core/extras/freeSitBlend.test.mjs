import assert from 'node:assert/strict'
import test from 'node:test'
import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import * as THREE from 'three'

const bundle = await build({
  entryPoints: [fileURLToPath(new URL('./freeSitBlend.js', import.meta.url))],
  bundle: true,
  platform: 'node',
  format: 'esm',
  write: false,
})
const { setFreeSitBlend, updateFreeSitBlend } = await import(
  `data:text/javascript;base64,${Buffer.from(bundle.outputFiles[0].contents).toString('base64')}`
)
const pose = (x, angle) => ({
  offset: [x, 0, 0],
  rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), angle).toArray(),
  pose: {
    hips: {
      position: [0, x, 0],
      rotation: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), angle).toArray(),
    },
  },
})
function fixture() {
  const avatar = {
    position: new THREE.Vector3(),
    quaternion: new THREE.Quaternion(),
    setPoseOverride(value) {
      this.pose = value
    },
  }
  return { avatar }
}

test('blends seat offset, orientation and bone pose together and reaches its destination', () => {
  const player = fixture(),
    avatar = player.avatar
  setFreeSitBlend(player, avatar, pose(0, 0), [2, 1, 0])
  setFreeSitBlend(player, avatar, pose(1, Math.PI / 2), [2, 1, 0])
  assert.equal(avatar.position.x, 0)
  updateFreeSitBlend(player, 0.09)
  assert.ok(Math.abs(avatar.position.x - 0.5) < 1e-6)
  assert.ok(Math.abs(avatar.pose.hips.position[1] - 0.5) < 1e-6)
  assert.ok(Math.abs(avatar.quaternion.angleTo(new THREE.Quaternion()) - Math.PI / 4) < 1e-6)
  assert.ok(
    Math.abs(new THREE.Quaternion(...avatar.pose.hips.rotation).angleTo(new THREE.Quaternion()) - Math.PI / 4) < 1e-6
  )
  updateFreeSitBlend(player, 0.09)
  assert.equal(avatar.position.x, 1)
})

test('retargets from the displayed pose without a snap and resets for another seat', () => {
  const player = fixture(),
    avatar = player.avatar
  setFreeSitBlend(player, avatar, pose(0, 0), [2, 1, 0])
  setFreeSitBlend(player, avatar, pose(1, 1), [2, 1, 0])
  updateFreeSitBlend(player, 0.09)
  setFreeSitBlend(player, avatar, pose(2, 2), [2, 1, 0])
  assert.equal(avatar.position.x, 0.5)
  updateFreeSitBlend(player, 0.09)
  assert.ok(Math.abs(avatar.position.x - 1.25) < 1e-6)
  setFreeSitBlend(player, avatar, pose(3, 0), [3, 1, 0])
  assert.equal(avatar.position.x, 3)
})

test('local and remote players blend updates and clear the pose on standing', async () => {
  const result = await build({
    stdin: {
      contents: `export { PlayerLocal } from './src/core/entities/PlayerLocal.js'; export { PlayerRemote } from './src/core/entities/PlayerRemote.js'; export { updateFreeSitBlend } from './src/core/extras/freeSitBlend.js'`,
      resolveDir: process.cwd(),
    },
    bundle: true,
    platform: 'node',
    format: 'esm',
    write: false,
  })
  const {
    PlayerLocal,
    PlayerRemote,
    updateFreeSitBlend: advance,
  } = await import(`data:text/javascript;base64,${Buffer.from(result.outputFiles[0].contents).toString('base64')}`)
  for (const Player of [PlayerLocal, PlayerRemote]) {
    const player = fixture()
    player.data = {
      avatar: 'asset://test.vrm',
      effect: { freeSit: { ...pose(0, 0), target: [2, 1, 0], kind: 'seat' } },
    }
    player.getAvatarUrl = () => player.data.avatar
    Player.prototype.applySeatPose.call(player)
    player.data.effect.freeSit = { ...pose(1, 1), target: [2, 1, 0], kind: 'seat' }
    Player.prototype.applySeatPose.call(player)
    assert.equal(player.avatar.position.x, 0)
    advance(player, 0.09)
    assert.ok(Math.abs(player.avatar.position.x - 0.5) < 1e-6)
    player.data.effect = null
    Player.prototype.applySeatPose.call(player)
    assert.equal(player.avatar.pose, null)
    assert.equal(player.freeSitBlend, null)
    assert.equal(player.avatar.position.x, 0)
  }
})
