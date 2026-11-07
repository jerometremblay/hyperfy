import {parseControls,plainRecord,ParameterError} from '../../engine/parameters.ts';
import type {Control,Design,Descriptor,Parameters} from '../../engine/parameters.ts';

const colors = {stone:'#898880',coping:'#b2ac96',timber:'#62432e',roof:'#a77342',iron:'#343b3b',rope:'#bca879'};
const controls:Control[] = [
  {key:'diameter',label:'Outside diameter',kind:'range',group:'shape',unit:'m',min:1.8,max:3.2,step:0.05,default:2.2,hint:'Outside masonry diameter. Shaft stays open with 25 cm walls.',affects:['geometry'],targets:['stone','coping','post','windlass','roof-board']},
  {key:'wallHeight',label:'Wall height',kind:'range',group:'shape',unit:'m',min:0.65,max:1.4,step:0.05,default:0.95,hint:'Ground to coping top. Timber and mechanism follow the wall.',affects:['geometry','topology'],targets:['stone','coping','post','windlass','bucket-shell']},
  {key:'roofSize',label:'Roof size',kind:'range',group:'shape',unit:'ratio',ratioBasis:'width',min:1.15,max:1.6,step:0.05,default:1.35,hint:'Roof width as a multiple of well diameter. Depth is 85 percent of width.',affects:['geometry','topology'],targets:['roof-board','rafter','ridge']},
  {key:'roof',label:'Timber roof',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Roof boards, rafters and braces; posts remain with an open top.',affects:['topology'],targets:['roof-board','rafter','ridge','fascia','tie','brace','post']},
  {key:'bucket',label:'Suspended bucket',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Bucket, handle and hanging rope. Requires the windlass.',affects:['topology'],targets:['bucket','hanging-rope']},
  {key:'windlass',label:'Windlass mechanism',kind:'toggle',group:'construction',unit:'none',default:true,hint:'Axle, bearings, crank and rope spool. Remove the bucket before disabling.',affects:['topology'],targets:['windlass','axle-bearing','spool-flange','crank','rope-coil']},
  {key:'bucketDrop',label:'Bucket drop',kind:'range',group:'construction',unit:'m',min:0,max:0.6,step:0.05,default:0,hint:'Lowers the bucket from its default height and lengthens the hanging rope.',affects:['geometry'],targets:['bucket','hanging-rope']},
  ...Object.entries(colors).map(([role,color]):Control=>({key:'color.'+role,label:role,kind:'color',group:'colors',unit:'color',default:color,role,hint:'Color of '+role+' parts.',affects:['material'],targets:[role]})),
];
function relationships(p:Record<string,unknown>) {
  return p.bucket&&!p.windlass?[{code:'relationship',keys:['bucket','windlass'],message:'Suspended bucket requires the windlass. Remove bucket or enable windlass.'}]:[];
}
function parse(input:unknown) {
  const p=parseControls(controls,input),issues=relationships(p);
  if(issues.length)throw new ParameterError(issues);
  return p;
}
function save(input:unknown):Design {const requested={...plainRecord(input)};return {formatVersion:1,family:'stone-well',familyVersion:'1.0.0',requested,applied:parse(requested)};}
export function load(input:unknown):Design {
  const v=plainRecord(input);
  if(Reflect.ownKeys(v).some(k=>typeof k!=='string'||!['formatVersion','family','familyVersion','requested','applied'].includes(k)))throw Error('Unknown stone well design field');
  if(v.formatVersion!==1||v.family!=='stone-well'||v.familyVersion!=='1.0.0')throw Error('Unsupported stone well design version');
  const d=save(v.requested),a=plainRecord(v.applied);
  if(Reflect.ownKeys(a).length!==Object.keys(d.applied).length||Object.entries(d.applied).some(([k,x])=>a[k]!==x))throw Error('Stone well applied parameters mismatch');
  return d;
}
