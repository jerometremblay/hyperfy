import { taperedSweep } from '../engine/geometry.ts';
import { Vector3 } from 'three';
import { ConvexGeometry } from 'three/addons/geometries/ConvexGeometry.js';
import { Assembly } from './assembly.ts';
import type { Configuration, Role } from './config.ts';

function crownGeometry(size: [number, number, number], random: () => number) {
  const phase=random()*Math.PI*2,points:Vector3[]=[];
  for(let i=0;i<34;i++) {
    const y=1-2*(i+.5)/34,angle=i*2.399963+phase;
    const radius=Math.sqrt(1-y*y),growth=1+.10*Math.sin(angle+phase)*radius;
    points.push(new Vector3(Math.cos(angle)*radius*growth+.18*y,y+.07*Math.sin(angle*2+phase)*radius,Math.sin(angle)*radius*(1-.08*y)));
  }
  const geometry=new ConvexGeometry(points);
  geometry.computeBoundingBox();
  const bounds=geometry.boundingBox!,extent=bounds.getSize(new Vector3()),center=bounds.getCenter(new Vector3());
  geometry.translate(-center.x,-center.y,-center.z);
  geometry.scale(size[0]/extent.x,size[1]/extent.y,size[2]/extent.z);
  geometry.computeVertexNormals();
  return geometry;
}

export function tree(config: Configuration) {
  const a=new Assembly(config),p=config.applied,h=Number(p.height),s=Number(p.spread),lean=Number(p.lean)*h;
  const mature=p.growth==='mature',upright=p.architecture==='upright',full=Number(p.canopyFullness);
  const girth=Number(p.trunkGirth)*(mature?1:.82),forkY=h*Number(p.forkHeight),count=Number(p.branchCount);
  const randomFor=(id:string)=>{
    let state=(Number(p.seed)+1)>>>0;
    for(const c of id)state=Math.imul(state^c.charCodeAt(0),16777619)>>>0;
    return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  };
  const base:[number,number,number]=[0,0,0],fork:[number,number,number]=[lean*.35,forkY,0];
  const upper:[number,number,number]=[lean*.65+h*.025,h*.64,-s*.025];
  a.mesh('trunk',taperedSweep([
    {center:base,radius:girth*1.55},{center:[0,girth*.75,0],radius:girth*1.18},
    {center:[-h*.018,h*.16,0],radius:girth*.96},{center:fork,radius:girth*.78},
    {center:[lean*.52+h*.035,(forkY+h*.64)/2,s*.025],radius:girth*.59},{center:upper,radius:girth*.30},
  ],9),'timber');
  for(let i=0;i<5;i++){
    const angle=i*Math.PI*2/5+.3,dx=Math.cos(angle),dz=Math.sin(angle),reach=girth*(1.85+randomFor('root'+i)()*.20);
    const points:[[number,number,number],[number,number,number]][]=[
      [[girth*.5,0,girth*.72],[girth*.5,0,-girth*.72]],
      [[reach,0,girth*.32],[reach,0,-girth*.32]],
      [[reach*.94,girth*.16,girth*.27],[reach*.94,girth*.16,-girth*.27]],
      [[girth*.58,girth*1.25,girth*.32],[girth*.58,girth*1.25,-girth*.32]],
    ];
    a.mesh('root-'+i,new ConvexGeometry(points.flat().map(([r,y,side])=>new Vector3(dx*r-dz*side,y,dz*r+dx*side))),'timber');
  }
  const canopyWidth=s*full*(upright?.80:1)*(mature?1:.92);
  const canopyDepth=canopyWidth*(upright?.90:1);
  const growthHeight=h*full*(mature?1:.94);
  const crownLayout=[
    [-.08,.81,-.04,.58,.38,.56],
    [.23,.69,.06,.52,.30,.46],
    [-.27,.66,.07,.43,.26,.43],
    [.09,.83,-.25,.34,.22,.34],
    [-.12,.63,.29,.35,.23,.32],
    [.36,.75,-.19,.30,.22,.30],
    [-.35,.79,-.18,.32,.24,.29],
    [.21,.59,.27,.28,.19,.28],
  ];
  for(let i=0;i<count;i++){
    const [x,y,z,w,tall,deep]=crownLayout[i]!;
    const major=i===0,crownHeight=growthHeight*tall!;
    const cy=major?h-crownHeight/2:Math.max(h-(1-y!)*growthHeight+(upright?(i%2?.025:-.015)*h:0),forkY+h*.11+crownHeight/2);
    const center:[number,number,number]=[lean+x!*canopyWidth,cy,z!*canopyDepth];
    const size:[number,number,number]=[w!*canopyWidth,crownHeight,deep!*canopyDepth];
    const name=i===0?'main':String(i),role:Role=major?'foliage':i%2?'foliageShade':'foliageLight';
    a.mesh('crown-'+name,crownGeometry(size,randomFor('crown-'+name)),role,center);
    const start:[number,number,number]=i===0?upper:[fork[0],fork[1]+(i%3)*h*.04,0];
    const middle:[number,number,number]=[start[0]+(center[0]-start[0])*.62,Math.min(cy-h*.09,start[1]+(cy-start[1])*.48),center[2]*.5];
    const branch=a.mesh('branch-'+name,taperedSweep([{center:start,radius:girth*(major?.43:.64)},{center:middle,radius:girth*.39},{center:center,radius:girth*.13}],8),'timber');
    branch.userData.tip=[...center];
  }
  a.anchors.fork=[...fork];a.anchors.crown=[lean,h,0];return a.finish();
}
