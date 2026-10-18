import { execFileSync, spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { compareText, sha256, stableJson } from './canonical.mjs'
import { discoverObjects, loadObject, validateObjectManifest } from './object-source.mjs'

const BASE_DIRECTORY = '.upstream-base'
const MAX_FILE_BYTES = 256 * 1024 * 1024
const TOOL_REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..')
const CANONICAL_CATALOG_ROOT = path.join(TOOL_REPO_ROOT, 'tools', 'worldsync', 'catalog')

function assertRelativePath(value, label) {
  if (
    typeof value !== 'string' ||
    !value ||
    value.includes('\\') ||
    value.includes('\0') ||
    value.startsWith('/') ||
    value.split('/').some(part => !part || part === '.' || part === '..')
  ) {
    throw new Error(label + ' must be a safe relative path')
  }
  return value
}

function normalizeRepository(value, label = 'Git repository') {
  let candidate = value
  const ssh = /^git@([^:]+):(.+)$/.exec(candidate)
  if (ssh) candidate = 'https://' + ssh[1] + '/' + ssh[2]
  let url
  try {
    url = new URL(candidate)
  } catch {
    throw new Error(label + ' must be an HTTPS Git repository URL')
  }
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) {
    throw new Error(label + ' must be an HTTPS Git repository URL without credentials')
  }
  const pathname = url.pathname.replace(/\/+$/, '').replace(/\.git$/i, '')
  if (!pathname || pathname === '/') throw new Error(label + ' must identify a repository')
  return 'https://' + url.host.toLowerCase() + pathname
}

function gitOutput(directory, args, label) {
  try {
    return execFileSync('git', ['-C', directory, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    throw new Error(label)
  }
}

function repositoryDetails(sourcePath) {
  const repoRoot = path.resolve(gitOutput(sourcePath, ['rev-parse', '--show-toplevel'], 'source must be inside a Git repository'))
  const origin = gitOutput(repoRoot, ['remote', 'get-url', 'origin'], 'source repository must have an origin remote')
  return { repoRoot, repository: normalizeRepository(origin, 'source origin') }
}

function assertRefIsCheckedOut(repoRoot, ref) {
  const head = gitOutput(repoRoot, ['rev-parse', '--verify', 'HEAD^{commit}'], 'source checkout must have a commit')
  const selected = gitOutput(
    repoRoot,
    ['rev-parse', '--verify', ref + '^{commit}'],
    'upstream ref ' + ref + ' is not available in the Hyperfy checkout; fetch or check out that ref first'
  )
  if (head !== selected) {
    throw new Error('upstream ref ' + ref + ' does not match the current Hyperfy checkout; check out that ref before syncing')
  }
}

function sourceRootForPath(repoRoot, objectKey, repositoryPath) {
  const keyParts = objectKey.split('/')
  const pathParts = assertRelativePath(repositoryPath, 'upstream.path').split('/')
  const objectsIndex = pathParts.length - keyParts.length - 1
  if (
    objectsIndex < 0 ||
    pathParts[objectsIndex] !== 'objects' ||
    pathParts.slice(objectsIndex + 1).join('/') !== objectKey
  ) {
    throw new Error('upstream.path must point to objects/' + objectKey + ' inside its repository')
  }
  return path.resolve(repoRoot, ...pathParts.slice(0, objectsIndex))
}

async function readFile(filePath, label) {
  const stat = await fs.lstat(filePath)
  if (stat.isSymbolicLink() || !stat.isFile()) throw new Error(label + ' must be a regular file')
  if (stat.size > MAX_FILE_BYTES) throw new Error(label + ' exceeds the ' + MAX_FILE_BYTES + ' byte limit')
  const bytes = await fs.readFile(filePath)
  if (bytes.byteLength !== stat.size || bytes.byteLength > MAX_FILE_BYTES) {
    throw new Error(label + ' changed while it was being read')
  }
  if (bytes.toString('utf8', 0, 43).startsWith('version https://git-lfs.github.com/spec/v1')) {
    throw new Error(label + ' is an unresolved Git LFS pointer; hydrate the asset first')
  }
  return bytes
}

function normalizedManifest(bytes, label) {
  let manifest
  try {
    manifest = JSON.parse(bytes.toString('utf8'))
  } catch (error) {
    throw new Error(label + ' is invalid JSON: ' + error.message)
  }
  delete manifest.upstream
  validateObjectManifest(manifest, label)
  return Buffer.from(stableJson(manifest))
}

async function readTree(directory, { base = false, skipBase = false } = {}) {
  const files = new Map()
  const root = path.resolve(directory)

  async function visit(current, prefix = '') {
    const entries = await fs.readdir(current, { withFileTypes: true })
    entries.sort((left, right) => compareText(left.name, right.name))
    for (const entry of entries) {
      if (!prefix && skipBase && entry.name === BASE_DIRECTORY) continue
      const relative = prefix ? prefix + '/' + entry.name : entry.name
      assertRelativePath(relative, 'object file path')
      const absolute = path.join(current, entry.name)
      if (entry.isSymbolicLink()) throw new Error('Symbolic links are not allowed in upstream objects: ' + relative)
      if (entry.isDirectory()) {
        await visit(absolute, relative)
        continue
      }
      if (!entry.isFile()) throw new Error('Special files are not allowed in upstream objects: ' + relative)
      const bytes = await readFile(absolute, relative)
      const manifestName = base ? 'manifest.json' : 'object.json'
      const mapped = !prefix && entry.name === manifestName ? 'object.json' : relative
      files.set(mapped, !prefix && entry.name === manifestName ? normalizedManifest(bytes, relative) : bytes)
    }
  }

  const stat = await fs.lstat(root)
  if (!stat.isDirectory() || stat.isSymbolicLink()) throw new Error('Object source must be a real directory')
  await visit(root)
  if (!files.has('object.json')) throw new Error(base ? 'Upstream base manifest is missing' : 'Object manifest is missing')
  return files
}

function fingerprintTree(files) {
  const parts = [Buffer.from('hyperfy-upstream-object-v1\0')]
  for (const [relative, bytes] of [...files].sort(([left], [right]) => compareText(left, right))) {
    parts.push(Buffer.from(relative + '\0' + bytes.byteLength + '\0'), bytes)
  }
  return sha256(Buffer.concat(parts))
}

function sameBytes(left, right) {
  return left === undefined || right === undefined ? left === right : left.equals(right)
}

function changedPaths(before, after) {
  const all = new Set([...before.keys(), ...after.keys()])
  return [...all].filter(relative => !sameBytes(before.get(relative), after.get(relative))).sort(compareText)
}

function textBuffer(bytes) {
  if (bytes.includes(0)) return false
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return true
  } catch {
    return false
  }
}

async function mergeText(local, base, upstream) {
  if (![local, base, upstream].every(textBuffer)) return null
  const temporary = await fs.mkdtemp(path.join(os.tmpdir(), 'hyperfy-worldsync-merge-'))
  const paths = {
    local: path.join(temporary, 'local'),
    base: path.join(temporary, 'base'),
    upstream: path.join(temporary, 'upstream'),
  }
  try {
    await Promise.all([
      fs.writeFile(paths.local, local),
      fs.writeFile(paths.base, base),
      fs.writeFile(paths.upstream, upstream),
    ])
    const result = spawnSync('git', ['merge-file', '-p', '-L', 'local', '-L', 'base', '-L', 'upstream', paths.local, paths.base, paths.upstream], {
      encoding: null,
      maxBuffer: MAX_FILE_BYTES,
    })
    if (result.error) throw new Error('git merge-file could not run: ' + result.error.message)
    if (result.status === 0) return result.stdout
    if (result.status === 1) return null
    throw new Error('git merge-file failed while merging an upstream object')
  } finally {
    await fs.rm(temporary, { recursive: true, force: true })
  }
}

async function mergeTrees(base, local, upstream) {
  const merged = new Map()
  const conflicts = []
  const all = new Set([...base.keys(), ...local.keys(), ...upstream.keys()])
  for (const relative of [...all].sort(compareText)) {
    const oldBytes = base.get(relative)
    const localBytes = local.get(relative)
    const upstreamBytes = upstream.get(relative)
    if (sameBytes(localBytes, oldBytes)) {
      if (upstreamBytes !== undefined) merged.set(relative, upstreamBytes)
      continue
    }
    if (sameBytes(upstreamBytes, oldBytes) || sameBytes(localBytes, upstreamBytes)) {
      if (localBytes !== undefined) merged.set(relative, localBytes)
      continue
    }
    if (oldBytes !== undefined && localBytes !== undefined && upstreamBytes !== undefined) {
      const bytes = await mergeText(localBytes, oldBytes, upstreamBytes)
      if (bytes) merged.set(relative, bytes)
      else conflicts.push(relative)
      continue
    }
    conflicts.push(relative)
  }
  return { merged, conflicts }
}

async function writeTree(directory, files, { base = false } = {}) {
  for (const [relative, bytes] of files) {
    assertRelativePath(relative, 'object file path')
    const target = relative === 'object.json' && base
      ? path.join(directory, 'manifest.json')
      : path.join(directory, ...relative.split('/'))
    await fs.mkdir(path.dirname(target), { recursive: true })
    await fs.writeFile(target, bytes, { flag: 'wx' })
  }
}

async function replaceObject(root, objectDir, localTree, baseTree, metadata) {
  const local = new Map(localTree)
  const manifest = JSON.parse(local.get('object.json').toString('utf8'))
  manifest.upstream = metadata
  validateObjectManifest(manifest, path.join(objectDir, 'object.json'))
  local.set('object.json', Buffer.from(stableJson(manifest)))

  const parent = path.dirname(objectDir)
  const stage = path.join(parent, '.worldsync-upstream-' + randomUUID())
  const backupRoot = path.join(root, '.worldsync')
  await fs.mkdir(stage)
  try {
    await writeTree(stage, local)
    await writeTree(path.join(stage, BASE_DIRECTORY), baseTree, { base: true })
    await fs.mkdir(backupRoot, { recursive: true })
    const backup = path.join(backupRoot, 'upstream-backup-' + randomUUID())
    await fs.rename(objectDir, backup)
    try {
      await fs.rename(stage, objectDir)
    } catch (error) {
      await fs.rename(backup, objectDir)
      throw error
    }
    await fs.rm(backup, { recursive: true, force: true })
  } catch (error) {
    await fs.rm(stage, { recursive: true, force: true })
    throw error
  }
}

async function loadSource(key, expectedUpstream) {
  const { repoRoot, repository } = repositoryDetails(TOOL_REPO_ROOT)
  if (repository !== normalizeRepository(expectedUpstream.repository, 'upstream.repository')) {
    throw new Error('The Hyperfy checkout origin does not match the object upstream repository')
  }
  assertRefIsCheckedOut(repoRoot, expectedUpstream.ref)
  const sourceRoot = sourceRootForPath(repoRoot, key, expectedUpstream.path)
  const source = await loadObject(sourceRoot, key)
  if (source.manifest.mode !== 'files' || source.manifest.upstream) {
    throw new Error('The canonical upstream must be a files-mode object without upstream metadata')
  }
  const repositoryPath = path.relative(repoRoot, source.objectDir).split(path.sep).join('/')
  if (repositoryPath.startsWith('../') || path.isAbsolute(repositoryPath)) {
    throw new Error('The canonical object must be inside its Git repository')
  }
  if (repositoryPath !== expectedUpstream.path) {
    throw new Error('The source checkout object path does not match the recorded upstream path')
  }
  return { source, repository, repositoryPath }
}

export async function trackUpstream(root, objectKey) {
  const key = objectKey
  const target = await loadObject(root, key)
  if (target.manifest.mode !== 'files') throw new Error('Upstream tracking currently supports files-mode objects only')
  if (target.manifest.upstream) throw new Error(key + ' already tracks an upstream object')
  if (target.manifest.extensions && Object.keys(target.manifest.extensions).length) {
    throw new Error('Objects with unsupported extensions cannot track an upstream source')
  }
  try {
    await fs.lstat(path.join(target.objectDir, BASE_DIRECTORY))
    throw new Error('Reserved upstream base directory already exists in ' + key)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  const { repoRoot, repository } = repositoryDetails(TOOL_REPO_ROOT)
  const ref = gitOutput(repoRoot, ['symbolic-ref', '--short', 'HEAD'], 'upstream tracking requires a named source branch')
  const source = await loadObject(CANONICAL_CATALOG_ROOT, key)
  if (source.manifest.mode !== 'files' || source.manifest.upstream) {
    throw new Error('The canonical upstream must be a files-mode object without upstream metadata')
  }
  const repositoryPath = path.relative(repoRoot, source.objectDir).split(path.sep).join('/')
  if (repositoryPath.startsWith('../') || path.isAbsolute(repositoryPath)) {
    throw new Error('The canonical object must be inside its Git repository')
  }
  const sourceTree = await readTree(source.objectDir, { skipBase: true })
  const localTree = await readTree(target.objectDir, { skipBase: true })
  const metadata = {
    repository,
    ref,
    path: repositoryPath,
    sourceFingerprint: fingerprintTree(sourceTree),
  }
  await replaceObject(root, target.objectDir, localTree, sourceTree, metadata)
  return { key, ...metadata, localChanges: changedPaths(sourceTree, localTree) }
}

async function planUpstream(root, objectKey) {
  const target = await loadObject(root, objectKey)
  const metadata = target.manifest.upstream
  if (!metadata) throw new Error(objectKey + ' has no upstream; run upstream track first')
  if (target.manifest.mode !== 'files') throw new Error('Upstream updates currently support files-mode objects only')
  const { source, repositoryPath } = await loadSource(objectKey, metadata)
  if (repositoryPath !== metadata.path) throw new Error('The source checkout object path does not match the recorded upstream path')
  const baseDirectory = path.join(target.objectDir, BASE_DIRECTORY)
  const baseTree = await readTree(baseDirectory, { base: true })
  const baseFingerprint = fingerprintTree(baseTree)
  if (baseFingerprint !== metadata.sourceFingerprint) {
    throw new Error('The stored upstream base does not match object.json; restore the base or re-track this object')
  }
  const localTree = await readTree(target.objectDir, { skipBase: true })
  const upstreamTree = await readTree(source.objectDir, { skipBase: true })
  const sourceFingerprint = fingerprintTree(upstreamTree)
  const { merged, conflicts } = await mergeTrees(baseTree, localTree, upstreamTree)
  return {
    key: objectKey,
    target,
    baseTree,
    localTree,
    upstreamTree,
    merged,
    conflicts,
    metadata: { ...metadata, sourceFingerprint },
    sourceChanged: sourceFingerprint !== metadata.sourceFingerprint,
    localChanges: changedPaths(baseTree, localTree),
    upstreamChanges: changedPaths(baseTree, upstreamTree),
    mergedChanges: changedPaths(localTree, merged),
  }
}

async function selectedUpstreamObjects(root, objectKey) {
  if (objectKey) {
    const object = await loadObject(root, objectKey)
    if (!object.manifest.upstream) throw new Error(objectKey + ' has no upstream; run upstream track first')
    return [object]
  }
  return (await discoverObjects(root)).filter(object => object.manifest.upstream)
}

export async function checkUpstream(root, objectKey = null) {
  const objects = await selectedUpstreamObjects(root, objectKey)
  const results = []
  for (const object of objects) {
    try {
      const plan = await planUpstream(root, object.manifest.key)
      results.push({
        key: plan.key,
        sourceChanged: plan.sourceChanged,
        localChanges: plan.localChanges,
        upstreamChanges: plan.upstreamChanges,
        conflicts: plan.conflicts,
        mergedChanges: plan.mergedChanges,
      })
    } catch (error) {
      results.push({ key: object.manifest.key, error: error.message })
    }
  }
  return results
}

export async function updateUpstream(root, objectKey = null) {
  const objects = await selectedUpstreamObjects(root, objectKey)
  const results = []
  for (const object of objects) {
    try {
      const plan = await planUpstream(root, object.manifest.key)
      if (plan.conflicts.length) {
        results.push({
          key: plan.key,
          error: 'Upstream update has conflicts in: ' + plan.conflicts.join(', ') + '. No files were changed.',
        })
        continue
      }
      if (!plan.sourceChanged) {
        results.push({ key: plan.key, updated: false, files: [] })
        continue
      }
      await replaceObject(root, plan.target.objectDir, plan.merged, plan.upstreamTree, plan.metadata)
      results.push({ key: plan.key, updated: true, files: plan.mergedChanges })
    } catch (error) {
      results.push({ key: object.manifest.key, error: error.message })
    }
  }
  return results
}
