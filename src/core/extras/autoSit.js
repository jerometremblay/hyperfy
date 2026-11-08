import * as THREE from './three'
import { Layers } from './Layers'
import { getDefaultSittingPose, sanitizeNormalizedPose } from './seatPose'
import { clampBoneRotation, solveTwoBoneIK } from './poseEditorMath'

const DOWN = new THREE.Vector3(0, -1, 0)
const MASK = Layers.environment.group | Layers.prop.group
const MAX_REACH = 2.5

// A free seat is relative to the standing player, so leaving it does not
// teleport the capsule into furniture. The regular player effect carries the
// small offset to observers.
export function getFreeSittingPose(effect) {
  const seat = effect?.freeSit
  if (
    !seat ||
    !Array.isArray(seat.offset) ||
    seat.offset.length !== 3 ||
    !seat.offset.every(value => Number.isFinite(value) && Math.abs(value) <= 2) ||
    !['floor', 'seat', 'lean', 'leanFloor'].includes(seat.kind)
  )
    return null
  let rotation = [0, 0, 0, 1]
  if (seat.rotation !== undefined) {
    if (!Array.isArray(seat.rotation) || seat.rotation.length !== 4 || !seat.rotation.every(Number.isFinite))
      return null
    const q = new THREE.Quaternion(...seat.rotation)
    if (Math.abs(q.length() - 1) > 0.1) return null
    rotation = q.normalize().toArray()
  }
  const pose = getDefaultSittingPose()
  if (seat.kind === 'floor' || seat.kind === 'leanFloor') {
    // Extend the legs along the floor instead of bending them through it.
    pose.leftLowerLeg.rotation = [0, 0, 0, 1]
    pose.rightLowerLeg.rotation = [0, 0, 0, 1]
  }
  if (seat.kind === 'lean' || seat.kind === 'leanFloor') {
    pose.spine.rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), 0.2).toArray()
    if (seat.kind === 'lean') {
      pose.hips.position = [0, 0, 0]
      for (const name of ['leftUpperLeg', 'leftLowerLeg', 'rightUpperLeg', 'rightLowerLeg']) {
        pose[name].rotation = [0, 0, 0, 1]
      }
    }
  }
  if (seat.pose !== undefined) {
    const fitted = sanitizeNormalizedPose(seat.pose)
    if (!fitted || !fitted.hips) return null
    return { offset: seat.offset, rotation, pose: fitted }
  }
  return { offset: seat.offset, rotation, pose }
}

// Find the descending side of the selected support and fit a cloned humanoid
// there. Return null rather than publishing an unvalidated, intersecting pose.
export function fitFreeSittingPose(physics, seat, base, avatar, direction = null) {
  const factory = avatar?.factory
  const source = avatar?.instance?.raw?.scene
  if (!factory?.cloneScene || !factory?.getRawBoneName || !factory?.applyNormalizedPose || !source) return null
  if (!seat || !Array.isArray(seat.offset) || seat.offset.length !== 3 || !seat.offset.every(Number.isFinite))
    return null
  if (
    seat.target !== undefined &&
    (!Array.isArray(seat.target) || seat.target.length !== 3 || !seat.target.every(Number.isFinite))
  )
    return null
  const baseQ = base.quaternion.clone()
  const selectedPoint = seat.target
    ? new THREE.Vector3(...seat.target)
    : new THREE.Vector3(...seat.offset).applyQuaternion(baseQ).add(base.position)
  const clone = factory.cloneScene(source)
  const scene = clone.scene
  if (!scene) return null
  for (const root of clone.detachedRoots || []) {
    let parent = root
    while (parent && parent !== scene) parent = parent.parent
    if (!parent) scene.add(root)
  }
  const bone = name => scene.getObjectByName(factory.getRawBoneName(name))
  const chains = ['left', 'right'].map(side => ({
    side,
    root: bone(`${side}UpperLeg`),
    middle: bone(`${side}LowerLeg`),
    end: bone(`${side}Foot`),
  }))
  const hips = bone('hips')
  if (!hips || chains.some(c => !c.root || !c.middle || !c.end)) return null

  // Sample the avatar's actual foot and shoe vertices, not just ankle joints.
  // Bone-weighted samples retain the footwear's shape across each IK attempt.
  const footVertices = { left: [], right: [] }
  const handVertices = { left: [], right: [] }
  scene.traverse(mesh => {
    if (!mesh.isSkinnedMesh || !mesh.skeleton) return
    const indices = mesh.geometry.getAttribute('skinIndex')
    const weights = mesh.geometry.getAttribute('skinWeight')
    if (!indices || !weights) return
    mesh.bindMode = THREE.AttachedBindMode
    const footBones = Object.fromEntries(
      ['left', 'right'].map(side => [
        side,
        new Set([factory.getRawBoneName(`${side}Foot`), factory.getRawBoneName(`${side}Toes`)].filter(Boolean)),
      ])
    )
    const handBones = Object.fromEntries(
      ['left', 'right'].map(side => {
        const names = new Set()
        bone(`${side}Hand`)?.traverse(child => {
          if (child.isBone) names.add(child.name)
        })
        return [side, names]
      })
    )
    for (let index = 0; index < indices.count; index++) {
      for (const side of ['left', 'right']) {
        let weight = 0
        for (let slot = 0; slot < Math.min(4, weights.itemSize); slot++) {
          const name = mesh.skeleton.bones[indices.getComponent(index, slot)]?.name
          if (footBones[side].has(name)) weight += weights.getComponent(index, slot)
        }
        if (index % 8 === 0 && weight >= 0.5) footVertices[side].push({ mesh, index })
        let handWeight = 0
        for (let slot = 0; slot < Math.min(4, weights.itemSize); slot++) {
          const name = mesh.skeleton.bones[indices.getComponent(index, slot)]?.name
          if (handBones[side].has(name)) handWeight += weights.getComponent(index, slot)
        }
        if (handWeight >= 0.5) handVertices[side].push({ mesh, index })
      }
    }
  })

  const downHit = (x, z, top, range) => {
    const hit = physics.raycast(new THREE.Vector3(x, top, z), DOWN, range, MASK)
    return hit && hit.normal.y >= 0.8 ? hit.point.clone() : null
  }
  const supportAtSeat = downHit(selectedPoint.x, selectedPoint.z, selectedPoint.y + 0.08, 0.16)
  if (!supportAtSeat || Math.abs(supportAtSeat.y - selectedPoint.y) > 0.04) return null
  const candidates = []
  for (let i = 0; i < (direction ? 1 : 16); i++) {
    const angle = (i * Math.PI) / 8
    const forward = direction
      ? direction.clone().setY(0).normalize()
      : new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle))
    if (forward.lengthSq() < 0.99) continue
    const probe = selectedPoint.clone().addScaledVector(forward, 0.4)
    const support = downHit(probe.x, probe.z, selectedPoint.y + 0.12, 1.3)
    if (!support || support.y <= selectedPoint.y + 0.08) candidates.push({ forward, height: support?.y ?? -Infinity })
  }
  const preferred = new THREE.Vector3(0, 0, -1).applyQuaternion(baseQ)
  candidates.sort((a, b) => a.height - b.height || b.forward.dot(preferred) - a.forward.dot(preferred))
  for (const hanging of [false, true])
    for (const candidate of candidates)
      for (const shift of hanging ? [0, 0.15, 0.3, 0.45, 0.6, 0.75] : [0]) {
        const f = candidate.forward
        const point = selectedPoint.clone().addScaledVector(f, shift)
        if (point.distanceTo(base.position) > MAX_REACH) continue
        if (shift) {
          const support = downHit(point.x, point.z, point.y + 0.08, 0.16)
          if (!support || Math.abs(support.y - point.y) > 0.04) continue
        }
        const yaw = Math.atan2(-f.x, -f.z)
        const worldQ = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw)
        const rotation = baseQ.clone().invert().multiply(worldQ).normalize()
        const right = new THREE.Vector3(1, 0, 0).applyQuaternion(worldQ)
        const root = new THREE.Group()
        root.position.copy(point)
        root.quaternion.copy(worldQ)
        scene.removeFromParent()
        root.add(scene)
        scene.matrixAutoUpdate = true
        scene.matrixWorldAutoUpdate = true
        scene.position.set(0, 0, 0)
        scene.quaternion.identity()
        scene.scale.set(1, 1, 1)
        root.updateMatrixWorld(true)
        const initial = getDefaultSittingPose()
        initial.hips.position = [0, 0, 0]
        factory.applyNormalizedPose(scene, initial)
        scene.updateWorldMatrix(true, true)
        const hip = hips.getWorldPosition(new THREE.Vector3())
        initial.hips.position = [0, point.y + 0.08 - hip.y, 0]
        factory.applyNormalizedPose(scene, initial)
        scene.updateWorldMatrix(true, true)
        const contacts = {}
        const clear = (a, b) => {
          const d = b.clone().sub(a)
          const n = d.length()
          if (n < 0.06) return true
          d.normalize()
          return !physics.raycast(a.clone().addScaledVector(d, 0.04), d, n - 0.06, MASK)
        }
        let valid = true
        for (const chain of chains) {
          const hipPos = chain.root.getWorldPosition(new THREE.Vector3())
          const kneePos = chain.middle.getWorldPosition(new THREE.Vector3())
          const footPos = chain.end.getWorldPosition(new THREE.Vector3())
          const footOrientation = chain.end.getWorldQuaternion(new THREE.Quaternion())
          const upperLength = hipPos.distanceTo(kneePos)
          const lowerLength = kneePos.distanceTo(footPos)
          const length = upperLength + lowerLength
          let fitted = false
          for (const hangingLeg of hanging ? [false, true] : [false]) {
            const targets = []
            const distances = hangingLeg
              ? [0.25, 0.55, 0.9].map(n => n * upperLength)
              : [0.2, 0.35, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2].map(n => n * upperLength)
            for (const forwardDistance of distances) {
              const xz = point
                .clone()
                .addScaledVector(f, forwardDistance)
                .addScaledVector(right, chain.side === 'left' ? -0.1 : 0.1)
              const contact = hangingLeg ? null : downHit(xz.x, xz.z, point.y + 0.1, Math.min(length + 0.3, 1.5))
              if (!hangingLeg && !contact) continue
              if (contact && point.y - base.position.y > 0.2 && contact.y >= point.y - 0.04) continue
              const relaxedDrop = (lowerLength * 0.9) / length
              for (const dropRatio of hangingLeg ? [0.9, 0.75, 0.6, relaxedDrop] : [0]) {
                const ankle = hangingLeg
                  ? new THREE.Vector3(xz.x, hipPos.y - length * dropRatio, xz.z)
                  : contact.clone().add(new THREE.Vector3(0, 0.07, 0))
                if (hipPos.distanceTo(ankle) >= length - 0.01) continue
                const drop = THREE.MathUtils.clamp((hipPos.y - ankle.y) / length, 0, 1)
                // A dangling leg can extend down if its own path is clear.
                const preferredForward = upperLength * (1 - drop) * 0.9
                const actualForward = ankle.clone().sub(hipPos).dot(f)
                const score = hangingLeg
                  ? chain.side === 'left'
                    ? Math.abs(drop - relaxedDrop) + (Math.abs(actualForward - upperLength * 0.9) / length) * 0.1
                    : -drop + (Math.abs(actualForward) / length) * 0.1
                  : Math.abs(actualForward - preferredForward)
                targets.push({ contact, ankle, score })
              }
            }
            targets.sort((a, b) => a.score - b.score)
            for (const { contact, ankle: baseAnkle } of targets) {
              for (const lift of [0, 0.03, 0.06, 0.09, 0.12]) {
                const ankle = baseAnkle.clone().add(new THREE.Vector3(0, lift, 0))
                if (hipPos.distanceTo(ankle) >= length - 0.01) continue
                const local = scene.worldToLocal(ankle.clone()).toArray()
                if (!solveTwoBoneIK(scene, chain.root, chain.middle, chain.end, local, [0, 0, -1])) continue
                const limited = factory.getNormalizedPose(scene)
                for (const name of [`${chain.side}UpperLeg`, `${chain.side}LowerLeg`]) {
                  if (limited[name]?.rotation) limited[name].rotation = clampBoneRotation(name, limited[name].rotation)
                }
                factory.applyNormalizedPose(scene, limited)
                scene.updateWorldMatrix(true, true)
                if (footVertices[chain.side].length) {
                  const parentOrientation = chain.end.parent.getWorldQuaternion(new THREE.Quaternion())
                  chain.end.quaternion.copy(parentOrientation.invert().multiply(footOrientation)).normalize()
                  chain.end.updateMatrix()
                  scene.updateWorldMatrix(true, true)
                }
                const actualKnee = chain.middle.getWorldPosition(new THREE.Vector3())
                const actualFoot = chain.end.getWorldPosition(new THREE.Vector3())
                if (actualFoot.distanceTo(ankle) > 0.04) continue
                if (!clear(hipPos, actualKnee) || !clear(actualKnee, actualFoot)) continue
                const toes = bone(`${chain.side}Toes`)
                if (toes) {
                  const toe = toes.getWorldPosition(new THREE.Vector3())
                  if (physics.overlapSphere) {
                    if (physics.overlapSphere(0.01, toe, MASK).length) continue
                  } else {
                    const belowToe = downHit(toe.x, toe.z, toe.y + 0.25, 0.5)
                    if (belowToe && toe.y < belowToe.y + 0.015) continue
                  }
                  if (!clear(actualFoot, toe)) continue
                }
                // Check the lowest sampled footwear vertices in small horizontal
                // cells so toes and heels cannot disappear into a stair tread.
                const cells = new Map()
                const updatedMeshes = new Set()
                for (const { mesh, index } of footVertices[chain.side]) {
                  if (!updatedMeshes.has(mesh)) {
                    mesh.updateMatrixWorld(true)
                    mesh.skeleton.update()
                    updatedMeshes.add(mesh)
                  }
                  const vertex = mesh.getVertexPosition(index, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld)
                  const relative = vertex.clone().sub(actualFoot)
                  const key = `${Math.floor(relative.dot(f) / 0.035)},${Math.floor(relative.dot(right) / 0.035)}`
                  if (!cells.has(key) || cells.get(key).y > vertex.y) cells.set(key, vertex)
                }
                let footClear = true
                for (const vertex of cells.values()) {
                  if (physics.overlapSphere) {
                    if (physics.overlapSphere(0.002, vertex, MASK).length) {
                      footClear = false
                      break
                    }
                  } else {
                    const top = Math.max(point.y + 0.15, vertex.y + 0.25)
                    const surface = downHit(vertex.x, vertex.z, top, top - vertex.y + 0.03)
                    if (surface && vertex.y < surface.y - 0.003) {
                      footClear = false
                      break
                    }
                  }
                }
                if (!footClear) continue
                if (contact) contacts[`${chain.side}Foot`] = contact.toArray()
                fitted = true
                break
              }
              if (fitted) break
            }
            if (fitted) break
          }
          if (!fitted) {
            valid = false
            break
          }
        }
        if (!valid) continue
        const spine = bone('spine')
        const chest = bone('chest')
        if (spine && chest) {
          const hipPoint = hips.getWorldPosition(new THREE.Vector3())
          const spinePoint = spine.getWorldPosition(new THREE.Vector3())
          const chestPoint = chest.getWorldPosition(new THREE.Vector3())
          if (!clear(hipPoint, spinePoint) || !clear(spinePoint, chestPoint)) continue
        }
        // Find tabletop or armrest contacts independently for each hand.
        for (const side of ['left', 'right']) {
          const upper = bone(`${side}UpperArm`),
            elbow = bone(`${side}LowerArm`),
            hand = bone(`${side}Hand`)
          if (!upper || !elbow || !hand) continue
          const shoulder = upper.getWorldPosition(new THREE.Vector3())
          const middle = elbow.getWorldPosition(new THREE.Vector3())
          const end = hand.getWorldPosition(new THREE.Vector3())
          const length = shoulder.distanceTo(middle) + middle.distanceTo(end)
          const previous = factory.getNormalizedPose(scene)
          const sign = side === 'left' ? -1 : 1
          const contactsToTry = []
          for (const forward of [0.51, 0.55, 0.59, 0.63, 0.74, 0.82, 0.43, 1, 0.16].map(n => n * length)) {
            for (const lateral of [0.39, 0.55, 0.66, 0.23].map(n => n * length)) {
              const sample = point
                .clone()
                .addScaledVector(right, sign * lateral)
                .addScaledVector(f, forward)
              const contact = downHit(sample.x, sample.z, shoulder.y + 0.1, Math.max(0.1, shoulder.y - point.y + 0.1))
              if (!contact || contact.y < point.y + 0.1 || shoulder.distanceTo(contact) >= length - 0.02) continue
              contactsToTry.push(contact)
            }
          }
          let fittedHand = false
          for (const contact of contactsToTry) {
            for (const lift of [0.025, 0.045, 0.065, 0.085, 0.105]) {
              for (const pole of [
                [0, 0, -1],
                [0, -1, 0],
                [0, 0, 1],
              ]) {
                factory.applyNormalizedPose(scene, previous)
                scene.updateWorldMatrix(true, true)
                const targetWorld = contact.clone().add(new THREE.Vector3(0, lift, 0))
                const target = scene.worldToLocal(targetWorld.clone()).toArray()
                if (!solveTwoBoneIK(scene, upper, elbow, hand, target, pole)) continue
                const limited = factory.getNormalizedPose(scene)
                for (const name of [`${side}UpperArm`, `${side}LowerArm`]) {
                  if (limited[name]?.rotation) limited[name].rotation = clampBoneRotation(name, limited[name].rotation)
                }
                factory.applyNormalizedPose(scene, limited)
                scene.updateWorldMatrix(true, true)
                const nextElbow = elbow.getWorldPosition(new THREE.Vector3())
                const nextHand = hand.getWorldPosition(new THREE.Vector3())
                if (
                  nextHand.distanceTo(targetWorld) > 0.05 ||
                  !clear(shoulder, nextElbow) ||
                  !clear(nextElbow, nextHand)
                )
                  continue
                const updated = new Set()
                let safe = true
                for (const { mesh, index } of handVertices[side]) {
                  if (!updated.has(mesh)) {
                    mesh.updateMatrixWorld(true)
                    mesh.skeleton.update()
                    updated.add(mesh)
                  }
                  const vertex = mesh.getVertexPosition(index, new THREE.Vector3()).applyMatrix4(mesh.matrixWorld)
                  if (physics.overlapSphere?.(0.002, vertex, MASK).length) {
                    safe = false
                    break
                  }
                }
                if (!safe) continue
                contacts[`${side}Hand`] = contact.toArray()
                fittedHand = true
                break
              }
              if (fittedHand) break
            }
            if (fittedHand) break
          }
          if (!fittedHand) {
            factory.applyNormalizedPose(scene, previous)
            scene.updateWorldMatrix(true, true)
          }
        }
        const pose = sanitizeNormalizedPose(factory.getNormalizedPose(scene))
        if (!pose) continue
        // Keep the synchronized effect within the existing network size limit.
        for (const transform of Object.values(pose)) {
          for (const key of ['rotation', 'position']) {
            if (transform[key]) transform[key] = transform[key].map(value => Math.round(value * 1e5) / 1e5)
          }
        }
        const offset = point.clone().sub(base.position).applyQuaternion(baseQ.clone().invert())
        if (offset.toArray().some(value => Math.abs(value) > 2)) continue
        return {
          offset: offset.toArray(),
          target: selectedPoint.toArray(),
          kind: 'seat',
          rotation: rotation.toArray(),
          pose,
          contacts,
        }
      }
  return null
}

export function findFreeSittingSurface(physics, origin, direction, base) {
  if (!physics?.raycast || !origin || !direction || !base) return null
  const viewed = physics.raycast(origin, direction, 8, MASK)
  const point = viewed?.point?.clone()
  if (!point || point.distanceTo(base.position) > MAX_REACH) return null

  // A broad, level area supports sitting; a small or steep contact can still
  // support a lean. Copy the first hit before querying: PhysX reuses it.
  const horizontal = viewed.normal.y >= 0.8
  let broad = horizontal
  if (broad) {
    for (const [x, z] of [
      [-0.14, 0],
      [0.14, 0],
      [0, -0.14],
      [0, 0.14],
    ]) {
      const sample = point.clone().add(new THREE.Vector3(x, 0.12, z))
      const hit = physics.raycast(sample, DOWN, 0.24, MASK)
      if (!hit || hit.normal.y < 0.8 || Math.abs(hit.point.y - point.y) > 0.08) {
        broad = false
        break
      }
    }
  }
  const low = Math.abs(point.y - base.position.y) < 0.15
  const kind = broad ? (low ? 'floor' : 'seat') : low ? 'leanFloor' : 'lean'
  const position = point.clone()
  let rotation
  if (kind === 'lean') {
    // Keep the feet on the player's ground and place the back near the contact.
    const outward = base.position.clone().sub(point).setY(0)
    if (outward.lengthSq() < 1e-6) outward.set(0, 0, -1).applyQuaternion(base.quaternion).setY(0)
    outward.normalize()
    position.addScaledVector(outward, 0.15)
    position.y = base.position.y
    const worldYaw = Math.atan2(-outward.x, -outward.z)
    const facing = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), worldYaw)
    rotation = base.quaternion.clone().invert().multiply(facing).normalize().toArray()
  }
  const offset = position.sub(base.position).applyQuaternion(base.quaternion.clone().invert())
  if (offset.toArray().some(value => Math.abs(value) > 2)) return null
  return { offset: offset.toArray(), kind, target: point.toArray(), horizontal, ...(rotation ? { rotation } : {}) }
}
