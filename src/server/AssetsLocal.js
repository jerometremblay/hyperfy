import fs from 'fs-extra'
import path from 'path'
import { hashFile } from '../core/utils-server'
import { createOnce } from './coalesce'

export class AssetsLocal {
  constructor() {
    this.url = process.env.ASSETS_BASE_URL
    this.dir = null
    this.inflight = new Map()
  }

  async init({ rootDir, worldDir }) {
    console.log('[assets] initializing')
    this.dir = path.join(worldDir, '/assets')
    // ensure assets directory exists
    await fs.ensureDir(this.dir)
    // copy over built-in assets
    await fs.copy(path.join(rootDir, 'src/world/assets'), this.dir)
  }

  async upload(file) {
    const buffer = Buffer.isBuffer(file.buffer) ? file.buffer : Buffer.from(await file.arrayBuffer())
    const hash = await hashFile(buffer)
    const ext = file.name.split('.').pop().toLowerCase()
    if (!/^[a-z0-9]+$/.test(ext)) throw new Error('Invalid asset extension')
    const filename = `${hash}.${ext}`
    const assetPath = path.join(this.dir, filename)
    return createOnce(this.inflight, filename, async () => {
      if (await fs.exists(assetPath)) return false
      await fs.writeFile(assetPath, buffer)
      return true
    })
  }

  async exists(filename) {
    if (typeof filename !== 'string' || !/^[a-z0-9_-]+\.[a-z0-9]+$/i.test(filename)) return false
    const filePath = path.join(this.dir, filename)
    const exists = await fs.exists(filePath)
    return exists
  }

  async freeSpace() {
    const { statfs } = await import('node:fs/promises')
    const space = await statfs(this.dir)
    return { free: space.bavail * space.bsize, total: space.blocks * space.bsize }
  }

  async read(filename) {
    if (!/^[a-z0-9_-]+\.[a-z0-9]+$/.test(filename)) return null
    const filePath = path.join(this.dir, filename)
    let stat
    try {
      stat = await fs.lstat(filePath)
    } catch (error) {
      if (error.code === 'ENOENT') return null
      throw error
    }
    if (!stat.isFile() || stat.isSymbolicLink()) return null
    if (stat.size > 256 * 1024 * 1024) throw new Error('Asset exceeds the 256 MiB read limit')
    const bytes = await fs.readFile(filePath)
    if (bytes.byteLength !== stat.size) throw new Error('Asset changed while it was being read')
    return bytes
  }

  async list() {
    const assets = new Set()
    const files = fs.readdirSync(this.dir)
    for (const file of files) {
      const filePath = path.join(this.dir, file)
      const isDirectory = fs.statSync(filePath).isDirectory()
      if (isDirectory) continue
      const relPath = path.relative(this.dir, filePath)
      // HACK: we only want to include uploaded assets (not core/assets/*) so we do a check
      // if its filename is a 64 character hash
      const isAsset = relPath.split('.')[0].length === 64
      if (!isAsset) continue
      assets.add(relPath)
    }
    return assets
  }

  async delete(assets) {
    for (const asset of assets) {
      const fullPath = path.join(this.dir, asset)
      fs.removeSync(fullPath)
    }
  }
}
