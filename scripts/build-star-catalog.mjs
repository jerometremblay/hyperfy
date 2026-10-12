import { readFile, writeFile } from 'node:fs/promises'
import { createHash } from 'node:crypto'

const sourceURL = 'https://raw.githubusercontent.com/astronexus/HYG-Database/main/hyg/CURRENT/hygdata_v41.csv'
const sha256 = 'd9f69fd86bbf90a4e4d52b4c5c53eacfa6dfc0bfdef85bfd94f095e0bebe4ebd'
const bytes = process.argv[2]
  ? await readFile(process.argv[2])
  : Buffer.from(await (await fetch(sourceURL)).arrayBuffer())
if (createHash('sha256').update(bytes).digest('hex') !== sha256) throw new Error('HYG 4.1 source checksum mismatch')

// HYG records occupy one line; honor quoted commas and escaped quotes in names.
function parseRow(line) {
  const fields = []
  let value = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (c === '"') {
      if (quoted && line[i + 1] === '"') {
        value += '"'
        i++
      } else quoted = !quoted
    } else if (c === ',' && !quoted) {
      fields.push(value)
      value = ''
    } else value += c
  }
  fields.push(value)
  return fields
}
const [header, ...lines] = bytes.toString('utf8').trim().split(/\r?\n/)
const columns = parseRow(header)
const stars = []
const hipStars = new Map()
for (const line of lines) {
  const fields = parseRow(line)
  const get = name => fields[columns.indexOf(name)]
  const number = name => (get(name) === '' ? NaN : Number(get(name)))
  const ra = number('ra'),
    dec = number('dec'),
    mag = number('mag'),
    ci = number('ci')
  if (get('id') === '0' || ![ra, dec, mag].every(Number.isFinite)) continue
  if (ra < 0 || ra >= 24 || Math.abs(dec) > 90) throw new Error('Invalid HYG coordinates')
  if (get('hip')) hipStars.set(number('hip'), [ra, dec])
  if (mag > 6.5) continue
  stars.push([ra, dec, mag, Number.isFinite(ci) ? ci : null])
}
const catalog = {
  version: 1,
  source: 'HYG Database 4.1, David Nash / Astronexus',
  sourceURL,
  sourceSHA256: sha256,
  license: 'CC-BY-SA-4.0',
  epoch: 'J2000',
  fields: ['raHours', 'decDegrees', 'magnitude', 'bvColorIndex'],
  magnitudeLimit: 6.5,
  stars,
}
await writeFile(new URL('../src/client/public/stars.json', import.meta.url), JSON.stringify(catalog) + '\n')
console.log(`Generated ${stars.length} stars from HYG 4.1`)

const lineSourceURL = 'https://raw.githubusercontent.com/Stellarium/stellarium/master/skycultures/modern/index.json'
const lineSHA256 = '1f2f5ffd6c9e25a7d0dcfdbf1f756e2db03dd3b8ed4ec016a2839b09f6b0fe1e'
const lineBytes = process.argv[3]
  ? await readFile(process.argv[3])
  : Buffer.from(await (await fetch(lineSourceURL)).arrayBuffer())
if (createHash('sha256').update(lineBytes).digest('hex') !== lineSHA256)
  throw new Error('Constellation source checksum mismatch')
const constellations = JSON.parse(lineBytes).constellations.map(constellation => ({
  id: constellation.id.split(' ').at(-1),
  segments: constellation.lines.flatMap(chain =>
    chain.slice(1).map((hip, i) => {
      const a = hipStars.get(chain[i]),
        b = hipStars.get(hip)
      if (!a || !b) throw new Error(`Missing constellation star: ${chain[i]} / ${hip}`)
      return [...a, ...b]
    })
  ),
}))
await writeFile(
  new URL('../src/core/extras/constellations.json', import.meta.url),
  JSON.stringify({
    source: 'Stellarium team, modern sky culture; positions from HYG 4.1',
    sourceURL: lineSourceURL,
    sourceSHA256: lineSHA256,
    positionSourceSHA256: sha256,
    license: 'CC-BY-SA-4.0',
    epoch: 'J2000',
    fields: ['raHoursA', 'decDegreesA', 'raHoursB', 'decDegreesB'],
    constellations,
  }) + '\n'
)
console.log(`Generated line connections for ${constellations.length} constellations`)
