import * as THREE from '../extras/three'

import { System } from './System'

import { CSM } from '../libs/csm/CSM'
import { isNumber, isString } from 'lodash-es'
import { Sky as SolarSky } from 'three/addons/objects/Sky.js'
import { getDayNightState, getWorldTime } from '../extras/dayNight'
import { createMoon } from '../extras/createMoon'

const sunsetColor = new THREE.Color('#ffb16b')
const moonDistance = 900

const csmLevels = {
  none: {
    cascades: 1,
    shadowMapSize: 1024,
    castShadow: false,
    lightIntensity: 3,
    // shadowBias: 0.000002,
    // shadowNormalBias: 0.001,
  },
  low: {
    cascades: 1,
    shadowMapSize: 2048,
    castShadow: true,
    lightIntensity: 3,
    shadowBias: 0.0000009,
    shadowNormalBias: 0.001,
  },
  med: {
    cascades: 3,
    shadowMapSize: 1024,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.000002,
    shadowNormalBias: 0.002,
  },
  high: {
    cascades: 3,
    shadowMapSize: 2048,
    castShadow: true,
    lightIntensity: 1,
    shadowBias: 0.000003,
    shadowNormalBias: 0.002,
  },
}

// fix fog distance calc
// see: https://github.com/mrdoob/three.js/issues/14601
// future: https://www.youtube.com/watch?v=k1zGz55EqfU
THREE.ShaderChunk.fog_vertex = `
#ifdef USE_FOG

  // original
  // vFogDepth = - mvPosition.z;

  // radial distance
  vFogDepth = length( mvPosition );

  // cylindrical (ignore altitude)
  // vFogDepth = length( mvPosition.xz );

  // height-based (eg ground fog)
  // vFogDepth = abs( mvPosition.y );

#endif
`

/**
 * Environment System
 *
 * - Runs on the client
 * - Sets up the sky, hdr, sun, shadows, fog etc
 *
 */
export class ClientEnvironment extends System {
  constructor(world) {
    super(world)

    this.model = null
    this.skys = []
    this.sky = null
    this.skyN = 0
    this.bgUrl = null
    this.hdrUrl = null
    this.solarSky = null
    this.solarDirection = new THREE.Vector3()
    this.solarUpdatedAt = -Infinity
    this.moon = null
    this.moonDirection = new THREE.Vector3()
    this.moonLight = null
  }

  init({ baseEnvironment }) {
    this.base = baseEnvironment
  }

  async start() {
    this.buildCSM()
    this.updateSky()

    this.world.prefs.on('change', this.onPrefsChange)
    this.world.settings.on('change', this.onSettingsChange)
    this.world.graphics.on('resize', this.onViewportResize)
  }

  addSky(node) {
    const handle = {
      node,
      destroy: () => {
        const idx = this.skys.indexOf(handle)
        if (idx === -1) return
        this.skys.splice(idx, 1)
        this.updateSky()
      },
    }
    this.skys.push(handle)
    this.updateSky()
    return handle
  }

  getSky() {
    // ...
  }

  async updateSky() {
    if (!this.sky) {
      const geometry = new THREE.SphereGeometry(1000, 60, 40)
      const material = new THREE.MeshBasicMaterial({ side: THREE.BackSide })
      this.sky = new THREE.Mesh(geometry, material)
      this.sky.geometry.computeBoundsTree()
      this.sky.material.fog = false
      this.sky.material.toneMapped = false
      this.sky.material.needsUpdate = true
      this.sky.matrixAutoUpdate = false
      this.sky.matrixWorldAutoUpdate = false
      this.sky.visible = false
      this.world.stage.scene.add(this.sky)

      this.solarSky = new SolarSky()
      this.solarSky.scale.setScalar(1000)
      this.solarSky.material.uniforms.rayleigh.value = 2
      this.solarSky.material.uniforms.cloudCoverage.value = 0
      // The physical sky radiance overwhelms the world's bloom at normal exposure.
      // Scale only the sky, keeping sunlight and other emissive objects unchanged.
      this.solarSky.material.uniforms.showSunDisc.value = 0.001
      this.solarSky.material.uniforms.daylight = { value: 0 }
      this.solarSky.material.fragmentShader = 'uniform float daylight;\n' + this.solarSky.material.fragmentShader
      this.solarSky.material.fragmentShader = this.solarSky.material.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        'gl_FragColor.rgb = mix(gl_FragColor.rgb * 0.05, vec3(0.18, 0.6, 1.2), daylight * 0.8);\n#include <tonemapping_fragment>'
      )
      this.solarSky.visible = false
      this.solarSky.frustumCulled = false
      this.world.stage.scene.add(this.solarSky)

      this.moon = createMoon()
      this.world.stage.scene.add(this.moon)
      this.moonLight = new THREE.DirectionalLight('#b9caff', 0)
      this.world.stage.scene.add(this.moonLight, this.moonLight.target)
    }

    const base = this.base
    const node = this.skys[this.skys.length - 1]?.node
    const bgUrl = node?._bg || base.bg
    const hdrUrl = node?._hdr || base.hdr
    const rotationY = isNumber(node?._rotationY) ? node._rotationY : base.rotationY
    const sunDirection = node?._sunDirection || base.sunDirection
    const sunIntensity = isNumber(node?._sunIntensity) ? node._sunIntensity : base.sunIntensity
    const sunColor = isString(node?._sunColor) ? node._sunColor : base.sunColor
    const fogNear = isNumber(node?._fogNear) ? node._fogNear : base.fogNear
    const fogFar = isNumber(node?._fogFar) ? node._fogFar : base.fogFar
    const fogColor = isString(node?._fogColor) ? node._fogColor : base.fogColor

    const n = ++this.skyN
    let bgTexture
    if (bgUrl) bgTexture = await this.world.loader.load('texture', bgUrl)
    let hdrTexture
    if (hdrUrl) hdrTexture = await this.world.loader.load('hdr', hdrUrl)
    if (n !== this.skyN) return

    if (bgTexture) {
      // bgTexture = bgTexture.clone()
      bgTexture.minFilter = bgTexture.magFilter = THREE.LinearFilter
      bgTexture.mapping = THREE.EquirectangularReflectionMapping
      // bgTexture.encoding = Encoding[this.encoding]
      bgTexture.colorSpace = THREE.SRGBColorSpace
      this.sky.material.map = bgTexture
      this.sky.visible = true
    } else {
      this.sky.visible = false
    }

    if (hdrTexture) {
      // hdrTexture.colorSpace = THREE.NoColorSpace
      // hdrTexture.colorSpace = THREE.SRGBColorSpace
      // hdrTexture.colorSpace = THREE.LinearSRGBColorSpace
      hdrTexture.mapping = THREE.EquirectangularReflectionMapping
      this.world.stage.scene.environment = hdrTexture
    }

    this.world.stage.scene.environmentRotation.y = rotationY
    this.sky.rotation.y = rotationY
    this.sky.matrixWorld.compose(this.sky.position, this.sky.quaternion, this.sky.scale)

    this.csm.lightDirection = sunDirection

    for (const light of this.csm.lights) {
      light.intensity = sunIntensity
      light.color.set(sunColor)
    }

    if (isNumber(fogNear) && isNumber(fogFar) && fogColor) {
      const color = new THREE.Color(fogColor)
      this.world.stage.scene.fog = new THREE.Fog(color, fogNear, fogFar)
    } else {
      this.world.stage.scene.fog = null
    }

    this.skyInfo = {
      bgUrl,
      hdrUrl,
      rotationY,
      sunDirection,
      sunIntensity,
      sunColor,
      fogNear,
      fogFar,
      fogColor,
    }
    this.updateDayNight()
  }

  update(delta) {
    const now = Date.now()
    // Use wall time rather than accumulated frame deltas, including after a tab resumes.
    const transition = this.world.settings.timeTransition
    const transitioning = transition && this.solarUpdatedAt < transition.endsAt
    if (this.world.settings.dayNightCycle && (transitioning || Math.abs(now - this.solarUpdatedAt) >= 1000)) {
      this.updateDayNight(now)
    }
    this.csm.update()
  }

  updateDayNight(now = Date.now()) {
    if (!this.skyInfo) return
    const scene = this.world.stage.scene
    const { dayNightCycle, latitude, longitude } = this.world.settings
    this.solarSky.visible = dayNightCycle
    this.sky.visible = !dayNightCycle && !!this.skyInfo.bgUrl
    if (!dayNightCycle) {
      this.moon.visible = false
      this.moonLight.intensity = 0
      scene.environmentIntensity = 1
      this.csm.lightDirection = this.skyInfo.sunDirection
      for (const light of this.csm.lights) {
        light.intensity = this.skyInfo.sunIntensity
        light.color.set(this.skyInfo.sunColor)
      }
      return
    }

    const state = getDayNightState(new Date(getWorldTime(this.world.settings, now)), latitude, longitude)
    this.solarUpdatedAt = now
    this.solarDirection.fromArray(state.sunPosition)
    this.solarSky.material.uniforms.sunPosition.value.copy(this.solarDirection).multiplyScalar(450000)
    this.solarSky.material.uniforms.daylight.value = state.skyDaylight
    this.csm.lightDirection = this.solarDirection.clone().negate()
    for (const light of this.csm.lights) {
      light.intensity = this.skyInfo.sunIntensity * state.sunIntensity
      light.color.set(this.skyInfo.sunColor).lerp(sunsetColor, state.warmth)
    }
    scene.environmentIntensity = state.environmentIntensity
    this.moonDirection.fromArray(state.moon.position)
    this.moon.visible = state.moon.altitude > 0
    this.moon.scale.setScalar(moonDistance * Math.tan(state.moon.angularRadius))
    this.moon.material.uniforms.lightDirection.value.fromArray(state.moon.lightDirection)
    this.moon.material.uniforms.opacity.value = state.moon.opacity
    this.moonLight.intensity = state.moon.lightIntensity
  }

  lateUpdate(delta) {
    this.sky.position.x = this.world.rig.position.x
    this.sky.position.z = this.world.rig.position.z
    this.sky.matrixWorld.setPosition(this.sky.position)
    this.solarSky.position.copy(this.world.rig.position)
    this.moon.position.copy(this.moonDirection).multiplyScalar(moonDistance).add(this.world.rig.position)
    this.moon.lookAt(this.world.rig.position)
    this.moonLight.position.copy(this.moon.position)
    this.moonLight.target.position.copy(this.world.rig.position)
    // this.sky.matrixWorld.copyPosition(this.world.rig.matrixWorld)
  }

  buildCSM() {
    const options = csmLevels[this.world.prefs.shadows]
    if (this.csm) {
      this.csm.updateCascades(options.cascades)
      this.csm.updateShadowMapSize(options.shadowMapSize)
      this.csm.lightDirection = this.skyInfo.sunDirection
      for (const light of this.csm.lights) {
        light.intensity = this.skyInfo.sunIntensity
        light.color.set(this.skyInfo.sunColor)
        light.castShadow = options.castShadow
      }
    } else {
      const scene = this.world.stage.scene
      const camera = this.world.camera
      this.csm = new CSM({
        mode: 'practical', // uniform, logarithmic, practical, custom
        // mode: 'custom',
        // customSplitsCallback: function (cascadeCount, nearDistance, farDistance) {
        //   return [0.05, 0.2, 0.5]
        // },
        cascades: 3,
        maxCascades: 3,
        shadowMapSize: 2048,
        maxFar: 100,
        lightIntensity: 1,
        lightDirection: new THREE.Vector3(0, -1, 0).normalize(),
        fade: true,
        parent: scene,
        camera: camera,
        // note: you can play with bias in console like this:
        // var csm = world.graphics.csm
        // csm.shadowBias = 0.00001
        // csm.shadowNormalBias = 0.002
        // csm.updateFrustums()
        // shadowBias: 0.00001,
        // shadowNormalBias: 0.002,
        // lightNear: 0.0000001,
        // lightFar: 5000,
        // lightMargin: 200,
        // noLastCascadeCutOff: true,
        ...options,
        // note: you can test changes in console and then call csm.updateFrustrums() to debug
      })
      if (!options.castShadow) {
        for (const light of this.csm.lights) {
          light.castShadow = false
        }
      }
    }
    this.updateDayNight()
  }

  onPrefsChange = changes => {
    if (changes.shadows) {
      this.buildCSM()
      this.updateSky()
    }
  }

  onViewportResize = () => {
    this.csm.updateFrustums()
  }

  onSettingsChange = changes => {
    if (
      changes.dayNightCycle ||
      changes.latitude ||
      changes.longitude ||
      changes.timeOffset ||
      changes.timeTransition
    ) {
      this.updateDayNight()
    }
  }

  destroy() {
    this.world.prefs.off('change', this.onPrefsChange)
    this.world.settings.off('change', this.onSettingsChange)
    this.world.graphics.off('resize', this.onViewportResize)
    for (const sky of [this.sky, this.solarSky, this.moon]) {
      if (!sky) continue
      sky.removeFromParent()
      sky.geometry.dispose()
      sky.material.dispose()
    }
    this.csm?.dispose()
    this.moonLight?.removeFromParent()
    this.moonLight?.target.removeFromParent()
    this.moonLight?.dispose()
  }
}
