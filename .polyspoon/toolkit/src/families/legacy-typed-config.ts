import {legacyFamilies} from './legacy-config.ts';
import {parseControls,plainRecord} from '../engine/parameters.ts';
import type {Control,Design} from '../engine/parameters.ts';
type TypedLegacyFamily='tree'|'fence'|'crate'|'boulder';
const colors={
 forest:{timber:'#594739',wood:'#966c48',stone:'#7d8279',foliage:'#728456',foliageShade:'#536c48',foliageLight:'#899863'},
 harbor:{timber:'#49524c',wood:'#958568',stone:'#778487',foliage:'#587769',foliageShade:'#405f56',foliageLight:'#799681'},
 ember:{timber:'#604234',wood:'#a1784d',stone:'#928071',foliage:'#a0894c',foliageShade:'#79693f',foliageLight:'#b7a364'},
} as const;
const roles:Record<TypedLegacyFamily,Array<keyof typeof colors.forest>>={tree:['timber','foliage','foliageShade','foliageLight'],fence:['timber','wood'],crate:['wood','timber'],boulder:['stone']};
export function loadTypedLegacyConfiguration(input:unknown):Design {
 const value=plainRecord(input),family=value.family as TypedLegacyFamily;
 if(value.formatVersion!==1||value.familyVersion!=='0.2.0'||!Object.hasOwn(roles,family))throw new Error('Unsupported typed legacy configuration');
 for(const key of Reflect.ownKeys(value))if(typeof key!=='string'||!['formatVersion','family','familyVersion','requested','applied','migration'].includes(key))throw new Error('Unknown configuration field');
 const requested=plainRecord(value.requested),schema=legacyFamilies[family];
 const way=typeof requested.colorway==='string'&&Object.hasOwn(colors,requested.colorway)?requested.colorway as keyof typeof colors:'forest';
 const base={group:'shape' as const,unit:'none' as const,hint:'',affects:['geometry' as const],targets:[]};
 const controls:Control[]=schema.controls.map(c=>({...base,kind:c.integer?'integer':'range',key:c.key,label:c.key,min:c.min,max:c.max,step:1,default:Number(schema.defaults[c.key])}));
 controls.push({...base,kind:'choice',key:'colorway',label:'Colorway',default:'forest',options:['forest','harbor','ember'].map(value=>({value,label:value}))});
 for(const role of roles[family])controls.push({...base,kind:'color',key:'color.'+role,label:role,role,default:colors[way][role]});
 const applied=parseControls(controls,requested);
 if(!schema.relationship(applied as typeof schema.defaults))throw new Error('Legacy dimension relationship violated');
 const given=plainRecord(value.applied);
 if(Reflect.ownKeys(given).length!==Object.keys(applied).length||Object.entries(applied).some(([key,v])=>!Object.hasOwn(given,key)||given[key]!==v))throw new Error('Applied parameters mismatch');
 if(value.migration!==undefined) {
  const m=plainRecord(value.migration);
  if(Reflect.ownKeys(m).length!==3||m.fromVersion!=='0.1.0'||m.toVersion!=='0.2.0'||m.notice!=='Design upgraded to typed controls; construction may differ. Original geometry replay is not guaranteed.')throw new Error('Invalid migration notice');
 }
 return {formatVersion:1,family,familyVersion:'0.2.0',requested:{...requested},applied};
}

