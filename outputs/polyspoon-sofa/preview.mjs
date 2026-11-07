import * as THREE from 'three'
import { createAsset, disposeAsset, metadata } from './sofa.recipe.mjs'
const canvas=document.querySelector('#view'), renderer=new THREE.WebGLRenderer({canvas,antialias:true})
renderer.setPixelRatio(1)
const inputs=new Map()
for(const control of metadata.controls) {
 const label=document.createElement('label'), input=document.createElement('input'), output=document.createElement('output')
 label.append(document.createTextNode(control.label+' '))
 input.type=control.kind==='color'?'color':'range'
 if(control.kind!=='color'){input.min=control.min;input.max=control.max;input.step=control.step;label.append(input,output)}
 else label.append(input)
 input.value=control.default
 document.querySelector('header').append(label);inputs.set(control.key,{input,output,control})
}
const directions=[[0,0.3,-3],[2,1.2,-3],[0,0.5,3]], views=[]
for(const direction of directions) {
 const scene=new THREE.Scene();scene.background=new THREE.Color('#ece8e2')
 scene.add(new THREE.HemisphereLight(0xffffff,0xa9a19a,2.2))
 const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-3,7,-4);scene.add(light)
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(30,30),new THREE.MeshStandardMaterial({color:'#d8d1c9',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-0.01;scene.add(floor)
 views.push({scene,direction,sofa:null})
}
function draw(){
 const parameters=Object.fromEntries([...inputs].map(([key,{input,output,control}])=>{
  const value=control.kind==='color'?input.value:Number(input.value)
  if(control.kind!=='color')output.textContent=value+' '+control.unit
  return [key,value]
 }))
 const seats=parameters.seatCount,width=parameters.seatWidth
 renderer.setSize(canvas.clientWidth,canvas.clientHeight,false)
 for(let i=0;i<views.length;i++){
  const v=views[i];if(v.sofa){v.scene.remove(v.sofa);disposeAsset(v.sofa)}
  v.sofa=createAsset(parameters);v.scene.add(v.sofa)
  const w=canvas.clientWidth/3,h=canvas.clientHeight,aspect=w/h,span=Math.max(1.7,(seats*width+.8)/2)
  const camera=new THREE.OrthographicCamera(-span,span,span/aspect,-span/aspect,.01,100)
  camera.position.set(...v.direction);camera.lookAt(0,.53,0)
  renderer.setViewport(i*w,0,w,h);renderer.setScissor(i*w,0,w,h);renderer.setScissorTest(true);renderer.render(v.scene,camera)
 }
}
for(const input of document.querySelectorAll('input,select'))input.addEventListener('input',draw)
window.addEventListener('resize',draw);draw()
document.querySelector('#status').remove()
