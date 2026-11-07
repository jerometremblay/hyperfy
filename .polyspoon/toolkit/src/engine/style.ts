export const edgeStyles={timber:{chamfer:0.008},metal:{chamferRatio:0.055},stone:{chamfer:0.035}} as const;
export interface MaterialStyle { color:string;roughness:number;metalness:number }
export function materialStyle(role:string,color:string):MaterialStyle {
  return {color,roughness:role==='accent'||role==='hardware'?0.66:role==='diffuser'||role==='enclosure'?0.78:0.9,metalness:0};
}

