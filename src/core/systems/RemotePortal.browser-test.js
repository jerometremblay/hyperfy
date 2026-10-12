import 'ses'
import '../lockdown'
import * as THREE from '../extras/three'
import { World } from '../World'
import { ClientGraphics } from './ClientGraphics'
import { ClientPortalPreviews } from './ClientPortalPreviews'
import { Portal } from '../nodes/Portal'

const source = new World()
const graphics = new ClientGraphics(source)
source.graphics = graphics
source.environment = {
  base: {
    bg: null,
    hdr: '/Clear_08_4pm_LDR.hdr',
    sunDirection: new THREE.Vector3(-1, -2, -2).normalize(),
    sunColor: 0xffffff,
    sunIntensity: 1,
  },
  csm: null,
}
source.portalPreviews = new ClientPortalPreviews(source)
const renderer = new THREE.WebGLRenderer({ preserveDrawingBuffer: true })
renderer.setSize(640, 480)
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.shadowMap.enabled = true
renderer.setClearColor('#090c20')
graphics.renderer = renderer
graphics.maxAnisotropy = renderer.capabilities.getMaxAnisotropy()
const portal = new Portal({
  url: 'http://localhost:3335',
  target: 'exit',
  width: 3,
  height: 2.4,
  resolution: 512,
  updateRate: 0,
  position: [0, 1.2, 0],
})
portal.activate({ world: source })
const cameras = [-0.032, 0.032].map(x => {
  const camera = new THREE.PerspectiveCamera(55, 640 / 480, 0.1, 100)
  camera.position.set(x, 1.2, 4)
  camera.updateMatrixWorld(true)
  return camera
})
source.rig.position.set(0, 1.2, 4)
const errors = []
window.addEventListener('error', e => errors.push(e.message))
renderer.debug.onShaderError = (gl, program) => errors.push(gl.getProgramInfoLog(program))
const output = document.querySelector('pre')
const started = performance.now()
let warmFrames = 0
function render() {
  source.portalPreviews.update()
  const remote = source.portalPreviews.get(portal)?.world
  if (
    !remote?.environment.skyInfo ||
    remote.frame < 5 ||
    !remote?.entities.items.size ||
    ![...remote.entities.items.values()].some(entity => entity.isApp && entity.root?.children.length)
  ) {
    if (performance.now() - started > 15000) {
      output.textContent = JSON.stringify({
        pass: false,
        errors,
        entries: [...source.portalPreviews.worlds.values()].map(entry => entry.error),
      })
      document.title = 'FAIL: remote portal stereo'
      return
    }
    requestAnimationFrame(render)
    return
  }
  renderer.render(source.stage.scene, cameras[0])
  if (warmFrames++ < 5) {
    requestAnimationFrame(render)
    return
  }
  try {
    const results = []
    for (const [index, camera] of cameras.entries()) {
      renderer.render(source.stage.scene, camera)
      const pixels = new Uint8Array(640 * 480 * 4)
      const gl = renderer.getContext()
      gl.readPixels(0, 0, 640, 480, gl.RGBA, gl.UNSIGNED_BYTE, pixels)
      let redPixels = 0
      let xSum = 0
      for (let i = 0; i < pixels.length; i += 4) {
        if (pixels[i] > 50 && pixels[i] > pixels[i + 1] * 1.5 && pixels[i + 2] > pixels[i + 1] * 1.2) {
          redPixels++
          xSum += (i / 4) % 640
        }
      }
      results.push({ eye: index, redPixels, centroidX: xSum / redPixels })
      const figure = document.createElement('figure')
      const image = new Image()
      image.src = renderer.domElement.toDataURL()
      const caption = document.createElement('figcaption')
      caption.textContent = index ? 'Right eye' : 'Left eye'
      figure.append(image, caption)
      document.querySelector('main').append(figure)
    }
    const separateTargets =
      portal.views.size === 2 && new Set([...portal.views.values()].map(view => view.target)).size === 2
    const parallax = Math.abs(results[0].centroidX - results[1].centroidX)
    const restored =
      renderer.getRenderTarget() === null &&
      renderer.toneMapping === THREE.ACESFilmicToneMapping &&
      !graphics.renderingPortal
    const noPhysics = !remote.physics
    const scripts = [...remote.entities.items.values()]
      .filter(entity => entity.isApp)
      .map(entity => ({ id: entity.data.id, error: entity.scriptError }))
    const remoteLighting = {
      hdr: !!remote.stage.scene.environment,
      fogNear: remote.stage.scene.fog?.near,
      fogFar: remote.stage.scene.fog?.far,
      sunIntensity: remote.environment.skyInfo.sunIntensity,
      pointLights: 0,
    }
    remote.stage.scene.traverse(object => {
      if (object.isPointLight) remoteLighting.pointLights++
    })
    const lightingMatches =
      remoteLighting.hdr &&
      remoteLighting.fogNear === 25 &&
      remoteLighting.fogFar === 60 &&
      remoteLighting.sunIntensity === 1.2 &&
      remoteLighting.pointLights > 0
    const avatars = remote.entities.players.size
    const longitude = remote.settings.longitude
    const beforeCleanup = { ...renderer.info.memory }
    portal.unmount()
    source.portalPreviews.destroy()
    renderer.render(source.stage.scene, cameras[0])
    const cleanup =
      !remote.entities.items.size && !remote.loader.files.size && !remote.stage.models.size && !remote.network.ws
    const afterCleanup = { ...renderer.info.memory }
    const pass =
      results.every(result => result.redPixels > 500) &&
      parallax > 0.1 &&
      separateTargets &&
      restored &&
      noPhysics &&
      cleanup &&
      lightingMatches &&
      scripts.every(app => !app.error) &&
      !errors.length
    output.textContent = JSON.stringify(
      {
        pass,
        results,
        parallax,
        separateTargets,
        restored,
        noPhysics,
        remoteLighting,
        scripts,
        remoteAvatars: avatars,
        remoteLongitude: longitude,
        cleanup,
        beforeCleanup,
        afterCleanup,
        errors,
      },
      null,
      2
    )
    document.title = `${pass ? 'PASS' : 'FAIL'}: remote portal stereo`
  } catch (error) {
    output.textContent = JSON.stringify({ pass: false, error: error.message, errors })
    document.title = 'FAIL: remote portal stereo'
  }
}
requestAnimationFrame(render)
