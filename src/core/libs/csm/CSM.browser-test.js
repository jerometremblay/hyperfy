// Run node scripts/test-light-shadows.mjs and open its URL in a WebGL browser.
import * as THREE from 'three'
import { CSM } from './CSM'

const results = []
const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(256, 256)
renderer.shadowMap.enabled = true
const output = document.createElement('pre')
document.body.append(output)
const initialChunks = {
  lights_fragment_begin: THREE.ShaderChunk.lights_fragment_begin,
  lights_pars_begin: THREE.ShaderChunk.lights_pars_begin,
}

for (const shadowType of [THREE.BasicShadowMap, THREE.PCFShadowMap]) {
  renderer.shadowMap.type = shadowType
  for (const type of ['point', 'spot', 'directional']) {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#202030')
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 30)
    camera.position.set(5, 5, 7)
    camera.lookAt(0, 0, 0)
    camera.updateMatrixWorld()
    const csm = new CSM({
      parent: scene,
      camera,
      cascades: 3,
      maxCascades: 3,
      maxFar: 30,
      shadowMapSize: 256,
      lightIntensity: 0.1,
      fade: true,
    })
    const material = new THREE.MeshStandardMaterial({ color: '#dddddd' })
    csm.setupMaterial(material)
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(10, 10), material)
    floor.rotation.x = -Math.PI / 2
    floor.receiveShadow = true
    const wall = new THREE.Mesh(new THREE.BoxGeometry(1, 2, 1), material)
    wall.position.y = 1
    wall.castShadow = true
    wall.receiveShadow = true
    scene.add(floor, wall, new THREE.AmbientLight(0xffffff, 0.1))
    const light =
      type === 'point'
        ? new THREE.PointLight(0xffffff, 150, 20)
        : type === 'spot'
          ? new THREE.SpotLight(0xffffff, 150, 20, Math.PI / 3)
          : new THREE.DirectionalLight(0xffffff, 3)
    light.position.set(-3, 5, 2)
    light.shadow.mapSize.set(512, 512)
    light.shadow.bias = -0.0001
    scene.add(light)
    if (light.target) scene.add(light.target)
    const errors = []
    renderer.debug.onShaderError = (gl, program, vertex, fragment) => {
      errors.push(gl.getShaderInfoLog(vertex) + gl.getShaderInfoLog(fragment))
    }
    csm.update()
    const pixels = () => {
      renderer.render(scene, camera)
      const data = new Uint8Array(256 * 256 * 4)
      renderer
        .getContext()
        .readPixels(0, 0, 256, 256, renderer.getContext().RGBA, renderer.getContext().UNSIGNED_BYTE, data)
      return data
    }
    const unshadowed = pixels()
    light.castShadow = true
    const shadowed = pixels()
    let blockedPixels = 0
    for (let i = 0; i < shadowed.length; i += 4) {
      if (unshadowed[i] - shadowed[i] > 20) blockedPixels++
    }
    const pass = errors.length === 0 && blockedPixels > 100
    results.push({ type, shadowType, pass, blockedPixels, errors })
    const label = document.createElement('div')
    label.textContent = `${type}, ${shadowType === THREE.PCFShadowMap ? 'PCF' : 'Basic'}: ${pass ? 'PASS' : 'FAIL'}`
    const image = new Image()
    image.src = renderer.domElement.toDataURL()
    label.append(image)
    document.body.append(label)
    material.dispose()
    floor.geometry.dispose()
    wall.geometry.dispose()
    light.dispose()
    csm.dispose()
  }
}
Object.assign(THREE.ShaderChunk, initialChunks)
renderer.dispose()
output.textContent = results
  .map(
    result =>
      `${result.type} ${result.shadowType === THREE.PCFShadowMap ? 'PCF' : 'Basic'}: ${result.pass ? 'PASS' : 'FAIL'} (${result.blockedPixels} shadowed pixels)${result.errors.length ? '\n' + result.errors.join('\n') : ''}`
  )
  .join('\n')
document.title = results.every(result => result.pass) ? 'PASS: light shadows' : 'FAIL: light shadows'
