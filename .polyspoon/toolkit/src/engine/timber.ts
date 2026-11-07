import {Color,Float32BufferAttribute} from 'three';
import type {BufferGeometry} from 'three';
export function timberFaceColors(geometry:BufferGeometry,variation:number,age:number,name:string){
 const normals=geometry.getAttribute('normal'),colors:number[]=[];
 let code=0;for(const c of name)code=(Math.imul(code,31)+c.charCodeAt(0))>>>0;
 const member=((code%7)/6-.5)*variation;
 for(let i=0;i<normals.count;i++){
  const top=Math.max(0,normals.getY(i)),side=Math.abs(normals.getX(i)),down=Math.max(0,-normals.getY(i));
  const value=Math.min(1,.9+member+top*.065-side*.065-down*.09);
  const tint=new Color().setRGB(value,value*(1-age*.015),value*(1-age*.035));
  colors.push(tint.r,tint.g,tint.b);
 }
 geometry.setAttribute('color',new Float32BufferAttribute(colors,3));
}
