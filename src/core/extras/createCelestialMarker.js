import * as THREE from './three'

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

export function createCelestialMarker(name, uniforms) {
  const marker = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: {
        ...uniforms,
        map: { value: null },
        right: uniforms.right ?? { value: new THREE.Vector3() },
        up: uniforms.up ?? { value: new THREE.Vector3() },
        extent: { value: new THREE.Vector2(128, 32).multiplyScalar(angularUnit) },
        // The texture's circle is at x=40/512; align it with the celestial direction.
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
  marker.frustumCulled = false
  marker.renderOrder = -0.5 // Over the stars, behind the Moon and scene transparency.
  marker.onBeforeRender = () => {
    if (!marker.material.uniforms.map.value) {
      marker.material.uniforms.map.value = createNameTexture(name)
    }
  }
  return marker
}

export function updateCelestialMarker(marker, direction, opacity, visible) {
  const uniforms = marker.material.uniforms
  uniforms.direction.value.copy(direction)
  uniforms.opacity.value = opacity
  uniforms.right.value.crossVectors(direction, zenith)
  if (uniforms.right.value.lengthSq() < 1e-12) uniforms.right.value.crossVectors(direction, polarReference)
  uniforms.right.value.normalize()
  uniforms.up.value.crossVectors(uniforms.right.value, direction).normalize()
  marker.visible = visible
}
