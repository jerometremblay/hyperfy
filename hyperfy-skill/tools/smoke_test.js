#!/usr/bin/env node
import fs from 'node:fs'
import vm from 'node:vm'
const path = process.argv[2]
if (!path) throw new Error('usage: smoke_test.js app.js')

const rootNodes = []
const worldNodes = []
const events = new Map()

function qmul(a, b) {
  return [
    a[3]*b[0]+a[0]*b[3]+a[1]*b[2]-a[2]*b[1],
    a[3]*b[1]-a[0]*b[2]+a[1]*b[3]+a[2]*b[0],
    a[3]*b[2]+a[0]*b[1]-a[1]*b[0]+a[2]*b[3],
    a[3]*b[3]-a[0]*b[0]-a[1]*b[1]-a[2]*b[2],
  ]
}
function qaxis(x, y, z, a) {
  const s = Math.sin(a / 2)
  return [x*s, y*s, z*s, Math.cos(a / 2)]
}
function qeulerYXZ(e=[0,0,0]) {
  return qmul(qmul(qaxis(0,1,0,e[1]), qaxis(1,0,0,e[0])), qaxis(0,0,1,e[2]))
}
function qrot(v, q) {
  const [x,y,z] = v
  const [qx,qy,qz,qw] = q
  const ix=qw*x+qy*z-qz*y, iy=qw*y+qz*x-qx*z, iz=qw*z+qx*y-qy*x, iw=-qx*x-qy*y-qz*z
  return [
    ix*qw+iw*-qx+iy*-qz-iz*-qy,
    iy*qw+iw*-qy+iz*-qx-ix*-qz,
    iz*qw+iw*-qz+ix*-qy-iy*-qx,
  ]
}
function vec3(v=[0,0,0]) {
  const a = Array.isArray(v) ? v : [v?.x||0,v?.y||0,v?.z||0]
  return {
    x:a[0]||0,y:a[1]||0,z:a[2]||0,
    set(x,y,z){this.x=x;this.y=y;this.z=z;return this},
    copy(o){this.x=o.x;this.y=o.y;this.z=o.z;return this},
    clone(){return vec3([this.x,this.y,this.z])},
    equals(o){return this.x===o.x&&this.y===o.y&&this.z===o.z},
    multiply(o){this.x*=o.x;this.y*=o.y;this.z*=o.z;return this},
    multiplyScalar(s){this.x*=s;this.y*=s;this.z*=s;return this},
    add(o){this.x+=o.x;this.y+=o.y;this.z+=o.z;return this},
    sub(o){this.x-=o.x;this.y-=o.y;this.z-=o.z;return this},
    applyQuaternion(o){const r=qrot([this.x,this.y,this.z],[o.x,o.y,o.z,o.w]);this.x=r[0];this.y=r[1];this.z=r[2];return this},
    toArray(){return[this.x,this.y,this.z]},
  }
}
function quat(v=[0,0,0,1]) {
  const a = Array.isArray(v) ? v : [v?.x||0,v?.y||0,v?.z||0,v?.w??1]
  return {
    x:a[0]||0,y:a[1]||0,z:a[2]||0,w:a[3]??1,
    set(x,y,z,w){this.x=x;this.y=y;this.z=z;this.w=w;return this},
    copy(o){this.x=o.x;this.y=o.y;this.z=o.z;this.w=o.w;return this},
    clone(){return quat([this.x,this.y,this.z,this.w])},
    equals(o){return this.x===o.x&&this.y===o.y&&this.z===o.z&&this.w===o.w},
    multiply(o){const q=qmul([this.x,this.y,this.z,this.w],[o.x,o.y,o.z,o.w]);this.x=q[0];this.y=q[1];this.z=q[2];this.w=q[3];return this},
    toArray(){return[this.x,this.y,this.z,this.w]},
  }
}

const primitiveTypes = new Set(['box', 'sphere', 'cylinder', 'cone', 'torus', 'plane', 'extrude'])
const isFiniteNumber = value => typeof value === 'number' && Number.isFinite(value)
const isNumberBetween = (value, min, max) => isFiniteNumber(value) && value >= min && value <= max

function validatePrimConfig(cfg={}) {
  if (cfg === null || typeof cfg !== 'object' || Array.isArray(cfg)) {
    throw new Error('[prim] config must be an object')
  }

  if (cfg.type !== undefined && !primitiveTypes.has(cfg.type)) {
    throw new Error('[prim] type invalid')
  }
  if (cfg.size !== undefined && (!Array.isArray(cfg.size) || cfg.size.some(value => !isFiniteNumber(value)))) {
    throw new Error('[prim] size must be an array of finite numbers')
  }
  if (cfg.profile !== undefined && (!Array.isArray(cfg.profile) || cfg.profile.some(point => !Array.isArray(point) || point.length !== 2 || point.some(value => !isFiniteNumber(value))))) {
    throw new Error('[prim] profile must be an array of [x, y] points')
  }
  if (cfg.depth !== undefined && (!isFiniteNumber(cfg.depth) || cfg.depth <= 0)) {
    throw new Error('[prim] depth must be a positive number')
  }
  for (const name of ['bevelEnabled', 'smooth', 'castShadow', 'receiveShadow', 'doubleside', 'trigger']) {
    if (cfg[name] !== undefined && typeof cfg[name] !== 'boolean') {
      throw new Error(`[prim] ${name} must be boolean`)
    }
  }
  for (const name of ['bevelThickness', 'bevelSize']) {
    if (cfg[name] !== undefined && (!isFiniteNumber(cfg[name]) || cfg[name] < 0)) {
      throw new Error(`[prim] ${name} must be a non-negative number`)
    }
  }
  for (const name of ['bevelSegments', 'curveSegments']) {
    const minimum = name === 'curveSegments' ? 1 : 0
    if (cfg[name] !== undefined && (!Number.isInteger(cfg[name]) || cfg[name] < minimum)) {
      throw new Error(`[prim] ${name} must be a valid integer`)
    }
  }
  if (cfg.creaseAngle !== undefined && !isNumberBetween(cfg.creaseAngle, 0, Math.PI)) {
    throw new Error('[prim] creaseAngle must be a number between 0 and PI')
  }
  if (cfg.color !== undefined && typeof cfg.color !== 'string') {
    throw new Error('[prim] color must be string')
  }
  if (cfg.emissive !== undefined && cfg.emissive !== null && typeof cfg.emissive !== 'string') {
    throw new Error('[prim] emissive must be string or null')
  }
  if (cfg.texture !== undefined && cfg.texture !== null && typeof cfg.texture !== 'string') {
    throw new Error('[prim] texture must be string or null')
  }
  if (cfg.emissiveIntensity !== undefined && (!isFiniteNumber(cfg.emissiveIntensity) || cfg.emissiveIntensity < 0)) {
    throw new Error('[prim] emissiveIntensity must be a non-negative number')
  }
  for (const name of ['metalness', 'roughness', 'opacity', 'staticFriction', 'dynamicFriction', 'restitution']) {
    if (cfg[name] !== undefined && !isNumberBetween(cfg[name], 0, 1)) {
      throw new Error(`[prim] ${name} must be a number between 0 and 1`)
    }
  }
  if (cfg.physics !== undefined && cfg.physics !== null && !['static', 'kinematic', 'dynamic'].includes(cfg.physics)) {
    throw new Error('[prim] physics must be null, "static", "kinematic", or "dynamic"')
  }
  for (const name of ['mass', 'linearDamping', 'angularDamping']) {
    if (cfg[name] !== undefined && (!isFiniteNumber(cfg[name]) || (name === 'mass' ? cfg[name] <= 0 : cfg[name] < 0))) {
      throw new Error(`[prim] ${name} must be a valid non-negative number`)
    }
  }
  if (cfg.layer !== undefined && typeof cfg.layer !== 'string') throw new Error('[prim] layer must be string')
  if (cfg.tag !== undefined && cfg.tag !== null && typeof cfg.tag !== 'string') throw new Error('[prim] tag must be string or null')
  for (const name of ['onContactStart', 'onContactEnd', 'onTriggerEnter', 'onTriggerLeave']) {
    if (cfg[name] !== undefined && cfg[name] !== null && typeof cfg[name] !== 'function') {
      throw new Error(`[prim] ${name} must be function or null`)
    }
  }
}

function node(kind, cfg={}) {
  if (kind === 'prim') validatePrimConfig(cfg)
  const n={kind,children:[],parent:null,...cfg}
  n.position=vec3(cfg.position)
  n.rotation=vec3(cfg.rotation)
  n.quaternion=quat(cfg.quaternion || qeulerYXZ(cfg.rotation || [0,0,0]))
  n.scale=vec3(cfg.scale||[1,1,1])
  n.add=c=>{c.parent=n;n.children.push(c);return c}
  return n
}

const app=node('app',{position:[0,0,0],quaternion:[0,0,0,1],scale:[1,1,1]})
app.create=node
app.add=n=>{n.parent=app;rootNodes.push(n);return n}
app.on=(name,fn)=>{if(!events.has(name))events.set(name,new Set());events.get(name).add(fn)}
app.off=(name,fn)=>events.get(name)?.delete(fn)
app.resetOnMove=false
app.isMoving=false

const world={
  isClient:true,
  isServer:false,
  add(n){n.parent=null;if(!worldNodes.includes(n))worldNodes.push(n);return n},
  remove(n){const i=worldNodes.indexOf(n);if(i>=0)worldNodes.splice(i,1)},
}

const sandbox={app,world,props:{},DEG2RAD:Math.PI/180,RAD2DEG:180/Math.PI,Math,console}
vm.createContext(sandbox)
vm.runInContext(fs.readFileSync(path,'utf8'),sandbox,{filename:path})
for (const fn of events.get('update') || []) fn(0)

let rootCount=0
;(function walk(ns){for(const n of ns){rootCount++;walk(n.children||[])}})(rootNodes)
console.log(JSON.stringify({ok:true,nodes:rootCount+worldNodes.length,appNodes:rootCount,worldNodes:worldNodes.length}))
