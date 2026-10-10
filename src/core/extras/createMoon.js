import * as THREE from './three'

// A sky disc with a spherical surface normal. Its light direction controls both
// the curved terminator and the local tilt without textures for each phase.
export function createMoon() {
  const material = new THREE.ShaderMaterial({
    uniforms: {
      lightDirection: { value: new THREE.Vector3(0, 0, 1) },
      opacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    vertexShader: `
      varying vec2 vDisc;
      void main() {
        vDisc = uv * 2.0 - 1.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform vec3 lightDirection;
      uniform float opacity;
      varying vec2 vDisc;
      void main() {
        float radiusSquared = dot(vDisc, vDisc);
        if (radiusSquared > 1.0) discard;
        vec3 normal = vec3(vDisc, sqrt(max(0.0, 1.0 - radiusSquared)));
        float light = dot(normal, lightDirection);
        float illuminated = smoothstep(-0.01, 0.01, light);
        float edge = 1.0 - smoothstep(0.98, 1.0, radiusSquared);
        vec3 color = vec3(0.78, 0.80, 0.84) * (0.5 + 0.5 * max(0.0, light));
        gl_FragColor = vec4(color, opacity * illuminated * edge);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  })
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material)
  moon.name = 'moon'
  moon.visible = false
  moon.frustumCulled = false
  return moon
}
