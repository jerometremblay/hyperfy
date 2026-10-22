// Fireplace tool set: +Y up, +X right, -Z forward, metres.
// At rest every part is in its slot. Each object has its own interaction target.
// Press E to pick up, X to return the held object to the rack. No per-part physics.
const IRON = '#181c1f'
const EDGE = '#383e42'
const HILITE = '#51565a'
const BLACK = '#101416'
const BRISTLE = '#343333'
const SLOTS = {"rack": [0.0, 0.0, -0.02], "poker": [-0.3, 0.0, 0.145], "brush": [-0.1, 0.0, 0.145], "shovel": [0.1, 0.0, 0.145], "tongs": [0.3, 0.0, 0.145]}
const KINDS = ["rack", "poker", "brush", "shovel", "tongs"]
function addPrimitive(parent, type, size, position, color=IRON, rotation=[0,0,0], more={}) {
  const p = app.create('prim', {
    type, size, position, rotation, color,
    metalness: color===BRISTLE ? 0.08 : 0.84,
    roughness: color===BRISTLE ? 0.95 : 0.42,
    castShadow:true, receiveShadow:true, physics:null, ...more
  })
  parent.add(p)
  return p
}
const box=(g,s,p,c=IRON,r=[0,0,0])=>addPrimitive(g,'box',s,p,c,r)
const cyl=(g,rad,ht,p,c=IRON,r=[0,0,0])=>addPrimitive(g,'cylinder',[rad,rad,ht],p,c,r)
const sphere=(g,rad,p,c=IRON)=>addPrimitive(g,'sphere',[rad],p,c)
const torus=(g,maj,min,p,c=EDGE,r=[0,0,0])=>addPrimitive(g,'torus',[maj,min],p,c,r)
function rod(g,ax,ay,bx,by,r=0.008,c=IRON,z=0) {
  const dx=bx-ax,dy=by-ay,dist=Math.hypot(dx,dy)
  return cyl(g,r,dist,[(ax+bx)/2,(ay+by)/2,z],c,[0,0,-Math.atan2(dx,dy)])
}
function scroll(g,x,cy,z,scale=1) {
  torus(g,0.029*scale,0.006*scale,[x,cy,z],EDGE)
  sphere(g,0.007*scale,[x+0.018*scale,cy+0.018*scale,z],HILITE)
}
function decorateRing(g,y=0.32) {
  torus(g,0.029,0.006,[0,y,0],HILITE)
  cyl(g,0.009,0.045,[0,y-0.063,0],EDGE)
  cyl(g,0.012,0.024,[0,y-0.099,0],IRON)
}
function rack(g) {
  // Broad forged base with raised edges and four distinct feet.
  box(g,[0.82,0.028,0.42],[0,-0.46,0.0],IRON)
  box(g,[0.85,0.025,0.035],[0,-0.436,-0.20],EDGE)
  box(g,[0.85,0.025,0.035],[0,-0.436,0.20],EDGE)
  for(const x of [-0.415,0.415]) {
    box(g,[0.031,0.037,0.47],[x,-0.444,0],EDGE)
    for(const z of [-0.17,0.17]){
      sphere(g,0.025,[x,-0.48,z],BLACK)
      sphere(g,0.013,[x,-0.424,z],HILITE)
    }
  }
  // Open sides, arched rails and four hook positions.
  for(const x of [-0.405,0.405]) {
    cyl(g,0.014,0.755,[x,-0.041,-0.145],IRON)
    cyl(g,0.014,0.755,[x,-0.041,0.145],IRON)
    sphere(g,0.026,[x,0.365,-0.145],HILITE)
    sphere(g,0.026,[x,0.365,0.145],HILITE)
    rod(g,x,-0.34,x-0.032,-0.26,0.008,EDGE,-0.145)
    rod(g,x,-0.34,x-0.032,-0.26,0.008,EDGE,0.145)
  }
  box(g,[0.82,0.026,0.026],[0,0.324,-0.145],EDGE)
  box(g,[0.82,0.024,0.024],[0,0.324,0.145],EDGE)
  box(g,[0.82,0.022,0.020],[0,-0.25,-0.145],IRON)
  box(g,[0.82,0.022,0.020],[0,-0.25,0.145],IRON)
  for(const x of [-0.30,-0.10,0.10,0.30]) {
    // Hooks are visible behind each tool loop, not coincident with the loop mesh.
    cyl(g,0.008,0.067,[x,0.275,0.145],EDGE)
    sphere(g,0.012,[x,0.240,0.145],HILITE)
  }
  // Scrollwork in the open rack back (no giant solid silhouette).
  for(const x of [-0.31,-0.14,0.14,0.31]) scroll(g,x,-0.32,-0.147,0.9)
  for(const x of [-0.27,0.27]) {
    rod(g,x,-0.248,x+0.055,-0.100,0.009,EDGE,-0.146)
    rod(g,x+0.055,-0.100,x,-0.020,0.009,EDGE,-0.146)
    scroll(g,x+0.055,0.020,-0.146,0.8)
  }
  torus(g,0.085,0.012,[0,0.047,-0.146],BLACK)
  torus(g,0.044,0.009,[0,0.047,-0.128],EDGE)
}
function handle(g) {
  // Tactile forged octagonal grip approximated with a shaft and stepped ferrules.
  cyl(g,0.009,0.504,[0,-0.008,0],EDGE)
  cyl(g,0.013,0.135,[0,0.210,0],IRON)
  for(const y of [0.143,0.275]) cyl(g,0.017,0.018,[0,y,0],HILITE)
  decorateRing(g,0.331)
  for(const y of [-0.07,-0.025,0.020,0.065]) {
    cyl(g,0.0105,0.012,[0,y,0],HILITE)
  }
}
function poker(g) {
  handle(g)
  cyl(g,0.008,0.168,[0,-0.329,0],IRON)
  cyl(g,0.006,0.068,[0,-0.430,0],EDGE)
  // Bent sharp hook and short back prong.
  rod(g,0,-0.452,-0.052,-0.452,0.007,IRON)
  rod(g,-0.052,-0.452,-0.064,-0.411,0.006,EDGE)
  rod(g,0,-0.437,0.027,-0.427,0.006,IRON)
  sphere(g,0.009,[0,-0.410,0],HILITE)
}
function brush(g) {
  handle(g)
  cyl(g,0.008,0.095,[0,-0.284,0],IRON)
  box(g,[0.145,0.043,0.073],[0,-0.340,0],IRON)
  box(g,[0.157,0.013,0.084],[0,-0.363,0],EDGE)
  for(let i=-5;i<=5;i++) for(const z of [-0.027,0,0.027]) {
    const xx=i*0.012
    cyl(g,0.0034,0.097,[xx,-0.411,z],BRISTLE)
  }
}
function shovel(g) {
  handle(g)
  cyl(g,0.010,0.142,[0,-0.312,0],IRON)
  // Single thick iron scoop, shaped like an old hearth shovel.
  box(g,[0.152,0.165,0.022],[0,-0.360,0.008],IRON)
  box(g,[0.115,0.026,0.029],[0,-0.270,0.008],IRON)
  for (const side of [-1,1])
    box(g,[0.013,0.110,0.025],[side*0.078,-0.357,0.008],EDGE,[0,0,side*0.05])
  box(g,[0.166,0.009,0.022],[0,-0.442,0.020],HILITE)
  for(const x of [-0.050,0.050]) sphere(g,0.008,[x,-0.288,0.021],HILITE)
}
function tongs(g) {
  // Paired forged rods joined by the heavy iron pivot, with spring opening at tip.
  torus(g,0.030,0.006,[0,0.322,0],HILITE)
  cyl(g,0.012,0.285,[0,0.164,0],EDGE)
  for (const y of [0.042,0.267]) cyl(g,0.016,0.018,[0,y,0],HILITE)
  sphere(g,0.025,[0,-0.007,0],HILITE)
  for(const side of [-1,1]) {
    rod(g,0,-0.017,side*0.028,-0.108,0.010,IRON)
    rod(g,side*0.028,-0.108,side*0.082,-0.391,0.008,EDGE)
    rod(g,side*0.082,-0.391,side*0.046,-0.425,0.008,IRON)
    box(g,[0.043,0.017,0.027],[side*0.041,-0.426,0],IRON,[0,0,side*0.30])
    for(const y of [-0.350,-0.306]) sphere(g,0.011,[side*(0.082-(y+0.391)*0.19),y,0],BLACK)
  }
}
const build = {rack,poker,brush,shovel,tongs}
const home = Object.create(null)
const groups = Object.create(null)
const actions = Object.create(null)
for(const kind of KINDS) {
  const slot=SLOTS[kind]
  home[kind]=slot
  const group=app.create('group',{position:slot})
  build[kind](group)
  app.add(group)
  groups[kind]=group
}

// Script-created nodes are local to their app, and each can be picked without
// moving or merging any of its neighbours. Server owns just the occupancy state.
if (world.isServer) {
  if (!app.state.owners) app.state.owners={}
  app.on('claim', data => {
    if(!data || !KINDS.includes(data.kind) || !data.playerId) return
    const occupied = Object.values(app.state.owners).includes(data.playerId)
    if (occupied || app.state.owners[data.kind]) return
    app.state.owners[data.kind]=data.playerId
    app.send('claimed',data)
  })
  app.on('release', data => {
    if (!data || app.state.owners[data.kind]!==data.playerId) return
    delete app.state.owners[data.kind]
    app.send('released',{kind:data.kind})
  })
  if (typeof world.on === 'function') world.on('leave', player => {
    for(const kind of KINDS) if(app.state.owners[kind]===player.id){
      delete app.state.owners[kind]
      app.send('released',{kind})
    }
  })
}
if(world.isClient && typeof world.getPlayer==='function' && typeof app.send==='function') {
  const owners={...(app.state?.owners||{})}
  const me=world.getPlayer()
  const localId=me?.id
  for(const kind of KINDS){
    const a=app.create('action',{
      label:kind==='rack' ? 'Lift fireplace rack' : 'Pick up '+kind,
      distance:2.5,
      duration:0.15,
      onTrigger:({playerId})=>{
        if(!owners[kind]) app.send('claim',{kind,playerId})
      }
    })
    a.position.set(0,kind==='rack'?0.23:0.24,0)
    groups[kind].add(a)
    actions[kind]=a
    a.active=!owners[kind]
  }
  const restore=kind=>{
    owners[kind]=null
    groups[kind].position.set(...home[kind])
    groups[kind].quaternion.set(0,0,0,1)
    actions[kind].active=true
    updateReturnHint()
  }
  app.on('claimed',({kind,playerId})=>{
    if(!groups[kind]) return
    owners[kind]=playerId
    actions[kind].active=false
    updateReturnHint()
  })
  app.on('released',({kind})=>{if(groups[kind]) restore(kind)})
  const controls=app.control()
  let hintedKind=null
  function updateReturnHint(){
    const kind=KINDS.find(kind=>owners[kind]===localId) || null
    if(kind===hintedKind) return
    hintedKind=kind
    controls.setActions(kind ? [{type:'keyX',label:'Put the '+kind+' away',position:'bottom-left',opacity:0.5}] : [])
  }
  updateReturnHint()
  controls.keyX.onPress=()=>{
    if(!localId) return
    for(const kind of KINDS) if(owners[kind]===localId)
      app.send('release',{kind,playerId:localId})
  }
  function rotateInverse(v,q){
    const x=-q.x,y=-q.y,z=-q.z,w=q.w
    const [vx,vy,vz]=v
    const tx=2*(y*vz-z*vy),ty=2*(z*vx-x*vz),tz=2*(x*vy-y*vx)
    return [vx+w*tx+(y*tz-z*ty),vy+w*ty+(z*tx-x*tz),vz+w*tz+(x*ty-y*tx)]
  }
  app.on('lateUpdate',()=>{
    const q=app.quaternion
    for(const kind of KINDS){
      const id=owners[kind]
      if(!id) continue
      const player=world.getPlayer(id)
      if(!player) continue
      const m=player.getBoneTransform?.('rightIndexProximal') || player.getBoneTransform?.('rightHand')
      const p=m?.elements ? [m.elements[12],m.elements[13],m.elements[14]] :
        (player.position ? [player.position.x,player.position.y+1.05,player.position.z] : null)
      if(!p) continue
      const delta=rotateInverse([p[0]-app.position.x,p[1]-app.position.y,p[2]-app.position.z],q)
      const grip=kind==='rack' ? 0.23 : 0.24
      groups[kind].position.set(delta[0]/app.scale.x,delta[1]/app.scale.y-grip,delta[2]/app.scale.z)
      // Upright even when the app/prompt box was originally rotated.
      groups[kind].quaternion.set(-q.x,-q.y,-q.z,q.w)
    }
  })
}
