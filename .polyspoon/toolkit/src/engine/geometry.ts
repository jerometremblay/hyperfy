import { BufferGeometry, Float32BufferAttribute, Shape, ExtrudeGeometry, Vector3, Quaternion, BoxGeometry } from 'three';

export interface FacetedStation { center:[number,number,number]; outline:Array<[number,number]> }
export function facetedLoft(stations:FacetedStation[],caps:{bottom:boolean;top:boolean}={bottom:true,top:true}):BufferGeometry {
  const count=stations[0]?.outline.length??0;
  if(stations.length<2||count<3||stations.some((s,i)=>s.outline.length!==count||![...s.center,...s.outline.flat()].every(Number.isFinite)||(i>0&&s.center[1]<=stations[i-1]!.center[1])))throw new Error('Invalid faceted loft');
  for(const station of stations) {
    const area=station.outline.reduce((sum,[x,z],i)=>{const next=station.outline[(i+1)%count]!;return sum+x*next[1]-next[0]*z;},0);
    if(area<=1e-10)throw new Error('Loft outline must have positive area and winding');
    for(let i=0;i<count;i++) {
      const a=station.outline[i]!,b=station.outline[(i+1)%count]!;
      const side=(p:[number,number])=>(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]);
      if(side([0,0])<=1e-10||station.outline.some((p,j)=>j!==i&&j!==(i+1)%count&&side(p)<=1e-10))throw new Error('Loft outline must be strictly convex around its center');
    }
  }
  const rings=stations.map(s=>s.outline.map(([x,z])=>[s.center[0]+x,s.center[1],s.center[2]+z]));
  const positions:number[]=[];
  const triangle=(a:number[],b:number[],c:number[])=>positions.push(...a,...b,...c);
  for(let k=0;k<rings.length-1;k++)for(let i=0;i<count;i++) {
    const j=(i+1)%count;
    triangle(rings[k]![i]!,rings[k+1]![i]!,rings[k+1]![j]!);
    triangle(rings[k]![i]!,rings[k+1]![j]!,rings[k]![j]!);
  }
  for(let i=0;i<count;i++) {
    const j=(i+1)%count;
    if(caps.bottom)triangle(stations[0]!.center,rings[0]![i]!,rings[0]![j]!);
    if(caps.top)triangle(stations.at(-1)!.center,rings.at(-1)![j]!,rings.at(-1)![i]!);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}


interface Station { y: number; width: number; depth: number; chamfer: number }
export function profileSolid(stations: Station[]): BufferGeometry {
  if(stations.length<2||stations.some((s,i)=>![s.y,s.width,s.depth,s.chamfer].every(Number.isFinite)||s.width<=0||s.depth<=0||s.chamfer<=0||s.chamfer>=Math.min(s.width,s.depth)/2||(i>0&&s.y<=stations[i-1]!.y)))throw new Error('Invalid profile stations');
  const rings = stations.map(s => {
    const x = s.width / 2, z = s.depth / 2, c = s.chamfer;
    return [[-x + c, s.y, -z], [x - c, s.y, -z], [x, s.y, -z + c], [x, s.y, z - c], [x - c, s.y, z], [-x + c, s.y, z], [-x, s.y, z - c], [-x, s.y, -z + c]];
  });
  const positions: number[] = [];
  const triangle = (a: number[], b: number[], c: number[]) => positions.push(...a, ...b, ...c);
  for (let k = 0; k < rings.length - 1; k++) {
    const lower = rings[k]!, upper = rings[k + 1]!;
    for (let i = 0; i < 8; i++) {
      const j = (i + 1) % 8;
      triangle(lower[i]!, upper[i]!, upper[j]!);
      triangle(lower[i]!, upper[j]!, lower[j]!);
    }
  }
  for (let i = 0; i < 8; i++) {
    const j = (i + 1) % 8;
    triangle([0, stations[0]!.y, 0], rings[0]![i]!, rings[0]![j]!);
    triangle([0, stations.at(-1)!.y, 0], rings.at(-1)![j]!, rings.at(-1)![i]!);
  }
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function profiledBeam(from:[number,number,number],to:[number,number,number],width:number,depth:number,chamfer:number):BufferGeometry {
  const start=new Vector3(...from),delta=new Vector3(...to).sub(start),length=delta.length();
  if(length<=1e-8)throw new Error('Beam span must be positive');
  const geometry=profileSolid([{y:0,width,depth,chamfer},{y:length,width,depth,chamfer}]);
  geometry.applyQuaternion(new Quaternion().setFromUnitVectors(new Vector3(0,1,0),delta.normalize()));
  geometry.translate(...from);return geometry;
}
export function framedPanel(width:number,height:number,frame:number,depth:number,reveal:number) {
  if(![width,height,frame,depth,reveal].every(Number.isFinite)||Math.min(width,height)<=frame*2||frame<=0||depth<=0||reveal<0)throw new Error('Invalid framed panel opening');
  const box=(w:number,h:number,d:number,position:[number,number,number])=>({geometry:new BoxGeometry(w,h,d),position});
  return {
    left:box(frame,height,depth,[-(width-frame)/2,0,0]),
    right:box(frame,height,depth,[(width-frame)/2,0,0]),
    top:box(width-frame*2,frame,depth,[0,(height-frame)/2,0]),
    bottom:box(width-frame*2,frame,depth,[0,-(height-frame)/2,0]),
    backing:box(width-frame*2,height-frame*2,0.025,[0,0,-depth/2-reveal]),
  };
}
export function repeatSpan(span:number,targetWidth:number,gap=0) {
  if(![span,targetWidth,gap].every(Number.isFinite)||span<=0||targetWidth<=0||gap<0)throw new Error('Invalid repeated span');
  const count=Math.max(1,Math.round((span+gap)/(targetWidth+gap))),width=(span-gap*(count-1))/count;
  if(width<=0)throw new Error('Repeated span has no usable width');
  return {count,width,centers:Array.from({length:count},(_,i)=>-span/2+width/2+i*(width+gap))};
}

export function carryingBand(innerWidth: number, bottom: number, innerTop: number, band: number, depth: number): BufferGeometry {
  const x = innerWidth / 2, outer = x + band, top = innerTop + band, cut = band * 0.65;
  const shape = new Shape();
  shape.moveTo(-outer, bottom);
  shape.lineTo(-outer, top - cut);
  shape.lineTo(-outer + cut, top);
  shape.lineTo(outer - cut, top);
  shape.lineTo(outer, top - cut);
  shape.lineTo(outer, bottom);
  shape.lineTo(x, bottom);
  shape.lineTo(x, innerTop);
  shape.lineTo(-x, innerTop);
  shape.lineTo(-x, bottom);
  shape.closePath();
  const geometry = new ExtrudeGeometry(shape, { depth, steps: 1, bevelEnabled: false, curveSegments: 1 });
  geometry.translate(0, 0, -depth / 2);
  geometry.clearGroups();
  return geometry;
}

export function taperedSweep(stations:Array<{center:[number,number,number];radius:number}>,sides=9):BufferGeometry {
  if(stations.length<2||sides<3||stations.some(s=>s.radius<=0||![...s.center,s.radius].every(Number.isFinite)))throw new Error('Invalid sweep stations');
  const centers=stations.map(s=>new Vector3(...s.center)),rings:Vector3[][]=[];
  let previous:Vector3|undefined;
  for(let i=0;i<stations.length;i++){
    const tangent=centers[Math.min(i+1,centers.length-1)]!.clone().sub(centers[Math.max(0,i-1)]!);
    if(tangent.length()<1e-8)throw new Error('Collapsed sweep path');
    tangent.normalize();
    let u=previous?.clone().addScaledVector(tangent,-previous.dot(tangent));
    if(!u||u.length()<1e-6)u=new Vector3(Math.abs(tangent.y)<.9?0:1,Math.abs(tangent.y)<.9?1:0,0).cross(tangent);
    u.normalize();const v=tangent.clone().cross(u);previous=u;
    rings.push(Array.from({length:sides},(_,j)=>centers[i]!.clone().addScaledVector(u!,Math.cos(j*2*Math.PI/sides)*stations[i]!.radius).addScaledVector(v,Math.sin(j*2*Math.PI/sides)*stations[i]!.radius)));
  }
  const positions:number[]=[],tri=(a:Vector3,b:Vector3,c:Vector3)=>positions.push(...a.toArray(),...b.toArray(),...c.toArray());
  for(let i=0;i<rings.length-1;i++)for(let j=0;j<sides;j++){
    const k=(j+1)%sides;tri(rings[i]![j]!,rings[i]![k]!,rings[i+1]![k]!);tri(rings[i]![j]!,rings[i+1]![k]!,rings[i+1]![j]!);
  }
  for(let j=0;j<sides;j++){const k=(j+1)%sides;tri(centers[0]!,rings[0]![k]!,rings[0]![j]!);tri(centers.at(-1)!,rings.at(-1)![j]!,rings.at(-1)![k]!);}
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();return g;
}
