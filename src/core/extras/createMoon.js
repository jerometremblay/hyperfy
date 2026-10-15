import * as THREE from './three'

// Project the Moon onto the celestial sphere while preserving its real angular size.
export function createMoon() {
  const moon = new THREE.Mesh(
    new THREE.PlaneGeometry(2, 2),
    new THREE.ShaderMaterial({
      uniforms: {
        direction: { value: new THREE.Vector3() },
        right: { value: new THREE.Vector3() },
        up: { value: new THREE.Vector3() },
        angularRadius: { value: 0 },
        lightDirection: { value: new THREE.Vector3(0, 0, 1) },
        opacity: { value: 1 },
      },
      transparent: true,
      depthWrite: false,
      vertexShader: `
        uniform vec3 direction;
        uniform vec3 right;
        uniform vec3 up;
        uniform float angularRadius;
        varying vec2 vDisc;
        void main() {
          vDisc = uv * 2.0 - 1.0;
          vec3 ray = normalize(direction + right * position.x * tan(angularRadius)
            + up * position.y * tan(angularRadius));
          gl_Position = projectionMatrix * vec4(mat3(viewMatrix) * ray, 0.0);
          gl_Position.z = gl_Position.w;
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
  )
  moon.name = 'moon'
  moon.visible = false
  moon.frustumCulled = false
  return moon
}
