import { resolveWorldProfile } from './world-profile.mjs'

const args = process.argv.slice(2)
const dev = args.includes('--dev')
const profiles = args.filter(arg => arg !== '--dev')
if (profiles.length > 1) {
  console.error('Usage: npm start -- <world> or npm run dev -- <world>')
  process.exit(1)
}
try {
  Object.assign(process.env, resolveWorldProfile(profiles[0]))
} catch (error) {
  console.error(error.message)
  process.exit(1)
}
await import(dev ? './build.mjs' : '../build/index.js')
