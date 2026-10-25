// Hyperfy laser-cut T-Rex skeleton display.
// Coordinate system: +Y up, +X toward the skull, -Z is Hyperfy forward.
// Construction style follows the CC0 p7ymwnp7 3 mm T-Rex press-fit puzzle reference.
// All visible structural plates are native `extrude` prims with tiny bevels.

const WOOD = '#D7B57A'
const WOOD_LIGHT = '#E5C895'
const PLATE = 0.038
// Adjacent side plates have a visible clearance beyond the beveled thickness.
const LAYER = 0.05
const PI = Math.PI

function addPrim(parent, type, props = {}) {
  const node = app.create('prim', {
    type,
    castShadow: true,
    receiveShadow: true,
    roughness: props.roughness ?? 0.72,
    metalness: 0,
    physics: props.physics ?? null,
    ...props,
  })
  if (parent) parent.add(node)
  else app.add(node)
  return node
}

function group(position = [0,0,0], rotation = [0,0,0]) {
  const g = app.create('group', { position, rotation })
  app.add(g)
  return g
}

function extrude(parent, profile, depth, color, extra = {}) {
  return addPrim(parent, 'extrude', {
    profile,
    depth,
    color,
    bevelEnabled: extra.bevelEnabled ?? true,
    bevelThickness: extra.bevelThickness ?? 0.004,
    bevelSize: extra.bevelSize ?? 0.004,
    bevelSegments: extra.bevelSegments ?? 2,
    curveSegments: extra.curveSegments ?? 10,
    smooth: extra.smooth ?? true,
    creaseAngle: extra.creaseAngle ?? PI/3,
    roughness: extra.roughness ?? 0.72,
    ...extra,
  })
}

function woodPiece(profile, position, rotation=[0,0,0], depth=PLATE, color=WOOD) {
  const g = group(position, rotation)
  // One solid per kit piece: no overlapping decorative extrusion.
  extrude(g, profile, depth, color, {
    bevelThickness: 0.004,
    bevelSize: 0.004,
    bevelSegments: 2,
    smooth: true,
    creaseAngle: PI/3,
  })
  return g
}

function ellipseProfile(rx, ry, n=20) {
  const pts=[]
  for (let i=0;i<n;i++) {
    const a=i/n*PI*2
    pts.push([Math.cos(a)*rx, Math.sin(a)*ry])
  }
  return pts
}

function capsuleProfile(length, width, n=7) {
  const r=width/2
  const x=length/2-r
  const pts=[]
  for (let i=0;i<=n;i++) {
    const a=-PI/2 + i/n*PI
    pts.push([x+Math.cos(a)*r, Math.sin(a)*r])
  }
  for (let i=0;i<=n;i++) {
    const a=PI/2 + i/n*PI
    pts.push([-x+Math.cos(a)*r, Math.sin(a)*r])
  }
  return pts
}

function plateBetween(a, b, width, z, color=WOOD_LIGHT, depth=PLATE) {
  const dx=b[0]-a[0], dy=b[1]-a[1]
  const len=Math.hypot(dx,dy)
  const angle=Math.atan2(dy,dx)
  return woodPiece(capsuleProfile(len,width,6), [(a[0]+b[0])/2,(a[1]+b[1])/2,z], [0,0,angle], depth, color)
}

function ribProfile(width, height, thickness) {
  // Open-bottom horseshoe band. It is one simple concave polygon, so it works with the extrude primitive without holes.
  const w=width/2, h=height/2, t=thickness
  return [
    [-w, h*0.70], [-w*0.90,h], [-w*0.38,h*1.13], [0,h*1.18], [w*0.38,h*1.13], [w*0.90,h], [w,h*0.70],
    [w*0.91,h*0.20], [w*0.78,-h*0.36], [w*0.58,-h], [w*0.58-t,-h], [w*0.68,-h*0.31],
    [w*0.77,h*0.18], [w*0.83,h*0.62], [w*0.69,h*0.78], [w*0.34,h*0.91], [0,h*0.96],
    [-w*0.34,h*0.91], [-w*0.69,h*0.78], [-w*0.83,h*0.62], [-w*0.77,h*0.18], [-w*0.68,-h*0.31],
    [-w*0.58+t,-h], [-w*0.58,-h], [-w*0.78,-h*0.36], [-w*0.91,h*0.20],
  ]
}

function spineProfile() {
  // Side plate: tapering tail, sacrum and neck with press-fit-looking vertebral tabs.
  return [
    [-2.42,0.02],[-2.18,0.08],[-1.98,0.15],[-1.78,0.22],[-1.55,0.31],[-1.34,0.39],[-1.12,0.47],[-0.92,0.54],[-0.72,0.61],
    [-0.50,0.70],[-0.28,0.78],[-0.06,0.83],[0.18,0.86],[0.42,0.88],[0.68,0.86],[0.91,0.81],[1.08,0.76],
    [1.08,0.66],[0.91,0.68],[0.69,0.72],[0.43,0.73],[0.18,0.72],[-0.06,0.69],[-0.30,0.63],[-0.53,0.56],
    [-0.76,0.48],[-0.98,0.39],[-1.20,0.31],[-1.43,0.23],[-1.67,0.16],[-1.92,0.10],[-2.18,0.04],
  ]
}

function pelvisProfile() {
  return [
    [-0.43,0.10],[-0.34,0.32],[-0.17,0.43],[0.06,0.44],[0.25,0.31],[0.33,0.12],[0.25,-0.07],[0.09,-0.13],
    [0.00,0.05],[-0.10,0.13],[-0.18,-0.02],[-0.29,-0.15],[-0.42,-0.10],[-0.50,0.00],
  ]
}

function shoulderBladeProfile() {
  return [[-0.26,0.00],[-0.15,0.25],[0.03,0.35],[0.18,0.26],[0.23,0.05],[0.10,-0.10],[-0.08,-0.16],[-0.23,-0.10]]
}

function skullTopProfile() {
  // Upper cranium / snout; lower edge is deliberately open/stepped to retain a skeletal look.
  return [
    [-0.42,-0.08],[-0.38,0.18],[-0.24,0.34],[0.02,0.42],[0.31,0.36],[0.54,0.25],[0.67,0.10],[0.64,-0.02],
    [0.47,-0.01],[0.39,-0.09],[0.25,-0.03],[0.13,-0.13],[-0.02,-0.06],[-0.15,-0.15],[-0.27,-0.08],
  ]
}

function snoutProfile() {
  // Upper jaw beam with coarse teeth silhouette.
  return [
    [-0.30,0.09],[0.42,0.10],[0.58,0.04],[0.60,-0.04],[0.49,-0.05],[0.43,-0.13],[0.34,-0.05],[0.26,-0.14],
    [0.17,-0.05],[0.08,-0.14],[-0.01,-0.05],[-0.10,-0.13],[-0.18,-0.04],[-0.30,-0.03],
  ]
}

function jawProfile() {
  // Lower teeth point upward toward the upper jaw.
  return [
    [-0.38,-0.08],[0.39,-0.07],[0.55,-0.00],[0.43,0.08],[0.31,0.05],[0.23,0.12],[0.14,0.05],[0.05,0.12],
    [-0.04,0.05],[-0.13,0.11],[-0.21,0.04],[-0.34,0.02],[-0.43,-0.02],
  ]
}

function neckPlateProfile() {
  return [[-0.23,-0.32],[-0.08,-0.12],[-0.04,0.19],[0.08,0.32],[0.22,0.23],[0.17,0.06],[0.08,-0.06],[0.04,-0.29],[-0.08,-0.38]]
}

function footProfile() {
  return [[-0.30,-0.06],[-0.05,-0.10],[0.15,-0.08],[0.34,-0.02],[0.28,0.06],[0.09,0.09],[-0.05,0.07],[-0.16,0.13],[-0.27,0.10]]
}

function clawProfile() {
  return [[-0.08,-0.05],[0.13,-0.08],[0.23,-0.02],[0.13,0.04],[-0.05,0.05]]
}

// --- Main axial plate -------------------------------------------------------
// The reference press-fit kit uses a side spine carrying tail, torso and neck pieces.
// Hyperfy centers every extrusion on its bounds. The spine outline's center
// is [-0.67, 0.45], so restore that offset to its intended [-0.10, 0.76]
// anchor. Center the profile explicitly before placing the plate.
const spine = spineProfile().map(([x, y]) => [x + 0.67, y - 0.45])
woodPiece(spine, [-0.77,1.21,0], [0,0,0], PLATE, WOOD)

// Vertebral cross-plates down the tail. They progressively shrink like the source kit.
for (let i=0;i<15;i++) {
  const t=i/14
  const x=-2.18 + t*1.47
  const y=0.79 + t*0.50
  const w=0.13 + t*0.30
  const h=0.12 + t*0.18
  woodPiece(ellipseProfile(w,h,14), [x,y,0], [0,PI/2,0], PLATE, i%2 ? WOOD : WOOD_LIGHT)
}

// Pelvis: paired side plates, separated like laser-cut puzzle laminations.
for (const z of [-0.105,0.105]) {
  woodPiece(pelvisProfile(), [-0.48,1.17,z], [0,0,0], PLATE, WOOD_LIGHT)
}

// Shoulder blades.
for (const z of [-0.13,0.13]) {
  woodPiece(shoulderBladeProfile(), [0.48,1.46,z], [0,0,0], PLATE, WOOD_LIGHT)
}

// Rib cage cross-plates. Each one crosses the axial spine at 90 degrees.
const ribStations=[
  [0.02,0.76,0.86],[0.16,0.82,0.91],[0.30,0.87,0.94],[0.44,0.91,0.92],
  [0.58,0.94,0.86],[0.72,0.96,0.78],[0.85,0.96,0.68],
]
for (const [x,w,h] of ribStations) {
  woodPiece(ribProfile(w,h,0.075), [x,1.34,0], [0,PI/2,0], PLATE, WOOD)
}

// Neck cross plates.
for (let i=0;i<5;i++) {
  const x=0.88+i*0.11
  const y=1.55+i*0.055
  const w=0.47-i*0.045
  woodPiece(ellipseProfile(w,0.18,14), [x,y,0], [0,PI/2,0], PLATE, WOOD_LIGHT)
}

// Neck side laminations connecting ribs to skull.
for (const z of [-0.055,0.055]) {
  woodPiece(neckPlateProfile(), [1.07,1.62,z], [0,0,-0.18], PLATE, WOOD)
}

// --- Skull -----------------------------------------------------------------
// Stagger neck, cranium and snout plates across separate layers.
for (const z of [-0.055,0.055]) {
  woodPiece(skullTopProfile(), [1.50,1.93,z + Math.sign(z)*LAYER], [0,0,0], PLATE, WOOD_LIGHT)
  woodPiece(snoutProfile(), [1.68,1.78,z + Math.sign(z)*LAYER*2], [0,0,-0.02], PLATE, WOOD)
  // Match the upper tooth row, inset 5 mm to avoid coplanar faces.
  // Tilt the jaw down 16 degrees, keeping its rear near the original hinge.
  woodPiece(jawProfile(), [1.65,1.47,z + Math.sign(z)*(LAYER*2 - 0.005)], [0,0,-0.28], PLATE, WOOD_LIGHT)
}
// Skull spacers / slot tabs crossing the side laminations.
for (const [x,y,w,h] of [[1.30,1.95,0.25,0.12],[1.60,1.99,0.23,0.12],[1.83,1.87,0.19,0.10]]) {
  woodPiece(ellipseProfile(w,h,12), [x,y,0], [0,PI/2,0], PLATE, WOOD)
}

// --- Hind legs --------------------------------------------------------------
for (const side of [-1,1]) {
  const z=side*0.17
  // femur angles forward from hip, then shin drops almost vertically.
  plateBetween([-0.47,1.18],[-0.18,0.73],0.14,z,WOOD_LIGHT)
  plateBetween([-0.18,0.73],[-0.28,0.25],0.12,z+side*LAYER,WOOD)
  // ankle / metatarsal
  plateBetween([-0.28,0.25],[-0.08,0.08],0.095,z+side*LAYER*2,WOOD_LIGHT)
  woodPiece(footProfile(), [0.04,0.075,z+side*LAYER*3], [0,0,0.02*side], PLATE, WOOD)
  // three toe/claw laminations
  woodPiece(clawProfile(), [0.25,0.055,z+side*LAYER*4], [0,0,-0.08], PLATE*0.82, WOOD_LIGHT)
  woodPiece(clawProfile(), [0.20,0.038,z+side*LAYER*5], [0,0,-0.16], PLATE*0.78, WOOD)
}

// --- Small forearms ---------------------------------------------------------
for (const side of [-1,1]) {
  const z=side*0.18
  plateBetween([0.98,1.53],[1.18,1.34],0.085,z,WOOD_LIGHT,PLATE*0.86)
  plateBetween([1.18,1.34],[1.34,1.44],0.070,z+side*LAYER,WOOD,PLATE*0.82)
  // two tiny fingers
  plateBetween([1.34,1.44],[1.43,1.48],0.035,z+side*LAYER*2,WOOD_LIGHT,PLATE*0.66)
  plateBetween([1.33,1.43],[1.42,1.39],0.032,z+side*LAYER*3,WOOD_LIGHT,PLATE*0.62)
}

// Small sacrum cross plates around the hip.
for (let i=0;i<4;i++) {
  const x=-0.72+i*0.14
  woodPiece(ellipseProfile(0.34-i*0.02,0.23,14), [x,1.24,0], [0,PI/2,0], PLATE, WOOD)
}

// Invisible static collision: a few broad shapes rather than a collider per laser-cut plate.
function collider(size, pos, rot=[0,0,0]) {
  addPrim(null,'box',{
    size, position:pos, rotation:rot,
    color:'#ffffff', opacity:0,
    castShadow:false, receiveShadow:false,
    physics:'static', roughness:1,
  })
}
collider([2.0,0.95,0.72],[0.10,1.30,0],[0,0,-0.04])
collider([0.88,0.62,0.46],[1.55,1.78,0])
collider([1.85,0.28,0.40],[-1.53,0.82,0],[0,0,0.24])
collider([0.26,1.18,0.24],[-0.20,0.58,-0.17],[0,0,-0.12])
collider([0.26,1.18,0.24],[-0.20,0.58,0.17],[0,0,-0.12])
