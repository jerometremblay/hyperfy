import {BufferGeometry,Float32BufferAttribute,ShapeUtils,Vector2} from 'three';
export function shapedRoofCourse(inner:number,outer:number,z0:number,z1:number,side:number,height:(x:number,z:number)=>number,thickness:number,scallop:number,phase:number){
 const samples=6,width=z1-z0;
 const plan:Array<[number,number]>=[[inner,z0],[outer-scallop*.32,z0]];
 for(let j=1;j<=samples;j++){
  const t=j/samples,z=z0+width*t;
  const edge=outer+scallop*(Math.sin(t*Math.PI)*(.85+.15*Math.sin(phase))- .32)+scallop*.12*Math.sin(t*Math.PI*2+phase);
  plan.push([edge,z]);
 }
 plan.push([inner,z1]);
 const footprint=plan.map(([x,z]):[number,number]=>[side*x,z]);if(side<0)footprint.reverse();
 const top=footprint.map(([x,z])=>{
  const t=Math.min(1,Math.max(0,(Math.abs(x)-inner)/(outer-inner)));
  return [x,height(x,z)+thickness*(.55+.45*Math.sin(t*Math.PI*.65)),z];
 });
 const bottom=footprint.map(([x,z])=>[x,height(x,z)-thickness*.20,z]);
 const positions:number[]=[],tri=(a:number[],b:number[],c:number[])=>positions.push(...a,...b,...c);
 for(const [a,b,c] of ShapeUtils.triangulateShape(footprint.map(([x,z])=>new Vector2(x,z)),[])){
  tri(top[a!]!,top[c!]!,top[b!]!);tri(bottom[a!]!,bottom[b!]!,bottom[c!]!);
 }
 for(let i=0;i<footprint.length;i++){const j=(i+1)%footprint.length;tri(top[i]!,top[j]!,bottom[j]!);tri(top[i]!,bottom[j]!,bottom[i]!);}
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();return g;
}
export function angularThatchBand(inner:number,outer:number,z0:number,z1:number,side:number,height:(x:number,z:number)=>number,thickness:number,course:number,backing?:(x:number,z:number)=>number){
 const count=8,top:number[][]=[],bottom:number[][]=[],positions:number[]=[];
 for(let j=0;j<=count;j++){
  const z=z0+(z1-z0)*j/count,rag=.045*Math.sin(j*2.1+course*1.7)+.025*Math.cos(j*3.4-course);
  const x=side*(outer+rag),ix=side*(inner+(inner>0?.045*Math.sin(j*2.1+(course-1)*1.7)+.025*Math.cos(j*3.4-(course-1)):0));
  top.push([ix,height(ix,z)+thickness*.76,z],[x,height(x,z)+thickness*(.88+.09*Math.sin(j*1.9+course)),z]);
  bottom.push([ix,backing?backing(ix,z):height(ix,z)-thickness*.15,z],[x,backing?backing(x,z):height(x,z)-thickness*.15,z]);
 }
 const tri=(a:number[],b:number[],c:number[])=>{if(side>0)positions.push(...a,...b,...c);else positions.push(...a,...c,...b);};
 for(let j=0;j<count;j++){
  const k=j*2;tri(top[k]!,top[k+2]!,top[k+3]!);tri(top[k]!,top[k+3]!,top[k+1]!);
  tri(bottom[k]!,bottom[k+3]!,bottom[k+2]!);tri(bottom[k]!,bottom[k+1]!,bottom[k+3]!);
  tri(top[k+1]!,top[k+3]!,bottom[k+3]!);tri(top[k+1]!,bottom[k+3]!,bottom[k+1]!);
  tri(top[k+2]!,top[k]!,bottom[k]!);tri(top[k+2]!,bottom[k]!,bottom[k+2]!);
 }
 tri(top[0]!,top[1]!,bottom[1]!);tri(top[0]!,bottom[1]!,bottom[0]!);
 const k=count*2;tri(top[k+1]!,top[k]!,bottom[k]!);tri(top[k+1]!,bottom[k]!,bottom[k+1]!);
 const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();return g;
}
