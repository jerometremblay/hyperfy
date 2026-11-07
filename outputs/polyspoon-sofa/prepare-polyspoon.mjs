// Prepare a separate Polyspoon toolkit with the sofa recipe registered.
// Usage: node outputs/polyspoon-sofa/prepare-polyspoon.mjs /absolute/new-directory
import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'
import { spawnSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const target = process.argv[2]
if (!target || !isAbsolute(target)) throw new Error('Pass the absolute path of a new directory')
const here = dirname(fileURLToPath(import.meta.url))
const original = resolve(here, '../../.polyspoon')
await mkdir(target)
await cp(original, join(target, '.polyspoon'), { recursive: true })
const toolkit = join(target, '.polyspoon/toolkit')
const recipeDir = join(toolkit, 'examples/recipes/cognac-leather-sofa')
await mkdir(recipeDir)
await cp(join(here, 'polyspoon-recipe/index.ts'), join(recipeDir, 'index.ts'))
await cp(join(here, 'polyspoon-recipe/sofa.ts'), join(recipeDir, 'sofa.ts'))

const registryPath = join(toolkit, 'src/recipes/index.ts')
const oldRegistry = await readFile(registryPath, 'utf8')
const needle = 'for (const entry of ['
const end = 'humanoidRecipe,foxRecipe]) registry.register(entry);'
if (oldRegistry.split(needle).length !== 2 || oldRegistry.split(end).length !== 2) throw new Error('Unsupported toolkit registry')
const registry = oldRegistry
  .replace(needle, "import { cognacLeatherSofaRecipe } from '../../examples/recipes/cognac-leather-sofa/index.ts';\n" + needle)
  .replace(end, 'humanoidRecipe,foxRecipe,cognacLeatherSofaRecipe]) registry.register(entry);')
await writeFile(registryPath, registry)

const runnerPath = join(toolkit, 'runner.ts')
const runner = await readFile(runnerPath, 'utf8')
const familyCheck = 'if(config.family!=="bench")'
if (runner.split(familyCheck).length !== 2) throw new Error('Unsupported toolkit runner')
await writeFile(runnerPath, runner.replace(familyCheck, 'if(config.family!=="cognac-leather-sofa")'))
await cp(join(here, 'sofa.design.json'), join(toolkit, 'config.json'))
const sofaControls = JSON.parse(await readFile(join(here, 'sofa.controls.json'), 'utf8'))
const controls = sofaControls.controls.map(control => control.unit === 'mm' ? { ...control, unit: 'none' } : control)
await writeFile(join(toolkit, 'controls.json'), JSON.stringify(controls, null, 2) + '\n')
const manifestPath = join(toolkit, 'manifest.json')
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'))
manifest.recipe = { id: 'cognac-leather-sofa', version: '1.1.0', entry: 'examples/recipes/cognac-leather-sofa/index.ts', exportName: 'cognacLeatherSofaRecipe' }
manifest.licenses.content = 'User-provided sofa design; no license grant'
manifest.licenses.contentPaths = []
manifest.provenance.sofa = 'Adapted from the user-provided Hyperfy sofa; not covered by the toolkit author declaration.'
for (const name of ['src/recipes/index.ts', 'runner.ts', 'config.json', 'controls.json', 'examples/recipes/cognac-leather-sofa/index.ts', 'examples/recipes/cognac-leather-sofa/sofa.ts']) {
  const bytes = await readFile(join(toolkit, name))
  manifest.files[name] = { sha256: createHash('sha256').update(bytes).digest('hex'), bytes: bytes.length }
}
await writeFile(manifestPath, JSON.stringify(manifest, null, 2) + '\n')
const sources = Object.keys(manifest.files).filter(name => name.endsWith('.ts'))
const compiler = spawnSync(process.execPath, [
  join(toolkit, 'node_modules/typescript/bin/tsc'), '--ignoreConfig', '--noCheck',
  '--target', 'ES2023', '--module', 'ESNext', '--moduleResolution', 'Bundler',
  '--rewriteRelativeImportExtensions', '--rootDir', toolkit, '--outDir', join(toolkit, '.recipe-build'),
  ...sources,
], { cwd: toolkit, stdio: 'inherit' })
if (compiler.error) throw compiler.error
if (compiler.status !== 0) throw new Error('Polyspoon toolkit compilation failed')
console.log(`Prepared isolated Polyspoon toolkit: ${target}`)
