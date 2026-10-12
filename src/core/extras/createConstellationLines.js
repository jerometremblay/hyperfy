import * as THREE from './three'
import { celestialDirection } from './celestialRotation'
import catalog from './constellations.json'

export function createConstellationLines(uniforms) {
  const positions = []
  const a = new THREE.Vector3(),
    b = new THREE.Vector3(),
    point = new THREE.Vector3()
  for (const constellation of catalog.constellations) {
    for (const [raA, decA, raB, decB] of constellation.segments) {
      a.fromArray(celestialDirection(raA, decA))
      b.fromArray(celestialDirection(raB, decB))
      // Short arcs keep the perspective projection and horizon fade smooth.
      const steps = Math.max(1, Math.ceil(a.angleTo(b) / THREE.MathUtils.degToRad(1)))
      for (let i = 0; i < steps; i++) {
        for (const t of [i / steps, (i + 1) / steps]) {
          point.copy(a).lerp(b, t).normalize()
          positions.push(point.x, point.y, point.z)
        }
      }
    }
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  const material = new THREE.ShaderMaterial({
    uniforms: { celestialRotation: uniforms.celestialRotation, opacity: uniforms.opacity },
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    vertexShader: `
      uniform mat3 celestialRotation;
      varying float vAltitude;
      void main() {
        vec3 direction = celestialRotation * position;
        vAltitude = direction.y;
        gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * direction, 0.0);
        gl_Position.z = gl_Position.w;
      }
    `,
    fragmentShader: `
      uniform float opacity;
      varying float vAltitude;
      void main() {
        if (vAltitude <= 0.0) discard;
        float horizon = smoothstep(0.0, 0.035, vAltitude);
        gl_FragColor = vec4(vec3(0.16, 0.22, 0.3), opacity * horizon * 0.18);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const lines = new THREE.LineSegments(geometry, material)
  lines.name = 'constellations'
  lines.visible = false
  lines.frustumCulled = false
  lines.renderOrder = -2
  return lines
}
