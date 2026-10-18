import * as THREE from './three'
import { CELESTIAL_ANNOTATION_COLOR, CELESTIAL_ANNOTATION_OPACITY } from './celestialAnnotationStyle'

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
  canvas.height = 512
  const context = canvas.getContext('2d')
  context.strokeStyle = CELESTIAL_ANNOTATION_COLOR
  context.fillStyle = CELESTIAL_ANNOTATION_COLOR
  context.lineWidth = 2
  // Outline only: keep the center transparent so the planet sprite beneath it shows through.
  context.beginPath()
  context.arc(40, 256, 24, 0, Math.PI * 2)
  context.stroke()
  context.font = '36px sans-serif'
  context.textBaseline = 'middle'
  context.fillText(name, 80, 256)
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
        textOffset: { value: 0 },
        right: uniforms.right ?? { value: new THREE.Vector3() },
        up: uniforms.up ?? { value: new THREE.Vector3() },
        extent: { value: new THREE.Vector2(128, 128).multiplyScalar(angularUnit) },
        // The texture's circle is at x=40/512; align it with the celestial direction.
        offset: { value: new THREE.Vector2(108, 0).multiplyScalar(angularUnit) },
      },
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      vertexShader,
      fragmentShader: `
        uniform sampler2D map;
        uniform float opacity;
        uniform float textOffset;
        uniform vec3 direction;
        varying vec2 vUv;
        void main() {
          if (direction.y <= 0.0) discard;
          vec2 sampleUv = vUv;
          // The marker plane spans 256 reference pixels vertically.
          if (vUv.x > 0.14) sampleUv.y += textOffset / 256.0;
          gl_FragColor = texture2D(map, sampleUv);
          gl_FragColor.a *= opacity * smoothstep(0.0, 0.035, direction.y) * ${CELESTIAL_ANNOTATION_OPACITY};
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

export function updateCelestialMarker(marker, direction, opacity, visible, rightDirection, textOffset = 0) {
  const uniforms = marker.material.uniforms
  uniforms.direction.value.copy(direction)
  uniforms.opacity.value = opacity
  uniforms.textOffset.value = textOffset
  if (rightDirection?.lengthSq() > 1e-12) uniforms.right.value.copy(rightDirection)
  else uniforms.right.value.crossVectors(direction, zenith)
  if (uniforms.right.value.lengthSq() < 1e-12) uniforms.right.value.crossVectors(direction, polarReference)
  uniforms.right.value.normalize()
  uniforms.up.value.crossVectors(uniforms.right.value, direction).normalize()
  if (uniforms.up.value.y < 0) {
    uniforms.right.value.negate()
    uniforms.up.value.negate()
  }
  marker.visible = visible
}
