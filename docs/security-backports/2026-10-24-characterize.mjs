import { build } from 'esbuild'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
const root = fileURLToPath(new URL('../../', import.meta.url)).replace(/\/$/, '')
const bundle=await build({stdin:{contents:`export { UI } from './src/core/nodes/UI.js'; export { UIView } from './src/core/nodes/UIView.js'; export { UIText } from './src/core/nodes/UIText.js'; export { ClientAudio } from './src/core/systems/ClientAudio.js'; export { Chat } from './src/core/systems/Chat.js'; export { ServerNetwork } from './src/core/systems/ServerNetwork.js'; export { ClientNetwork } from './src/core/systems/ClientNetwork.js'; export { isFlexDirection } from './src/core/extras/yoga.js';`,resolveDir:root},bundle:true,format:'esm',platform:'node',packages:'external',write:false})
// Keep the bundle in the project resolution tree, without writing application files.
const file = root + '/node_modules/.cache-upstream-review-' + randomUUID() + '.mjs'
await fs.writeFile(file,bundle.outputFiles[0].text)
try {
 const {UI,UIView,UIText,ClientAudio,Chat,ServerNetwork,ClientNetwork,isFlexDirection}=await import(file)
 const result={}
 for(const Class of [UI,UIView]) {try {result[Class.name+'FlexWrap']=new Class().flexWrap}catch(e){result[Class.name+'FlexWrap']=e.name}}
 const text=new UIText();try{text.padding=text.padding;result.repeatPadding='accepted'}catch(e){result.repeatPadding=e.name}
 const view=new UIView();let positionType='not called';view.yogaNode={setPositionType:value=>{positionType=value}};view.absolute=true;result.absoluteYogaType=positionType===undefined?'undefined':positionType
 result.invalidFlexDirectionAccepted=isFlexDirection('center')
 const previous=globalThis.AudioContext
 globalThis.AudioContext=class {constructor(){this.listener={setPosition(){},setOrientation(){}};this.destination={};this.state='running'}createGain(){return {gain:{value:0},connect(){}}}}
 try{new ClientAudio({prefs:{music:1,sfx:1,voice:1}});result.firefoxAudio='ok'}catch(e){result.firefoxAudio=e.name}finally{globalThis.AudioContext=previous}
 const world={entities:{player:{data:{id:'visitor',name:'Visitor'}},getPlayer:()=>null},events:{emit(){}},network:{isClient:true,send(name,message){this.message=message}}}
 const clientChat=new Chat(world)
 const serverWorld={chat:{add(message){this.message=message}}}
 const network=new ServerNetwork(serverWorld);clearInterval(network.socketIntervalId)
 network.send=(name,message,ignoreId)=>{if(ignoreId!=='visitor')clientChat.add(message,false)}
 clientChat.send('upstream-review-probe')
 await network.onChatAdded({id:'visitor',player:world.entities.player},world.network.message)
 result.sentChatRows=clientChat.msgs.length
 result.sentChatDistinctIds=new Set(clientChat.msgs.map(message=>message.id)).size
 const fake={loader:{preload(){},execPreload(){}},collections:{deserialize(){}},settings:{deserialize(){},setHasAdminCode(){}},chat:{deserialize(){}},blueprints:{deserialize(){}},entities:{deserialize(){}}}
 const clientNetwork=new ClientNetwork(fake)
 clientNetwork.onAuthToken=()=>{}
 try{clientNetwork.onSnapshot({id:'probe',serverTime:0,settings:{},chat:[],collections:[],blueprints:[],entities:[]});result.headlessSnapshot='ok'}catch(e){result.headlessSnapshot=e.name+': '+e.message}
 console.log(JSON.stringify(result,null,2))
}finally{await fs.rm(file,{force:true})}
