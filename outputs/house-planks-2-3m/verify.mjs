import fs from 'node:fs/promises'
import vm from 'node:vm'
import assert from 'node:assert/strict'
const source = await fs.readFile(new URL('source.js', import.meta.url), 'utf8')
const helper = source.slice(source.indexOf('let floorSeed ='), source.indexOf('const guardPostPositions'))
function generate() {
  const boards = []
  const context = vm.createContext({ C: {floor:['a','b','c','d'],trim:'trim'}, E:{halfWidth:3,back:12.35},box:(size,position,color,rotation,extra,name)=>boards.push({size,position,color,name}) })
  vm.runInContext(helper + `
    for (let i=0;i<60;i++) {
      const x=-8.85+i*.3;
      floorBoardRun(x,.295,-7.5,Math.abs(x)<3?12.35:7.5,.10,.04,{},'floorboard')
    }
    floorDeck(-8.83,8.83,1.9,7.35,3.3,'rear')
  `, context)
  return boards
}
const boards=generate()
assert.equal(JSON.stringify(boards),JSON.stringify(generate()),'Layout must be reproducible')
const floor=boards.filter(b=>b.name==='floorboard')
for(const b of floor) assert(b.size[2]>0 && b.size[2]<=3)
for(let row=0;row<60;row++) {
  const x=-8.85+row*.3, end=Math.abs(x)<3?12.35:7.5
  const run=floor.filter(b=>b.position[0]===x)
  const low=b=>b.position[2]-b.size[2]/2,high=b=>b.position[2]+b.size[2]/2
  assert(Math.abs(low(run[0])+7.5)<1e-9)
  assert(Math.abs(high(run.at(-1))-end)<1e-9)
  for(let i=1;i<run.length;i++) assert(Math.abs(low(run[i])-high(run[i-1])-.004)<1e-9)
}
assert.equal(new Set(floor.map(b=>b.color)).size,4)
const report={valid:true,groundBoards:floor.length,maxLength:Math.max(...floor.map(b=>b.size[2])),deterministic:true,coverageAndJointGaps:'pass',colors:'four independently selected wood tones'}
await fs.writeFile(new URL('validation.json',import.meta.url),JSON.stringify(report,null,2))
console.log(report)
