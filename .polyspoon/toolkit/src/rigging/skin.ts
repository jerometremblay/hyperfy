import { BufferGeometry,Float32BufferAttribute,Uint16BufferAttribute,Vector3 } from 'three';
export interface SkinStation {right?:Vector3;center:Vector3;radiusX:number;radiusY:number;weights:[number,number][]}
export function skinGeometry(stations:SkinStation[],segments=8,flattenFloor=false,caps:{start?:boolean;end?:boolean}={}):BufferGeometry {
  if(stations.length<2||segments<6)throw new Error('Skin loft requires rings');
  const positions:number[]=[],indices:number[]=[],weights:number[]=[],joints:number[]=[];
  function vertex(point:Vector3,influences:[number,number][]){
    positions.push(point.x,flattenFloor?Math.max(0,point.y):point.y,point.z);
    for(let i=0;i<4;i++){const weight=influences[i]?.[1]??0;joints.push(weight>0?influences[i]![0]:0);weights.push(weight);}
  }
  for(let i=0;i<stations.length;i++){
    const station=stations[i]!,tangent=stations[Math.min(i+1,stations.length-1)]!.center.clone().sub(stations[Math.max(0,i-1)]!.center).normalize();
    const axis=Math.abs(tangent.z)<.9?new Vector3(0,0,1):new Vector3(0,1,0),right=station.right?station.right.clone().addScaledVector(tangent,-station.right.dot(tangent)).normalize():axis.cross(tangent).normalize(),up=tangent.clone().cross(right).normalize();
    for(let j=0;j<segments;j++){const angle=j/segments*Math.PI*2;vertex(station.center.clone().addScaledVector(right,Math.cos(angle)*station.radiusX).addScaledVector(up,Math.sin(angle)*station.radiusY),station.weights);}
    if(i)for(let j=0;j<segments;j++){const a=(i-1)*segments+j,b=(i-1)*segments+(j+1)%segments,c=i*segments+j,d=i*segments+(j+1)%segments;indices.push(a,b,c,b,d,c);}
  }
  if(caps.start!==false){const start=positions.length/3;vertex(stations[0]!.center,stations[0]!.weights);for(let j=0;j<segments;j++)indices.push(start,(j+1)%segments,j);}
  if(caps.end!==false){const end=positions.length/3;vertex(stations.at(-1)!.center,stations.at(-1)!.weights);for(let j=0;j<segments;j++){const offset=(stations.length-1)*segments;indices.push(end,offset+j,offset+(j+1)%segments);}}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('skinIndex',new Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function combineSkins(parts:BufferGeometry[]):BufferGeometry {
  const positions:number[]=[],weights:number[]=[],joints:number[]=[],indices:number[]=[];
  for(const part of parts){const offset=positions.length/3;positions.push(...part.getAttribute('position').array);weights.push(...part.getAttribute('skinWeight').array);joints.push(...part.getAttribute('skinIndex').array);indices.push(...Array.from(part.index!.array,index=>index+offset));part.dispose();}
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.setAttribute('skinIndex',new Uint16BufferAttribute(joints,4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(weights,4));geometry.setIndex(indices);geometry.computeVertexNormals();geometry.computeBoundingBox();return geometry;
}

export function skinBand(stations:SkinStation[],thickness:number,segments=8):BufferGeometry {
  const outer=skinGeometry(stations,segments,false,{start:false,end:false}),inner=skinGeometry(stations.map(station=>({...station,radiusX:station.radiusX-thickness,radiusY:station.radiusY-thickness})),segments,false,{start:false,end:false});
  const inside=Array.from(inner.index!.array);for(let i=0;i<inside.length;i+=3)[inside[i+1],inside[i+2]]=[inside[i+2]!,inside[i+1]!];inner.setIndex(inside);
  const geometry=combineSkins([outer,inner]),indices=Array.from(geometry.index!.array),offset=stations.length*segments,last=(stations.length-1)*segments;
  for(let j=0;j<segments;j++){const next=(j+1)%segments;indices.push(j,offset+j,next,offset+j,offset+next,next,last+j,last+next,offset+last+j,offset+last+j,last+next,offset+last+next);}
  geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
export function skinPolyhedron(points:Vector3[],indices:number[],bone:number):BufferGeometry {
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(points.flatMap(point=>point.toArray()),3));geometry.setAttribute('skinIndex',new Uint16BufferAttribute(points.flatMap(()=>[bone,0,0,0]),4));geometry.setAttribute('skinWeight',new Float32BufferAttribute(points.flatMap(()=>[1,0,0,0]),4));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
}
