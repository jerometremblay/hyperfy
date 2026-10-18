import fs from 'node:fs/promises'
import path from 'node:path'

const DEFAULT_MAX_FILE_SIZE = 256 * 1024 * 1024

function inside(parent, child) {
  const relative = path.relative(parent, child)
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative))
}

export async function resolveLocalReference(root, baseDir, reference, label = 'file reference') {
  if (typeof reference !== 'string' || !reference.startsWith('file:')) {
    throw new Error(label + ' must use file:./relative-path')
  }
  const rawRelative = reference.slice('file:'.length)
  if (rawRelative.split('/').includes('..')) {
    throw new Error(label + ' must not contain empty, dot, or parent path segments')
  }
  if (!rawRelative.startsWith('./')) {
    throw new Error(label + ' must use file:./relative-path')
  }
  const relative = rawRelative.slice(2)
  if (!relative || relative.includes('\\') || relative.startsWith('/') || relative.includes('\0')) {
    throw new Error(label + ' must be a safe relative path')
  }
  const segments = relative.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new Error(label + ' must not contain empty, dot, or parent path segments')
  }
  const resolved = path.resolve(baseDir, ...segments)
  const requestedStat = await fs.lstat(resolved).catch(() => {
    throw new Error(label + ' does not exist: ' + relative)
  })
  if (requestedStat.isSymbolicLink()) throw new Error(label + ' must not be a symbolic link')
  const [realRoot, realBase, realFile] = await Promise.all([
    fs.realpath(root).catch(() => {
      throw new Error(label + ' repository root does not exist')
    }),
    fs.realpath(baseDir).catch(() => {
      throw new Error(label + ' base directory does not exist')
    }),
    fs.realpath(resolved).catch(() => {
      throw new Error(label + ' does not exist: ' + relative)
    }),
  ])
  if (!inside(realRoot, realBase)) throw new Error(label + ' base directory escapes the repository')
  if (!inside(realBase, realFile)) throw new Error(label + ' escapes its source directory')
  const stat = await fs.stat(realFile)
  if (!stat.isFile()) throw new Error(label + ' is not a regular file')
  return {
    absolutePath: realFile,
    relativePath: path.relative(realRoot, realFile).split(path.sep).join('/'),
  }
}

export async function readBoundedFile(filePath, { maxBytes = DEFAULT_MAX_FILE_SIZE, label = filePath } = {}) {
  const stat = await fs.lstat(filePath)
  if (stat.isSymbolicLink()) throw new Error(label + ' must not be a symbolic link')
  if (!stat.isFile()) throw new Error(label + ' is not a regular file')
  if (stat.size === 0) throw new Error(label + ' is empty')
  if (stat.size > maxBytes) throw new Error(label + ' exceeds the ' + maxBytes + ' byte limit')
  const bytes = await fs.readFile(filePath)
  if (bytes.byteLength !== stat.size || bytes.byteLength > maxBytes) {
    throw new Error(label + ' changed while it was being read')
  }
  if (bytes.toString('utf8', 0, 43).startsWith('version https://git-lfs.github.com/spec/v1')) {
    throw new Error(label + ' is an unresolved Git LFS pointer; hydrate the asset first')
  }
  return bytes
}

export function resolveContainedPath(root, baseDir, relative, label = 'path') {
  if (
    typeof relative !== 'string' ||
    !relative ||
    path.isAbsolute(relative) ||
    relative.includes('\\') ||
    relative.includes('\0')
  ) {
    throw new Error(label + ' must be a safe relative path')
  }
  const parts = relative.split('/')
  if (parts.some(part => !part || part === '.' || part === '..')) {
    throw new Error(label + ' must not contain empty, dot, or parent path segments')
  }
  const resolved = path.resolve(baseDir, ...parts)
  if (!inside(path.resolve(root), resolved)) throw new Error(label + ' escapes the repository')
  return resolved
}

export async function ensureSafeDirectory(root, directory, label = 'directory') {
  const absoluteRoot = path.resolve(root)
  const absoluteDirectory = path.resolve(directory)
  if (!inside(absoluteRoot, absoluteDirectory)) throw new Error(label + ' escapes the repository')
  const relative = path.relative(absoluteRoot, absoluteDirectory)
  let current = absoluteRoot
  for (const part of relative ? relative.split(path.sep) : []) {
    current = path.join(current, part)
    try {
      const stat = await fs.lstat(current)
      if (!stat.isDirectory() || stat.isSymbolicLink()) {
        throw new Error(label + ' contains a non-directory or symbolic link: ' + current)
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error
      await fs.mkdir(current)
    }
  }
  const [realRoot, realDirectory] = await Promise.all([fs.realpath(absoluteRoot), fs.realpath(absoluteDirectory)])
  if (!inside(realRoot, realDirectory)) throw new Error(label + ' escapes the repository')
  return realDirectory
}

export async function assertSafeDirectory(root, directory, label = 'directory') {
  const absoluteRoot = path.resolve(root)
  const absoluteDirectory = path.resolve(directory)
  if (!inside(absoluteRoot, absoluteDirectory)) throw new Error(label + ' escapes the repository')
  const [realRoot, realDirectory] = await Promise.all([
    fs.realpath(absoluteRoot).catch(() => {
      throw new Error(label + ' repository root does not exist')
    }),
    fs.realpath(absoluteDirectory).catch(() => {
      throw new Error(label + ' does not exist')
    }),
  ])
  const stat = await fs.lstat(absoluteDirectory)
  if (!stat.isDirectory() || stat.isSymbolicLink() || !inside(realRoot, realDirectory)) {
    throw new Error(label + ' must be a real directory inside the repository')
  }
  return realDirectory
}
