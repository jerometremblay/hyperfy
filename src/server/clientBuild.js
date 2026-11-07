import { readFileSync, watchFile, unwatchFile } from 'node:fs'

export function readClientBuild(filename) {
  try {
    return readFileSync(filename, 'utf8').match(/<script src="([^"]+)" type="module"/)[1]
  } catch {
    return null
  }
}

export function watchClientBuild(filename, onBuild) {
  let current = null
  const check = () => {
    const build = readClientBuild(filename)
    // Ignore incomplete or failed builds; announce only a ready HTML shell.
    if (!build || build.includes('{') || build === current) return
    current = build
    onBuild(build)
  }
  check()
  watchFile(filename, { interval: 1000, persistent: false }, check)
  return () => unwatchFile(filename, check)
}
