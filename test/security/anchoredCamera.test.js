import { test } from 'node:test'
import assert from 'node:assert/strict'
import { Matrix4, Object3D, Quaternion, Vector3, Box3 } from 'three'
import { loadClient } from './lib/clientHarness.mjs'
import { readAnchorPose } from '../../src/core/extras/anchorPose.js'
import { getAvatarCameraFocus, getAvatarEyePosition } from '../../src/core/extras/avatarFocus.js'

const Player = loadClient('core/entities/PlayerLocal.js', 'PlayerLocal', {
  readAnchorPose,
  getAvatarCameraFocus,
  getAvatarEyePosition,
  simpleCamLerp(world, camera, target) {
    camera.position.copy(target.position)
  },
})

for (const firstPerson of [false, true]) {
  test(`anchored ${firstPerson ? 'first' : 'third'}-person camera follows the rendered avatar on the movement frame`, () => {
    for (const fps of [30, 60, 120]) {
      const anchor = new Matrix4()
      const base = new Object3D()
      const avatarRoot = new Object3D()
      avatarRoot.position.set(.08, -.04, .03)
      base.add(avatarRoot)
      base.clean = () => base.updateMatrixWorld(true)
      base.clean()
      const head = new Matrix4().makeTranslation(.025, .71, -.13)
      const headWorld = new Matrix4()
      const avatar = {
        instance: { raw: { scene: avatarRoot } },
        getHeight: () => 1.8,
        getBoneTransform: () => headWorld.multiplyMatrices(avatarRoot.matrixWorld, head),
      }
      const player = Object.assign(Object.create(Player.prototype), {
        base, avatar, firstPerson, camHeight: 1.2,
        cameraFocus: new Vector3(), cameraFocusBounds: new Box3(),
        aura: { position: new Vector3() },
        controller: { teleport() {} },
        getAnchorMatrix: () => anchor,
        cam: { position: new Vector3(), quaternion: new Quaternion(), zoom: firstPerson ? 0 : 2 },
        control: { camera: { position: new Vector3(), zoom: firstPerson ? 0 : 2 } },
        world: { camera: { near: .2, updateProjectionMatrix() {} } },
      })
      // Move immediately upon sitting, then stop. Post-late-update rendering
      // commits the avatar after the camera has already selected its position.
      for (const z of [-1 / fps, -2 / fps, -3 / fps, -3 / fps, -3 / fps]) {
        anchor.makeTranslation(5, .595, z)
        player.lateUpdate(1 / fps)
        base.clean()
        const renderedHead = new Vector3().setFromMatrixPosition(avatar.getBoneTransform('head'))
        if (!firstPerson) renderedHead.x += .3
        assert(player.control.camera.position.distanceTo(renderedHead) < 1e-10,
          `Camera follows a stale avatar transform at ${fps} FPS, z=${z}`)
      }
    }
  })
}
