// Fire Lookout Tower — Hyperfy primitive-only app
// Y-up. Avatar-scale. No external meshes, textures, or images.

const C = {
  steel: '#4c5358',
  steelDark: '#30363a',
  wood: '#9a754f',
  woodDark: '#654b33',
  cabin: '#b45f3c',
  trim: '#e9e1d2',
  glass: '#6f9eb0',
  roof: '#354a43',
  concrete: '#888b88',
  solar: '#263e5a',
  solarLine: '#7790a5',
  red: '#d1493f',
  white: '#f2eee4',
  yellow: '#d5a83a',
}

function prim(type, size, position, color, rotation=[0,0,0], extra={}) {
  const node = app.create('prim', {
    type,
    size,
    position,
    rotation,
    color,
    castShadow: true,
    receiveShadow: true,
    roughness: 0.68,
    metalness: 0.08,
    ...extra,
  })
  app.add(node)
  return node
}

const box = (size, pos, color, rot=[0,0,0], extra={}) => prim('box', size, pos, color, rot, extra)
const sphere = (r, pos, color, extra={}) => prim('sphere', [r], pos, color, [0,0,0], extra)
const cylinder = (rt, rb, h, pos, color, rot=[0,0,0], extra={}) => prim('cylinder', [rt,rb,h], pos, color, rot, extra)
const cone = (r, h, pos, color, rot=[0,0,0], extra={}) => prim('cone', [r,h], pos, color, rot, extra)

// Concrete footings.
for (const x of [-1.75, 1.75]) {
  for (const z of [-1.75, 1.75]) {
    box([0.72,0.35,0.72],[x,0.175,z],C.concrete)
    box([0.38,0.30,0.38],[x,0.50,z],C.steelDark)
  }
}

// Four primary tower legs, tapered inward using exact endpoint alignment.
const levels = [0.65, 2.35, 4.05, 5.75]
const halfWidths = [1.72, 1.52, 1.32, 1.14]
for (let i=0; i<levels.length-1; i++) {
  const y0 = levels[i], y1 = levels[i+1]
  const w0 = halfWidths[i], w1 = halfWidths[i+1]
  const dy = y1-y0
  for (const sx of [-1,1]) {
    for (const sz of [-1,1]) {
      const dx = sx*(w1-w0)
      const dz = sz*(w1-w0)
      const len = Math.hypot(dx,dy,dz)
      // A box's long local Y axis is rotated so its ends land exactly on
      // [sx*w0,y0,sz*w0] and [sx*w1,y1,sz*w1].
      const rx = Math.asin(dz/len)
      const rz = Math.atan2(-dx,dy)
      const x = sx*(w0+w1)/2
      const z = sz*(w0+w1)/2
      box([0.16,len+0.05,0.16],[x,(y0+y1)/2,z],C.steel,[rx,0,rz],{metalness:0.55,roughness:0.38})
    }
  }
}

// Horizontal frames at each level.
for (let i=0; i<levels.length; i++) {
  const y=levels[i], w=halfWidths[i]*2
  box([w,0.12,0.12],[0,y,-halfWidths[i]],C.steelDark,[0,0,0],{metalness:0.6})
  box([w,0.12,0.12],[0,y, halfWidths[i]],C.steelDark,[0,0,0],{metalness:0.6})
  box([0.12,0.12,w],[-halfWidths[i],y,0],C.steelDark,[0,0,0],{metalness:0.6})
  box([0.12,0.12,w],[ halfWidths[i],y,0],C.steelDark,[0,0,0],{metalness:0.6})
}

// X-bracing. Each bay receives braces on all four faces.
function braceXY(z, y0, y1, x0, x1, flip=false) {
  const dx=x1-x0, dy=y1-y0
  const len=Math.hypot(dx,dy)
  const a=Math.atan2(dy,dx)
  const x=(x0+x1)/2, y=(y0+y1)/2
  box([len,0.09,0.09],[x,y,z],C.steelDark,[0,0,a],{metalness:0.52,roughness:0.42})
  box([len,0.09,0.09],[-x,y,z],C.steelDark,[0,0,-a],{metalness:0.52,roughness:0.42})
}
function braceZY(x, y0, y1, z0, z1) {
  const dz=z1-z0, dy=y1-y0
  const len=Math.hypot(dz,dy)
  const a=Math.atan2(dy,dz)
  const z=(z0+z1)/2, y=(y0+y1)/2
  box([0.09,0.09,len],[x,y,z],C.steelDark,[-a,0,0],{metalness:0.52,roughness:0.42})
  box([0.09,0.09,len],[x,y,-z],C.steelDark,[a,0,0],{metalness:0.52,roughness:0.42})
}
for (let i=0; i<levels.length-1; i++) {
  const y0=levels[i], y1=levels[i+1], w0=halfWidths[i], w1=halfWidths[i+1]
  braceXY(-((w0+w1)/2),y0,y1,-w0,w1)
  braceXY( ((w0+w1)/2),y0,y1,-w0,w1)
  braceZY(-((w0+w1)/2),y0,y1,-w0,w1)
  braceZY( ((w0+w1)/2),y0,y1,-w0,w1)
}

// Main observation deck and underside beams.
box([4.65,0.22,4.65],[0,5.98,0],C.wood,[0,0,0],{roughness:0.9})
for (const x of [-1.55,-0.52,0.52,1.55]) box([0.12,0.20,4.45],[x,5.80,0],C.steelDark)
for (const z of [-1.55,-0.52,0.52,1.55]) box([4.45,0.20,0.12],[0,5.80,z],C.steelDark)

// Cabin body, windows and door.
box([3.25,2.05,3.25],[0,7.12,0],C.cabin,[0,0,0],{roughness:0.76})
// Front window bank (-Z).
for (const x of [-1.05,-0.35,0.35,1.05]) {
  box([0.54,0.88,0.055],[x,7.40,-1.655],C.glass,[0,0,0],{roughness:0.16,metalness:0.02})
}
// Rear windows (+Z), leaving room for door.
for (const x of [-1.05,-0.35]) {
  box([0.54,0.82,0.055],[x,7.42,1.655],C.glass,[0,0,0],{roughness:0.16})
}
box([0.78,1.55,0.07],[0.80,6.95,1.66],C.woodDark)
sphere(0.055,[0.50,6.98,1.71],C.yellow,{metalness:0.65,roughness:0.25})
// Side windows.
for (const x of [-1.655,1.655]) {
  for (const z of [-0.92,0,0.92]) {
    box([0.055,0.82,0.56],[x,7.42,z],C.glass,[0,0,0],{roughness:0.16})
  }
}

// Roof with broad overhang and shallow cap.
box([3.92,0.18,3.92],[0,8.22,0],C.roof,[0,0,0],{roughness:0.62})
box([3.55,0.18,3.55],[0,8.37,0],C.roof,[0,0,0],{roughness:0.62})
cone(0.16,0.42,[0,8.67,0],C.steelDark,[0,0,0],{metalness:0.55})

// Deck guardrails around the cabin.
function railX(z) {
  for (const x of [-2.05,-1.03,0,1.03,2.05]) cylinder(0.025,0.025,0.92,[x,6.49,z],C.steel,[0,0,0],{metalness:0.8})
  cylinder(0.030,0.030,4.12,[0,6.92,z],C.steel,[0,0,Math.PI/2],{metalness:0.8})
  cylinder(0.022,0.022,4.12,[0,6.55,z],C.steel,[0,0,Math.PI/2],{metalness:0.75})
}
function railZ(x) {
  for (const z of [-2.05,-1.03,0,1.03,2.05]) cylinder(0.025,0.025,0.92,[x,6.49,z],C.steel,[0,0,0],{metalness:0.8})
  cylinder(0.030,0.030,4.12,[x,6.92,0],C.steel,[Math.PI/2,0,0],{metalness:0.8})
  cylinder(0.022,0.022,4.12,[x,6.55,0],C.steel,[Math.PI/2,0,0],{metalness:0.75})
}
railX(-2.05)
railZ(-2.05)
railZ(2.05)
// Rear rail split to leave stair opening.
for (const x of [-1.55,1.55]) {
  cylinder(0.025,0.025,0.92,[x,6.49,2.05],C.steel,[0,0,0],{metalness:0.8})
  cylinder(0.030,0.030,1.00,[x/2,6.92,2.05],C.steel,[0,0,Math.PI/2],{metalness:0.8})
}

// Exterior stair: lower flight on +Z side from ground to mid landing.
box([1.35,0.18,1.25],[0,3.20,2.22],C.wood,[0,0,0],{roughness:0.9})
for (let i=0;i<9;i++) {
  const t=i/8
  const y=0.82+t*2.20
  const z=3.68-t*1.82
  box([1.16,0.11,0.34],[0,y,z],C.wood,[0,0,0],{roughness:0.92})
}
{
  const dy = 3.02-0.82
  const dz = 3.68-1.86
  const len = Math.hypot(dy,dz)
  const angle = Math.atan2(dy,dz)
  for (const x of [-0.58,0.58]) {
    box([0.09,0.09,len],[x,(0.82+3.02)/2,(3.68+1.86)/2],C.steelDark,[angle,0,0],{metalness:0.48})
  }
}
// Upper flight turns to the +X side.
for (let i=0;i<10;i++) {
  const t=i/9
  const y=3.42+t*2.24
  const x=0.22+t*1.72
  box([0.34,0.11,1.16],[x,y,2.04],C.wood,[0,0,0],{roughness:0.92})
}
{
  const dx = 1.94-0.22
  const dy = 5.66-3.42
  const len = Math.hypot(dx,dy)
  const angle = Math.atan2(dy,dx)
  for (const z of [1.46,2.62]) {
    box([len,0.09,0.09],[(0.22+1.94)/2,(3.42+5.66)/2,z],C.steelDark,[0,0,angle],{metalness:0.48})
  }
}

// Stair handrails.
for (let i=0;i<5;i++) {
  const t=i/4, y=1.45+t*2.10, z=3.62-t*1.72
  for (const x of [-0.70,0.70]) cylinder(0.022,0.022,0.72,[x,y,z],C.steel,[0,0,0],{metalness:0.8})
}
for (let i=0;i<5;i++) {
  const t=i/4, y=4.05+t*2.08, x=0.35+t*1.55
  for (const z of [1.34,2.72]) cylinder(0.022,0.022,0.72,[x,y,z],C.steel,[0,0,0],{metalness:0.8})
}
// Continuous sloped handrails following the two stair flights.
{
  const dy=2.10, dz=1.72, len=Math.hypot(dy,dz), angle=Math.atan2(dy,dz)
  for (const x of [-0.70,0.70]) {
    box([0.055,0.055,len],[x,(1.81+3.91)/2,(3.62+1.90)/2],C.steel,[angle,0,0],{metalness:0.8})
  }
}
{
  const dx=1.55, dy=2.08, len=Math.hypot(dx,dy), angle=Math.atan2(dy,dx)
  for (const z of [1.34,2.72]) {
    box([len,0.055,0.055],[(0.35+1.90)/2,(4.41+6.49)/2,z],C.steel,[0,0,angle],{metalness:0.8})
  }
}

// Solar panel array on roof, tilted toward the front.
box([2.45,0.08,1.25],[0,8.92,0.46],C.solar,[-0.34,0,0],{roughness:0.28,metalness:0.18})
for (const x of [-0.82,-0.27,0.27,0.82]) box([0.03,0.09,1.22],[x,8.93,0.46],C.solarLine,[-0.34,0,0],{metalness:0.4})
for (const z of [0.18,0.74]) box([2.42,0.09,0.03],[0,8.93,z],C.solarLine,[-0.34,0,0],{metalness:0.4})

// Antenna mast and beacon.
cylinder(0.045,0.055,2.35,[1.28,9.18,-0.68],C.steel,[0,0,0],{metalness:0.82,roughness:0.24})
cylinder(0.018,0.022,1.35,[1.28,10.98,-0.68],C.steel,[0,0,0],{metalness:0.82,roughness:0.24})
for (const y of [9.52,9.92,10.32]) box([0.88,0.035,0.035],[1.28,y,-0.68],C.steel,[0,0,0],{metalness:0.8})
sphere(0.14,[0,8.68,-1.06],C.red,{emissive:C.red,emissiveIntensity:0.8,roughness:0.22})
cylinder(0.16,0.19,0.12,[0,8.53,-1.06],C.steelDark,[0,0,0],{metalness:0.55})

// Small equipment box and extinguisher on deck.
box([0.62,0.58,0.42],[-1.72,6.31,1.55],C.steelDark,[0,0,0],{metalness:0.4})
cylinder(0.10,0.10,0.46,[-1.74,6.36,1.11],C.red,[0,0,0],{roughness:0.5})
box([0.14,0.12,0.08],[-1.74,6.62,1.11],C.steelDark)
