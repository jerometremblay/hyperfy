import {shapedRoofCourse,angularThatchBand} from '../engine/roof.ts';
import { BufferGeometry, Float32BufferAttribute, ExtrudeGeometry, Shape, Vector3, Raycaster, type Mesh } from 'three';
import { Assembly } from './assembly.ts';
import { palettes } from './config.ts';
import type { Configuration } from './config.ts';
import { repeatSpan, profileSolid } from '../engine/geometry.ts';

function roofPatch(x0:number,x1:number,z0:number,z1:number,height:(x:number,z:number)=>number,thickness:number) {
  const top=[[x0,height(x0,z0),z0],[x1,height(x1,z0),z0],[x1,height(x1,z1),z1],[x0,height(x0,z1),z1]];
  const points=[...top,...top.map(p=>[p[0]!,p[1]!-thickness,p[2]!])],positions:number[]=[];
  for(const [a,b,c,d] of [[0,3,2,1],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]]) {
    positions.push(...points[a!]!,...points[b!]!,...points[c!]!,...points[a!]!,...points[c!]!,...points[d!]!);
  }
  const g=new BufferGeometry();g.setAttribute('position',new Float32BufferAttribute(positions,3));g.computeVertexNormals();
  const normals=g.getAttribute('normal'),vertices=g.getAttribute('position'),epsilon=0.0001;
  for(let i=0;i<6;i++) {
    const x=vertices.getX(i),z=vertices.getZ(i);
    const normal=new Vector3(-(height(x+epsilon,z)-height(x-epsilon,z))/(2*epsilon),1,-(height(x,z+epsilon)-height(x,z-epsilon))/(2*epsilon)).normalize();
    normals.setXYZ(i,normal.x,normal.y,normal.z);
  }
  return g;
}
function roofTrim(xs:number[],zs:number[],top:(x:number,z:number)=>number,bottom:(x:number,z:number)=>number){
  const upper=zs.map(z=>xs.map(x=>[x,top(x,z),z])),lower=zs.map(z=>xs.map(x=>[x,bottom(x,z),z])),positions:number[]=[];
  const quad=(a:number[],b:number[],c:number[],d:number[])=>positions.push(...a,...b,...c,...a,...c,...d);
  const lastX=xs.length-1,lastZ=zs.length-1;
  for(let j=0;j<lastZ;j++)for(let i=0;i<lastX;i++){
    quad(upper[j]![i]!,upper[j+1]![i]!,upper[j+1]![i+1]!,upper[j]![i+1]!);
    quad(lower[j]![i]!,lower[j]![i+1]!,lower[j+1]![i+1]!,lower[j+1]![i]!);
  }
  for(let j=0;j<lastZ;j++){
    quad(upper[j+1]![0]!,upper[j]![0]!,lower[j]![0]!,lower[j+1]![0]!);
    quad(upper[j]![lastX]!,upper[j+1]![lastX]!,lower[j+1]![lastX]!,lower[j]![lastX]!);
  }
  for(let i=0;i<lastX;i++){
    quad(upper[0]![i]!,upper[0]![i+1]!,lower[0]![i+1]!,lower[0]![i]!);
    quad(upper[lastZ]![i+1]!,upper[lastZ]![i]!,lower[lastZ]![i]!,lower[lastZ]![i+1]!);
  }
  const geometry=new BufferGeometry();geometry.setAttribute('position',new Float32BufferAttribute(positions,3));geometry.computeVertexNormals();return geometry;
}
export function cottage(config:Configuration) {
  const p=config.applied,a=new Assembly(config,{...palettes[p.colorway],hardware:'#b99247'});
  const w=Number(p.width),d=Number(p.depth),h=Number(p.wallHeight),rise=Number(p.roofRise),eave=Number(p.eaveOverhang);
  const stout=p.beamWeight==='stout',beam=(stout?0.21:0.15)*Number(p.beamSection),detail=p.detail==='inspection',floor=0.22;
  const half=w/2+eave,zHalf=d/2+eave,sag=Number(p.roofCharacter)*Number(p.ridgeSag)*rise*0.42;
  const roofY=(x:number,z:number)=>h+rise-rise*Math.abs(x)/(w/2)+Math.max(0,Math.abs(x)-w/2)*0.20-sag*Math.max(0,1-Math.abs(x)/(w/2))*Math.max(0,1-(z/(d/2))**2);
  const deckZ=[-zHalf,-d/2,-d/4,0,d/4,d/2,zHalf],deckDepth=.10;
  const roofDeckY=(x:number,z:number)=>{
    const xs=x<0?[-half,-w/2,0]:[0,w/2,half];
    const xi=x>xs.at(-1)!?xs.length-2:Math.max(0,xs.findIndex(value=>value>=x)-1);
    const zi=z>deckZ.at(-1)!?deckZ.length-2:Math.max(0,deckZ.findIndex(value=>value>=z)-1);
    const x0=xs[xi]!,x1=xs[xi+1]!,z0=deckZ[zi]!,z1=deckZ[zi+1]!;
    const u=(x-x0)/(x1-x0),v=(z-z0)/(z1-z0);
    const a=roofY(x0,z0),b=roofY(x1,z0),c=roofY(x1,z1),e=roofY(x0,z1);
    return .015+(v>=u?a+(e-a)*v+(c-e)*u:a+(b-a)*u+(c-b)*v);
  };
  const stone=(name:string,width:number,height:number,depth:number,x:number,y:number,z:number)=>a.mesh(name,profileSolid([{y:0,width:width-0.02,depth:depth-0.02,chamfer:0.02},{y:height*0.22,width,depth,chamfer:0.025},{y:height*0.82,width,depth,chamfer:0.025},{y:height,width:width-0.015,depth:depth-0.015,chamfer:0.02}]),'stone',[x,y,z]);
  stone('foundation',w+0.22,floor,d+0.22,0,0,0);
  if(detail) {
    const row=repeatSpan(w+0.16,0.85,0.025);
    row.centers.forEach((x,i)=>{stone('plinth-front-'+i,row.width,0.16,0.15,x,0.04,d/2+0.05);stone('plinth-rear-'+i,row.width,0.16,0.15,x,0.04,-d/2-0.05);});
  }
  const doorW=1.05,doorH=2.05,doorOuter=1.35;
  const n=p.windowLayout==='sparse'?1:w>=5.8?2:1,windowW=p.windowLayout==='workshop'?(w<4.2?.68:.91):w<4.2?0.62:0.76,windowH=0.95,windowY=1.47;
  const windows:number[]=[];
  for(const side of (p.windowLayout==='sparse'?[-1]:[-1,1]))for(let i=0;i<n;i++)windows.push(side*(0.87+(w/2-0.98)*(i+0.5)/n));
  const openings=[{x:0,width:doorOuter,bottom:floor,top:floor+doorH+0.17},...windows.map(x=>({x,width:windowW,bottom:windowY-windowH/2,top:windowY+windowH/2}))].sort((a,b)=>a.x-b.x);
  const sillY=floor+beam*.35,frontZ=d/2+.015,headY=h-.05;
  for(const side of [-1,1]){
    const x0=side<0?-w/2:doorOuter/2,x1=side<0?-doorOuter/2:w/2;
    a.beam('front-sill-'+side,[x0,sillY,frontZ],[x1,sillY,frontZ],beam*.7,.20,'timber');
  }
  const framePier=(id:string,x0:number,x1:number)=>{
    const span=x1-x0,section=Math.min(beam*.8,span*.7),sill='front-sill-'+((x0+x1)<0?-1:1);
    if(span<=section*2.5){
      const x=(x0+x1)/2;
      a.beam('front-bay-post-'+id,[x,sillY,frontZ],[x,headY,frontZ],section,.20,'timber');
      return;
    }
    const low=x0+section/2,high=x1-section/2;
    for(const [end,x] of [['left',low],['right',high]] as const)
      a.beam('front-bay-post-'+id+'-'+end,[x,sillY,frontZ],[x,headY,frontZ],section,.20,'timber');
    if(p.framingStyle==='diagonal'&&span>=.85&&(high-low)/(headY-sillY)>.27){
      const from:[number,number,number]=[low,sillY,frontZ],to:[number,number,number]=[high,headY,frontZ];
      const brace=a.beam('facade-diagonal-'+id,from,to,section*.75,.18,'timber');
      Object.assign(brace.userData,{from,to,supports:[[sill,'front-bay-post-'+id+'-left'],['eave-beam-1','front-bay-post-'+id+'-right']]});
    }
  };
  let left=-w/2;
  for(const [i,o] of openings.entries()) {
    const start=o.x-o.width/2,end=o.x+o.width/2;
    if(start>left){
      a.box('front-wall-pier-'+i,[start-left,h-floor,0.24],'plaster',[(left+start)/2,(h+floor)/2,d/2-0.12]);
      framePier(String(i),left,start);
    }
    if(o.bottom>floor)a.box('front-wall-below-'+i,[o.width,o.bottom-floor,0.24],'plaster',[o.x,(floor+o.bottom)/2,d/2-0.12]);
    a.box('front-wall-above-'+i,[o.width,h-o.top,0.24],'plaster',[o.x,(h+o.top)/2,d/2-0.12]);
    left=end;
  }
  a.box('front-wall-pier-end',[w/2-left,h-floor,0.24],'plaster',[(left+w/2)/2,(h+floor)/2,d/2-0.12]);
  framePier('end',left,w/2);
  a.box('wall-rear',[w,h-floor,0.24],'plaster',[0,(h+floor)/2,-d/2+0.12]);
  for(const side of [-1,1]) {
    const sw=0.95,sy=1.48,sh=1.05;
    if(p.framingStyle==='diagonal')for(const end of [-1,1]){
      a.beam('side-diagonal-'+side+'-'+end,[side*(w/2+.015),floor+.1,end*(d/2-.12)],[side*(w/2+.015),h-.15,end*(sw/2+.13)],.17,beam*.8,'timber');
    }
    for(const end of [-1,1])a.box('side-wall-pier-'+side+'-'+end,[0.24,h-floor,(d-sw)/2],'plaster',[side*(w/2-0.12),(h+floor)/2,end*(d+sw)/4]);
    a.box('side-wall-below-'+side,[0.24,sy-sh/2-floor,sw],'plaster',[side*(w/2-0.12),(floor+sy-sh/2)/2,0]);
    a.box('side-wall-above-'+side,[0.24,h-sy-sh/2,sw],'plaster',[side*(w/2-0.12),(h+sy+sh/2)/2,0]);
    a.panel('side-window-'+side,sw,sh,beam*0.5,0.20,0.11,[side*(w/2-0.025),sy,0],'wood','recess',side*Math.PI/2);
    a.box('side-window-mullion-'+side,[0.085,sh-0.12,0.055],'timber',[side*(w/2-0.035),sy,0]);
  }
  for(const [i,x] of windows.entries()) {
    a.panel('front-window-'+i,windowW,windowH,beam*0.5,0.20,0.13,[x,windowY,d/2-0.035],'wood','recess');
    a.box('window-mullion-'+i,[0.055,windowH-0.14,0.1],'timber',[x,windowY,d/2-0.02]);
    a.box('window-transom-'+i,[windowW-0.13,0.05,0.1],'timber',[x,windowY+0.08,d/2-0.02]);
    a.beam('window-sill-'+i,[x-windowW/2-0.07,windowY-windowH/2-0.02,d/2+0.055],[x+windowW/2+0.07,windowY-windowH/2-0.02,d/2+0.055],0.12,0.28,'wood');
    if(p.shutters)for(const side of [-1,1]) {
      const sx=x+side*(windowW/2+0.11);
      a.box('shutter-'+i+'-'+side,[0.19,windowH,0.055],'wood',[sx,windowY,d/2+0.025]);
      for(const y of [-0.28,0.28])a.box('shutter-band-'+i+'-'+side+'-'+y,[0.20,0.065,0.07],'timber',[sx,windowY+y,d/2+0.04]);
    }
  }
  const doorFace=d/2-.275;
  a.box('entrance-door',[doorW,doorH,0.08],'wood',[0,floor+doorH/2,doorFace-.04]);
  for(const side of [-1,1])a.beam('entrance-jamb-'+side,[side*(doorW/2+0.075),floor,d/2-0.06],[side*(doorW/2+0.075),floor+doorH+0.17,d/2-0.06],beam,0.42,'timber');
  a.beam('entrance-lintel',[-0.76,floor+doorH+0.09,d/2-.04],[0.76,floor+doorH+0.09,d/2-.04],0.24,0.46,'timber');
  stone('entrance-threshold',doorW+.12,.07,.44,0,floor-.035,d/2-.08);
  if(detail) {
    const boards=repeatSpan(doorW,0.21,0.012);
    boards.centers.forEach((x,i)=>a.box('door-board-'+i,[boards.width,doorH-0.05,0.045],'wood',[x,floor+doorH/2,doorFace+.012]));
    for(const y of [floor+0.32,floor+1.68])a.box('door-strap-'+y,[0.28,0.055,0.035],'recess',[-0.33,y,doorFace+.045]);
  }
  const hardwareFace=doorFace+(detail?.0345:0);
  a.box('door-latch-plate',[0.085,0.19,0.025],'recess',[0.35,1.16,hardwareFace+.0125]);
  a.box('door-latch',[0.13,0.04,0.05],'hardware',[0.37,1.17,hardwareFace+.0455]);
  stone('entrance-step',1.65,0.14,0.70,0,0,d/2+0.18);
  for(const x of [-1,1])for(const z of [-1,1])a.beam('corner-post-'+x+'-'+z,[x*(w/2-0.06),floor,z*(d/2-0.035)],[x*(w/2-0.06),h,z*(d/2-0.035)],beam,beam,'timber');
  for(const z of [-1,1]) {
    a.beam('eave-beam-'+z,[-w/2-0.07,h-0.05,z*(d/2-0.02)],[w/2+0.07,h-0.05,z*(d/2-0.02)],beam,beam,'timber');
    const g=new Shape();g.moveTo(-w/2,h);g.lineTo(w/2,h);g.lineTo(0,roofY(0,z*d/2));g.closePath();
    a.mesh('gable-'+z,new ExtrudeGeometry(g,{depth:0.20,bevelEnabled:false,steps:1}),'plaster',[0,0,z>0?d/2-0.2:-d/2]);
    a.beam('gable-upright-'+z,[0,h,z*(d/2+0.01)],[0,roofY(0,z*d/2)-0.035,z*(d/2+0.01)],beam*0.8,0.14,'timber');
    for(const side of [-1,1])a.beam('gable-brace-'+z+'-'+side,[side*w*0.33,h-0.05,z*(d/2+0.015)],[0,h+(roofY(0,z*d/2)-h)*0.67,z*(d/2+0.015)],beam*0.6,0.12,'timber');
  }
  a.beam('rear-cross-beam',[-w/2+0.05,1.45,-d/2-0.015],[w/2-0.05,1.45,-d/2-0.015],beam*0.85,beam*0.85,'timber');
  a.beam('rear-supported-brace',[-w/2+0.07,floor,-d/2-0.015],[0,1.45,-d/2-0.015],beam*0.65,beam*0.65,'timber');
  const zStations=[-zHalf,-d/2,0,d/2,zHalf],thatch=p.roofCover==='thatch',thickness=Number(p.roofThickness),coverDepth=thatch?thickness:thickness*.32;
  const courses=Math.max(3,Math.ceil(Math.hypot(half,rise)/(thatch?.75:.55))),pieceCount=Math.ceil(zHalf*2/(thatch?.95:.58)),pieceWidth=zHalf*2/pieceCount;
  const ridgeCover:Mesh[]=[];
  for(const side of [-1,1]) {
    const deckX=side<0?[-half,-w/2,0]:[0,w/2,half];
    for(let k=0;k<deckX.length-1;k++)for(let j=0;j<deckZ.length-1;j++)a.mesh('roof-deck-'+side+'-'+j+'-'+k,roofPatch(deckX[k]!,deckX[k+1]!,deckZ[j]!,deckZ[j+1]!, (x,z)=>roofY(x,z)+.015,deckDepth),'roof');
    for(let i=0;i<courses;i++){
      const low=i*half/courses,high=Math.min(half+.05,(i+1)*half/courses+(thatch?.11:.075));
      const edges=[-zHalf,...Array.from({length:pieceCount-1},(_,j)=>-zHalf+(j+1+(i%2)*.42)*pieceWidth),zHalf];
      for(let j=0;j<edges.length-1;j++){
        const z0=Math.max(-zHalf,edges[j]!-.025),z1=Math.min(zHalf,edges[j+1]!+.025),phase=i*2.3+j*1.7;
        const height=(x:number,z:number)=>thatch?roofY(x,z)+.035+coverDepth*.11*(1-i/courses):roofDeckY(x,z)+coverDepth*.15;
        const cover=thatch?angularThatchBand(low,high,z0,z1,side,height,coverDepth,phase,(x,z)=>roofDeckY(x,z)-.015):shapedRoofCourse(low,high,z0,z1,side,height,coverDepth,.035,phase);
        if(!thatch){
          const position=cover.getAttribute('position');
          for(let k=0;k<position.count;k++){
            const x=position.getX(k),z=position.getZ(k);
            if(position.getY(k)<height(x,z))position.setY(k,roofDeckY(x,z)-.04);
          }
          cover.computeVertexNormals();
        }
        const panel=a.mesh('roof-'+(side<0?'left':'right')+'-'+(thatch?'band':'course')+'-'+i+'-'+j,cover,'roof');
        if(i===0)ridgeCover.push(panel);
      }
    }
    const fasciaX=side*(half-.10),fasciaDepth=.13;
    const fasciaY=(z:number)=>roofDeckY(fasciaX,z)-deckDepth-fasciaDepth/2+.012;
    for(let j=0;j<zStations.length-1;j++){
      const fascia=a.beam('eave-fascia-'+side+'-'+j,[fasciaX,fasciaY(zStations[j]!),zStations[j]!],[fasciaX,fasciaY(zStations[j+1]!),zStations[j+1]!],.18,fasciaDepth,'timber');
      const position=fascia.geometry.getAttribute('position');
      for(let k=0;k<position.count;k++){
        const x=position.getX(k),z=position.getZ(k);
        position.setY(k,position.getY(k)+roofDeckY(x,z)-roofDeckY(fasciaX,z));
      }
      fascia.geometry.computeVertexNormals();
    }
    for(const z of [-1,1]){
      const xs=side<0?[-half,-w/2,0]:[0,w/2,half],edge=z*zHalf;
      const top=(x:number,sampleZ:number)=>roofDeckY(x,Math.max(-zHalf,Math.min(zHalf,sampleZ)))-deckDepth+.012;
      a.mesh('roof-rake-'+side+'-'+z,roofTrim(xs,[edge-.08,edge+.08],top,(x,sampleZ)=>top(x,sampleZ)-.16),'wood');
    }
  }
  a.root.updateMatrixWorld(true);
  const ridgeRay=new Raycaster(new Vector3(),new Vector3(0,-1,0)),ridgeHeights=new Map<string,number>(),coverZ=new Set<number>();
  for(const panel of ridgeCover){const position=panel.geometry.getAttribute('position');for(let i=0;i<position.count;i++)coverZ.add(position.getZ(i));}
  const coverStations=[...coverZ].sort((a,b)=>a-b).filter((value,i,all)=>i===0||value-all[i-1]!>1e-4);
  const ridgeSurface=(x:number,z:number)=>{
    const key=x+':'+z,cached=ridgeHeights.get(key);if(cached!==undefined)return cached;
    ridgeRay.ray.origin.set(x,h+rise+coverDepth+1,Math.max(-zHalf+1e-5,Math.min(zHalf-1e-5,z)));
    const hit=ridgeRay.intersectObjects(ridgeCover)[0];if(!hit)throw new Error('Ridge cap lacks a covering support surface');
    ridgeHeights.set(key,hit.point.y);return hit.point.y;
  };
  const capHalf=(.26+coverDepth*.35)/2,capDepth=.07+coverDepth*.08;
  const capXs=[-capHalf,-capHalf/2,0,capHalf/2,capHalf];
  for(let j=0;j<deckZ.length-1;j++){
    const z0=deckZ[j]!,z1=deckZ[j+1]!,stations=[z0,...coverStations.filter(z=>z>z0+1e-4&&z<z1-1e-4),z1];
    a.mesh('ridge-cap-'+j,roofTrim(capXs,stations,(x,z)=>ridgeSurface(x,z)+capDepth,(x,z)=>ridgeSurface(x,z)-.012),'roof');
  }
  if(p.chimney) {
    const x=-w*0.28,z=-d*0.22,bottom=roofY(x,z)-0.08,top=h+rise+0.66;
    const count=Math.ceil((top-bottom)/0.25),ch=(top-bottom)/count;
    for(let i=0;i<count;i++)stone('chimney-course-'+i,0.52+(i%2)*0.018,ch-0.012,0.62+(i%2)*0.018,x,bottom+i*ch,z);
    a.box('chimney-collar',[0.70,0.09,0.80],'recess',[x,bottom+0.1,z]);
    for(const side of [-1,1]) {
      a.box('chimney-top-side-'+side,[0.13,0.18,0.78],'stone',[x+side*0.275,top,z]);
      a.box('chimney-top-end-'+side,[0.42,0.18,0.13],'stone',[x,top,z+side*0.325]);
    }
    a.box('chimney-dark-interior',[0.40,0.025,0.49],'recess',[x,top-0.10,z]);
    a.anchors.chimney=[x,top+0.09,z];
  }
  if(p.workBay!=='none') {
    const side=p.workBay==='left'?-1:1,bx=side*(w/2+0.55),bz=-d*0.12,bd=Number(p.bayDepth),top=1.03,roofHigh=Math.max(1.9,h*0.72);
    stone('work-bay',1.1,top-0.13,bd,bx,0,bz);
    a.box('work-bay-surface',[1.15,0.13,bd+0.10],'wood',[bx,top-0.065,bz]);
    a.box('work-bay-back',[0.10,roofHigh-top,bd-0.15],'recess',[side*(w/2+0.045),(top+roofHigh)/2,bz]);
    for(const dx of [-1,1])for(const dz of [-1,1])a.beam('work-bay-post-'+dx+'-'+dz,[bx+dx*0.48,0,bz+dz*(bd/2-0.07)],[bx+dx*0.48,roofHigh-side*dx*0.1,bz+dz*(bd/2-0.07)],beam*0.8,beam*0.8,'timber');
    const by=(x:number)=>roofHigh+0.09-side*(x-bx)*0.21;
    a.mesh('work-bay-roof',roofPatch(bx-0.7,bx+0.7,bz-bd/2-0.2,bz+bd/2+0.2,(x)=>by(x),0.08),'roof');
    const bayCoverCount=Math.ceil((bd+.4)/.75),bayCoverSpan=(bd+.4)/bayCoverCount;
    for(let i=0;i<bayCoverCount;i++){
      const z0=bz-bd/2-.2+i*bayCoverSpan,z1=Math.min(bz+bd/2+.2,z0+bayCoverSpan+.04);
      a.mesh('work-bay-cover-'+i,roofPatch(bx-.72,bx+.72,z0,z1,(x)=>by(x)+.035,Math.max(.055,coverDepth*.35)),'roof');
    }
    for(const dz of [-1,1])a.beam('work-bay-header-'+dz,[bx-0.57,by(bx-0.57)-0.14,bz+dz*bd/2],[bx+0.57,by(bx+0.57)-0.14,bz+dz*bd/2],0.16,0.15,'timber');
    if(detail)for(const dx of [-1,1])a.beam('work-bay-brace-'+dx,[bx+dx*0.48,roofHigh-0.48,bz+bd/2-0.07],[bx+dx*0.20,by(bx+dx*0.20)-0.17,bz+bd/2-0.07],0.10,0.10,'timber');
    a.anchors.workSurface=[bx,top,bz];
  }
  a.anchors.entrance=[0,floor,d/2+0.48];a.anchors.ridge=[0,roofY(0,0)+0.29,0];
  return a.finish();
}
