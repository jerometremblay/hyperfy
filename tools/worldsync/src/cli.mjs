#!/usr/bin/env node

import fs from 'node:fs/promises'
import path from 'node:path'
import { buildWorldBundle, verifyWorldBundle } from './bundle.mjs'
import { compileProject, compileSingleObject } from './compiler.mjs'
import { assertKey } from './canonical.mjs'
import { importHyp, unpackObject } from './importer.mjs'
import { packHyp } from './hyp-format.mjs'
import { loadObject } from './object-source.mjs'
import { bootstrapWorld, deployObject, diffObjectDeployment } from './deployment.mjs'
import { checkUpstream, trackUpstream, updateUpstream } from './upstream.mjs'
import { ensureSafeDirectory, readBoundedFile, resolveContainedPath, resolveLocalReference } from './paths.mjs'

function parseArgs(values) {
  const options = {}
  const positional = []
  for (let index = 0; index < values.length; index++) {
    const value = values[index]
    if (!value.startsWith('--')) {
      positional.push(value)
      continue
    }
    const name = value.slice(2)
    if (['extract', 'keep-original', 'include-hyp', 'allow-external', 'dry-run', 'json', 'help'].includes(name)) {
      options[name] = true
      continue
    }
    const next = values[index + 1]
    if (!next || next.startsWith('--')) throw new Error('Missing value for --' + name)
    options[name] = next
    index++
  }
  return { options, positional }
}

function printHelp() {
  console.log([
    'Hyperfy world source tools',
    '',
    'Implemented commands:',
    '  validate --scene <key>',
    '  build --scene <key> [--include-hyp] [--allow-external] [--output <path>]',
    '  import <file.hyp> --key <key> [--extract] [--keep-original]',
    '  unpack --object <key> [--keep-original]',
    '  export-hyp --object <key> [--output <path>]',
    '  verify --bundle <path>',
    '  diff --object <key> --profile <name>',
    '  deploy --object <key> --profile <name>',
    '  bootstrap --scene <key> --profile <name> [--allow-external] [--dry-run]',
    '  upstream track --object <key>',
    '  upstream check|update [--object <key>]',
    '',
    'Live scene capture and worker commands are not available in this phase.',
  ].join('\n'))
}

async function writeOutput(root, outputPath, defaultPath, bytes) {
  const selected = outputPath || defaultPath
  const destination = resolveContainedPath(root, root, selected, 'output path')
  await ensureSafeDirectory(root, path.dirname(destination), 'output directory')
  try {
    const current = await fs.lstat(destination)
    if (current.isSymbolicLink() || !current.isFile()) {
      throw new Error('output path must be a regular file and not a symbolic link')
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await fs.writeFile(destination, bytes)
  return destination
}

async function run() {
  const { options, positional } = parseArgs(process.argv.slice(2))
  const command = positional.shift()
  const root = path.resolve(options.root || process.cwd())
  if (!command || command === 'help' || command === '--help' || options.help) return printHelp()
  if (command === 'validate') {
    if (!options.scene) throw new Error('validate requires --scene')
    const compiled = await compileProject(root, options.scene)
    const result = {
      scene: compiled.scene.sceneKey,
      objects: compiled.objects.length,
      instances: compiled.scene.instances.length,
      assets: compiled.assets.length,
      warnings: compiled.warnings,
    }
    console.log(options.json ? JSON.stringify(result, null, 2) : JSON.stringify(result))
    return
  }
  if (command === 'build') {
    if (!options.scene) throw new Error('build requires --scene')
    const compiled = await compileProject(root, options.scene)
    const bundle = buildWorldBundle(compiled, {
      includeHyp: !!options['include-hyp'],
      allowExternal: !!options['allow-external'],
    })
    const destination = await writeOutput(
      root,
      options.output,
      path.join('tools', 'worldsync', 'dist', options.scene + '.hworld'),
      bundle
    )
    const portability = compiled.warnings.some(warning => warning.code === 'external-asset')
      ? ', nonportable external dependencies=' + compiled.warnings.filter(warning => warning.code === 'external-asset').length
      : ', portable'
    console.log('Built ' + path.relative(root, destination) + ' (' + bundle.byteLength + ' bytes' + portability + ')')
    return
  }
  if (command === 'verify') {
    if (!options.bundle) throw new Error('verify requires --bundle')
    const bundlePath = path.resolve(root, options.bundle)
    const bundle = await readBoundedFile(bundlePath, { maxBytes: 1024 * 1024 * 1024, label: options.bundle })
    const result = verifyWorldBundle(bundle)
    console.log(options.json ? JSON.stringify(result, null, 2) : 'Bundle verified: ' + result.manifest.sceneKey)
    return
  }
  if (command === 'import') {
    const input = positional.shift()
    if (!input || !options.key) throw new Error('import requires a .hyp path and --key')
    const result = await importHyp(root, input, assertKey(options.key, 'object key'), {
      extract: !!options.extract,
      keepOriginal: !!options['keep-original'],
    })
    console.log('Imported ' + result.key + ' as mode ' + result.mode)
    return
  }
  if (command === 'unpack') {
    if (!options.object) throw new Error('unpack requires --object')
    const result = await unpackObject(root, options.object, { keepOriginal: !!options['keep-original'] })
    console.log('Unpacked ' + result.key + ' to editable source files')
    return
  }
  if (command === 'export-hyp') {
    if (!options.object) throw new Error('export-hyp requires --object')
    const key = assertKey(options.object, 'object key')
    const source = await loadObject(root, key)
    let bytes
    let detail
    if (source.manifest.mode === 'hyp') {
      const original = await resolveLocalReference(root, source.objectDir, source.manifest.source, 'legacy .hyp source')
      bytes = await readBoundedFile(original.absolutePath, { label: original.relativePath })
      detail = 'Copied original HYP unchanged'
    } else {
      const compiled = await compileSingleObject(root, key)
      bytes = packHyp(compiled.blueprint, compiled.assets)
      detail = 'Exported a deterministic native HYP package'
    }
    const outputPath = options.output || path.join('tools', 'worldsync', 'dist', 'objects', options.object + '.hyp')
    const destination = await writeOutput(root, outputPath, outputPath, bytes)
    console.log(detail + ' to ' + path.relative(root, destination))
    return
  }
  if (command === 'diff') {
    if (!options.object) throw new Error('diff requires --object')
    const result = await diffObjectDeployment(root, options.object, options.profile)
    console.log(
      result.fields.length
        ? `${result.key}: live version ${result.version}; changed fields: ${result.fields.join(', ')}`
        : `${result.key}: no changes (live version ${result.version})`
    )
    return
  }
  if (command === 'deploy') {
    if (!options.object) throw new Error('deploy requires --object')
    const result = await deployObject(root, options.object, options.profile)
    console.log(
      result.updated
        ? `Deployed ${result.key} to live version ${result.version} (fields: ${result.fields.join(', ')})`
        : `${result.key} is already current (live version ${result.version})`
    )
    return
  }
  if (command === 'bootstrap') {
    if (!options.scene || !options.profile) throw new Error('bootstrap requires --scene and --profile')
    const result = await bootstrapWorld(root, options.scene, options.profile, {
      allowExternal: !!options['allow-external'],
      dryRun: !!options['dry-run'],
    })
    if (options.json) {
      console.log(JSON.stringify({ dryRun: !!options['dry-run'], ...result }, null, 2))
    } else {
      console.log(
        `${options['dry-run'] ? 'Bootstrap plan' : 'Bootstrapped'} ${result.sceneKey} on ${result.profile}: ` +
          `${result.createBlueprints} blueprint(s) to create, ${result.updateBlueprints} to update, ` +
          `${result.createInstances} instance(s) to create, ${result.updateInstances} to update, ` +
          `${result.updateSettings} setting(s) to update${result.updateSpawn ? ', spawn to update' : ''}; ` +
          `${result.assets} asset(s), ${result.warnings} external reference warning(s)`
      )
    }
    return
  }
  if (command === 'upstream') {
    const action = positional.shift()
    if (!['track', 'check', 'update'].includes(action)) {
      throw new Error('upstream requires track, check, or update')
    }
    if (action === 'track' && !options.object) {
      throw new Error('upstream track requires --object')
    }
    const key = options.object ? assertKey(options.object, 'object key') : null
    if (action === 'track') {
      const result = await trackUpstream(root, key)
      console.log('Tracking ' + result.key + ' from ' + result.repository + '#' + result.ref + ':' + result.path)
      if (result.localChanges.length) console.log('Preserved local changes: ' + result.localChanges.join(', '))
      return
    }
    const results = action === 'check'
      ? await checkUpstream(root, key)
      : await updateUpstream(root, key)
    if (results.some(result => result.error || (result.conflicts && result.conflicts.length))) {
      process.exitCode = 1
    }
    if (options.json) {
      console.log(JSON.stringify(results, null, 2))
    } else if (!results.length) {
      console.log('No objects track an upstream')
    } else {
      for (const result of results) {
        if (result.error) {
          console.log(result.key + ': ERROR ' + result.error)
          process.exitCode = 1
          continue
        }
        if (action === 'check') {
          console.log(result.sourceChanged
            ? result.conflicts.length
              ? `${result.key}: upstream changes conflict in ${result.conflicts.join(', ')}`
              : `${result.key}: ${result.upstreamChanges.length} upstream change(s) can be merged; local changes: ${result.localChanges.length}`
            : `${result.key}: upstream is current; local changes: ${result.localChanges.length}`)
        } else {
          console.log(result.updated
            ? 'Updated ' + result.key + (result.files.length ? ' (changed files: ' + result.files.join(', ') + ')' : ' (upstream baseline advanced)')
            : result.key + ' is already current')
        }
        if (result.conflicts && result.conflicts.length) process.exitCode = 1
      }
    }
    return
  }
  if (['status', 'capture', 'adopt'].includes(command)) {
    throw new Error(command + ' is not implemented yet')
  }
  printHelp()
  throw new Error('Unknown command: ' + command)
}

run().catch(error => {
  console.error('worldsync: ' + error.message)
  process.exitCode = 1
})
