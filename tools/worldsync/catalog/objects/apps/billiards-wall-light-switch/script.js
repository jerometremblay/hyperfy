// Hyperfy billiard lamp wall switch. Y up, +X right, -Z forward; metres.
// Back of wallplate is at local Z=0. Face toward +Z when positioning on a wall.
// Match props.channel to the pool-table fixture's channel.
app.configure([
  { type:'text', key:'channel', label:'Switch channel', initial:'billiards-main', hint:'Must match the fixture channel exactly' },
  { type:'toggle', key:'initialOn', label:'Initially on', initial:true },
  { type:'color', key:'plateColor', label:'Wallplate metal', initial:'#c7bca1' },
])
const channel = String(props.channel || 'billiards-main').trim()
const metal = props.plateColor || '#c7bca1'
const dark = '#393936'
const onAtStart = props.initialOn !== false

function shape(type,size,position,color,extra={}) {
  const n=app.create('prim',{
    type,size,position,color,physics:null,castShadow:true,receiveShadow:true,
    metalness:0.6,roughness:0.3,...extra,
  })
  app.add(n)
  return n
}
function box(size,pos,color,extra={}) { return shape('box',size,pos,color,extra) }
function orb(radius,pos,color,extra={}) {return shape('sphere',[radius],pos,color,extra)}

// Thin backing plate and four visible machined corner screws.
box([0.165,0.28,0.025],[0,0,0.017],dark,{metalness:0.4,roughness:0.45})
box([0.15,0.265,0.012],[0,0,0.034],metal,{metalness:0.72,roughness:0.23})
for (const x of [-0.057,0.057]) for (const y of [-0.116,0.116]) {
  shape('cylinder',[0.007,0.007,0.004],[x,y,0.043],'#554d42',{
    rotation:[Math.PI/2,0,0],metalness:0.72,roughness:0.32,
  })
}

box([0.079,0.125,0.018],[0,0.008,0.048],dark,{metalness:0.25,roughness:0.42})
const lever=box([0.05,0.095,0.034],[0,0.007,0.075],metal,{metalness:0.72,roughness:0.25})
const led=orb(0.014,[0,-0.084,0.051],'#b2ffac',{
  emissive:'#79ff79',emissiveIntensity:3.5,metalness:0,roughness:0.45,castShadow:false,
})

let on=app.state && typeof app.state.on === 'boolean' ? app.state.on : onAtStart
let lastInteraction=0
function setOn(value) {
  on=!!value
  led.color=on?'#a6ffc0':'#3a513f'
  led.emissiveIntensity=on?3.5:0
  lever.rotation.x=on?-0.19:0.19
  action.label=on?'Turn pool lights OFF':'Turn pool lights ON'
}
function toggle() {
  if (!world.isClient) return
  const now=Date.now()
  if (now-lastInteraction < 250) return
  lastInteraction=now
  app.send('billiards-wall-switch-toggle', {})
}

const action=app.create('action',{
  position:[0,0,0.10],
  label:'Toggle pool lights',distance:2.5,duration:0.12,
  onTrigger:toggle,
})
app.add(action)
// Click plate or lever with mouse as an alternative to Press E.
lever.onPointerDown=toggle
setOn(on)

if (world.isServer) {
  if (!app.state || typeof app.state.on !== 'boolean') app.state={on:onAtStart}
  const matches = msg => msg && String(msg.channel || '').trim() === channel
  function announce() {
    app.emit('billiards-light-command',{channel,on:app.state.on})
    app.send('billiards-wall-switch-state',{on:app.state.on})
  }
  app.on('billiards-wall-switch-toggle', () => {
    app.state={...app.state,on:!app.state.on}
    announce()
  })
  app.on('billiards-wall-switch-query', () => announce())
  world.on('billiards-light-request', message => {if (matches(message)) announce()})
  announce()
}
if (world.isClient) {
  app.on('billiards-wall-switch-state', message => {
    if (message && typeof message.on === 'boolean') setOn(message.on)
  })
  if (typeof app.send === 'function') app.send('billiards-wall-switch-query',{})
}
