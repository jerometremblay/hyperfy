import { System } from './System'

import * as THREE from '../extras/three'
import { DEG2RAD, RAD2DEG } from '../extras/general'
import { clamp, num, uuid } from '../utils'
import { LerpVector3 } from '../extras/LerpVector3'
import { LerpQuaternion } from '../extras/LerpQuaternion'
import { Curve } from '../extras/Curve'
import { prng } from '../extras/prng'
import { BufferedLerpVector3 } from '../extras/BufferedLerpVector3'
import { BufferedLerpQuaternion } from '../extras/BufferedLerpQuaternion'
import { createScriptCompartment, wrapRawCode } from '../extras/scriptCompartment'
import { hardenForScripts, hardenScriptClasses } from '../extras/scriptHardening'
import { createScriptObjectURL } from '../extras/scriptBlob'
import { createScriptConsole, hostInspect } from '../extras/scriptConsole'

/**
 * Script System
 *
 * - Runs on both the server and client.
 * - Executes scripts inside secure compartments
 * - One compartment per script asset, with locked endowments
 *
 */

export class Scripts extends System {
  constructor(world) {
    super(world)
    hardenScriptClasses()
    // shared host functions are frozen once, so no script can stash data on them
    this.helpers = hardenForScripts({ num, prng, clamp, uuid })
    // on Node, script console arguments are rendered to strings before they reach the host console
    this.inspect = hostInspect()
  }

  // fresh wrapper objects per compartment: no object is shared between two scripts
  createEndowments() {
    return {
      console: hardenForScripts(createScriptConsole({ inspect: this.inspect })),
      Date: hardenForScripts({
        now: () => Date.now(),
      }),
      URL: hardenForScripts({
        createObjectURL: blob => createScriptObjectURL(blob),
      }),
      Math,
      eval: undefined,
      harden: undefined,
      lockdown: undefined,
      num: this.helpers.num,
      prng: this.helpers.prng,
      clamp: this.helpers.clamp,
      // Layers,
      Object3D: THREE.Object3D,
      Quaternion: THREE.Quaternion,
      Vector3: THREE.Vector3,
      Euler: THREE.Euler,
      Matrix4: THREE.Matrix4,
      LerpVector3, // deprecated - use BufferedLerpVector3
      LerpQuaternion, // deprecated - use BufferedLerpQuaternion
      BufferedLerpVector3,
      BufferedLerpQuaternion,
      // Material: Material,
      Curve,
      // Gradient: Gradient,
      DEG2RAD,
      RAD2DEG,
      uuid: this.helpers.uuid,
      // pause: () => this.world.pause(),
    }
  }

  evaluate(code) {
    const compartment = createScriptCompartment(this.createEndowments())
    let value
    const result = {
      exec: (...args) => {
        if (!value) value = compartment.evaluate(wrapRawCode(code))
        return value(...args)
      },
      code,
    }
    return result
  }
}
