export { profileSolid, carryingBand } from '../engine/geometry.ts';
import {facetedLoft} from '../engine/geometry.ts';

export function protectiveGuard(stations:Array<[number,number,number]>,width:number,depth:number,angle:number){
 const x=width/2,z=depth/2,cut=Math.min(width,depth)*.18;
 const section:Array<[number,number]>=[[-x+cut,-z],[x-cut,-z],[x,-z+cut],[x,z-cut],[x-cut,z],[-x+cut,z],[-x,z-cut],[-x,-z+cut]];
 const c=Math.cos(angle),s=Math.sin(angle);
 const outline=section.map(([u,v]):[number,number]=>[s*u+c*v,-c*u+s*v]);
 return facetedLoft(stations.map(center=>({center,outline})));
}
