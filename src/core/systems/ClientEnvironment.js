import * as THREE from '../extras/three'

import { System } from './System'

import { CSM } from '../libs/csm/CSM'
import { isNumber, isString } from 'lodash-es'
import { Sky as SolarSky } from 'three/addons/objects/Sky.js'
import { DEFAULT_BORTLE_CLASS, getDayNightState, getWorldTime } from '../extras/dayNight'
import { createMoon } from '../extras/createMoon'
import { createCelestialMarker, updateCelestialMarker } from '../extras/createCelestialMarker'
import { createStarField, loadStarCatalog } from '../extras/createStarField'
import { setCelestialRotation } from '../extras/celestialRotation'
import { getPlanetStates } from '../extras/planetPositions'
import { createPlanets, updatePlanets } from '../extras/createPlanets'
import { twilightSkyShader } from '../extras/twilightSky'
import {
  celestialVisibilityShader,
  getConstellationLineOpacity,
  getNightProgress,
} from '../extras/celestialVisibility'

const sunsetColor = new THREE.Color('#ffb16b')
const moonDistance = 900
const obliquity = THREE.MathUtils.degToRad(23.439281)
const eclipticPoleEquatorial = new THREE.Vector3(0, Math.cos(obliquity), Math.sin(obliquity))

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
    this.diffuseSkyPlaceholder = null
    this.solarDirection = new THREE.Vector3()
    this.celestialRotation = new THREE.Matrix3()
    this.eclipticPole = new THREE.Vector3()
    this.solarUpdatedAt = -Infinity
    this.renderExposure = 1
    this.moon = null
    this.moonMarker = null
    this.moonDirection = new THREE.Vector3()
    this.celestialVisibility = {
      sunDirection: { value: new THREE.Vector3(0, -1, 0) },
      moonDirection: { value: new THREE.Vector3(0, -1, 0) },
      moonFraction: { value: 0 },
      bortleClass: { value: DEFAULT_BORTLE_CLASS },
    }
    this.moonLight = null
    this.planets = null
    this.stars = null
    this.constellationLines = null
    this.starsLoading = null
    this.destroyed = false
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
      this.solarSky.material.uniforms.sunAltitude = { value: 0 }
      this.diffuseSkyPlaceholder = new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1)
      this.diffuseSkyPlaceholder.needsUpdate = true
      Object.assign(this.solarSky.material.uniforms, {
        diffuseSkyMap: { value: this.diffuseSkyPlaceholder },
        worldToCelestial: { value: new THREE.Matrix3() },
        diffuseSkyAppearance: { value: 0.3 },
        diffuseSkyBortleClass: { value: DEFAULT_BORTLE_CLASS },
        diffuseMoonDirection: this.celestialVisibility.moonDirection,
        diffuseMoonFraction: this.celestialVisibility.moonFraction,
      })
      this.solarSky.material.fragmentShader =
        `uniform float sunAltitude;
         uniform sampler2D diffuseSkyMap;
         uniform mat3 worldToCelestial;
         uniform float diffuseSkyAppearance;
         uniform float diffuseSkyBortleClass;
         uniform vec3 diffuseMoonDirection;
         uniform float diffuseMoonFraction;
         ` +
        celestialVisibilityShader +
        twilightSkyShader +
        this.solarSky.material.fragmentShader
      this.solarSky.material.fragmentShader = this.solarSky.material.fragmentShader.replace(
        '#include <tonemapping_fragment>',
        `
          float daylight = smoothstep(-1.5, 6.0, sunAltitude);
          vec3 nightSky = vec3(0.0015, 0.002, 0.006);
          vec3 scatteringSky = max(gl_FragColor.rgb, vec3(0.0)) * 0.05;
          vec3 twilightSky = getTwilightSky(direction, vSunDirection, sunAltitude);
          vec3 daytimeSky = mix(scatteringSky, vec3(0.18, 0.6, 1.2), daylight * 0.8);
          gl_FragColor.rgb = mix(twilightSky, daytimeSky, daylight);

          vec3 equatorialDirection = normalize(worldToCelestial * direction);
          float rightAscension = atan(-equatorialDirection.z, equatorialDirection.x);
          vec2 diffuseSkyUv = vec2(
            fract(0.5 - rightAscension / (2.0 * pi)),
            0.5 + asin(clamp(equatorialDirection.y, -1.0, 1.0)) / pi
          );
          vec3 diffuseSky = texture2D(diffuseSkyMap, diffuseSkyUv).rgb;
          diffuseSky = max(diffuseSky - vec3(0.0008), vec3(0.0));
          float diffuseLuminance = dot(diffuseSky, vec3(0.2126, 0.7152, 0.0722));
          float diffuseSaturation = mix(0.08, 0.45, diffuseSkyAppearance);
          diffuseSky = mix(vec3(diffuseLuminance), diffuseSky, diffuseSaturation);

          float skyAltitude = getCelestialAltitude(direction);
          float moonAltitude = getCelestialAltitude(diffuseMoonDirection);
          float moonSeparation = acos(clamp(dot(direction, diffuseMoonDirection), -1.0, 1.0));
          float moonGlow = diffuseMoonFraction * smoothstep(-5.0, 15.0, moonAltitude)
            * (0.25 + 0.75 * exp(-pow(moonSeparation / 0.55, 2.0)));
          float horizonTransmission = smoothstep(0.0, 6.0, skyAltitude)
            * exp(-0.16 * getAtmosphericExtinction(skyAltitude));
          float skyLuminance = dot(max(gl_FragColor.rgb, vec3(0.0)), vec3(0.2126, 0.7152, 0.0722));
          float darkSkyLuminance = dot(nightSky, vec3(0.2126, 0.7152, 0.0722));
          float nightVisibility = getMilkyWayVisibility(skyLuminance, darkSkyLuminance);
          float bortleVisibility = getBortleDiffuseVisibility(diffuseSkyBortleClass);
          float moonVisibility = 1.0 - 0.78 * moonGlow;
          float appearanceGain = mix(0.55, 1.6, diffuseSkyAppearance);
          float diffuseVisibility = nightVisibility * horizonTransmission
            * bortleVisibility * moonVisibility;
          gl_FragColor.rgb += diffuseSky * (0.1 * appearanceGain * diffuseVisibility);

          #include <tonemapping_fragment>`
      )
      this.solarSky.visible = false
      this.solarSky.frustumCulled = false
      this.world.stage.scene.add(this.solarSky)

      const diffuseSkyUrl = this.world.isPreview ? new URL('/milkyway.jpg', window.location.href).href : '/milkyway.jpg'
      this.world.loader
        .load('texture', diffuseSkyUrl)
        .then(texture => {
          if (this.destroyed) return
          texture.colorSpace = THREE.LinearSRGBColorSpace
          this.solarSky.material.uniforms.diffuseSkyMap.value = texture
          this.diffuseSkyPlaceholder?.dispose()
          this.diffuseSkyPlaceholder = null
        })
        .catch(error => {
          if (!this.destroyed) console.warn('Unable to load diffuse night sky:', error)
        })

      this.moon = createMoon()
      const moonUniforms = this.moon.material.uniforms
      this.moonMarker = createCelestialMarker('Moon', {
        direction: moonUniforms.direction,
        right: moonUniforms.right,
        up: moonUniforms.up,
        opacity: { value: 0 },
      })
      this.world.stage.scene.add(this.moon, this.moonMarker)
      this.moonLight = new THREE.DirectionalLight('#b9caff', 0)
      this.world.stage.scene.add(this.moonLight, this.moonLight.target)
      this.planets = createPlanets(this.celestialVisibility)
      this.world.stage.scene.add(this.planets)
    }

    if (!this.stars && !this.starsLoading && !this.destroyed) {
      this.starsLoading = loadStarCatalog()
        .then(catalog => {
          if (this.destroyed) return
          this.stars = createStarField(catalog, this.celestialVisibility)
          this.constellationLines = this.stars.getObjectByName('constellations')
          this.world.stage.scene.add(this.stars)
          this.updateDayNight()
        })
        .catch(error => {
          if (!this.destroyed) console.warn('Unable to load night sky stars:', error)
        })
        .finally(() => {
          this.starsLoading = null
        })
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
    const now = this.world.network.getServerTime()
    // Use the synchronized server clock, including after a tab resumes.
    const transition = this.world.settings.timeTransition
    const transitioning = transition && this.solarUpdatedAt < transition.endsAt
    if (
      Number.isFinite(now) &&
      this.world.settings.dayNightCycle &&
      (transitioning || Math.abs(now - this.solarUpdatedAt) >= 1000)
    ) {
      this.updateDayNight(now)
    }
    this.csm.update()
  }

  updateDayNight(now = this.world.network.getServerTime()) {
    if (!this.skyInfo || !Number.isFinite(now)) return
    const scene = this.world.stage.scene
    const { dayNightCycle, latitude, longitude } = this.world.settings
    this.solarSky.visible = dayNightCycle
    this.sky.visible = !dayNightCycle && !!this.skyInfo.bgUrl
    if (this.constellationLines) this.constellationLines.visible = this.world.settings.constellationLines
    if (!dayNightCycle) {
      if (this.stars) this.stars.visible = false
      this.moon.visible = false
      this.moonMarker.visible = false
      this.planets.visible = false
      this.moonLight.intensity = 0
      scene.environmentIntensity = 1
      this.renderExposure = 1
      this.csm.lightDirection = this.skyInfo.sunDirection
      for (const light of this.csm.lights) {
        light.intensity = this.skyInfo.sunIntensity
        light.color.set(this.skyInfo.sunColor)
      }
      return
    }

    const date = new Date(getWorldTime(this.world.settings, now))
    const state = getDayNightState(date, latitude, longitude)
    const nightProgress = getNightProgress(state.altitude)
    setCelestialRotation(this.celestialRotation, date, latitude, longitude)
    const diffuseSkyUniforms = this.solarSky.material.uniforms
    diffuseSkyUniforms.worldToCelestial.value.copy(this.celestialRotation).transpose()
    diffuseSkyUniforms.diffuseSkyAppearance.value = this.world.settings.skyAppearance / 100
    diffuseSkyUniforms.diffuseSkyBortleClass.value = this.world.settings.bortleClass
    this.celestialVisibility.bortleClass.value = this.world.settings.bortleClass
    this.eclipticPole.copy(eclipticPoleEquatorial).applyMatrix3(this.celestialRotation).normalize()
    this.solarUpdatedAt = now
    this.renderExposure = state.renderExposure
    this.solarDirection.fromArray(state.sunPosition)
    this.moonDirection.fromArray(state.moon.position)
    this.celestialVisibility.sunDirection.value.copy(this.solarDirection)
    this.celestialVisibility.moonDirection.value.copy(this.moonDirection)
    this.celestialVisibility.moonFraction.value = state.moon.fraction
    updatePlanets(
      this.planets,
      getPlanetStates(date, latitude, longitude),
      this.celestialVisibility,
      this.world.settings.constellationLines,
      nightProgress,
      this.eclipticPole
    )
    if (this.stars) {
      this.stars.material.uniforms.celestialRotation.value.copy(this.celestialRotation)
      this.stars.material.uniforms.opacity.value = 1
      this.stars.material.uniforms.constellationOpacity.value = getConstellationLineOpacity(state.altitude)
      // Individual stars fade according to magnitude; skip the field once its
      // brightest catalog stars are below the solar glare limit.
      this.stars.visible = state.altitude < 1
      if (this.constellationLines) {
        this.constellationLines.visible =
          this.world.settings.constellationLines && this.stars.material.uniforms.constellationOpacity.value > 0
      }
    }
    this.solarSky.material.uniforms.sunPosition.value.copy(this.solarDirection).multiplyScalar(450000)
    this.solarSky.material.uniforms.sunAltitude.value = state.altitude
    this.csm.lightDirection = this.solarDirection.clone().negate()
    for (const light of this.csm.lights) {
      light.intensity = this.skyInfo.sunIntensity * state.sunIntensity
      light.color.set(this.skyInfo.sunColor).lerp(sunsetColor, state.warmth)
    }
    scene.environmentIntensity = state.environmentIntensity
    this.moon.visible = state.moon.altitude > 0
    const moonUniforms = this.moon.material.uniforms
    moonUniforms.angularRadius.value = state.moon.angularRadius
    this.moon.material.uniforms.lightDirection.value.fromArray(state.moon.lightDirection)
    this.moon.material.uniforms.opacity.value = state.moon.opacity
    updateCelestialMarker(
      this.moonMarker,
      this.moonDirection,
      nightProgress,
      this.moon.visible && this.world.settings.constellationLines
    )
    this.moonLight.intensity = state.moon.lightIntensity
  }

  lateUpdate(delta) {
    this.sky.position.x = this.world.rig.position.x
    this.sky.position.z = this.world.rig.position.z
    this.sky.matrixWorld.setPosition(this.sky.position)
    this.solarSky.position.copy(this.world.rig.position)
    this.moonLight.position.copy(this.moonDirection).multiplyScalar(moonDistance).add(this.world.rig.position)
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
      changes.constellationLines ||
      changes.skyAppearance ||
      changes.bortleClass ||
      changes.latitude ||
      changes.longitude ||
      changes.timeOffset ||
      changes.timeTransition
    ) {
      this.updateDayNight()
    }
  }

  destroy() {
    this.destroyed = true
    this.skyN++ // Cancel environment loads that finish after world disposal.
    this.world.prefs.off('change', this.onPrefsChange)
    this.world.settings.off('change', this.onSettingsChange)
    this.world.graphics.off('resize', this.onViewportResize)
    this.diffuseSkyPlaceholder?.dispose()
    for (const sky of [this.sky, this.solarSky, this.moon, this.moonMarker, this.stars]) {
      if (!sky) continue
      sky.removeFromParent()
      sky.geometry.dispose()
      sky.material.dispose()
    }
    this.moonMarker?.material.uniforms.map.value?.dispose()
    this.constellationLines?.geometry.dispose()
    this.constellationLines?.material.dispose()
    this.planets?.removeFromParent()
    this.planets?.traverse(object => {
      object.geometry?.dispose()
      object.material?.uniforms.map?.value?.dispose()
      object.material?.dispose()
    })
    this.csm?.dispose()
    this.moonLight?.removeFromParent()
    this.moonLight?.target.removeFromParent()
    this.moonLight?.dispose()
  }
}
