// Run the authoring preflight with the math endowments that Hyperfy supplies.
// The stock smoke harness omits these; do not change the shared skill files.
import { mkdtemp, mkdir, readFile, writeFile, copyFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { execFileSync } from 'node:child_process'
const root = fileURLToPath(new URL('.', import.meta.url))
const temp = await mkdtemp(`${tmpdir()}/billard-preflight-`)
await mkdir(`${temp}/tools`)
await copyFile(`${root}../hyperfy-skill/tools/validate_result.py`, `${temp}/tools/validate_result.py`)
let smoke = await readFile(`${root}../hyperfy-skill/tools/smoke_test.js`, 'utf8')
const math = pathToFileURL(`${root}../node_modules/three/build/three.module.js`).href
smoke = `import { Vector3, Quaternion, Euler } from '${math}'\n` + smoke.replace(/^#![^\n]*\n/, '')
smoke = smoke.replace('const sandbox={', 'app.configure = () => {}; app.get = () => null; app.off = () => {}; app.emit = () => {}; app.send = () => {}; world.on = () => {}; world.getPlayer = () => null;\nconst sandbox={')
smoke = smoke.replace('const sandbox={app,world,props:', 'const sandbox={Vector3,Quaternion,Euler,app,world,props:')
await writeFile(`${temp}/tools/smoke_test.js`, smoke)
console.log('Authoring preflight with real Hyperfy math endowments:')
for (const file of ['hyperfy-billard.js', 'hyperfy-billard.hyp', 'hyperfy-billard-source.zip']) {
  execFileSync('python3', [`${temp}/tools/validate_result.py`, `${root}dist/${file}`], { stdio: 'inherit' })
}
