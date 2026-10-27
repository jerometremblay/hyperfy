import { build } from 'esbuild'
import { createServer } from 'node:http'
import { readFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(fileURLToPath(import.meta.url))
await mkdir(join(root, 'build'), { recursive: true })
await build({
  entryPoints: [join(root, 'main.js')],
  bundle: true,
  format: 'esm',
  outfile: join(root, 'build', 'main.js'),
  sourcemap: true,
  logLevel: 'info',
})
if (!process.argv.includes('--build')) {
  const routes = {
    '/': ['index.html', 'text/html'],
    '/style.css': ['style.css', 'text/css'],
    '/main.js': ['build/main.js', 'text/javascript'],
    '/main.js.map': ['build/main.js.map', 'application/json'],
  }
  const server = createServer(async (request, response) => {
    const route = routes[new URL(request.url, 'http://localhost').pathname]
    if (!route) {
      response.writeHead(404).end('Not found')
      return
    }
    try {
      const body = await readFile(join(root, route[0]))
      response.writeHead(200, { 'Content-Type': route[1], 'Cache-Control': 'no-store' })
      response.end(body)
    } catch {
      response.writeHead(500).end('Could not read prototype file')
    }
  })
  server.listen(Number(process.env.PORT || 4318), '127.0.0.1', () => {
    console.log(`Rendering prototype: http://127.0.0.1:${server.address().port}`)
  })
}
