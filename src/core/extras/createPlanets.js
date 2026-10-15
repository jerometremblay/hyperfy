import * as THREE from './three'
import { PLANET_NAMES } from './planetPositions'
import { createCelestialMarker, updateCelestialMarker } from './createCelestialMarker'
import { celestialVisibilityShader, getCelestialVisibility } from './celestialVisibility'

const colors = ['#cbc4b7', '#fff2cc', '#e8a080', '#e9dac3', '#e6d4ac', '#b8e3e8', '#8aa8e8']

export function createPlanets(
  visibilityUniforms = {
    sunDirection: { value: new THREE.Vector3(0, -1, 0) },
    moonDirection: { value: new THREE.Vector3(0, -1, 0) },
    moonFraction: { value: 0 },
  }
) {
  const group = new THREE.Group()
  group.name = 'planets'
  group.visible = false
  group.planets = PLANET_NAMES.map((name, i) => {
    const anchor = new THREE.Group()
    anchor.name = name
    const direction = { value: new THREE.Vector3() }
    const opacity = { value: 0 }
    const uniforms = { direction, pixelScale: { value: 1 } }
    const discGeometry = new THREE.BufferGeometry()
    discGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    const disc = new THREE.Points(
      discGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
          ...visibilityUniforms,
          ...uniforms,
          magnitude: { value: 0 },
          color: { value: new THREE.Color(colors[i]) },
        },
        transparent: true,
        depthWrite: false,
        vertexShader: `
          uniform vec3 direction;
          uniform vec3 sunDirection;
          uniform vec3 moonDirection;
          uniform float moonFraction;
          uniform float magnitude;
          uniform float pixelScale;
          ${celestialVisibilityShader}
          varying float vBrightness;
          varying float vVisibility;
          void main() {
            float apparentMagnitude = getObservedMagnitude(
              magnitude, direction, sunDirection, moonDirection, moonFraction
            );
            vBrightness = clamp(1.5 * pow(10.0, -0.15 * apparentMagnitude), 0.2, 5.0);
            vVisibility = getMagnitudeVisibility(
              magnitude, direction, sunDirection, moonDirection, moonFraction
            );
            gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * direction, 0.0);
            gl_Position.z = gl_Position.w;
            gl_PointSize = clamp(3.5 - 0.3 * apparentMagnitude, 1.5, 4.5) * pixelScale;
          }
        `,
        fragmentShader: `
        uniform vec3 color;
        varying float vBrightness;
        varying float vVisibility;
        void main() {
          float radius = length(gl_PointCoord * 2.0 - 1.0);
          if (radius > 1.0 || vVisibility <= 0.001) discard;
          float edge = 1.0 - smoothstep(0.85, 1.0, radius);
          gl_FragColor = vec4(color * vBrightness, vVisibility * edge);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      })
    )
    disc.name = `${name} disc`
    const marker = createCelestialMarker(name, { direction, opacity })
    const viewport = new THREE.Vector4()
    disc.frustumCulled = false
    disc.onBeforeRender = (renderer, _scene, camera) => {
      if (camera.viewport) viewport.copy(camera.viewport)
      else renderer.getCurrentViewport(viewport)
      uniforms.pixelScale.value = Math.max(0.5, viewport.w / 800)
    }
    anchor.add(disc, marker)
    group.add(anchor)
    return { name, anchor, direction, opacity, disc, marker }
  })
  return group
}

export function updatePlanets(group, states, visibilityUniforms, showNames, nightOpacity = 1) {
  const sunDirection = visibilityUniforms.sunDirection.value
  const moonDirection = visibilityUniforms.moonDirection.value
  const moonFraction = visibilityUniforms.moonFraction.value
  let anyVisible = false
  states.forEach((state, i) => {
    const planet = group.planets[i]
    planet.direction.value.fromArray(state.direction)
    const visibility = getCelestialVisibility(
      state.magnitude,
      planet.direction.value,
      sunDirection,
      moonDirection,
      moonFraction
    )
    planet.anchor.visible = visibility > 0.001
    anyVisible ||= planet.anchor.visible
    planet.opacity.value = visibility * nightOpacity
    updateCelestialMarker(
      planet.marker,
      planet.direction.value,
      planet.opacity.value,
      showNames && planet.opacity.value > 0.01
    )
    planet.disc.material.uniforms.magnitude.value = state.magnitude
  })
  group.visible = anyVisible
}
