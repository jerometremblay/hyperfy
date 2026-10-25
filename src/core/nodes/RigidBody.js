import * as THREE from '../extras/three'
import {
  decomposeMatrix,
  vec3ToPx,
  vec3ToPxPos,
  quatToPxRot,
  pxToVec3,
  pxToQuat,
  writeVec3,
  writeQuat,
  isVector3,
  isQuaternion,
  readVec3,
  readQuat,
  warnOnce,
  scratchPxVec3,
} from '../extras/physxConvert.js'

import { Node } from './Node'
import { callForScript } from '../extras/scriptValues'
import { isFunction, isNumber, isString } from 'lodash-es'

const _v1 = new THREE.Vector3()
const _v2 = new THREE.Vector3()
const _q1 = new THREE.Quaternion()
const _m1 = new THREE.Matrix4()
const _m2 = new THREE.Matrix4()
const _m3 = new THREE.Matrix4()
const _defaultScale = new THREE.Vector3(1, 1, 1)

const types = ['static', 'kinematic', 'dynamic']

const defaults = {
  type: 'static',
  mass: 1,
  linearDamping: 0, // physx default
  angularDamping: 0.05, // phyx default
  tag: null,
  onContactStart: null,
  onContactEnd: null,
  onTriggerEnter: null,
  onTriggerLeave: null,
}

let forceModes
function getForceMode(mode) {
  if (!forceModes) {
    forceModes = {
      force: PHYSX.PxForceModeEnum.eFORCE,
      impulse: PHYSX.PxForceModeEnum.eIMPULSE,
      acceleration: PHYSX.PxForceModeEnum.eACCELERATION,
      velocityChange: PHYSX.PxForceModeEnum.eVELOCITY_CHANGE,
    }
  }
  return typeof mode === 'string' && Object.prototype.hasOwnProperty.call(forceModes, mode)
    ? forceModes[mode]
    : forceModes.force
}

export class RigidBody extends Node {
  constructor(data = {}) {
    super(data)
    this.name = 'rigidbody'

    this.shapes = new Set()

    this.type = data.type
    this.mass = data.mass
    this.linearDamping = data.linearDamping
    this.angularDamping = data.angularDamping
    this.tag = data.tag
    this.onContactStart = data.onContactStart
    this.onContactEnd = data.onContactEnd
    this.onTriggerEnter = data.onTriggerEnter
    this.onTriggerLeave = data.onTriggerLeave

    this._tm = null

    this.tempVec3 = new THREE.Vector3()
    this.tempQuat = new THREE.Quaternion()
  }

  mount() {
    if (this.ctx.world.isPreview) return
    this.needsRebuild = false
    if (this.ctx.moving) return // physics ignored when moving apps around
    this._tm ||= new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    decomposeMatrix(this.matrixWorld, _v1, _q1, _v2)
    this.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    vec3ToPxPos(_v1, this.transform)
    quatToPxRot(_q1, this.transform)
    if (this._type === 'static') {
      this.actor = this.ctx.world.physics.physics.createRigidStatic(this.transform)
    } else if (this._type === 'kinematic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this.transform)
      this.actor.setRigidBodyFlag(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC, true)
      // this.actor.setMass(this.mass)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, this._mass)
      // this.untrack = this.ctx.world.physics.track(this.actor, this.onPhysicsMovement)
    } else if (this._type === 'dynamic') {
      this.actor = this.ctx.world.physics.physics.createRigidDynamic(this.transform)
      // this.actor.setMass(this.mass)
      PHYSX.PxRigidBodyExt.prototype.setMassAndUpdateInertia(this.actor, this._mass)
      // this.untrack = this.ctx.world.physics.track(this.actor, this.onPhysicsMovement)
      if (this._centerOfMass) {
        const pose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
        vec3ToPxPos(this._centerOfMass, pose)
        this.actor.setCMassLocalPose(pose)
      }
      this.actor.setLinearDamping(this._linearDamping)
      this.actor.setAngularDamping(this._angularDamping)
    }
    for (const shape of this.shapes) {
      this.actor.attachShape(shape)
    }
    const self = this
    const playerId = this.ctx.entity?.isPlayer ? this.ctx.entity.data.id : null
    this.actorHandle = this.ctx.world.physics.addActor(this.actor, {
      onInterpolate: this._type === 'kinematic' || this._type === 'dynamic' ? this.onInterpolate : null,
      node: this,
      get tag() {
        return self._tag
      },
      get playerId() {
        return playerId
      },
      get onContactStart() {
        return self._onContactStart
      },
      get onContactEnd() {
        return self._onContactEnd
      },
      get onTriggerEnter() {
        return self._onTriggerEnter
      },
      get onTriggerLeave() {
        return self._onTriggerLeave
      },
    })
  }

  commit(didMove) {
    if (this.needsRebuild) {
      this.unmount()
      this.mount()
      return
    }
    if (didMove) {
      this.actorHandle?.move(this.matrixWorld)
    }
  }

  onInterpolate = (position, quaternion) => {
    if (this.parent) {
      _m1.compose(position, quaternion, _defaultScale)
      _m2.copy(this.parent.matrixWorld).invert()
      _m3.multiplyMatrices(_m2, _m1)
      _m3.decompose(this.position, this.quaternion, _v1)
      // this.matrix.copy(_m3)
      // this.matrixWorld.copy(_m1)
    } else {
      this.position.copy(position)
      this.quaternion.copy(quaternion)
      // this.matrix.compose(this.position, this.quaternion, this.scale)
      // this.matrixWorld.copy(this.matrix)
    }
  }

  unmount() {
    if (this.actor) {
      // this.untrack?.()
      // this.untrack = null
      this.actorHandle?.destroy()
      this.actorHandle = null
      this.actor.release()
      this.actor = null
    }
  }

  addShape(shape) {
    if (!shape) return
    this.shapes.add(shape)
    if (this.actor) {
      this.actor.attachShape(shape)
    }
  }

  removeShape(shape) {
    if (!shape) return
    this.shapes.delete(shape)
    if (this.actor) {
      this.actor.detachShape(shape)
    }
  }

  copy(source, recursive) {
    super.copy(source, recursive)
    this._type = source._type
    this._mass = source._mass
    this._tag = source._tag
    this._onContactStart = source._onContactStart
    this._onContactEnd = source._onContactEnd
    this._onTriggerEnter = source._onTriggerEnter
    this._onTriggerLeave = source._onTriggerLeave
    return this
  }

  get type() {
    return this._type
  }

  set type(value = defaults.type) {
    if (!isType(value)) {
      throw new Error(`[rigidbody] type invalid: ${value}`)
    }
    if (this._type === value) return
    this._type = value
    this.needsRebuild = true
    this.setDirty()
  }

  get mass() {
    return this._mass
  }

  set mass(value = defaults.mass) {
    if (!isNumber(value)) {
      throw new Error('[rigidbody] mass not a number')
    }
    if (value < 0) {
      throw new Error('[rigidbody] mass cannot be less than zero')
    }
    this._mass = value
    this.needsRebuild = true
    this.setDirty()
  }

  get linearDamping() {
    return this._linearDamping
  }

  set linearDamping(value = defaults.linearDamping) {
    if (!isNumber(value)) {
      throw new Error('[rigidbody] linearDamping not a number')
    }
    if (value < 0) {
      throw new Error('[rigidbody] linearDamping cannot be less than zero')
    }
    this._linearDamping = value
    this.needsRebuild = true
    this.setDirty()
  }

  get angularDamping() {
    return this._angularDamping
  }

  set angularDamping(value = defaults.angularDamping) {
    if (!isNumber(value)) {
      throw new Error('[rigidbody] angularDamping not a number')
    }
    if (value < 0) {
      throw new Error('[rigidbody] angularDamping cannot be less than zero')
    }
    this._angularDamping = value
    this.needsRebuild = true
    this.setDirty()
  }

  get tag() {
    return this._tag
  }

  set tag(value = defaults.tag) {
    if (isNumber(value)) {
      value = value + ''
    }
    if (value !== null && !isString(value)) {
      throw new Error('[rigidbody] tag not a string')
    }
    this._tag = value
  }

  get onContactStart() {
    return this._onContactStart
  }

  set onContactStart(value = defaults.onContactStart) {
    if (value !== null && !isFunction(value)) {
      throw new Error('[rigidbody] onContactStart not a function')
    }
    this._onContactStart = value
  }

  get onContactEnd() {
    return this._onContactEnd
  }

  set onContactEnd(value = defaults.onContactEnd) {
    if (value !== null && !isFunction(value)) {
      throw new Error('[rigidbody] onContactEnd not a function')
    }
    this._onContactEnd = value
  }

  get onTriggerEnter() {
    return this._onTriggerEnter
  }

  set onTriggerEnter(value = defaults.onTriggerEnter) {
    if (value !== null && !isFunction(value)) {
      throw new Error('[rigidbody] onTriggerEnter not a function')
    }
    this._onTriggerEnter = value
  }

  get onTriggerLeave() {
    return this._onTriggerLeave
  }

  set onTriggerLeave(value = defaults.onTriggerLeave) {
    if (value !== null && !isFunction(value)) {
      throw new Error('[rigidbody] onTriggerLeave not a function')
    }
    this._onTriggerLeave = value
  }

  get sleeping() {
    if (!this.actor) return false
    return this.actor.isSleeping()
  }

  addForce(force, mode) {
    if (!readVec3(force, _v1, '[rigidbody] addForce force must be Vector3')) {
      warnOnce('[rigidbody] addForce ignored a non-finite force')
      return
    }
    if (!this.actor) return
    mode = getForceMode(mode)
    const px = scratchPxVec3()
    vec3ToPx(_v1, px)
    this.actor.addForce(px, mode, true)
  }

  addForceAtPos(force, pos, mode) {
    const validForce = readVec3(force, _v1, '[rigidbody] addForceAtPos force must be Vector3')
    const validPos = readVec3(pos, _v2, '[rigidbody] addForceAtPos pos must be Vector3')
    if (!validForce || !validPos) {
      warnOnce('[rigidbody] addForceAtPos ignored a non-finite force or pos')
      return
    }
    if (!this.actor?.getLinearVelocity) return
    if (!this._pv1) this._pv1 = new PHYSX.PxVec3()
    if (!this._pv2) this._pv2 = new PHYSX.PxVec3()
    mode = getForceMode(mode)
    vec3ToPx(_v1, this._pv1)
    vec3ToPx(_v2, this._pv2)
    PHYSX.PxRigidBodyExt.prototype.addForceAtPos(this.actor, this._pv1, this._pv2, mode, true)
  }

  addForceAtLocalPos(force, pos, mode) {
    const validForce = readVec3(force, _v1, '[rigidbody] addForceAtLocalPos force must be Vector3')
    const validPos = readVec3(pos, _v2, '[rigidbody] addForceAtLocalPos pos must be Vector3')
    if (!validForce || !validPos) {
      warnOnce('[rigidbody] addForceAtLocalPos ignored a non-finite force or pos')
      return
    }
    if (!this.actor?.getLinearVelocity) return
    if (!this._pv1) this._pv1 = new PHYSX.PxVec3()
    if (!this._pv2) this._pv2 = new PHYSX.PxVec3()
    mode = getForceMode(mode)
    vec3ToPx(_v1, this._pv1)
    vec3ToPx(_v2, this._pv2)
    PHYSX.PxRigidBodyExt.prototype.addForceAtLocalPos(this.actor, this._pv1, this._pv2, mode, true)
  }

  addTorque(torque, mode) {
    if (!readVec3(torque, _v1, '[rigidbody] addTorque torque must be Vector3')) {
      warnOnce('[rigidbody] addTorque ignored a non-finite torque')
      return
    }
    if (!this.actor) return
    mode = getForceMode(mode)
    const px = scratchPxVec3()
    vec3ToPx(_v1, px)
    this.actor.addTorque(px, mode, true)
  }

  getPosition(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!isVector3(vec3)) throw new Error('[rigidbody] getPosition target must be Vector3')
    if (!this.actor) return writeVec3(vec3, 0, 0, 0)
    const pose = this.actor.getGlobalPose()
    return pxToVec3(vec3, pose.p)
  }

  setPosition(vec3) {
    if (!readVec3(vec3, _v1, '[rigidbody] setPosition position must be Vector3')) {
      warnOnce('[rigidbody] setPosition ignored a non-finite position')
      return
    }
    if (!this.actor) return
    const pose = this.actor.getGlobalPose()
    vec3ToPxPos(_v1, pose)
    this.actor.setGlobalPose(pose)
    writeVec3(this.position, _v1.x, _v1.y, _v1.z)
  }

  getQuaternion(quat) {
    if (!quat) quat = this.tempQuat
    if (!isQuaternion(quat)) throw new Error('[rigidbody] getQuaternion target must be Quaternion')
    if (!this.actor) return writeQuat(quat, 0, 0, 0, 1)
    const pose = this.actor.getGlobalPose()
    return pxToQuat(quat, pose.q)
  }

  setQuaternion(quat) {
    if (!readQuat(quat, _q1, '[rigidbody] setQuaternion quaternion must be Quaternion')) {
      warnOnce('[rigidbody] setQuaternion ignored a non-finite quaternion')
      return
    }
    if (!this.actor) return
    const pose = this.actor.getGlobalPose()
    quatToPxRot(_q1, pose)
    this.actor.setGlobalPose(pose)
    writeQuat(this.quaternion, _q1.x, _q1.y, _q1.z, _q1.w)
  }

  getLinearVelocity(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!isVector3(vec3)) throw new Error('[rigidbody] getLinearVelocity target must be Vector3')
    if (!this.actor) return writeVec3(vec3, 0, 0, 0)
    return pxToVec3(vec3, this.actor.getLinearVelocity())
  }

  setLinearVelocity(vec3) {
    if (!readVec3(vec3, _v1, '[rigidbody] setLinearVelocity velocity must be Vector3')) {
      warnOnce('[rigidbody] setLinearVelocity ignored a non-finite velocity')
      return
    }
    if (this.actor?.setLinearVelocity == null) return
    const px = scratchPxVec3()
    vec3ToPx(_v1, px)
    this.actor.setLinearVelocity?.(px)
  }

  getAngularVelocity(vec3) {
    if (!vec3) vec3 = this.tempVec3
    if (!isVector3(vec3)) throw new Error('[rigidbody] getAngularVelocity target must be Vector3')
    if (!this.actor) return writeVec3(vec3, 0, 0, 0)
    return pxToVec3(vec3, this.actor.getAngularVelocity())
  }

  setAngularVelocity(vec3) {
    if (!readVec3(vec3, _v1, '[rigidbody] setAngularVelocity velocity must be Vector3')) {
      warnOnce('[rigidbody] setAngularVelocity ignored a non-finite velocity')
      return
    }
    if (this.actor?.setAngularVelocity == null) return
    const px = scratchPxVec3()
    vec3ToPx(_v1, px)
    this.actor.setAngularVelocity?.(px)
  }

  getVelocityAtPos(pos, vec3) {
    const valid = readVec3(pos, _v1, '[rigidbody] getVelocityAtPos pos must be Vector3')
    if (!vec3) vec3 = this.tempVec3
    if (!isVector3(vec3)) throw new Error('[rigidbody] getVelocityAtPos target must be Vector3')
    if (!valid) {
      warnOnce('[rigidbody] getVelocityAtPos ignored a non-finite pos')
      return writeVec3(vec3, 0, 0, 0)
    }
    if (!this.actor?.getLinearVelocity) return writeVec3(vec3, 0, 0, 0)
    const px = scratchPxVec3()
    vec3ToPx(_v1, px)
    return pxToVec3(vec3, PHYSX.PxRigidBodyExt.prototype.getVelocityAtPos(this.actor, px))
  }

  getLocalVelocityAtLocalPos(pos, vec3) {
    const valid = readVec3(pos, _v1, '[rigidbody] getLocalVelocityAtLocalPos pos must be Vector3')
    if (!vec3) vec3 = this.tempVec3
    if (!isVector3(vec3)) throw new Error('[rigidbody] getLocalVelocityAtLocalPos target must be Vector3')
    if (!valid) {
      warnOnce('[rigidbody] getLocalVelocityAtLocalPos ignored a non-finite pos')
      return writeVec3(vec3, 0, 0, 0)
    }
    if (!this.actor?.getLinearVelocity) return writeVec3(vec3, 0, 0, 0)
    const px = scratchPxVec3()
    vec3ToPx(_v1, px)
    return pxToVec3(vec3, PHYSX.PxRigidBodyExt.prototype.getLocalVelocityAtLocalPos(this.actor, px))
  }

  setCenterOfMass(pos) {
    if (!readVec3(pos, _v1, '[rigidbody] setCenterOfMass pos must be Vector3')) {
      warnOnce('[rigidbody] setCenterOfMass ignored a non-finite pos')
      return
    }
    this._centerOfMass ??= new THREE.Vector3()
    writeVec3(this._centerOfMass, _v1.x, _v1.y, _v1.z)
    this.needsRebuild = true
    this.setDirty()
  }

  setKinematicTarget(position, quaternion) {
    if (this._type !== 'kinematic') {
      throw new Error('[rigidbody] setKinematicTarget failed (not kinematic)')
    }
    const validPosition = readVec3(position, _v1, '[rigidbody] setKinematicTarget position must be Vector3')
    const validQuaternion = readQuat(quaternion, _q1, '[rigidbody] setKinematicTarget quaternion must be Quaternion')
    if (!validPosition || !validQuaternion) {
      warnOnce('[rigidbody] setKinematicTarget ignored a non-finite position or quaternion')
      return
    }
    if (!this.actor?.setKinematicTarget) return
    if (!this.actor.getRigidBodyFlags().isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)) return
    this._tm ||= new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    vec3ToPxPos(_v1, this._tm)
    quatToPxRot(_q1, this._tm)
    this.actor?.setKinematicTarget(this._tm)
  }

  getProxy() {
    if (!this.proxy) {
      const self = this
      let proxy = {
        get type() {
          return self.type
        },
        set type(value) {
          self.type = value
        },
        get mass() {
          return self.mass
        },
        set mass(value) {
          self.mass = value
        },
        set linearDamping(value) {
          self.linearDamping = value
        },
        set angularDamping(value) {
          self.angularDamping = value
        },
        get tag() {
          return self.tag
        },
        set tag(value) {
          self.tag = value
        },
        get onContactStart() {
          return self.onContactStart
        },
        set onContactStart(value) {
          self.onContactStart = value
        },
        get onContactEnd() {
          return self.onContactEnd
        },
        set onContactEnd(value) {
          self.onContactEnd = value
        },
        get onTriggerEnter() {
          return self.onTriggerEnter
        },
        set onTriggerEnter(value) {
          self.onTriggerEnter = value
        },
        get onTriggerLeave() {
          return self.onTriggerLeave
        },
        set onTriggerLeave(value) {
          self.onTriggerLeave = value
        },
        get sleeping() {
          return callForScript(() => self.sleeping, self, [])
        },
        addForce(force, mode) {
          return callForScript(self.addForce, self, [force, mode])
        },
        addForceAtPos(force, pos, mode) {
          return callForScript(self.addForceAtPos, self, [force, pos, mode])
        },
        addForceAtLocalPos(force, pos, mode) {
          return callForScript(self.addForceAtLocalPos, self, [force, pos, mode])
        },
        addTorque(torque, mode) {
          return callForScript(self.addTorque, self, [torque, mode])
        },
        getPosition(vec3) {
          return callForScript(self.getPosition, self, [vec3])
        },
        setPosition(vec3) {
          return callForScript(self.setPosition, self, [vec3])
        },
        getQuaternion(quat) {
          return callForScript(self.getQuaternion, self, [quat])
        },
        setQuaternion(quat) {
          return callForScript(self.setQuaternion, self, [quat])
        },
        getLinearVelocity(vec3) {
          return callForScript(self.getLinearVelocity, self, [vec3])
        },
        setLinearVelocity(vec3) {
          return callForScript(self.setLinearVelocity, self, [vec3])
        },
        getAngularVelocity(vec3) {
          return callForScript(self.getAngularVelocity, self, [vec3])
        },
        setAngularVelocity(vec3) {
          return callForScript(self.setAngularVelocity, self, [vec3])
        },
        getVelocityAtPos(pos, vec3) {
          return callForScript(self.getVelocityAtPos, self, [pos, vec3])
        },
        getLocalVelocityAtLocalPos(pos, vec3) {
          return callForScript(self.getLocalVelocityAtLocalPos, self, [pos, vec3])
        },
        setCenterOfMass(pos) {
          return callForScript(self.setCenterOfMass, self, [pos])
        },
        setKinematicTarget(position, quaternion) {
          return callForScript(self.setKinematicTarget, self, [position, quaternion])
        },
      }
      proxy = Object.defineProperties(proxy, Object.getOwnPropertyDescriptors(super.getProxy())) // inherit Node properties
      this.proxy = proxy
    }
    return this.proxy
  }
}

function isType(value) {
  return types.includes(value)
}
