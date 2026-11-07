// Derived from the Hyperfy cognac leather sofa in outputs/cognac-leather-furniture.
// Geometry-only conversion. Sitting, shadow toggles and original collider boxes are not included.
import { BoxGeometry, BufferGeometry, CylinderGeometry, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial, Shape } from 'three'
import { mergeVertices, toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js'

type Vec3 = [number, number, number]
type Profile = [number, number][]
type ColorRole = { value: string; role: string }
type ControlBase = { key: string; label: string; group: string; unit: string; hint: string; affects: string[]; targets: string[] }
type SofaControl = ControlBase & (
  | { kind: 'range' | 'integer'; min: number; max: number; step: number; default: number }
  | { kind: 'color'; default: string; role: string }
)
type PrimProps = {
  size?: number[]; profile?: Profile; depth?: number; position?: Vec3; rotation?: Vec3; color: ColorRole
  roughness?: number; metalness?: number; castShadow?: boolean; receiveShadow?: boolean
  bevelEnabled?: boolean; bevelThickness?: number; bevelSize?: number; bevelSegments?: number
  curveSegments?: number; smooth?: boolean; creaseAngle?: number
}
type PanelOptions = {
  bevelSize?: number; bevelThickness?: number; profileSegs?: number; roughness?: number
  bevelSegments?: number; curveSegments?: number; piping?: boolean
}

export const metadata: {
  id: string; version: string; title: string; description: string; controls: SofaControl[]
  presets: { id: string; name: string; description: string; parameters: Record<string, number | string> }[]
  palettes: []; defaults: Record<string, number | string>
} = {
  id: 'cognac-leather-sofa', version: '1.1.0', title: 'Cognac leather sofa',
  description: 'Beveled leather sofa adapted from the Hyperfy three-seat app.',
  controls: [
    { key: 'seatCount', label: 'Seats', kind: 'integer', group: 'construction', unit: 'count', min: 1, max: 5, step: 1, default: 3, hint: 'Number of cushions and seats.', affects: ['topology'], targets: ['seat', 'back'] },
    { key: 'seatWidth', label: 'Seat width', kind: 'range', group: 'shape', unit: 'm', min: 0.55, max: 0.95, step: 0.01, default: 0.70, hint: 'Width of each cushion in metres.', affects: ['geometry'], targets: ['seat', 'back'] },
    { key: 'seatDepth', label: 'Seat cushion depth', kind: 'range', group: 'shape', unit: 'm', min: 0.55, max: 0.75, step: 0.01, default: 0.66, hint: 'Depth of the seat cushion extrusion.', affects: ['geometry'], targets: ['seat'] },
    { key: 'backDepth', label: 'Back cushion depth', kind: 'range', group: 'shape', unit: 'm', min: 0.16, max: 0.28, step: 0.01, default: 0.22, hint: 'Depth of the back cushion extrusion.', affects: ['geometry'], targets: ['back'] },
    { key: 'armDepth', label: 'Arm depth', kind: 'range', group: 'shape', unit: 'm', min: 0.75, max: 0.95, step: 0.01, default: 0.84, hint: 'Depth of the arm extrusion.', affects: ['geometry'], targets: ['arms'] },
    { key: 'seatRadius', label: 'Seat corner radius', kind: 'range', group: 'shape', unit: 'm', min: 0.05, max: 0.10, step: 0.01, default: 0.08, hint: 'Roundness of the seat cushion profile.', affects: ['geometry'], targets: ['seat'] },
    { key: 'backRadius', label: 'Back corner radius', kind: 'range', group: 'shape', unit: 'm', min: 0.05, max: 0.12, step: 0.01, default: 0.09, hint: 'Roundness of the back cushion profile.', affects: ['geometry'], targets: ['back'] },
    { key: 'armRadius', label: 'Arm corner radius', kind: 'range', group: 'shape', unit: 'm', min: 0.05, max: 0.11, step: 0.01, default: 0.09, hint: 'Roundness of the arm profile.', affects: ['geometry'], targets: ['arms'] },
    { key: 'bevelSize', label: 'Bevel size (mm)', kind: 'integer', group: 'shape', unit: 'mm', min: 2, max: 22, step: 1, default: 20, hint: 'Seat cushion bevel size; other panels scale proportionally.', affects: ['geometry'], targets: ['seat', 'back', 'arms'] },
    { key: 'bevelThickness', label: 'Bevel depth (mm)', kind: 'integer', group: 'shape', unit: 'mm', min: 2, max: 25, step: 1, default: 18, hint: 'Seat cushion bevel depth; other panels scale proportionally.', affects: ['geometry'], targets: ['seat', 'back', 'arms'] },
    { key: 'color.leather', label: 'Leather', kind: 'color', group: 'colors', unit: 'color', default: '#8a4f2b', role: 'leather', hint: 'Arms and all cushions.', affects: ['material'], targets: ['arms', 'seat', 'back'] },
    { key: 'color.leatherDark', label: 'Dark leather', kind: 'color', group: 'colors', unit: 'color', default: '#6d3b22', role: 'leatherDark', hint: 'Base and seams.', affects: ['material'], targets: ['base'] },
    { key: 'color.piping', label: 'Piping', kind: 'color', group: 'colors', unit: 'color', default: '#b8774b', role: 'piping', hint: 'Piping and stitching.', affects: ['material'], targets: ['piping'] },
    { key: 'color.wood', label: 'Feet', kind: 'color', group: 'colors', unit: 'color', default: '#2b1b13', role: 'wood', hint: 'Wooden feet.', affects: ['material'], targets: ['feet'] },
  ],
  presets: [{ id: 'three-seat', name: 'Three-seat sofa', description: 'Original cognac leather sofa.', parameters: {} }],
  palettes: [], defaults: {},
}
metadata.defaults = Object.fromEntries(metadata.controls.map(control => [control.key, control.default]))

export function createAsset(input: Record<string, number | string | boolean> = {}) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an object of sofa parameters')
  const keys = new Set(metadata.controls.map(control => control.key))
  if (Object.keys(input).some(key => !keys.has(key))) throw new Error('Unknown sofa parameter')
  const applied = { ...metadata.defaults, ...input }
  for (const control of metadata.controls) {
    const value = applied[control.key]
    if (control.kind === 'color' ? typeof value !== 'string' || !/^#[a-f0-9]{6}$/i.test(value)
      : typeof value !== 'number' || !Number.isFinite(value) || value < control.min || value > control.max || (control.kind === 'integer' && !Number.isInteger(value))) {
      throw new Error('Invalid sofa parameter: ' + control.key)
    }
  }
  const SEAT_COUNT = Number(applied.seatCount)
  const C = Object.fromEntries(['leather', 'leatherDark', 'piping', 'wood'].map(role =>
    [role, { value: String(applied['color.' + role]), role }])) as Record<'leather' | 'leatherDark' | 'piping' | 'wood', ColorRole>
  const root = new Group()
  root.name = 'cognac-leather-sofa'
  root.userData.design = { formatVersion: 1, family: metadata.id, familyVersion: metadata.version, requested: { ...input }, applied: { ...applied } }

  function addPrim(parent: Group | null, type: 'box' | 'cylinder' | 'extrude', props: PrimProps) {
    let geometry: BufferGeometry
    if (type === 'box') geometry = new BoxGeometry(props.size![0], props.size![1], props.size![2])
    else if (type === 'cylinder') geometry = new CylinderGeometry(props.size![0], props.size![1], props.size![2], 20)
    else if (type === 'extrude') {
      const shape = new Shape()
      shape.moveTo(...props.profile![0]!)
      for (const point of props.profile!.slice(1)) shape.lineTo(...point)
      shape.closePath()
      geometry = new ExtrudeGeometry(shape, {
        depth: props.depth, bevelEnabled: props.bevelEnabled, bevelThickness: props.bevelThickness,
        bevelSize: props.bevelSize, bevelSegments: props.bevelSegments, curveSegments: props.curveSegments,
      })
      if (props.smooth) {
        const merged = mergeVertices(geometry)
        geometry.dispose()
        geometry = toCreasedNormals(merged, props.creaseAngle ?? Math.PI / 3)
        merged.dispose()
      }
      geometry.center()
    } else throw new Error('Unsupported sofa geometry: ' + type)
    const material = new MeshStandardMaterial({ color: props.color.value, roughness: props.roughness ?? 0.5, metalness: props.metalness ?? 0.02 })
    const node = new Mesh(geometry, material)
    node.userData.materialRole = props.color.role
    node.position.fromArray(props.position || [0, 0, 0])
    node.rotation.fromArray(props.rotation || [0, 0, 0])
    node.castShadow = props.castShadow !== false
    node.receiveShadow = props.receiveShadow !== false
    ;(parent || root).add(node)
    return node
  }
  function box(parent: Group | null, size: Vec3, position: Vec3, color: ColorRole, rotation: Vec3 = [0, 0, 0], extra: Partial<PrimProps> = {}) {
    return addPrim(parent, 'box', { size, position, color, rotation, ...extra })
  }
  function cylinder(parent: Group | null, radius: number, height: number, position: Vec3, color: ColorRole, rotation: Vec3 = [0, 0, 0], extra: Partial<PrimProps> = {}) {
    return addPrim(parent, 'cylinder', { size: [radius, radius, height], position, color, rotation, ...extra })
  }
  function extrudePrim(parent: Group | null, profile: Profile, depth: number, position: Vec3, color: ColorRole, rotation: Vec3 = [0, 0, 0], extra: Partial<PrimProps> = {}) {
    return addPrim(parent, 'extrude', {
      profile, depth, position, color, rotation, curveSegments: extra.curveSegments ?? 10,
      bevelEnabled: extra.bevelEnabled ?? true, bevelSize: extra.bevelSize ?? 0.018,
      bevelThickness: extra.bevelThickness ?? 0.016, bevelSegments: extra.bevelSegments ?? 4,
      smooth: extra.smooth ?? true, creaseAngle: extra.creaseAngle ?? Math.PI / 3, ...extra,
    })
  }
  function group(position: Vec3 = [0, 0, 0], rotation: Vec3 = [0, 0, 0]) {
    const node = new Group()
    node.position.fromArray(position)
    node.rotation.fromArray(rotation)
    root.add(node)
    return node
  }
function roundedRectProfile(w: number, h: number, r: number, seg = 6): Profile {
  const pts: Profile = []
  function arc(cx: number, cy: number, a0: number, a1: number, includeStart = false) {
    for (let i = includeStart ? 0 : 1; i <= seg; i++) {
      const t = a0 + (a1 - a0) * (i / seg)
      pts.push([cx + Math.cos(t) * r, cy + Math.sin(t) * r])
    }
  }
  arc(w / 2 - r, -h / 2 + r, -Math.PI / 2, 0, true)
  arc(w / 2 - r, h / 2 - r, 0, Math.PI / 2)
  arc(-w / 2 + r, h / 2 - r, Math.PI / 2, Math.PI)
  arc(-w / 2 + r, -h / 2 + r, Math.PI, Math.PI * 1.5)
  return pts
}

function pipingFront(parent: Group, w: number, h: number, d: number, r: number, color = C.piping) {
  const z = -d / 2 - 0.010
  const rr = 0.008
  const horizontal = w - 2 * r
  const vertical = h - 2 * r
  const y = h / 2 - r
  const x = w / 2 - r
  cylinder(parent, rr, horizontal, [0, y, z], color, [0, 0, Math.PI / 2], { roughness: 0.58 })
  cylinder(parent, rr, horizontal, [0, -y, z], color, [0, 0, Math.PI / 2], { roughness: 0.58 })
  cylinder(parent, rr, vertical, [x, 0, z], color, [0, 0, 0], { roughness: 0.58 })
  cylinder(parent, rr, vertical, [-x, 0, z], color, [0, 0, 0], { roughness: 0.58 })
}

function extrudedRoundedPanel(position: Vec3, rotation: Vec3, size: Vec3, radius: number, color: ColorRole, options: PanelOptions = {}) {
  const g = group(position, rotation)
  const bevelSize = (options.bevelSize ?? 0.018) * (Number(applied.bevelSize) / 20)
  const bevelThickness = (options.bevelThickness ?? 0.016) * (Number(applied.bevelThickness) / 18)
  extrudePrim(g, roundedRectProfile(size[0], size[1], radius, options.profileSegs ?? 7), size[2], [0, 0, 0], color, [0, 0, 0], {
    roughness: options.roughness ?? 0.46,
    bevelEnabled: true,
    bevelSize,
    bevelThickness,
    bevelSegments: options.bevelSegments ?? 4,
    curveSegments: options.curveSegments ?? 10,
  })
  if (options.piping !== false) pipingFront(g, size[0], size[1], size[2], radius)
  return g
}

function stitchDash(parent: Group | null, pos: Vec3, rot: Vec3 = [0, 0, 0], size: Vec3 = [0.025, 0.006, 0.006]) {
  box(parent, size, pos, C.piping, rot, { roughness: 0.64, castShadow: false })
}

function addArmStitching(x: number, armD: number) {
  const frontZ = -armD / 2 - 0.006
  const baseY = 0.39
  for (let i = 0; i < 8; i++) {
    const y = baseY + i * 0.052
    stitchDash(null, [x, y, frontZ], [0, 0, 0], [0.006, 0.024, 0.006])
  }
  const topY = 0.81
  for (let i = 0; i < 8; i++) {
    const z = -0.30 + i * 0.085
    stitchDash(null, [x, topY, z], [Math.PI / 2, 0, 0], [0.006, 0.024, 0.006])
  }
}

function buildCouch() {
  const seatW = Number(applied.seatWidth)
  const gap = 0.008
  const armW = 0.235
  const innerW = SEAT_COUNT * seatW + (SEAT_COUNT - 1) * gap
  const totalW = innerW + armW * 2 + 0.012
  const leftInner = -innerW / 2

  const footX = totalW / 2 - 0.16
  for (const x of [-footX, footX]) {
    for (const z of [-0.285, 0.275]) {
      box(null, [0.13, 0.18, 0.13], [x, 0.09, z], C.wood, [0.02 * Math.sign(z), 0, 0.015 * Math.sign(x)], { roughness: 0.78 })
    }
  }

  box(null, [totalW - 0.02, 0.30, 0.78], [0, 0.30, 0.03], C.leatherDark, [0, 0, 0], { roughness: 0.53 })
  extrudedRoundedPanel([0, 0.38, -0.33], [0, 0, 0], [totalW - 0.04, 0.11, 0.07], 0.035, C.leather, {
    piping: false,
    bevelSize: 0.012,
    bevelThickness: 0.010,
    roughness: 0.50,
    profileSegs: 5,
  })
  box(null, [innerW + 0.08, 0.27, 0.18], [0, 0.675, 0.30], C.leatherDark, [0.04, 0, 0], { roughness: 0.55 })

  const armX = innerW / 2 + armW / 2 + 0.006
  const armSize: Vec3 = [armW, 0.65, Number(applied.armDepth)]
  for (const x of [-armX, armX]) {
    extrudedRoundedPanel([x, 0.56, 0.015], [0, 0, 0], armSize, Number(applied.armRadius), C.leather, {
      piping: false,
      bevelSize: 0.02,
      bevelThickness: 0.018,
      profileSegs: 7,
      roughness: 0.47,
    })
    const ag = group([x, 0.56, 0.015], [0, 0, 0])
    pipingFront(ag, armSize[0], armSize[1], armSize[2], Number(applied.armRadius), C.piping)
    addArmStitching(x, armSize[2])
  }

  for (let i = 0; i < SEAT_COUNT; i++) {
    const x = leftInner + seatW / 2 + i * (seatW + gap)
    const seatY = 0.545
    const seatZ = -0.085
    const seat = extrudedRoundedPanel([x, seatY, seatZ], [0, 0, 0], [seatW + 0.04, 0.21, Number(applied.seatDepth)], Number(applied.seatRadius), C.leather, {
      bevelSize: 0.02,
      bevelThickness: 0.018,
      profileSegs: 8,
      roughness: 0.44,
    })
    seat.name = `seat-cushion-${i + 1}`

    const back = extrudedRoundedPanel([x, 0.79, 0.245], [0.14, 0, 0], [seatW + 0.025, 0.51, Number(applied.backDepth)], Number(applied.backRadius), C.leather, {
      bevelSize: 0.018,
      bevelThickness: 0.016,
      profileSegs: 8,
      roughness: 0.46,
    })
    back.name = `back-cushion-${i + 1}`
    box(back, [0.018, 0.30, 0.014], [0, -0.015, -Number(applied.backDepth) / 2], C.leatherDark, [0, 0, 0], { roughness: 0.62, castShadow: false })
  }

  const seamZ = -0.35
  cylinder(null, 0.007, totalW - 0.16, [0, 0.405, seamZ], C.piping, [0, 0, Math.PI / 2], { roughness: 0.62 })
  for (let i = 1; i < SEAT_COUNT; i++) {
    const x = -innerW / 2 + i * seatW + (i - 0.5) * gap
    cylinder(null, 0.006, 0.18, [x, 0.285, seamZ], C.piping, [0, 0, 0], { roughness: 0.62 })
  }
  for (let i = 0; i < SEAT_COUNT; i++) {
    const x = leftInner + seatW / 2 + i * (seatW + gap)
    box(null, [seatW + 0.015, 0.04, 0.06], [x, 0.448, -0.345], C.leatherDark, [0, 0, 0], { roughness: 0.68 })
  }

  return totalW
}


  buildCouch()
  root.updateMatrixWorld(true)
  return root
}

export function disposeAsset(root: Group) {
  root.traverse(node => {
    if (node instanceof Mesh) {
      node.geometry.dispose()
      for (const material of Array.isArray(node.material) ? node.material : [node.material]) material.dispose()
    }
  })
}
