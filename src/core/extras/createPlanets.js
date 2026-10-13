import * as THREE from './three'
import { PLANET_NAMES } from './planetPositions'

const colors = ['#cbc4b7', '#fff2cc', '#e8a080', '#e9dac3', '#e6d4ac', '#b8e3e8', '#8aa8e8']
// Preserve the original 60-degree/800-pixel footprint as a fixed angular size.
const angularUnit = Math.tan(Math.PI / 6) / 400
const zenith = new THREE.Vector3(0, 1, 0)
const polarReference = new THREE.Vector3(0, 0, 1)
const vertexShader = `
  uniform vec3 direction;
  uniform vec3 right;
  uniform vec3 up;
  uniform vec2 extent;
  uniform vec2 offset;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec2 tangent = position.xy * extent + offset;
    vec3 ray = normalize(direction + right * tangent.x + up * tangent.y);
    gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * ray, 0.0);
    gl_Position.z = gl_Position.w;
  }
`

function createNameTexture(name) {
  const canvas = document.createElement('canvas')
  canvas.width = 512
  canvas.height = 128
  const context = canvas.getContext('2d')
  context.strokeStyle = '#b9c9dc'
  context.fillStyle = '#d8e1ee'
  context.lineWidth = 2
  context.beginPath()
  context.arc(40, 64, 24, 0, Math.PI * 2)
  context.stroke()
  context.font = '36px sans-serif'
  context.textBaseline = 'middle'
  context.fillText(name, 80, 64)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function createPlanets() {
  const group = new THREE.Group()
  group.name = 'planets'
  group.visible = false
  group.planets = PLANET_NAMES.map((name, i) => {
    const anchor = new THREE.Group()
    anchor.name = name
    const direction = { value: new THREE.Vector3() }
    const opacity = { value: 0 }
    const uniforms = { direction, opacity, viewportSize: { value: new THREE.Vector2(800, 800) } }
    const discGeometry = new THREE.BufferGeometry()
    discGeometry.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0], 3))
    const disc = new THREE.Points(
      discGeometry,
      new THREE.ShaderMaterial({
        uniforms: {
          ...uniforms,
          angularRadius: { value: 0 },
          color: { value: new THREE.Color(colors[i]) },
          brightness: { value: 1 },
        },
        transparent: true,
        depthWrite: false,
        vertexShader: `
          uniform vec3 direction;
          uniform vec2 viewportSize;
          uniform float angularRadius;
          void main() {
            gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * direction, 0.0);
            gl_Position.z = gl_Position.w;
            gl_PointSize = max(1.0, tan(angularRadius) * projectionMatrix[1][1] * viewportSize.y);
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
    const marker = new THREE.Mesh(
      new THREE.PlaneGeometry(2, 2),
      new THREE.ShaderMaterial({
        uniforms: {
          ...uniforms,
          map: { value: null },
          right: { value: new THREE.Vector3() },
          up: { value: new THREE.Vector3() },
          extent: { value: new THREE.Vector2(128, 32).multiplyScalar(angularUnit) },
          // The texture's circle is at x=40/512; align it with the disc.
          offset: { value: new THREE.Vector2(108, 0).multiplyScalar(angularUnit) },
        },
        transparent: true,
        depthWrite: false,
        vertexShader,
        fragmentShader: `
        uniform sampler2D map;
        uniform float opacity;
        uniform vec3 direction;
        varying vec2 vUv;
        void main() {
          if (direction.y <= 0.0) discard;
          gl_FragColor = texture2D(map, vUv);
          gl_FragColor.a *= opacity * smoothstep(0.0, 0.035, direction.y) * 0.65;
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }
      `,
      })
    )
    marker.name = `${name} marker`
    marker.visible = false
    const viewport = new THREE.Vector4()
    for (const mesh of [disc, marker]) {
      mesh.frustumCulled = false
      mesh.renderOrder = -0.5 // Over the stars, behind the Moon and scene transparency.
      mesh.onBeforeRender = (renderer, _scene, camera) => {
        if (camera.viewport) viewport.copy(camera.viewport)
        else renderer.getCurrentViewport(viewport)
        uniforms.viewportSize.value.set(viewport.z, viewport.w)
        // Create labels only when rendered; headless/preview setup needs no DOM.
        if (mesh === marker && !marker.material.uniforms.map.value) {
          marker.material.uniforms.map.value = createNameTexture(name)
        }
      }
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
    const { right, up } = planet.marker.material.uniforms
    right.value.crossVectors(planet.direction.value, zenith)
    if (right.value.lengthSq() < 1e-12) right.value.crossVectors(planet.direction.value, polarReference)
    right.value.normalize()
    up.value.crossVectors(right.value, planet.direction.value).normalize()
    planet.opacity.value = opacity
    planet.marker.visible = showNames
    planet.disc.material.uniforms.angularRadius.value = state.angularRadius
    planet.disc.material.uniforms.brightness.value = THREE.MathUtils.clamp(
      1.5 * Math.pow(10, -0.15 * state.magnitude),
      0.2,
      5
    )
  })
}
