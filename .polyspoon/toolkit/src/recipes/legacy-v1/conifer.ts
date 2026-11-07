import {parseControls,plainRecord,ParameterError} from '../../engine/parameters.ts';
import type {Control,Design,Descriptor,Parameters} from '../../engine/parameters.ts';

const controls: Control[] = [
  {key:'height',label:'Height',kind:'range',group:'shape',unit:'m',min:2,max:12,step:0.1,default:6,hint:'Ground to highest needle.',affects:['geometry'],targets:['trunk','branch','foliage']},
  {key:'crownSpread',label:'Crown spread',kind:'range',group:'shape',unit:'m',min:1,max:7,step:0.1,default:3.8,hint:'Larger horizontal bounding-box dimension.',affects:['geometry'],targets:['trunk','branch','foliage']},
  {key:'seed',label:'Variation seed',kind:'integer',group:'construction',unit:'seed',min:0,max:65535,step:1,default:317,hint:'Repeatable trunk bends, branch spacing and foliage variation.',affects:['geometry'],targets:['trunk','branch','foliage']},
  {key:'tierCount',label:'Crown tiers',kind:'integer',group:'construction',unit:'count',min:5,max:10,step:1,default:8,hint:'Redistributes five to ten connected branch tiers through the same crown envelope, with fewer branches and smaller lobes toward the leader.',affects:['topology','geometry'],targets:['branch','foliage']},
  ...Object.entries({bark:'#70523a',needles:'#365c43',tips:'#55754c',shade:'#284c3c'}).map(([role,color]):Control=>({key:'color.'+role,label:role,kind:'color',group:'colors',unit:'color',default:color,role,hint:'Opaque faceted '+role+' material.',affects:['material'],targets:[role]})),
];
const parse=(input:unknown)=>parseControls(controls,plainRecord(input));
function save(input:unknown):Design {
  const requested={...plainRecord(input)};
  return {formatVersion:1,family:'conifer',familyVersion:'1.0.0',requested,applied:parse(requested)};
}
export function load(input:unknown):Design {
  const v=plainRecord(input);
  if(Reflect.ownKeys(v).some(k=>typeof k!=='string'||!['formatVersion','family','familyVersion','requested','applied'].includes(k)))throw new Error('Unknown conifer design field');
  if(v.formatVersion!==1||v.family!=='conifer'||v.familyVersion!=='1.0.0')throw new Error('Unsupported conifer design');
  const d=save(v.requested),a=plainRecord(v.applied);
  if(Object.keys(a).length!==Object.keys(d.applied).length||Object.entries(d.applied).some(([k,x])=>a[k]!==x))throw new Error('Conifer applied parameters mismatch');
  return d;
}
