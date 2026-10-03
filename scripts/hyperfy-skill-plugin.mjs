import { readdir, readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

// Embed the source folder at build time; browsers need no filesystem or extra requests.
export function hyperfySkillPlugin() {
  const root = fileURLToPath(new URL('../hyperfy-skill/', import.meta.url))
  return {
    name: 'hyperfy-skill',
    setup(build) {
      build.onResolve({ filter: /^hyperfy-skill-files$/ }, () => ({
        path: 'hyperfy-skill-files',
        namespace: 'hyperfy-skill',
      }))
      build.onLoad({ filter: /.*/, namespace: 'hyperfy-skill' }, async () => {
        const files = {}
        const watchFiles = []
        const watchDirs = []
        async function collect(dir) {
          watchDirs.push(dir)
          for (const entry of await readdir(dir, { withFileTypes: true })) {
            const filename = path.join(dir, entry.name)
            if (entry.isDirectory()) await collect(filename)
            else if (entry.isFile()) {
              watchFiles.push(filename)
              files['hyperfy-skill/' + path.relative(root, filename).split(path.sep).join('/')] = (
                await readFile(filename)
              ).toString('base64')
            }
          }
        }
        await collect(root)
        return { contents: `export default ${JSON.stringify(files)}`, loader: 'js', watchFiles, watchDirs }
      })
    },
  }
}
