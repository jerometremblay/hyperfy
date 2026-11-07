type LegacyParameters=Record<string,number|string>&{colorway:'forest'|'harbor'|'ember'};
interface LegacyDefinition {
 defaults:LegacyParameters;
 controls:ReadonlyArray<{key:string;min:number;max:number;integer:boolean}>;
 relationship:(p:LegacyParameters)=>boolean;
 relationshipMessage:string;
}
const control=(key:string,min:number,max:number,integer=false)=>Object.freeze({key,min,max,integer});
const definition=(defaults:LegacyParameters,controls:LegacyDefinition['controls'],relationship:LegacyDefinition['relationship'],relationshipMessage:string):Readonly<LegacyDefinition>=>Object.freeze({defaults:Object.freeze(defaults),controls:Object.freeze(controls),relationship,relationshipMessage});
export const legacyColorways=Object.freeze(['forest','harbor','ember']);
export const legacyFamilies=Object.freeze({
 cottage:definition({width:5,depth:4,wallHeight:2.8,roofRise:1.4,colorway:'forest'},[control('width',3.6,7.2),control('depth',3,5.5),control('wallHeight',2.5,3.4),control('roofRise',1,2)],p=>Number(p.roofRise)<=Number(p.width)*0.4+1e-9,'Roof rise must be at most 0.4 × footprint width.'),
 tree:definition({height:4.5,spread:3.8,seed:7,colorway:'forest'},[control('height',3,6),control('spread',2.4,5.4),control('seed',0,65535,true)],p=>Number(p.spread)>=Number(p.height)*0.55-1e-9&&Number(p.spread)<=Number(p.height)*1.25+1e-9,'Canopy spread must be 0.55–1.25 × tree height.'),
 fence:definition({length:3,height:1.1,bays:2,colorway:'forest'},[control('length',1.2,6),control('height',0.7,1.5),control('bays',1,4,true)],p=>Number(p.length)/Number(p.bays)>=0.6-1e-9&&Number(p.length)/Number(p.bays)<=2+1e-9,'Bay span must be 0.6–2 meters.'),
 crate:definition({width:0.9,height:0.7,depth:0.7,colorway:'forest'},[control('width',0.45,1.5),control('height',0.35,1.2),control('depth',0.4,1.2)],p=>Number(p.height)<=Math.min(Number(p.width),Number(p.depth))*1.6+1e-9,'Height must be at most 1.6 × smaller footprint dimension.'),
 boulder:definition({width:1.6,height:1,depth:1.2,lean:0.08,colorway:'forest'},[control('width',0.6,2.8),control('height',0.35,1.8),control('depth',0.5,2.4),control('lean',-0.18,0.18)],p=>Number(p.height)<=Math.min(Number(p.width),Number(p.depth))*1.3+1e-9,'Height must be at most 1.3 × smaller footprint dimension.'),
});

