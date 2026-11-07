import {plainRecord} from './parameters.ts';
import type {Design,MigrationNotice} from './parameters.ts';

export function constructionNotice(family:string,fromVersion:string,toVersion:string):MigrationNotice {
 const change=family==='fence'&&fromVersion==='0.5.0'&&toVersion==='0.6.0'?'Grouped built-in source revised; fence geometry is unchanged.':'Construction revised; prior geometry is not reproduced.';
 return {fromVersion,toVersion,notice:change+' Indexed part layouts may change. Retained semantic part colors stay attached to their names; new parts use authored colors and absent part colors remain inactive.'};
}
export function loadConstructionDesign<T extends Design>(input:unknown,family:string,version:string,priorVersions:string[],save:(input:unknown)=>T,loadPrior:(input:unknown)=>Design):T {
 const value=plainRecord(input);
 if(value.formatVersion!==1||value.family!==family||typeof value.familyVersion!=='string'||![version,...priorVersions].includes(value.familyVersion))throw new Error('Unsupported configuration family or version');
 if(Reflect.ownKeys(value).some(key=>typeof key!=='string'||!['formatVersion','family','familyVersion','requested','applied','migration'].includes(key)))throw new Error('Unknown configuration field');
 for(const field of ['requested','applied','migration'])if(field!=='migration'||Object.hasOwn(value,field))if(Reflect.ownKeys(plainRecord(value[field])).some(key=>typeof key!=='string'))throw new Error('Unknown configuration field');
 if(value.familyVersion!==version){
  const old=loadPrior(input),next=save(old.applied);
  return {...next,migration:constructionNotice(family,value.familyVersion,version)};
 }
 const next=save(value.requested),applied=plainRecord(value.applied);
 if(Reflect.ownKeys(applied).length!==Object.keys(next.applied).length||Object.entries(next.applied).some(([key,item])=>!Object.hasOwn(applied,key)||applied[key]!==item))throw new Error('Applied parameters mismatch');
 if(Object.hasOwn(value,'migration')){
  const migration=plainRecord(value.migration);
  if(typeof migration.fromVersion!=='string'||!priorVersions.includes(migration.fromVersion))throw new Error('Invalid migration notice');
  const expected=constructionNotice(family,migration.fromVersion,version);
  if(Reflect.ownKeys(migration).length!==3||Object.entries(expected).some(([key,item])=>!Object.hasOwn(migration,key)||migration[key]!==item))throw new Error('Invalid migration notice');
  next.migration=expected;
 }
 return next;
}
