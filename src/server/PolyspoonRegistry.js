import fs from 'node:fs/promises'
import path from 'node:path'

// Kept outside world.storage: ordinary app scripts can write to that store.
export class PolyspoonRegistry {
  constructor(worldDir) {
    this.dir = path.join(worldDir, 'polyspoon-recipes')
  }

  async has(hash) {
    if (!/^[a-f0-9]{64}$/.test(hash)) return false
    try {
      return (await fs.stat(path.join(this.dir, hash))).isFile()
    } catch (error) {
      if (error.code === 'ENOENT') return false
      throw error
    }
  }

  async approve(hash) {
    if (!/^[a-f0-9]{64}$/.test(hash)) throw new Error('Invalid recipe hash')
    await fs.mkdir(this.dir, { recursive: true })
    await fs.writeFile(path.join(this.dir, hash), '', { flag: 'a' })
  }

  async approveNative(hash, source) {
    if (!/^[a-f0-9]{64}$/.test(hash) || typeof source !== 'string') throw new Error('Invalid native recipe')
    await fs.mkdir(this.dir, { recursive: true })
    await fs.writeFile(path.join(this.dir, `native-${hash}.mjs`), source, { flag: 'wx' }).catch(error => {
      if (error.code !== 'EEXIST') throw error
    })
  }

  async hasNative(hash) {
    if (!/^[a-f0-9]{64}$/.test(hash)) return false
    try { return (await fs.stat(path.join(this.dir, `native-${hash}.mjs`))).isFile() }
    catch (error) { if (error.code === 'ENOENT') return false; throw error }
  }

  async readNativeSource(hash) {
    if (!(await this.hasNative(hash))) return null
    return fs.readFile(path.join(this.dir, `native-${hash}.mjs`), 'utf8')
  }
}
