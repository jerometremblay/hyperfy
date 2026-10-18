import * as THREE from 'three'

import { System } from './System'
import { ControlPriorities } from '../extras/ControlPriorities'
import { isTouch } from '../../client/utils'
import { clamp } from '../utils'

const BATCH_SIZE = 500
const ACTION_TARGET_RADIUS = 1
const FORWARD = new THREE.Vector3(0, 0, 1)

const v1 = new THREE.Vector3()
const v2 = new THREE.Vector3()
const v3 = new THREE.Vector3()
const v4 = new THREE.Vector3()
const v5 = new THREE.Vector3()
const q1 = new THREE.Quaternion()
const e1 = new THREE.Euler(0, 0, 0, 'YXZ')

export class ClientActions extends System {
  constructor(world) {
    super(world)
    this.nodes = []
    this.cursor = 0
    this.current = {
      node: null,
      distance: Infinity,
    }
    this.action = null
  }

  start() {
    this.action = createAction(this.world)
    this.btnDown = false
    this.btnClick = false
    this.control = this.world.controls.bind({ priority: ControlPriorities.ACTION })
  }

  register(node) {
    this.nodes.push(node)
  }

  unregister(node) {
    const idx = this.nodes.indexOf(node)
    if (idx === -1) return
    this.nodes.splice(idx, 1)
    if (this.current.node === node) {
      this.current.node = null
      this.current.distance = Infinity
      this.action.stop()
      this.emit('change', false)
      this.emit('progress', 0)
    }
  }

  update(delta) {
    const isXR = !!this.world.xr?.session
    const isBuilderMouseHover =
      this.world.builder?.enabled && !isXR && !isTouch && !this.control.pointer.locked
    const canTarget = !this.world.builder?.enabled || isBuilderMouseHover
    const cameraPos = isXR
      ? this.world.camera.getWorldPosition(v5)
      : this.world.rig.position

    this.btnDown =
      this.control.keyE.down ||
      this.control.touchB.down ||
      this.control.xrLeftTrigger.down ||
      this.control.xrRightTrigger.down ||
      this.control.xrLeftBtn1.down
    // Script pointer handlers capture desktop clicks before this system sees them.
    this.btnClick = !isTouch && !!this.control.mouseLeft?.pressed

    let hit = null
    if (canTarget && !isXR && this.world.stage.viewport) {
      if (isTouch || this.control.pointer.locked) {
        hit = this.world.stage.raycastReticle()[0]
      } else {
        hit = this.world.stage.raycastPointer(this.control.pointer.position)[0]
      }
    }
    const targetEntity = hit?.getEntity?.() || hit?.node?.ctx?.entity

    // Find the closest action when using XR. On desktop and touch, the active
    // pointer or reticle must hit the action's app near its target.
    let target = null
    let targetDistance = Infinity
    let targetOffset = Infinity

    // Keep the selected target while it remains under the pointer, even when
    // there are more actions than the per-frame search batch.
    if (canTarget && this.current.node && !this.current.node.finished) {
      const node = this.current.node
      const distance = node.worldPos.distanceTo(cameraPos)
      if (distance <= node._distance) {
        if (isXR) {
          target = node
          targetDistance = distance
        } else if (targetEntity && node.ctx?.entity === targetEntity && hit?.point) {
          const offset = node.worldPos.distanceTo(hit.point)
          if (offset <= ACTION_TARGET_RADIUS) {
            target = node
            targetDistance = distance
            targetOffset = offset
          }
        }
      }
    }

    const size = canTarget ? Math.min(this.nodes.length, BATCH_SIZE) : 0
    for (let i = 0; i < size; i++) {
      const idx = (this.cursor + i) % this.nodes.length
      const node = this.nodes[idx]
      if (node.finished) continue
      const distance = node.worldPos.distanceTo(cameraPos)
      if (distance > node._distance) continue

      if (isXR) {
        if (distance < targetDistance) {
          target = node
          targetDistance = distance
        }
      } else if (targetEntity && node.ctx?.entity === targetEntity && hit?.point) {
        const offset = node.worldPos.distanceTo(hit.point)
        if (offset <= ACTION_TARGET_RADIUS && offset < targetOffset) {
          target = node
          targetDistance = distance
          targetOffset = offset
        }
      }
    }
    if (size) {
      this.cursor = (this.cursor + size) % this.nodes.length
    }

    if (this.current.node !== target) {
      const hadCurrent = !!this.current.node
      if (hadCurrent) this.action.stop()
      this.current.node = target
      this.current.distance = targetDistance
      if (target) {
        this.action.start(target)
        this.emit('change', true)
      } else if (hadCurrent) {
        this.emit('change', false)
        this.emit('progress', 0)
      }
    } else if (target) {
      this.current.distance = targetDistance
    }
    this.action.update(delta)
  }

  destroy() {
    this.control.release()
    this.control = null
    this.nodes = []
  }
}

function createAction(world) {
  const widthPx = 300
  const heightPx = 44
  const pxToMeters = 0.01
  let board = null
  let mesh = null

  const draw = (label, ratio) => {
    // console.time('draw')
    if (!board) board = createBoard(widthPx, heightPx, pxToMeters, world)
    const text = board.measureText(47, heightPx / 2, label, '#ffffff', 18, 400)
    const prompt = getActionPrompt(world)
    const pillWidth = 6 + 4 + 24 + 4 + 6 + 9 + text.width + 13
    const left = (widthPx - pillWidth) / 2
    board.clear()
    board.drawBox(left, 0, pillWidth, heightPx, heightPx / 2, 'rgba(11, 10, 21, 0.97)')
    board.drawPie(left + 6, 6, 16, 100, '#5d6077') // grey
    board.drawPie(left + 6, 6, 16, ratio * 100, '#ffffff') // white
    board.drawCircle(left + 10, 10, 12, '#000000') // inner
    if (prompt) {
      const promptWidth = board.measureText(0, 0, prompt, '#ffffff', 18, 400).width
      board.drawText(left + 22 - promptWidth / 2, 14, prompt, '#ffffff', 18, 400)
    }
    board.drawText(left + 47, 14, label, '#ffffff', 18, 400) // label
    board.commit()
    // console.timeEnd('draw')
  }

  // debug
  // board.canvas.style = 'position:absolute; top:70px; left:30px; z-index:999; pointer-events:none; transform:scale(1); transform-origin:top left;' // prettier-ignore
  // document.body.appendChild(board.canvas)

  let node = null
  let cancelled = false

  const startAction = () => {
    cancelled = false
    try {
      node._onStart()
    } catch (err) {
      console.error('action.onStart:', err)
    }
  }

  const triggerAction = () => {
    try {
      node._onTrigger({ playerId: world.entities.player.data.id })
    } catch (err) {
      console.error('action.onTrigger:', err)
    }
  }

  return {
    start(_node) {
      // if (node) console.error('erm node already set')
      node = _node
      world.actions.btnDown = false
      node.progress = 0
      if (world.xr.session) {
        draw(node._label, node.progress / node._duration)
        mesh = board.getMesh()
        world.stage.scene.add(mesh)
      } else {
        world.actions.emit('progress', 0)
      }
    },
    update(delta) {
      if (!node) return
      if (world.xr.session) {
        if (!board) {
          draw(node._label, node.progress / node._duration)
          mesh = board.getMesh()
        }
        if (!mesh.parent) world.stage.scene.add(mesh)
        const pos = v1
        const qua = q1
        const sca = v2
        node.matrixWorld.decompose(pos, qua, sca)
        const camPosition = world.camera.getWorldPosition(v3)
        const distance = camPosition.distanceTo(pos)
        v4.subVectors(camPosition, pos).normalize()
        qua.setFromUnitVectors(FORWARD, v4)
        e1.setFromQuaternion(qua)
        e1.z = 0
        qua.setFromEuler(e1)
        mesh.position.copy(pos)
        mesh.quaternion.copy(qua)
        mesh.scale.copy(sca)
        const worldToScreenFactor = world.graphics.worldToScreenFactor
        const [minDistance, maxDistance] = [3, 5]
        const clampedDistance = clamp(distance, minDistance, maxDistance)
        // calculate scale factor based on the distance
        let scaleFactor = worldToScreenFactor * clampedDistance * 100
        scaleFactor *= 0.2 // shrink because its HUGE in VR
        mesh.scale.setScalar(scaleFactor)
      } else if (mesh?.parent) {
        world.stage.scene.remove(mesh)
      }
      if (world.actions.btnClick) {
        if (node.progress === 0) startAction()
        node.progress = 0
        if (!world.xr.session) world.actions.emit('progress', 0)
        triggerAction()
      } else if (world.actions.btnDown) {
        if (node.progress === 0) {
          startAction()
        }
        node.progress += delta
        if (node.progress > node._duration) node.progress = node._duration
        const progress = node._duration ? node.progress / node._duration : 1
        if (world.xr.session) draw(node._label, progress)
        else world.actions.emit('progress', progress)
        if (node.progress === node._duration) {
          node.progress = 0
          if (!world.xr.session) world.actions.emit('progress', 0)
          triggerAction()
        }
      } else if (node.progress > 0) {
        if (!cancelled) {
          try {
            node._onCancel()
          } catch (err) {
            console.error('action.onCancel:', err)
          }
          cancelled = true
        }
        node.progress -= delta
        if (node.progress < 0) node.progress = 0
        const progress = node._duration ? node.progress / node._duration : 0
        if (world.xr.session) draw(node._label, progress)
        else world.actions.emit('progress', progress)
      }
    },
    stop() {
      node = null
      if (mesh?.parent) {
        world.stage.scene.remove(mesh)
      }
    },
  }
}

export function getActionPrompt(world) {
  if (!world.xr?.session) return isTouch ? null : 'E'

  const sources = Array.from(world.xr.session.inputSources || [])
  const hasLeftController = sources.some(source => source.handedness === 'left' && source.gamepad)
  if (hasLeftController) return 'X'
  return null
}

const sizes = [128, 256, 512, 2048, 4096]

function createBoard(width, height, pxToMeters, world) {
  const max = Math.max(width, height)
  const size = sizes.find(size => size >= max)
  const pr = 1 // window.devicePixelRatio
  const canvas = document.createElement('canvas')
  canvas.width = size * pr
  canvas.height = size * pr
  // console.log('board', canvas.width, canvas.height)
  const ctx = canvas.getContext('2d')

  let texture
  let mesh

  return {
    canvas,
    drawBox(x, y, width, height, radius, color) {
      x *= pr
      y *= pr
      width *= pr
      height *= pr
      radius *= pr
      ctx.fillStyle = color
      ctx.beginPath()
      ctx.moveTo(x + radius, y) // start left center
      ctx.arcTo(x + width, y, x + width, y + height, radius) // right edge
      ctx.arcTo(x + width, y + height, x, y + height, radius) // bottom edge
      ctx.arcTo(x, y + height, x, y, radius) // left edge
      ctx.arcTo(x, y, x + width, y, radius) // top edge
      ctx.closePath()
      ctx.fill()
    },
    drawCircle(x, y, radius, color) {
      x *= pr
      y *= pr
      radius *= pr
      const centerX = x + radius
      const centerY = y + radius
      ctx.beginPath()
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
      ctx.fillStyle = color
      ctx.fill()
    },
    drawPie(x, y, radius, percent, color, offset = 0) {
      x *= pr
      y *= pr
      radius *= pr
      const offsetRadians = (offset * Math.PI) / 180
      const startAngle = -0.5 * Math.PI + offsetRadians
      const endAngle = startAngle + (percent / 100) * 2 * Math.PI
      ctx.beginPath()
      ctx.moveTo(x + radius, y + radius)
      ctx.arc(x + radius, y + radius, radius, startAngle, endAngle)
      ctx.lineTo(x + radius, y + radius)
      ctx.closePath()
      ctx.fillStyle = color
      ctx.fill()
    },
    measureText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
      fontSize *= pr
      ctx.font = `${fontWeight} ${fontSize}px ${font}`
      const metrics = ctx.measureText(text)
      return {
        width: metrics.width / pr,
      }
    },
    drawText(x, y, text, color, fontSize = 16, fontWeight = 400, font = 'Rubik') {
      x *= pr
      y *= pr
      // y -= fontSize / 2 // no idea why but yup
      fontSize *= pr
      ctx.fillStyle = color
      ctx.font = `${fontWeight} ${fontSize}px ${font}`
      ctx.textAlign = 'left'
      ctx.textBaseline = 'top'
      ctx.fillText(text, x, y)
    },
    getMesh() {
      if (mesh) return mesh
      const offsetX = 0 // top left for now
      const offsetY = 0
      texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = world.graphics.maxAnisotropy
      // texture.minFilter = texture.magFilter = THREE.LinearFilter
      texture.minFilter = THREE.LinearFilter
      texture.magFilter = THREE.LinearFilter
      // texture.generateMipmaps = false
      const geometry = new THREE.BufferGeometry()
      const halfWidth = (width * pxToMeters) / 2
      const halfHeight = (height * pxToMeters) / 2
      // prettier-ignore
      const vertices = new Float32Array([
        halfWidth, -halfHeight, 0,  // vertex 3 (bottom right)
        halfWidth, halfHeight, 0,   // vertex 2 (top right)
        -halfWidth, halfHeight, 0,  // vertex 1 (top left)
        -halfWidth, -halfHeight, 0, // vertex 0 (bottom left)
      ])
      geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      const uvX1 = offsetX / size
      const uvY1 = 1 - offsetY / size
      const uvX2 = (offsetX + width) / size
      const uvY2 = 1 - (offsetY + height) / size
      // prettier-ignore
      const uvs = new Float32Array([
        uvX2, uvY2,  // UV for vertex 3
        uvX2, uvY1,  // UV for vertex 2
        uvX1, uvY1,  // UV for vertex 1
        uvX1, uvY2,  // UV for vertex 0
      ])
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2))
      // prettier-ignore
      const indices = new Uint16Array([
        0, 1, 2,  // First triangle
        2, 3, 0   // Second triangle
      ])
      geometry.setIndex(new THREE.BufferAttribute(indices, 1))
      const material = new THREE.MeshBasicMaterial({ map: texture })
      material.toneMapped = false
      // create mesh
      mesh = new THREE.Mesh(geometry, material)
      // console.log(mesh)
      // always on top
      material.depthTest = false
      material.depthWrite = false
      material.transparent = true
      mesh.renderOrder = 999
      return mesh
    },
    commit() {
      if (!texture) return
      texture.needsUpdate = true
    },
    clear() {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
    },
  }
}
