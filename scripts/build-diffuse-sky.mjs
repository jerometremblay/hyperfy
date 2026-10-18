import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const sourceUrl = 'https://svs.gsfc.nasa.gov/vis/a000000/a004800/a004851/milkyway_2020_4k.exr'
const sourceSha256 = '2eb802d6e68d170b410f766c7fec07f7518619f6b6708fdc81e9302d93e74fdb'
const outputPath = fileURLToPath(new URL('../src/client/public/milkyway.jpg', import.meta.url))
const response = await fetch(sourceUrl)
if (!response.ok) throw new Error(`NASA Milky Way map: HTTP ${response.status}`)

const source = Buffer.from(await response.arrayBuffer())
const actualSha256 = createHash('sha256').update(source).digest('hex')
if (actualSha256 !== sourceSha256) throw new Error(`Unexpected NASA source checksum: ${actualSha256}`)

const tempDir = await mkdtemp(path.join(os.tmpdir(), 'hyperfy-diffuse-sky-'))
const sourcePath = path.join(tempDir, 'milkyway_2020_4k.exr')
const tempOutputPath = path.join(tempDir, 'milkyway.jpg')

try {
  await writeFile(sourcePath, source)
  // Keep the EXR's linear-light pixel values; the runtime samples the JPEG as linear RGB.
  execFileSync(
    'ffmpeg',
    [
      '-v',
      'error',
      '-i',
      sourcePath,
      '-vf',
      'scale=2048:1024:flags=lanczos',
      '-frames:v',
      '1',
      '-q:v',
      '2',
      '-pix_fmt',
      'yuvj444p',
      '-y',
      tempOutputPath,
    ],
    { stdio: 'inherit' }
  )

  const output = await readFile(tempOutputPath)
  if (output[0] !== 0xff || output[1] !== 0xd8 || output.length > 2_000_000) {
    throw new Error('ffmpeg did not produce the expected optimized JPEG')
  }
  await writeFile(outputPath, output)
  console.log(`Generated ${path.relative(process.cwd(), outputPath)} (${output.length} bytes)`)
} finally {
  await rm(tempDir, { recursive: true, force: true })
}
