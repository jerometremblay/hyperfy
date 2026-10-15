import * as THREE from './three'
import { celestialDirection } from './celestialRotation'
import { createConstellationLines } from './createConstellationLines'
import { celestialVisibilityShader } from './celestialVisibility'

let catalogPromise

// This is a client asset, even when rendering a remote world's portal preview.
// Share CPU data across worlds, but each environment owns its GPU resources.
export function loadStarCatalog() {
  if (!catalogPromise) {
    catalogPromise = fetch('/stars.json')
      .then(response => {
        if (!response.ok) throw new Error(`Star catalog: HTTP ${response.status}`)
        return response.json()
      })
      .then(catalog => {
        if (catalog.version !== 1 || !Array.isArray(catalog.stars) || !catalog.stars.length) {
          throw new Error('Invalid star catalog')
        }
        for (const star of catalog.stars) {
          if (
            !Array.isArray(star) ||
            star.length !== 4 ||
            !star.slice(0, 3).every(Number.isFinite) ||
            star[0] < 0 ||
            star[0] >= 24 ||
            Math.abs(star[1]) > 90 ||
            star[2] > 6.5 ||
            (star[3] !== null && !Number.isFinite(star[3]))
          )
            throw new Error('Invalid star catalog entry')
        }
        return catalog.stars
      })
      .catch(error => {
        catalogPromise = null
        throw error
      })
  }
  return catalogPromise
}

export function createStarField(
  stars,
  visibilityUniforms = {
    sunDirection: { value: new THREE.Vector3(0, -1, 0) },
    moonDirection: { value: new THREE.Vector3(0, -1, 0) },
    moonFraction: { value: 0 },
  }
) {
  const positions = new Float32Array(stars.length * 3)
  const colors = new Float32Array(stars.length * 3)
  const magnitudes = new Float32Array(stars.length)
  const cold = new THREE.Color('#cadbff')
  const neutral = new THREE.Color('#fff8f0')
  const warm = new THREE.Color('#ffd6ab')
  const color = new THREE.Color()
  stars.forEach(([ra, dec, magnitude, bv], i) => {
    positions.set(celestialDirection(ra, dec), i * 3)
    magnitudes[i] = magnitude
    // Muted approximate B-V color; missing indices remain neutral.
    const index = bv ?? 0.65
    if (index < 0.65) color.copy(cold).lerp(neutral, THREE.MathUtils.clamp((index + 0.3) / 0.95, 0, 1))
    else color.copy(neutral).lerp(warm, THREE.MathUtils.clamp((index - 0.65) / 1.15, 0, 1))
    color.toArray(colors, i * 3)
  })
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('magnitude', new THREE.BufferAttribute(magnitudes, 1))
  const material = new THREE.ShaderMaterial({
    uniforms: {
      ...visibilityUniforms,
      celestialRotation: { value: new THREE.Matrix3() },
      opacity: { value: 1 },
      constellationOpacity: { value: 0 },
      pixelScale: { value: 1 },
    },
    vertexColors: true,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      uniform mat3 celestialRotation;
      uniform float pixelScale;
      uniform vec3 sunDirection;
      uniform vec3 moonDirection;
      uniform float moonFraction;
      attribute float magnitude;
      ${celestialVisibilityShader}
      varying vec3 vColor;
      varying float vBrightness;
      varying float vVisibility;
      void main() {
        vec3 direction = celestialRotation * position;
        float apparentMagnitude = getObservedMagnitude(
          magnitude, direction, sunDirection, moonDirection, moonFraction
        );
        vVisibility = getMagnitudeVisibility(
          magnitude, direction, sunDirection, moonDirection, moonFraction
        );
        vColor = color;
        // Compress the photometric range for a visible, small star image.
        vBrightness = clamp(2.5 * pow(10.0, -0.15 * apparentMagnitude), 0.0, 5.0);
        gl_PointSize = clamp(3.5 - 0.3 * apparentMagnitude, 1.5, 4.5) * pixelScale;
        // Directions at infinity: neither head translation nor eye separation
        // changes their bearings. The active view also works through portals.
        gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * direction, 0.0);
        gl_Position.z = gl_Position.w;
      }
    `,
    fragmentShader: `
      uniform float opacity;
      varying vec3 vColor;
      varying float vBrightness;
      varying float vVisibility;
      void main() {
        if (vVisibility <= 0.001) discard;
        vec2 disc = gl_PointCoord * 2.0 - 1.0;
        float r2 = dot(disc, disc);
        if (r2 >= 1.0) discard;
        float profile = exp(-3.0 * r2) * (1.0 - smoothstep(0.6, 1.0, r2));
        gl_FragColor = vec4(vColor * vBrightness, opacity * vVisibility * profile);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const field = new THREE.Points(geometry, material)
  field.name = 'stars'
  field.add(
    createConstellationLines({
      celestialRotation: material.uniforms.celestialRotation,
      opacity: material.uniforms.constellationOpacity,
    })
  )
  field.visible = false
  field.frustumCulled = false
  // Draw over the opaque sky, before transparent Moon/scene objects.
  field.renderOrder = -1
  const viewport = new THREE.Vector4()
  field.onBeforeRender = (renderer, _scene, camera) => {
    if (camera.viewport) viewport.copy(camera.viewport)
    else renderer.getCurrentViewport(viewport)
    material.uniforms.pixelScale.value = Math.max(0.5, viewport.w / 800)
  }
  return field
}
