import { handlePhysicsFailure, isPhysicsTrap, getPhysicsTrapCount } from '../extras/physicsFailure.js'
import * as THREE from '../extras/three'
import { matrixToPxTransform, vec3ToPx, pxToVec3, pxToQuat, warnOnce } from '../extras/physxConvert.js'
import { System } from './System'
import { Layers } from '../extras/Layers'
import { loadPhysX } from '../loadPhysX'
import { PortalCollisions } from '../extras/PortalCollisions'
import { serializeError } from '../extras/serializeError'
import { briefError } from '../extras/logOnce.js'
import { positionOk } from '../extras/physicsValidate.js'

const _raycastHit = {
  actor: null,
  point: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  distance: null,
}

const _sweepHit = {
  actor: null,
  point: new THREE.Vector3(),
  normal: new THREE.Vector3(),
  distance: null,
}

const _overlapHit = {
  actor: null,
}

const overlapHitPool = []
const overlapHits = []

/**
 * Physics System
 *
 * - Runs on both the server and client.
 * - Allows inserting colliders etc into the world.
 * - Simulates physics and handles fixed timestep interpolation.
 *
 */
export class Physics extends System {
  constructor(world) {
    super(world)
    this.scene = null
    this.portalCollisions = new PortalCollisions(world)
    this.probeTick = 0
    this.lastProbeTick = -1
    this.needsProbe = false
  }

  async init() {
    const info = await loadPhysX()
    this.version = info.version
    this.allocator = info.allocator
    this.errorCb = info.errorCb
    this.foundation = info.foundation

    this.tolerances = new PHYSX.PxTolerancesScale()
    this.cookingParams = new PHYSX.PxCookingParams(this.tolerances)
    this.physics = PHYSX.CreatePhysics(this.version, this.foundation, this.tolerances)
    this.defaultMaterial = this.physics.createMaterial(0.2, 0.2, 0.2)

    this.contactCallbacks = []
    this.triggerCallbacks = []
    this.pendingCallbacks = []
    this.callbackFailures = []
    this.overflowTraps = 0
    this.callbackWarnings = new WeakMap()
    this.registrations = new WeakMap()

    const contactPoints = new PHYSX.PxArray_PxContactPairPoint(64)
    const simulationEventCallback = new PHYSX.PxSimulationEventCallbackImpl()
    simulationEventCallback.onContact = this.containCallback('onContact', (pairHeader, pairs, count) => {
      pairHeader = PHYSX.wrapPointer(pairHeader, PHYSX.PxContactPairHeader)
      const handle0 = this.handles.get(pairHeader.get_actors(0)?.ptr)
      const handle1 = this.handles.get(pairHeader.get_actors(1)?.ptr)
      if (!handle0 || !handle1) return
      for (let i = 0; i < count; i++) {
        const pair = PHYSX.NativeArrayHelpers.prototype.getContactPairAt(pairs, i)
        const start = pair.events.isSet(PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND)
        if (!start && !pair.events.isSet(PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST)) continue
        // Only primitive contact data is retained across the native callback boundary.
        const contacts = []
        if (start) {
          const count = pair.extractContacts(contactPoints.begin(), 64)
          for (let j = 0; j < count; j++) {
            const contact = contactPoints.get(j)
            contacts.push({
              position: copyPoint(contact.position),
              normal: copyPoint(contact.normal),
              impulse: copyPoint(contact.impulse),
            })
          }
        }
        const recipients = []
        const method = start ? 'onContactStart' : 'onContactEnd'
        if (handle0.contactedHandles.has(handle1) !== start) {
          recipients.push(this.snapshotRecipient(handle0, handle1, method))
        }
        if (handle1.contactedHandles.has(handle0) !== start) {
          recipients.push(this.snapshotRecipient(handle1, handle0, method))
        }
        if (start) {
          handle0.contactedHandles.add(handle1)
          handle1.contactedHandles.add(handle0)
        } else {
          handle0.contactedHandles.delete(handle1)
          handle1.contactedHandles.delete(handle0)
        }
        this.contactCallbacks.push({ contacts, recipients })
      }
    })
    simulationEventCallback.onTrigger = this.containCallback('onTrigger', (pairs, count) => {
      pairs = PHYSX.wrapPointer(pairs, PHYSX.PxTriggerPair)
      for (let i = 0; i < count; i++) {
        const pair = PHYSX.NativeArrayHelpers.prototype.getTriggerPairAt(pairs, i)
        // Removed shapes are handled by the synthetic queue, including rebuilt actors.
        if (
          pair.flags.isSet(PHYSX.PxTriggerPairFlagEnum.eREMOVED_SHAPE_TRIGGER) ||
          pair.flags.isSet(PHYSX.PxTriggerPairFlagEnum.eREMOVED_SHAPE_OTHER)
        ) {
          continue
        }
        const triggerHandle = this.handles.get(pair.triggerShape.getActor().ptr)
        const otherHandle = this.handles.get(pair.otherShape.getActor().ptr)
        if (!triggerHandle || !otherHandle) continue
        const start = pair.status === PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND
        if (!start && pair.status !== PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_LOST) continue
        if (otherHandle.triggeredHandles.has(triggerHandle) === start) continue
        const method = start ? 'onTriggerEnter' : 'onTriggerLeave'
        const recipient = this.snapshotRecipient(triggerHandle, otherHandle, method)
        if (start) {
          otherHandle.triggeredHandles.add(triggerHandle)
          triggerHandle.triggeringHandles.add(otherHandle)
        } else {
          otherHandle.triggeredHandles.delete(triggerHandle)
          triggerHandle.triggeringHandles.delete(otherHandle)
        }
        this.triggerCallbacks.push({ recipients: [recipient] })
      }
    })
    simulationEventCallback.onConstraintBreak = this.containCallback('onConstraintBreak', () => {})
    simulationEventCallback.onWake = () => {}
    simulationEventCallback.onSleep = () => {}

    const sceneDesc = new PHYSX.PxSceneDesc(this.tolerances)
    sceneDesc.gravity = new PHYSX.PxVec3(0, -9.81, 0)
    sceneDesc.cpuDispatcher = PHYSX.DefaultCpuDispatcherCreate(0)
    sceneDesc.filterShader = PHYSX.DefaultFilterShader()
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_CCD, true)
    sceneDesc.flags.raise(PHYSX.PxSceneFlagEnum.eENABLE_ACTIVE_ACTORS, true)
    sceneDesc.solverType = PHYSX.PxSolverTypeEnum.eTGS // recommened, default is PGS still
    sceneDesc.simulationEventCallback = simulationEventCallback
    sceneDesc.broadPhaseType = PHYSX.PxBroadPhaseTypeEnum.eGPU
    this.scene = this.physics.createScene(sceneDesc)

    this.handles = new Map()
    this.active = new Set()

    this.materials = new Map()

    this.raycastResult = new PHYSX.PxRaycastResult()
    this.sweepPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.sweepResult = new PHYSX.PxSweepResult()
    this.overlapPose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    this.overlapResult = new PHYSX.PxOverlapResult()
    this.overlapSphereGeometry = new PHYSX.PxSphereGeometry(1)
    this.queryFilterData = new PHYSX.PxQueryFilterData()

    this._pv1 = new PHYSX.PxVec3()
    this._pv2 = new PHYSX.PxVec3()
    this.transform = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)

    this.setupControllerManager()
    this.createProbeScene()
  }

  createProbeScene() {
    const desc = new PHYSX.PxSceneDesc(this.tolerances)
    const gravity = new PHYSX.PxVec3(0, -9.81, 0)
    desc.gravity = gravity
    desc.cpuDispatcher = PHYSX.DefaultCpuDispatcherCreate(0)
    desc.filterShader = PHYSX.DefaultFilterShader()
    this.probeScene = this.physics.createScene(desc)
    PHYSX.destroy(desc)
    PHYSX.destroy(gravity)
    const pose = new PHYSX.PxTransform(PHYSX.PxIDENTITYEnum.PxIdentity)
    const flags = new PHYSX.PxShapeFlags(PHYSX.PxShapeFlagEnum.eSIMULATION_SHAPE)
    for (const dynamic of [false, true]) {
      pose.p.y = dynamic ? 2 : 0
      const geometry = dynamic ? new PHYSX.PxSphereGeometry(0.25) : new PHYSX.PxBoxGeometry(1, 0.25, 1)
      const actor = dynamic ? this.physics.createRigidDynamic(pose) : this.physics.createRigidStatic(pose)
      const shape = this.physics.createShape(geometry, this.defaultMaterial, true, flags)
      actor.attachShape(shape)
      this.probeScene.addActor(actor)
      shape.release()
      PHYSX.destroy(geometry)
    }
    PHYSX.destroy(flags)
    PHYSX.destroy(pose)
  }

  probe() {
    try {
      this.probeScene.simulate(1 / 60)
      if (!this.probeScene.fetchResults(true)) return false
      const vector = new PHYSX.PxVec3()
      PHYSX.destroy(vector)
      return true
    } catch {
      return false
    }
  }

  checkHealth() {
    if (this.world.fatalError || (!this.needsProbe && getPhysicsTrapCount() < 64)) return
    if (this.lastProbeTick === this.probeTick) return
    this.lastProbeTick = this.probeTick
    this.needsProbe = false
    if (!this.probe()) this.world.fatal('physics unusable')
  }

  preTick() {
    this.probeTick++
    this.checkHealth()
  }

  postTick() {
    this.checkHealth()
  }

  setupControllerManager() {
    this.controllerManager = PHYSX.PxTopLevelFunctions.prototype.CreateControllerManager(this.scene) // prettier-ignore
    this.controllerFilters = new PHYSX.PxControllerFilters()
    this.controllerFilters.mFilterData = new PHYSX.PxFilterData(Layers.player.group, Layers.player.mask, 0, 0) // prettier-ignore
    const filterCallback = new PHYSX.PxQueryFilterCallbackImpl()
    filterCallback.simplePreFilter = this.containCallback(
      'simplePreFilter',
      (filterDataPtr, shapePtr) => {
        const filterData = PHYSX.wrapPointer(filterDataPtr, PHYSX.PxFilterData)
        const shape = PHYSX.wrapPointer(shapePtr, PHYSX.PxShape)
        const shapeFilterData = shape.getQueryFilterData()
        if (filterData.word0 & shapeFilterData.word1 && shapeFilterData.word0 & filterData.word1) {
          return PHYSX.PxQueryHitType.eBLOCK
        }
        return PHYSX.PxQueryHitType.eNONE
      },
      PHYSX.PxQueryHitType.eNONE
    )
    filterCallback.simplePostFilter = () => PHYSX.PxQueryHitType.eNONE
    this.controllerFilters.mFilterCallback = filterCallback
    const cctFilterCallback = new PHYSX.PxControllerFilterCallbackImpl()
    cctFilterCallback.filter = this.containCallback('filter', () => true, true)
    this.controllerFilters.mCCTFilterCallback = cctFilterCallback
  }

  destroy() {
    this.portalCollisions.destroy()
  }

  start() {
    // ...
  }

  addActor(actor, handle) {
    handle.actor = actor
    handle.contactedHandles = new Set()
    handle.triggeredHandles = new Set()
    handle.triggeringHandles = new Set()
    const registration = { handle, ptr: actor.ptr, destroyed: false }
    if (handle.onInterpolate) {
      handle.interpolation = {
        prev: {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        },
        next: {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        },
        curr: {
          position: new THREE.Vector3(),
          quaternion: new THREE.Quaternion(),
        },
      }
      const pose = actor.getGlobalPose()
      pxToVec3(handle.interpolation.prev.position, pose.p)
      pxToQuat(handle.interpolation.prev.quaternion, pose.q)
      pxToVec3(handle.interpolation.next.position, pose.p)
      pxToQuat(handle.interpolation.next.quaternion, pose.q)
      pxToVec3(handle.interpolation.curr.position, pose.p)
      pxToQuat(handle.interpolation.curr.quaternion, pose.q)
    }
    // added to the scene before the handle is published, so a throw here leaves no stale handle behind
    if (!handle.controller) {
      this.scene.addActor(actor)
    }
    this.registrations.set(handle, registration)
    this.handles.set(actor.ptr, handle)
    return {
      move: matrix => {
        if (this.ignoreSetGlobalPose) {
          return
        }
        if (!matrixToPxTransform(matrix, this.transform)) return
        // an actor outside the physics range corrupts the bodies it is jointed to or touches
        if (!positionOk(this.transform.p)) {
          warnOnce('[physics] ignored a move outside the physics range')
          return
        }
        // const isKinematic = actor.getRigidBodyFlags?.().isSet(PHYSX.PxRigidBodyFlagEnum.eKINEMATIC)
        // if (isKinematic) {
        //   actor.setKinematicTarget(this.transform)
        // } else {
        //   actor.setGlobalPose(this.transform)
        // }
        actor.setGlobalPose(this.transform)
      },
      snap: pose => {
        actor.setGlobalPose(pose)
        pxToVec3(handle.interpolation.prev.position, pose.p)
        pxToQuat(handle.interpolation.prev.quaternion, pose.q)
        pxToVec3(handle.interpolation.next.position, pose.p)
        pxToQuat(handle.interpolation.next.quaternion, pose.q)
        pxToVec3(handle.interpolation.curr.position, pose.p)
        pxToQuat(handle.interpolation.curr.quaternion, pose.q)
        handle.interpolation.skip = true
      },
      destroy: () => {
        if (registration.destroyed) return
        registration.destroyed = true
        this.handles.delete(registration.ptr)
        this.active.delete(handle)
        for (const otherHandle of handle.contactedHandles) {
          otherHandle.contactedHandles.delete(handle)
          this.pendingCallbacks.push({
            contacts: [],
            recipients: [this.snapshotRecipient(otherHandle, handle, 'onContactEnd')],
          })
        }
        handle.contactedHandles.clear()
        for (const triggerHandle of handle.triggeredHandles) {
          triggerHandle.triggeringHandles.delete(handle)
          this.pendingCallbacks.push({
            recipients: [this.snapshotRecipient(triggerHandle, handle, 'onTriggerLeave')],
          })
        }
        handle.triggeredHandles.clear()
        for (const otherHandle of handle.triggeringHandles) {
          otherHandle.triggeredHandles.delete(handle)
        }
        handle.triggeringHandles.clear()
        if (!handle.controller) {
          this.scene.removeActor(actor)
        }
      },
    }
  }

  containCallback(phase, callback, fallback) {
    return (...args) => {
      try {
        return callback(...args)
      } catch (err) {
        this.recordCallbackFailure(err, phase)
        return fallback
      }
    }
  }

  recordCallbackFailure(err, phase, entity) {
    const runtimeError = isPhysicsTrap(err)
    if (this.callbackFailures.length < 32) {
      this.callbackFailures.push({ phase, runtimeError, entity })
    } else if (runtimeError) {
      this.overflowTraps++
    }
  }

  drainCallbackFailures() {
    if (!this.callbackFailures.length && !this.overflowTraps) return
    const failures = this.callbackFailures
    this.callbackFailures = []
    if (this.overflowTraps) {
      failures.push({ phase: 'callback overflow', runtimeError: true, count: this.overflowTraps })
      this.overflowTraps = 0
    }
    this.handleContainedCallbackFailures(failures)
  }

  handleContainedCallbackFailures(failures) {
    for (const { phase, runtimeError, entity, count } of failures) {
      // Identity was classified inside the native callback; only metadata survives it.
      if (runtimeError) {
        handlePhysicsFailure(new WebAssembly.RuntimeError(), { entity, world: this.world, phase, count })
        continue
      }
      const subject = entity || this
      let warned = this.callbackWarnings.get(subject)
      if (!warned) this.callbackWarnings.set(subject, (warned = new Set()))
      const key = `${phase}:${runtimeError}`
      if (warned.has(key)) continue
      warned.add(key)
      console.error(`[physics] callback failed (phase ${phase}, native trap ${runtimeError})`)
    }
  }

  snapshotRecipient(handle, other, method) {
    const fn = handle[method]
    if (!fn) return null
    const entity = handle.node?.ctx?.entity
    return {
      registration: this.registrations.get(handle),
      entity,
      run: entity?.isApp ? entity.deadHook : null,
      fn,
      method,
      tag: other.tag,
      playerId: other.playerId,
      isLocalPlayer: other.playerId === this.world.network.id,
    }
  }

  dispatchCallbacks(callbacks) {
    for (const { recipients, contacts } of callbacks) {
      for (const recipient of recipients) {
        if (this.world.fatalError) return
        if (!recipient) continue
        const { registration, entity, run, fn, method, tag, playerId, isLocalPlayer } = recipient
        const { handle, ptr, destroyed } = registration
        if (destroyed || this.handles.get(ptr) !== handle || this.registrations.get(handle) !== registration) continue
        if (handle.node?.ctx?.entity !== entity) continue
        if (entity?.isApp && (entity.destroyed || entity.crashed || entity.deadHook !== run || run?.dead)) continue
        try {
          const event = contacts
            ? {
                tag,
                playerId,
                contacts: contacts.map(contact => ({
                  position: new THREE.Vector3(...contact.position),
                  normal: new THREE.Vector3(...contact.normal),
                  impulse: new THREE.Vector3(...contact.impulse),
                })),
              }
            : { tag, playerId, isLocalPlayer }
          Reflect.apply(fn, undefined, [event])
        } catch (err) {
          if (handlePhysicsFailure(err, { entity, world: this.world, phase: method })) continue
          const subject = run || registration
          let warned = this.callbackWarnings.get(subject)
          if (!warned) this.callbackWarnings.set(subject, (warned = new Set()))
          if (warned.has(method)) continue
          warned.add(method)
          console.error(
            `[physics] ${method} callback failed (entity ${entity?.data?.id ?? 'none'}): ${briefError(err)}`,
            err
          )
        }
      }
    }
    this.drainCallbackFailures()
  }

  processContactCallbacks() {
    if (!this.contactCallbacks.length) return
    const callbacks = this.contactCallbacks
    this.contactCallbacks = []
    this.dispatchCallbacks(callbacks)
  }

  processTriggerCallbacks() {
    if (!this.triggerCallbacks.length) return
    const callbacks = this.triggerCallbacks
    this.triggerCallbacks = []
    this.dispatchCallbacks(callbacks)
  }

  preFixedUpdate(willFixedUpdate) {
    if (willFixedUpdate) {
      // if physics will step, clear active actors so we can repopulate.
      this.active.clear()
    }
  }

  postFixedUpdate(delta) {
    if (this.world.fatalError) return
    const pending = this.pendingCallbacks
    this.pendingCallbacks = []
    this.dispatchCallbacks(pending)
    this.checkHealth()
    if (this.world.fatalError) return
    let phase = 'simulate'
    try {
      this.scene.simulate(delta)
      phase = 'fetchResults'
      this.scene.fetchResults(true)
      // the pushes made since the last step are consumed now, so the per-body push budget (RigidBody.spendPush)
      // starts over; callbacks dispatched before the next simulate share the next budget
      this.steps = (this.steps ?? 0) + 1
    } catch (err) {
      handlePhysicsFailure(err, { world: this.world, phase })
      this.world.fatal(`physics ${phase} interrupted`)
      return
    } finally {
      this.drainCallbackFailures()
    }
    this.checkHealth()
    if (this.world.fatalError) return
    this.processContactCallbacks()
    this.processTriggerCallbacks()
    this.checkHealth()
    if (this.world.fatalError) return
    const activeActors = PHYSX.SupportFunctions.prototype.PxScene_getActiveActors(this.scene)
    const size = activeActors.size()
    for (let i = 0; i < size; i++) {
      const actorPtr = activeActors.get(i).ptr
      const handle = this.handles.get(actorPtr)
      if (!handle) {
        // todo: addBot vrms do this
        // console.warn('active actor not found?', actorPtr)
        continue
      }
      const lerp = handle.interpolation
      if (!lerp) continue
      lerp.prev.position.copy(lerp.next.position)
      lerp.prev.quaternion.copy(lerp.next.quaternion)
      const pose = handle.actor.getGlobalPose()
      pxToVec3(lerp.next.position, pose.p)
      pxToQuat(lerp.next.quaternion, pose.q)
      this.active.add(handle)
    }
  }

  preUpdate(alpha) {
    if (this.world.fatalError) return
    this.world.stage.clean()
    let failed
    for (const handle of this.active) {
      const lerp = handle.interpolation
      if (lerp.skip) {
        lerp.skip = false
        continue
      }
      lerp.curr.position.lerpVectors(lerp.prev.position, lerp.next.position, alpha)
      lerp.curr.quaternion.slerpQuaternions(lerp.prev.quaternion, lerp.next.quaternion, alpha)
      try {
        handle.onInterpolate(lerp.curr.position, lerp.curr.quaternion)
      } catch (err) {
        if (!failed) failed = []
        failed.push({ handle, err })
      }
    }
    if (failed) this.containInterpolateFailures(failed)
    // finalize any physics updates immediately
    // but don't listen to any loopback commits from those actor moves
    this.ignoreSetGlobalPose = true
    this.world.stage.clean()
    this.ignoreSetGlobalPose = false
  }

  // an interpolation callback that throws (eg a script broke its own node's transform) must not stop the
  // other actors from updating: app-owned handles crash their app, anything else is logged once per handle
  containInterpolateFailures(failed) {
    const crashed = new Set()
    for (const { handle, err } of failed) {
      const owner = handle.node?.ctx?.entity
      const trapped = handlePhysicsFailure(err, { entity: owner, world: this.world, phase: 'Physics.preUpdate' })
      try {
        if (!handle._interpolateFailed) {
          handle._interpolateFailed = true
          console.error(
            `[physics] interpolation failed (node ${handle.node?.id ?? 'none'}, entity ${owner?.data?.id ?? 'none'})`
          )
          console.error(err)
        }
        if (owner?.isApp && !crashed.has(owner)) owner.scriptError = serializeError(err)
      } catch {
        // a hostile error object (eg throwing getters) must not stop the containment itself
      }
      if (owner?.isApp && !crashed.has(owner)) {
        crashed.add(owner)
        if (!trapped) owner.crash()
      }
    }
  }

  raycast(origin, direction, maxDistance = Infinity, layerMask) {
    if (!vec3ToPx(origin, this._pv1) || !vec3ToPx(direction, this._pv2)) return null
    // this.queryFilterData.flags |= PHYSX.PxQueryFlagEnum.ePREFILTER | PHYSX.PxQueryFlagEnum.ePOSTFILTER // prettier-ignore
    this.queryFilterData.data.word0 = layerMask // what to hit, eg Layers.player.group | Layers.environment.group
    this.queryFilterData.data.word1 = 0
    const didHit = this.scene.raycast(
      this._pv1,
      this._pv2,
      maxDistance,
      this.raycastResult,
      PHYSX.PxHitFlagEnum.eNORMAL,
      this.queryFilterData
    )
    if (didHit) {
      const numHits = this.raycastResult.getNbAnyHits()
      let hit
      for (let n = 0; n < numHits; n++) {
        const nHit = this.raycastResult.getAnyHit(n)
        if (!hit || hit.distance > nHit.distance) {
          hit = nHit
        }
      }
      _raycastHit.handle = this.handles.get(hit.actor.ptr)
      pxToVec3(_raycastHit.point, hit.position)
      pxToVec3(_raycastHit.normal, hit.normal)
      _raycastHit.distance = hit.distance
      return _raycastHit
    }
    // TODO: this.raycastResult.destroy() on this.destroy()
  }

  sweep(geometry, origin, direction, maxDistance, layerMask, rotation) {
    if (!vec3ToPx(origin, this.sweepPose.p) || !vec3ToPx(direction, this._pv2)) return null
    const q = this.sweepPose.q
    q.x = rotation?.x || 0
    q.y = rotation?.y || 0
    q.z = rotation?.z || 0
    q.w = rotation?.w ?? 1
    direction = this._pv2
    this.queryFilterData.data.word0 = layerMask
    this.queryFilterData.data.word1 = 0
    const didHit = this.scene.sweep(
      geometry,
      this.sweepPose,
      this._pv2,
      maxDistance,
      this.sweepResult,
      PHYSX.PxHitFlagEnum.eDEFAULT,
      this.queryFilterData
    )
    if (didHit) {
      const numHits = this.sweepResult.getNbAnyHits()
      let hit
      for (let n = 0; n < numHits; n++) {
        const nHit = this.sweepResult.getAnyHit(n)
        if (!hit || hit.distance > nHit.distance) {
          hit = nHit
        }
      }
      _sweepHit.actor = hit.actor
      pxToVec3(_sweepHit.point, hit.position)
      pxToVec3(_sweepHit.normal, hit.normal)
      _sweepHit.distance = hit.distance
      return _sweepHit
    }
    // TODO: this.sweepResult.destroy() on this.destroy()
  }

  // overlap(geometry, origin, layerMask) {
  //   if (!vec3ToPx(origin, this.overlapPose.p)) return []
  //   this.queryFilterData.data.word0 = layerMask
  //   this.queryFilterData.data.word1 = 0
  //   const didHit = this.scene.overlap(geometry, this.overlapPose, this.overlapResult, this.queryFilterData)
  //   if (didHit) {
  //     // const hit = this.overlapResult.getAnyHit(0)
  //     _overlapHit.actor = hit.actor
  //     return _overlapHit
  //   }
  //   // TODO: this.overlapResult.destroy() on this.destroy()
  // }

  overlapSphere(radius, origin, layerMask) {
    if (!vec3ToPx(origin, this.overlapPose.p)) return []
    const geometry = this.overlapSphereGeometry
    geometry.set_radius(Math.fround(radius))
    this.queryFilterData.data.word0 = layerMask // what to hit, eg Layers.player.group | Layers.environment.group
    this.queryFilterData.data.word1 = 0
    const didHit = this.scene.overlap(geometry, this.overlapPose, this.overlapResult, this.queryFilterData)
    if (!didHit) return []
    overlapHits.length = 0
    const numHits = this.overlapResult.getNbAnyHits()
    for (let n = 0; n < numHits; n++) {
      const nHit = this.overlapResult.getAnyHit(n)
      const hit = getOrCreateOverlapHit(n)
      hit.actor = nHit.actor
      hit.handle = this.handles.get(nHit.actor.ptr)
      overlapHits.push(hit)
    }
    return overlapHits
  }

  getMaterial(staticFriction, dynamicFriction, restitution) {
    const id = `${staticFriction}|${dynamicFriction}|${restitution}`
    const cached = this.materials.get(id)
    if (cached) return cached
    // Shapes retain these materials, so never evict or change an existing entry.
    if (this.materials.size >= 4096) {
      warnOnce('physics-material-cap', '[physics] material cache full; using default material')
      return this.defaultMaterial
    }
    const material = this.physics.createMaterial(staticFriction, dynamicFriction, restitution)
    if (!material?.ptr) {
      warnOnce('physics-material-null', '[physics] failed to create material; using default material')
      return this.defaultMaterial
    }
    this.materials.set(id, material)
    return material
  }
}

function copyPoint(point) {
  return [point.x, point.y, point.z]
}

function getOrCreateOverlapHit(idx) {
  let hit = overlapHitPool[idx]
  if (!hit) {
    hit = {
      actor: null,
      handle: null,
      proxy: {
        get tag() {
          return hit.handle?.tag || null
        },
        get playerId() {
          return hit.handle?.playerId || null
        },
      },
    }
    overlapHitPool.push(hit)
  }
  return hit
}
