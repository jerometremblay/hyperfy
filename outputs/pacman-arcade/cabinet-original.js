// Vintage 1980s PAC-MAN upright arcade cabinet — primitive-only Hyperfy app.
// Coordinates are centered on the prompt box: X right, Y up, -Z forward.
// Bounds: 1.0 m wide, 1.875109 m tall, 1.0 m deep. Static, visual-only.

const COL = {
  yellow: '#ffcf21', edge: '#e7a910', sun: '#ffeb52', darkYellow: '#c78e12',
  black: '#10111b', charcoal: '#20212e', midnight: '#080b1b', gray: '#424350',
  steel: '#9eabbc', chrome: '#d6e2e8', blue: '#203bdf', brightBlue: '#435dff',
  cyan: '#45ebfa', red: '#ed293f', cherry: '#f64841', pink: '#fc93d1',
  orange: '#fba149', ivory: '#fff0c8', white: '#f7ffff', shadow: '#682942',
}
const PI = Math.PI
const baseY = -0.9375546549250424

function primitive(type, options) {
  const node = app.create('prim', {
    type, castShadow: true, receiveShadow: true,
    metalness: 0.08, roughness: 0.68, physics: null, ...options,
  })
  app.add(node)
  return node
}
function box(w,h,d,x,y,z,color, opts={}) {
  return primitive('box',{size:[w,h,d],position:[x,y,z],color,...opts})
}
function cylinder(radiusTop,radiusBottom,height,x,y,z,color,opts={}) {
  return primitive('cylinder',{size:[radiusTop,radiusBottom,height],position:[x,y,z],color,...opts})
}
function sphere(radius,x,y,z,color,opts={}) {
  return primitive('sphere',{size:[radius],position:[x,y,z],color,...opts})
}
function extrude(profile,depth,position,color,opts={}) {
  return primitive('extrude',{
    profile,depth,bevelEnabled:false,position,color,...opts,
  })
}
// Align a beam's local +Y with a -> b, using Hyperfy's YXZ Euler convention.
// Positive screen-right is -X when the front of the cabinet faces -Z.
function yAxisRotationBetween(a,b) {
  const dx=b[0]-a[0], dy=b[1]-a[1], dz=b[2]-a[2]
  const horizontal=Math.hypot(dx,dz)
  if (horizontal<1e-12) return [dy>=0 ? 0 : PI,0,0]
  return [Math.atan2(horizontal,dy),Math.atan2(dx,dz),0]
}
function line3(a,b,width,color,opts={}) {
  const length=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])
  if (length<1e-9) throw new Error('Beam endpoints must be different')
  const rotation=yAxisRotationBetween(a,b)
  // Regression test: rotate the local +Y endpoint using the viewer's YXZ order.
  const [rx,ry]=rotation,half=length/2
  const tip=[half*Math.sin(rx)*Math.sin(ry),half*Math.cos(rx),half*Math.sin(rx)*Math.cos(ry)]
  const mid=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]
  const error=Math.min(
    Math.hypot(mid[0]+tip[0]-b[0],mid[1]+tip[1]-b[1],mid[2]+tip[2]-b[2]),
    Math.hypot(mid[0]-tip[0]-b[0],mid[1]-tip[1]-b[1],mid[2]-tip[2]-b[2])
  )
  if(error>1e-6)throw new Error('Beam orientation failed endpoint test')
  return box(width,length,width,...mid,color,{rotation,...opts})
}

// Real silhouette of an upright 1980s cabinet. Extruded in XY, then rotated
// around Y so the material has physical thickness across X (the left/right sides).
// local X = -world Z. front of cabinet is world -Z.
const outline = [
  [-0.374,-0.901], [-0.374,0.895], [0.314,0.895],
  [0.382,0.838], [0.382,0.566], [0.286,0.477],
  [0.104,-0.116], [0.099,-0.173], [0.424,-0.214],
  [0.424,-0.327], [0.349,-0.392], [0.349,-0.901],
]
// Hyperfy re-centers extrude profile bounds before rotating/placing it.
const outlineCx=(Math.min(...outline.map(p=>p[0]))+Math.max(...outline.map(p=>p[0])))/2
const outlineCy=(Math.min(...outline.map(p=>p[1]))+Math.max(...outline.map(p=>p[1])))/2
for (const side of [-1,1]) {
  extrude(outline,0.039,[side*0.359,0,0],COL.yellow,{rotation:[0,PI/2,0],roughness:0.50})
  // Side trim follows *recentered* extrusion contours, not the raw profile.
  for (let i=1;i<outline.length;i++) {
    const a=outline[i-1],b=outline[i]
    const x=side*0.382
    line3([x,a[1]-outlineCy,-(a[0]-outlineCx)],[x,b[1]-outlineCy,-(b[0]-outlineCx)],0.010,COL.sun,{roughness:.48})
  }
}

// Structural carcass with a genuine monitor opening. The original full-depth
// box obscured the CRT and every tilted display element. Keep only a thin rear
// core behind the CRT, plus separate solids above/below the screen opening.
box(.687,1.65,.315,0,-.069,.195,COL.darkYellow) // rear structure, front at Z +.0375
box(.687,.340,.650,0,.663,.020,COL.yellow)   // header above the glass
box(.687,.560,.672,0,-.607,.016,COL.yellow) // solid coin-door lower body
box(.687,.135,.388,0,-.246,.140,COL.yellow) // support below screen
box(.687,.085,.680,0,-.863,.021,COL.black)
box(.67,.024,.685,0,.875,-.012,COL.yellow)
box(.68,1.73,.018,0,-.021,.356,COL.darkYellow)
box(.67,.51,.026,0,-.647,-.353,COL.yellow)
box(.68,.039,.70,0,-.901,0,COL.black)
box(.659,.014,.7,0,-.867,0,COL.charcoal)

// Side marquee protrusion, period-correct rounded-effect layered trim.
box(.674,.251,.048,0,.718,-.366,COL.black)
box(.649,.219,.018,0,.720,-.397,COL.red)
box(.628,.196,.014,0,.723,-.411,COL.blue)
box(.601,.176,.012,0,.724,-.422,COL.yellow,{emissive:COL.yellow,emissiveIntensity:.40})
for(const yy of [.829,.611]) box(.649,.013,.028,0,yy,-.431,COL.black)

// 5x7 display lettering is actual tiny 3D blocks, never a flat web image.
const FONT={
 A:['01110','10001','10001','11111','10001','10001','10001'],
 B:['11110','10001','10001','11110','10001','10001','11110'],
 C:['01111','10000','10000','10000','10000','10000','01111'],
 D:['11110','10001','10001','10001','10001','10001','11110'],
 E:['11111','10000','10000','11110','10000','10000','11111'],
 F:['11111','10000','10000','11110','10000','10000','10000'],
 G:['01111','10000','10000','10111','10001','10001','01111'],
 H:['10001','10001','10001','11111','10001','10001','10001'],
 I:['11111','00100','00100','00100','00100','00100','11111'],
 K:['10001','10010','10100','11000','10100','10010','10001'],
 L:['10000','10000','10000','10000','10000','10000','11111'],
 M:['10001','11011','10101','10101','10001','10001','10001'],
 N:['10001','11001','10101','10011','10001','10001','10001'],
 O:['01110','10001','10001','10001','10001','10001','01110'],
 P:['11110','10001','10001','11110','10000','10000','10000'],
 R:['11110','10001','10001','11110','10100','10010','10001'],
 S:['01111','10000','10000','01110','00001','00001','11110'],
 T:['11111','00100','00100','00100','00100','00100','00100'],
 U:['10001','10001','10001','10001','10001','10001','01110'],
 V:['10001','10001','10001','10001','10001','01010','00100'],
 W:['10001','10001','10001','10101','10101','11011','10001'],
 X:['10001','10001','01010','00100','01010','10001','10001'],
 Y:['10001','10001','01010','00100','00100','00100','00100'],
 Z:['11111','00001','00010','00100','01000','10000','11111'],
 '0':['01110','10011','10101','10101','11001','10001','01110'],
 '1':['00100','01100','00100','00100','00100','00100','01110'],
 '2':['01110','10001','00001','00010','00100','01000','11111'],
 '3':['11110','00001','00001','01110','00001','00001','11110'],
 '4':['00010','00110','01010','10010','11111','00010','00010'],
 '5':['11111','10000','10000','11110','00001','00001','11110'],
 '8':['01110','10001','10001','01110','10001','10001','01110'],
 '9':['01110','10001','10001','01111','00001','00001','01110'],
 '-':['00000','00000','00000','11111','00000','00000','00000'],
 '!':['00100','00100','00100','00100','00100','00000','00100'],
 ' ':['00000','00000','00000','00000','00000','00000','00000'],
}
function textFront(text,xCenter,yTop,z,unit,color,depth=.003) {
  const total=text.length*6-1
  // From a viewer at -Z, world +X is LEFT. Advance each pixel toward -X.
  const xOrigin=xCenter+total*unit/2
  for(let j=0;j<text.length;j++) {
    const g=FONT[text[j]]||FONT[' ']
    for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(g[row][col]==='1') {
      box(unit*.91,unit*.91,depth,xOrigin-(j*6+col)*unit,yTop-row*unit,z,color,
        {emissive:color,emissiveIntensity:.32,castShadow:false})
    }
  }
}
// Marquee red lettering, drop-shadow then orange on top.
textFront('PAC-MAN',.004,.775,-.431,.0125,COL.shadow,.004)
textFront('PAC-MAN',0,.780,-.439,.0125,COL.red,.005)
textFront('MIDWAY',0,.647,-.438,.0059,COL.midnight,.003)

// Inclined CRT follows the side-panel diagonal: at the TOP Z is more negative.
// The CRT is deliberately inset 2-5 cm behind the yellow side-panel silhouette.
const screenAngle=Math.atan2(-.182,.593)
const centerY=.164, centerZ=-.096
function monitor(w,h,thickness,color,offset=0,opts={}) {
  // Local coordinates: +Y screen-up and -Z toward the viewer.
  const yy=centerY-offset*Math.sin(screenAngle), zz=centerZ+offset*Math.cos(screenAngle)
  return box(w,h,thickness,0,yy,zz,color,{rotation:[screenAngle,0,0],...opts})
}
function pixelOnScreen(x,v,w,h,color,z=-.038,opts={}) {
  // Here x is VISUAL screen-right, which means world -X viewed from -Z.
  const y=centerY+v*Math.cos(screenAngle)-z*Math.sin(screenAngle)
  const depth=centerZ+v*Math.sin(screenAngle)+z*Math.cos(screenAngle)
  return box(w,h,.0026,-x,y,depth,color,{rotation:[screenAngle,0,0],
    emissive:color,emissiveIntensity:.85,castShadow:false,...opts})
}
monitor(.690,.636,.018,COL.black,-.003)
monitor(.606,.569,.012,COL.charcoal,-.017)
monitor(.553,.502,.007,COL.midnight,-.028,{roughness:.18,metalness:.05})
// CRT glass borders and reflections in the same inclined local coordinate frame.
for(const x of [-.275,.275]) pixelOnScreen(x,0,.011,.52,COL.gray,-.034)
for(const y of [-.25,.25]) pixelOnScreen(0,y,.56,.010,COL.gray,-.034)

// Retro PAC-MAN screen maze. Thick blue pixelated wall strokes on a black CRT.
const GAME_BLUE=COL.brightBlue
function H(x,y,w,color=GAME_BLUE){pixelOnScreen(x,y,w,.006,color,-.037)}
function V(x,y,h,color=GAME_BLUE){pixelOnScreen(x,y,.006,h,color,-.037)}
function rect(x,y,w,h) { H(x,y+h/2,w); H(x,y-h/2,w); V(x-w/2,y,h); V(x+w/2,y,h) }
rect(0,0,.49,.448)
rect(0,.171,.330,.065)
rect(-.178,.095,.120,.070)
rect(.178,.095,.120,.070)
rect(0,.081,.140,.067)
rect(-.187,-.082,.107,.066)
rect(.187,-.082,.107,.066)
rect(0,-.159,.337,.067)
H(0,-.015,.14); V(-.085,.0,.13);V(.085,.0,.13)
H(-.119,-.110,.07); H(.119,-.110,.07)
H(-.118,.035,.065); H(.118,.035,.065)
// Central ghost house rim: gates and bright small bars.
H(0,-.040,.110,COL.cyan)
V(-.055,-.052,.036); V(.055,-.052,.036)
// Typical dotted corridors.
const dots = [
  [-.223,-.176, .223,-.176,16], [-.225,-.009,-.125,-.009,5],
  [.125,-.009,.225,-.009,5],[-.125,.131,-.055,.131,4],
  [.055,.131,.125,.131,4],[-.210,.183,-.173,.183,2],
  [.173,.183,.210,.183,2],[-.210,-.150,-.168,-.150,3],
  [.168,-.150,.210,-.150,3]
]
for(const [x0,y0,x1,y1,n] of dots)for(let i=0;i<n;i++) {
 const t=(i+.5)/n
 pixelOnScreen(x0+(x1-x0)*t,y0+(y1-y0)*t,.005,.005,COL.sun,-.038)
}
// Low resolution sprites on the LCD-like CRT surface, exact 7x7 pixel silhouettes.
const GHOST=['0011100','0111110','1111111','1111111','1111111','1101101','1001001']
const PAC=['0011110','0111110','1111100','1110000','1111100','0111110','0011110']
function spriteScreen(mask,x,y,pixel,color,eyes=true) {
 for(let r=0;r<mask.length;r++)for(let c=0;c<mask[r].length;c++)if(mask[r][c]==='1') {
   pixelOnScreen(x+(c-3)*pixel,y+(3-r)*pixel,pixel*.95,pixel*.95,color,-.041)
 }
 if(eyes) {
   for(const dx of [-1.25,1.25]) {
     pixelOnScreen(x+dx*pixel,y+1.0*pixel,pixel*1.25,pixel*1.3,COL.white,-.043)
     pixelOnScreen(x+(dx+.25)*pixel,y+.92*pixel,pixel*.6,pixel*.8,COL.blue,-.045)
   }
 }
}
spriteScreen(PAC,-.126,-.102,.0085,COL.sun,false)
spriteScreen(GHOST,.006,-.096,.0083,COL.red)
spriteScreen(GHOST,.097,-.096,.0083,COL.pink)
spriteScreen(GHOST,-.037,.023,.0083,COL.cyan)
// Top-left score label must follow the *tilted* screen, not a horizontal Z plane.
function textOnScreen(text,xLeft,vTop,unit,color) {
  for(let j=0;j<text.length;j++) {
    const glyph=FONT[text[j]]||FONT[' ']
    for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(glyph[row][col]==='1')
      pixelOnScreen(xLeft+(j*6+col)*unit,vTop-row*unit,unit*.88,unit*.88,color,-.042)
  }
}
textOnScreen('1UP',-.244,.224,.0052,COL.sun)

// Slanted sturdy control shelf, black 1980s control overlay and front kick rail.
const controlsTilt=-.163
box(.690,.043,.319,0,-.225,-.266,COL.black,{rotation:[controlsTilt,0,0]})
box(.665,.008,.302,0,-.194,-.264,COL.midnight,{rotation:[controlsTilt,0,0]})
box(.69,.055,.027,0,-.282,-.425,COL.yellow)
box(.68,.024,.024,0,-.302,-.428,COL.black)
box(.688,.019,.035,0,-.192,-.112,COL.black)
// Curved joystick shaft and ball; buttons are raised and readable in VR.
cylinder(.059,.059,.014,-.192,-.169,-.281,COL.gray,{metalness:.75})
cylinder(.035,.035,.012,-.192,-.160,-.281,COL.black)
cylinder(.010,.011,.085,-.192,-.116,-.281,COL.chrome,{metalness:.85})
sphere(.033,-.192,-.065,-.281,COL.red,{metalness:.13,roughness:.34})
for(const [x,z,color] of [[.108,-.264,COL.red],[.225,-.303,COL.white],[.172,-.215,COL.sun]]) {
 cylinder(.033,.033,.013,x,-.166,z,COL.gray,{metalness:.65})
 cylinder(.025,.025,.019,x,-.154,z,color,{metalness:.18,roughness:.35})
}
// Decorative rainbow strip under the controls.
box(.660,.010,.015,0,-.320,-.402,COL.red)

// Lower cabinet kick panel and a real protruding metal coin-mechanism door.
box(.667,.54,.018,0,-.649,-.369,COL.yellow)
box(.341,.276,.019,0,-.677,-.394,COL.charcoal,{metalness:.46,roughness:.40})
box(.313,.252,.008,0,-.675,-.407,COL.black)
box(.281,.014,.010,0,-.795,-.418,COL.steel,{metalness:.80})
for(const cx of [-.084,.084]) {
  box(.109,.084,.011,cx,-.615,-.417,COL.gray,{metalness:.52})
  box(.079,.034,.010,cx,-.592,-.428,COL.black)
  box(.050,.006,.014,cx,-.589,-.442,COL.chrome,{metalness:.8})
  box(.062,.024,.008,cx,-.643,-.430,COL.yellow,{emissive:COL.yellow,emissiveIntensity:.24})
  box(.009,.017,.009,cx,-.663,-.429,COL.red)
}
box(.083,.033,.009,0,-.755,-.427,COL.gray)
box(.058,.012,.011,0,-.755,-.434,COL.black)
// Distinctive arcade vents in back upper panel.
for(let i=0;i<9;i++)box(.31,.007,.006,0,.50-i*.034,.370,COL.black)

// Artwork actually wraps the extruded sides. XY decals are rotated into each side.
function sideExtrude(side,points,y,z,color,thickness=.003) {
  // Profile points are [Z,Y] offsets in side-view, converted to XY extrusion.
  const profile=points.map(([dz,dy])=>[-dz,dy])
  return extrude(profile,thickness,[side*.382,y,z],color,{rotation:[0,PI/2,0],castShadow:false})
}
// One-sided volume of a Pac-Man profile, mouth faces toward negative Z.
function pacProfile(radius,angle=.50) {
 const pts=[[0,0]]
 for(let i=0;i<=33;i++){
  const a=angle+(2*PI-2*angle)*i/33
  pts.push([-Math.cos(a)*radius, Math.sin(a)*radius])
 }
 return pts
}
const ghostShape=[[-.080,-.050],[-.080,.025],[-.068,.060],[-.037,.085],[.010,.088],
 [.052,.074],[.077,.040],[.080,-.051],[.055,-.032],[.029,-.053],[0,-.035],[-.031,-.053],[-.056,-.035]]
for (const side of [-1,1]) {
  // Big contrasting Pac-Man and dotted trail, on both extruded yellow cabinet sides.
  sideExtrude(side,pacProfile(.173),.205,.09,COL.red)
  sideExtrude(side,pacProfile(.140),.205,.09,COL.orange,.006)
  const sideX=side*.385
  sphere(.017,sideX,.272,.073,COL.black)
  for(let i=0;i<3;i++)sphere(.009,sideX,.196,-.07-i*.043,COL.red)
  // The little ghosts use true extrusion profiles rather than stacked boxes.
  sideExtrude(side,ghostShape,-.405,.095,COL.red,.006)
  sideExtrude(side,ghostShape,-.625,-.065,COL.blue,.006)
  for(const [cy,cz] of [[-.405,.095],[-.625,-.065]]){
   for(const dz of [-.030,.030]) {
     sphere(.020,sideX,cy+.027,cz+dz,COL.white)
     sphere(.008,sideX+side*.006,cy+.024,cz+dz-.006,COL.black)
   }
  }
  // 3 color stripes in lower part of each yellow cabinet side.
  for(const [yy,cc] of [[-.785,COL.red],[-.802,COL.blue],[-.819,COL.orange]]){
    box(.004,.009,.515,side*.381,yy,.014,cc,{castShadow:false})
  }
}
// Simple Pac-Man disc below controls on the cabinet front as raised graphic.
const frontPac=[]
frontPac.push([0,0])
for(let i=0;i<=28;i++){
 const a=.43+(2*PI-.86)*i/28
 frontPac.push([Math.cos(a)*.067,Math.sin(a)*.067])
}
// XY face extrusion toward -Z (rotated 180° about Y; symmetric X irrelevant).
extrude(frontPac,.007,[-.231,-.468,-.383],COL.red,{rotation:[0,PI,0],castShadow:false})
for(const x of [-.058,-.018,.022])sphere(.007,x,-.466,-.395,COL.orange)
// Period-appropriate grounding feet.
for(const xx of [-.282,.282])for(const zz of [-.26,.270])box(.084,.019,.092,xx,baseY+.010,zz,COL.black)
