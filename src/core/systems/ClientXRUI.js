import * as THREE from '../extras/three'
import { System } from './System'
import { ControlPriorities } from '../extras/ControlPriorities'
import { XRDOMSurface } from '../extras/XRDOMSurface'
import { getXRMenuButton, XRPoke } from '../extras/xrUI'

const PANEL_SCALE = 0.0008
const PANEL_DISTANCE = 0.7
const position = new THREE.Vector3()
const direction = new THREE.Vector3()
const rotation = new THREE.Quaternion()
const rigRotation = new THREE.Quaternion()

export class ClientXRUI extends System {
  constructor(world) {
    super(world)
    this.visible = false
    this.menuDown = false
    this.selectedSources = new Set()
    this.launcherPoke = new XRPoke()
    this.raycaster = new THREE.Raycaster()
    this.panelAnchor = new THREE.Object3D()
  }

  start() {
    this.control = this.world.controls.bind({ priority: ControlPriorities.XR_UI })
    this.world.on('xrSession', this.onSession)
  }

  setElement(element) {
    this.surface?.dispose()
    this.surface = null
    this.panelAnchor.removeFromParent()
    if (!element) return
    this.surface = new XRDOMSurface(element)
    this.surface.mesh.scale.setScalar(PANEL_SCALE / 0.001)
    this.surface.mesh.visible = this.visible
    this.panelAnchor.add(this.surface.mesh)
    this.world.stage.scene.add(this.panelAnchor)
    if (this.visible) this.placePanel()
  }

  onSession = session => {
    this.session?.removeEventListener('selectstart', this.onSelectStart)
    this.session?.removeEventListener('selectend', this.onSelectEnd)
    this.session?.removeEventListener('select', this.onSelect)
    this.session?.removeEventListener('visibilitychange', this.onVisibilityChange)
    this.session?.removeEventListener('inputsourceschange', this.onInputSourcesChange)
    this.session = session || null
    this.session?.addEventListener('selectstart', this.onSelectStart)
    this.session?.addEventListener('selectend', this.onSelectEnd)
    this.session?.addEventListener('select', this.onSelect)
    this.session?.addEventListener('visibilitychange', this.onVisibilityChange)
    this.session?.addEventListener('inputsourceschange', this.onInputSourcesChange)
    this.setVisible(false)
    this.menuDown = false
    this.launcherPoke = new XRPoke()
    this.launcher?.removeFromParent()
    this.launcher?.geometry.dispose()
    this.launcher?.material.map.dispose()
    this.launcher?.material.dispose()
    this.launcher = null
  }

  onSelectStart = event => {
    if (!this.visible || this.session?.visibilityState !== 'visible') return
    this.selectedSources.add(event.inputSource)
    this.updateRayPointer(event.inputSource, event.frame)
  }

  onSelectEnd = event => {
    this.selectedSources.delete(event.inputSource)
    if (this.visible && this.session?.visibilityState === 'visible') {
      this.updateRayPointer(event.inputSource, event.frame)
    }
  }

  onSelect = event => {
    if (!this.visible || this.session?.visibilityState !== 'visible' || !this.selectedSources.has(event.inputSource))
      return
    this.selectedSources.delete(event.inputSource)
    this.updateRayPointer(event.inputSource, event.frame, true)
  }

  onVisibilityChange = () => {
    if (this.session?.visibilityState === 'visible') return
    this.selectedSources.clear()
    this.surface?.cancelPointers()
    if (this.surface) this.surface.mesh.visible = false
  }

  onInputSourcesChange = event => {
    for (const source of event.removed) {
      this.selectedSources.delete(source)
      if (source.handedness === 'left' || source.handedness === 'right') {
        this.surface?.updatePointer(source.handedness === 'left' ? 101 : 102, null, false)
      }
    }
  }

  setVisible(visible) {
    this.visible = !!visible && !!this.world.xr.session
    this.surface?.cancelPointers()
    this.selectedSources.clear()
    if (this.surface) this.surface.mesh.visible = this.visible
    if (this.control) {
      this.control.xrLeftTrigger.capture = this.visible
      this.control.xrRightTrigger.capture = this.visible
    }
    if (this.visible) {
      this.placePanel()
      this.surface?.refresh()
    } else {
      const element = this.surface?.element
      const activeElement = element?.ownerDocument.activeElement
      if (activeElement && element.contains(activeElement)) activeElement.blur()
    }
  }

  placePanel() {
    if (!this.surface) return
    this.updatePanelAnchor()
    // Sample eye height only on open/recenter. Head direction and leaning never
    // change the fixed point in front of the avatar's movement orientation.
    this.world.camera.getWorldPosition(position)
    const mesh = this.surface.mesh
    mesh.position.set(0, position.y - this.panelAnchor.position.y - 0.22, -PANEL_DISTANCE)
    mesh.quaternion.identity()
    mesh.updateMatrixWorld(true)
  }

  updatePanelAnchor() {
    // The base follows physical walking, but its visual rotation follows the
    // headset. The XR rig's yaw tracks movement turns independently of the head.
    const player = this.world.entities.player
    if (!player?.base || !player.xrRig) return
    this.panelAnchor.position.copy(player.base.position)
    this.panelAnchor.quaternion.copy(player.xrRig.quaternion)
    this.panelAnchor.updateMatrixWorld(true)
  }

  update() {
    const session = this.world.xr.session
    if (!session || session.visibilityState !== 'visible') return
    const source = Array.from(session.inputSources).find(source => source.handedness === 'left' && !source.hand)
    // Y remains available on older Quest browsers which reserve the menu button.
    const quest = source?.profiles?.some(profile =>
      ['oculus-touch', 'oculus-touch-v2', 'oculus-touch-v3', 'meta-quest-touch-plus'].includes(profile)
    )
    const menuDown = !!(getXRMenuButton(source || {})?.pressed || (quest && source.gamepad?.buttons[5]?.pressed))
    if (menuDown && !this.menuDown) this.setVisible(!this.visible)
    this.menuDown = menuDown
  }

  lateUpdate() {
    const session = this.world.xr.session
    if (!session || !this.surface) return
    const interactive = session.visibilityState === 'visible'
    this.surface.mesh.visible = this.visible && interactive
    if (this.visible) this.updatePanelAnchor()
    const rendererXR = this.world.graphics.renderer.xr
    const frame = rendererXR.getFrame()
    const referenceSpace = rendererXR.getReferenceSpace()
    const rig = this.world.entities.player?.xrRig
    if (!interactive || !frame || !referenceSpace || !rig) {
      this.surface.cancelPointers()
      this.selectedSources.clear()
      this.launcherPoke.update(null)
      if (this.launcher) this.launcher.visible = false
      return
    }
    rig.updateMatrixWorld(true)
    const sources = Array.from(session.inputSources)
    this.updateLauncher(frame, referenceSpace, rig, sources)
    const seen = new Set()
    for (const source of sources) {
      const hand = source.handedness
      if (hand !== 'left' && hand !== 'right') continue
      const id = hand === 'left' ? 101 : 102
      if (this.visible) this.updateRayPointer(source, frame)
      seen.add(id)
    }
    for (const source of this.selectedSources) {
      if (!sources.includes(source)) this.selectedSources.delete(source)
    }
    for (const id of [101, 102]) {
      if (!seen.has(id)) {
        this.surface.updatePointer(id, null, false)
      }
    }
  }

  updateRayPointer(source, frame, activate = false) {
    const hand = source.handedness
    if (!this.surface || (hand !== 'left' && hand !== 'right')) return
    const id = hand === 'left' ? 101 : 102
    const referenceSpace = this.world.graphics.renderer.xr.getReferenceSpace()
    const rig = this.world.entities.player?.xrRig
    const pose = referenceSpace && source.targetRaySpace && frame?.getPose(source.targetRaySpace, referenceSpace)
    if (!rig || !pose) {
      this.selectedSources.delete(source)
      this.surface.updatePointer(id, null, false)
      return
    }
    this.updatePanelAnchor()
    rig.updateMatrixWorld(true)
    position.copy(pose.transform.position).applyMatrix4(rig.matrixWorld)
    rotation.copy(pose.transform.orientation).premultiply(rig.getWorldQuaternion(rigRotation))
    direction.set(0, 0, -1).applyQuaternion(rotation)
    this.raycaster.set(position, direction)
    const hit = this.raycaster.intersectObject(this.surface.mesh, false)[0]
    const uv = hit ? { x: hit.uv.x, y: 1 - hit.uv.y } : null
    // Quest supplies its Home-style pointing ray and emits these primary-action
    // events for a hand pinch or controller trigger. No custom gesture detection.
    this.surface.updatePointer(id, uv, this.selectedSources.has(source), activate)
  }

  updateLauncher(frame, referenceSpace, rig, sources) {
    const left = Array.from(sources).find(source => source.handedness === 'left' && source.hand)
    const right = Array.from(sources).find(source => source.handedness === 'right' && source.hand)
    const wrist = left?.hand.get('wrist')
    const tip = right?.hand.get('index-finger-tip')
    const wristPose = wrist && frame.getJointPose(wrist, referenceSpace)
    const tipPose = tip && frame.getJointPose(tip, referenceSpace)
    if (!wristPose || !tipPose) {
      if (this.launcher) this.launcher.visible = false
      this.launcherPoke.update(null)
      return
    }
    if (!this.launcher) {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 128
      const context = canvas.getContext('2d')
      context.fillStyle = '#2a2b39'
      context.fillRect(0, 0, 256, 128)
      context.fillStyle = 'white'
      context.font = '40px sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText('Menu', 128, 64)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      this.launcher = new THREE.Mesh(
        new THREE.PlaneGeometry(0.09, 0.045),
        new THREE.MeshBasicMaterial({ map: texture, toneMapped: false })
      )
      this.world.stage.scene.add(this.launcher)
    }
    this.launcher.visible = true
    this.launcher.position.copy(wristPose.transform.position).applyMatrix4(rig.matrixWorld)
    // Place beside the wrist and face the user, avoiding the reserved palm gesture.
    const camera = this.world.camera
    camera.getWorldQuaternion(this.launcher.quaternion)
    direction.set(-0.09, 0.03, 0).applyQuaternion(this.launcher.quaternion)
    this.launcher.position.add(direction)
    this.launcher.updateMatrixWorld(true)
    position.copy(tipPose.transform.position).applyMatrix4(rig.matrixWorld)
    this.launcher.worldToLocal(position)
    const poke = this.launcherPoke.update(position, 0.09, 0.045)
    if (poke.pressed) this.setVisible(!this.visible)
  }

  scroll(direction) {
    if (!this.surface) return
    const candidates = Array.from(this.surface.element.querySelectorAll('.sidebar *')).filter(element => {
      return (
        ['auto', 'scroll'].includes(getComputedStyle(element).overflowY) && element.scrollHeight > element.clientHeight
      )
    })
    const target = candidates.find(element => !element.closest('.sidebar-sections')) || candidates[0]
    if (target) target.scrollTop += direction * target.clientHeight * 0.6
    this.surface.refresh()
  }

  destroy() {
    this.onSession()
    this.setElement(null)
    this.world.off('xrSession', this.onSession)
    this.control?.release()
  }
}
