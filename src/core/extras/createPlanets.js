import * as THREE from './three'
import { PLANET_NAMES } from './planetPositions'
import { createCelestialMarker, updateCelestialMarker } from './createCelestialMarker'

const colors = ['#cbc4b7', '#fff2cc', '#e8a080', '#e9dac3', '#e6d4ac', '#b8e3e8', '#8aa8e8']

export function createPlanets() {
  const group = new THREE.Group()
  group.name = 'planets'
  group.visible = false
  group.planets = PLANET_NAMES.map((name, i) => {
    const anchor = new THREE.Group()
    anchor.name = name
    const direction = { value: new THREE.Vector3() }
    const opacity = { value: 0 }
    const uniforms = { direction, opacity, pixelScale: { value: 1 } }
    const discGeometry = new THREE.BufferGeometry()
    discGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    const disc = new THREE.Points(
      discGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
          ...uniforms,
          magnitude: { value: 0 },
          color: { value: new THREE.Color(colors[i]) },
          brightness: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        vertexShader: `
          uniform vec3 direction;
          uniform float magnitude;
          uniform float pixelScale;
          void main() {
            gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * direction, 0.0);
            gl_Position.z = gl_Position.w;
            gl_PointSize = clamp(3.5 - 0.3 * magnitude, 1.5, 4.5) * pixelScale;
          }
        `,
        fragmentShader: `
        uniform vec3 color;
        uniform float brightness;
        uniform float opacity;
        uniform vec3 direction;
        void main() {
          float radius = length(gl_PointCoord * 2.0 - 1.0);
          if (radius > 1.0 || direction.y <= 0.0) discard;
          float edge = 1.0 - smoothstep(0.85, 1.0, radius);
          gl_FragColor = vec4(color * brightness, opacity * smoothstep(0.0, 0.035, direction.y) * edge);
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

export function updatePlanets(group, states, opacity, showNames) {
  group.visible = opacity > 0
  states.forEach((state, i) => {
    const planet = group.planets[i]
    planet.anchor.visible = state.altitude > 0
    planet.direction.value.fromArray(state.direction)
    planet.opacity.value = opacity
    updateCelestialMarker(planet.marker, planet.direction.value, opacity, showNames)
    planet.disc.material.uniforms.magnitude.value = state.magnitude
    planet.disc.material.uniforms.brightness.value = THREE.MathUtils.clamp(
      1.5 * Math.pow(10, -0.15 * state.magnitude),
      0.2,
      5
    )
  })
}
