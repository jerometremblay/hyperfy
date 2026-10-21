import * as THREE from 'three'
import { twilightSkyShader } from './twilightSky'

// Exercise the shipped GLSL directly, without a second CPU implementation.
export function testTwilightSky(renderer, check, photo) {
  const scene = new THREE.Scene()
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  const material = new THREE.ShaderMaterial({
    uniforms: {
      sunAltitude: { value: -2 },
      sunDirection: { value: new THREE.Vector3() },
      viewDirection: { value: new THREE.Vector3() },
      panorama: { value: false },
    },
    vertexShader: `varying vec2 skyUv;
      void main() { skyUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`,
    fragmentShader: `uniform float sunAltitude;
      uniform vec3 sunDirection;
      uniform vec3 viewDirection;
      uniform bool panorama;
      varying vec2 skyUv;
      ${twilightSkyShader}
      void main() {
        float azimuth = (skyUv.x - 0.5) * 6.28318530718;
        float elevation = skyUv.y * 1.57079632679;
        vec3 direction = panorama
          ? vec3(sin(azimuth) * cos(elevation), sin(elevation), -cos(azimuth) * cos(elevation))
          : viewDirection;
        gl_FragColor = vec4(getTwilightSky(direction, sunDirection, sunAltitude), 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  })
  const geometry = new THREE.PlaneGeometry(2, 2)
  scene.add(new THREE.Mesh(geometry, material))
  const target = new THREE.WebGLRenderTarget(1, 1, { type: THREE.FloatType })
  const previousTarget = renderer.getRenderTarget()
  const previousExposure = renderer.toneMappingExposure
  const pixel = new Float32Array(4)
  function sample(sunAltitude, altitude, azimuth = 0) {
    material.uniforms.sunAltitude.value = sunAltitude
    material.uniforms.sunDirection.value.set(
      0,
      Math.sin((sunAltitude * Math.PI) / 180),
      -Math.cos((sunAltitude * Math.PI) / 180)
    )
    const a = (altitude * Math.PI) / 180,
      z = (azimuth * Math.PI) / 180
    material.uniforms.viewDirection.value.set(Math.sin(z) * Math.cos(a), Math.sin(a), -Math.cos(z) * Math.cos(a))
    renderer.setRenderTarget(target)
    renderer.render(scene, camera)
    renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixel)
    return Array.from(pixel.slice(0, 3))
  }
  const luminance = rgb => rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722
  const near = (a, b, tolerance = 0.00001) => a.every((value, i) => Math.abs(value - b[i]) < tolerance)
  const sunward = sample(-3, 15)
  const antisolar = sample(-3, 15, 180)
  check('Twilight is brighter across the solar hemisphere', luminance(sunward) > luminance(antisolar) * 1.5)
  const lowShadow = sample(-1, 8, 180)
  const risingShadow = sample(-3, 8, 180)
  check('Earth shadow rises through the antisolar sky', luminance(risingShadow) < luminance(lowShadow) * 0.8)
  const belt = sample(-2, 23, 180)
  const shadow = sample(-2, 3, 180)
  check('Broad Belt of Venus is pinker than the shadow below', belt[0] / belt[2] > (shadow[0] / shadow[2]) * 1.3)
  check('Twilight has no azimuth seam', near(sample(-3, 15, 179.999), sample(-3, 15, -179.999)))
  check('Twilight converges to one zenith color', near(sample(-3, 89.999, 0), sample(-3, 89.999, 180)))
  check(
    'Twilight rotates with solar azimuth',
    (() => {
      const expected = sample(-3, 15)
      material.uniforms.sunDirection.value.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
      material.uniforms.viewDirection.value.applyAxisAngle(new THREE.Vector3(0, 1, 0), Math.PI / 2)
      renderer.render(scene, camera)
      renderer.readRenderTargetPixels(target, 0, 0, 1, 1, pixel)
      return near(expected, Array.from(pixel.slice(0, 3)))
    })()
  )
  check(
    'Twilight fades continuously into the night floor',
    near(sample(-18, 20), [0.0015, 0.002, 0.006]) && near(sample(-18.001, 20), sample(-17.999, 20))
  )
  const grid = []
  for (const sun of [1, 0, -1, -2, -3, -4, -5, -6, -12, -17, -18]) {
    for (const altitude of [0, 5, 15, 45, 90]) {
      for (const azimuth of [0, 90, 180, 270]) grid.push(...sample(sun, altitude, azimuth))
    }
  }
  check(
    'Entire twilight hemisphere stays finite and nonnegative',
    grid.every(value => Number.isFinite(value) && value >= 0)
  )
  material.uniforms.panorama.value = true
  renderer.setRenderTarget(previousTarget)
  renderer.toneMappingExposure = 1
  for (const sun of [-1, -3, -5, -12, -18]) {
    material.uniforms.sunAltitude.value = sun
    material.uniforms.sunDirection.value.set(0, Math.sin((sun * Math.PI) / 180), -Math.cos((sun * Math.PI) / 180))
    renderer.render(scene, camera)
    photo(`Twilight ${sun}° · full 360° hemisphere · solar azimuth at center, antisolar at edges`)
  }
  renderer.toneMappingExposure = previousExposure
  target.dispose()
  material.dispose()
  geometry.dispose()
}
