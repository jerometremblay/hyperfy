import { uuid } from '../utils'
import { hashFile } from '../utils-client'
import * as THREE from './three'
import { cloneDeep, isEqual } from 'lodash-es'
import { getPromptBoxIntersections, getIntersectionSnapshot } from './promptBoxIntersections'
import {
  promptBoxScript,
  isPromptBox,
  getPromptBoxSnapshot,
  assertPromptBoxUnchanged,
  exportPromptBox,
  readPromptBoxResult,
} from './promptBoxTools'

export class PromptBoxWorkflow {
  constructor(world) {
    this.world = world
    this.busy = false
    this.lastReplacement = null
  }

  requireBuilder() {
    if (!this.world.builder.canBuild()) throw new Error('Builder permission is required.')
  }

  async create() {
    this.requireBuilder()
    const { world } = this
    const file = new File([promptBoxScript], 'prompt-box.js', { type: 'text/javascript' })
    const url = `asset://${await hashFile(file)}.js`
    await world.network.upload(file)
    world.loader.insert('script', url, file)
    await world.loader.load('script', url)
    this.requireBuilder()
    const blueprint = {
      id: uuid(),
      version: 0,
      name: 'Prompt Box',
      model: 'script-only',
      script: url,
      props: { promptBox: true, prompt: '' },
      unique: true,
      scene: false,
      disabled: false,
      locked: false,
      frozen: false,
    }
    world.blueprints.add(blueprint, true)
    const transform = world.builder.getSpawnTransform(true)
    // Spawn transforms locate the surface. This cube's origin is at its center.
    const center = new THREE.Vector3()
      .fromArray(transform.position)
      .add(new THREE.Vector3(0, 0.5, 0).applyQuaternion(new THREE.Quaternion().fromArray(transform.quaternion)))
    const app = world.entities.add(
      {
        id: uuid(),
        type: 'app',
        blueprint: blueprint.id,
        position: center.toArray(),
        quaternion: transform.quaternion,
        scale: [1, 1, 1],
        mover: null,
        uploader: null,
        pinned: false,
        state: {},
      },
      true
    )
    world.ui.setApp(app)
    return app
  }

  settle(app) {
    if (this.world.builder.selected === app) this.world.builder.select(null)
    if (app.data.mover) throw new Error('Finish moving the prompt-box before continuing.')
    if (app.destroyed || app.building) throw new Error('Wait for the prompt-box to finish loading.')
  }

  async export(app) {
    this.requireBuilder()
    this.settle(app)
    if (!isPromptBox(app.blueprint)) throw new Error('Select a prompt-box.')
    const box = getPromptBoxSnapshot(app)
    if (!box.prompt.trim()) throw new Error('Write a prompt before exporting.')
    const bp = this.world.blueprints.get(app.data.blueprint)
    const intersections = getPromptBoxIntersections(this.world, app)
    for (const other of intersections) {
      if (other.building || other.data.mover || other.data.uploader) {
        throw new Error(`Wait for “${other.blueprint.name || 'App'}” to finish loading or moving before exporting.`)
      }
    }
    const context = intersections.map(other => ({
      blueprint: cloneDeep(other.blueprint),
      snapshot: getIntersectionSnapshot(other, app),
    }))
    const request = {
      format: 'hyperfy-prompt-box',
      version: 2,
      requestId: uuid(),
      world: this.world.network.apiUrl,
      blueprintVersion: bp.version + 1,
      coordinates: { units: 'meters', handedness: 'right', up: '+Y', forward: '-Z', origin: 'box-center' },
      box,
      intersectionMethod: 'transformed-geometry-bounds',
      intersections: context.map(item => item.snapshot),
      result: {
        file: 'result.zip',
        standalone: { file: 'generated.hyp', scale: [1, 1, 1], baseY: -box.dimensions[1] / 2 },
        targetProperty: 'promptBoxTargetEntityId',
        constructionCoordinates: 'preserve-app-local',
        boxRole: 'approximate-edit-region',
        removeBoxIfUntargeted: true,
      },
    }
    const blueprint = { ...bp, version: request.blueprintVersion, props: { ...bp.props, promptBoxRequest: request } }
    // Build the package before marking it as the latest request.
    const file = await exportPromptBox({ blueprint }, request, this.world.loader.loadFile, context)
    this.requireBuilder()
    this.settle(app)
    if (
      this.world.blueprints.get(bp.id).version !== bp.version ||
      JSON.stringify(getPromptBoxSnapshot(app)) !== JSON.stringify(box)
    ) {
      throw new Error('The prompt-box changed during export. Try exporting again.')
    }
    const current = getPromptBoxIntersections(this.world, app)
    if (
      current.some(other => other.building || other.data.mover || other.data.uploader) ||
      !isEqual(
        current.map(other => getIntersectionSnapshot(other, app)),
        request.intersections
      )
    ) {
      throw new Error('Intersected apps changed during export. Try exporting again.')
    }
    this.world.blueprints.modify({ id: bp.id, version: blueprint.version, props: blueprint.props })
    this.world.network.send('blueprintModified', { id: bp.id, version: blueprint.version, props: blueprint.props })
    return file
  }

  checkTarget(app, request, info) {
    if (info.targetEntityId === request.box.entityId) return app
    const snapshot = request.intersections.find(item => item.entityId === info.targetEntityId)
    const target = this.world.entities.get(info.targetEntityId)
    if (!target?.isApp || target.destroyed)
      throw new Error('An edited construction is no longer available. Export a new request.')
    this.settle(target)
    if (target.blueprint.locked || target.blueprint.frozen)
      throw new Error('This construction is locked and cannot be edited.')
    if (!snapshot.editable)
      throw new Error('This construction was exported as reference only. Export a new editable request.')
    if (!isEqual(getIntersectionSnapshot(target, app), snapshot)) {
      throw new Error('An edited construction changed since export. Export a new request before importing its result.')
    }
    return target
  }

  async import(app, file) {
    this.requireBuilder()
    if (this.busy) throw new Error('An import is already in progress.')
    this.busy = true
    try {
      this.settle(app)
      const request = app.blueprint.props.promptBoxRequest
      assertPromptBoxUnchanged(app, request)
      if (request.world !== this.world.network.apiUrl) throw new Error('This request belongs to another world.')
      const results = await readPromptBoxResult(file, request)
      // Replace the placeholder last, keeping its request available while other apps build.
      results.sort((a, b) => Number(a.targetEntityId === app.data.id) - Number(b.targetEntityId === app.data.id))
      const check = () => {
        this.requireBuilder()
        this.settle(app)
        assertPromptBoxUnchanged(app, request)
        for (const info of results) this.checkTarget(app, request, info)
      }
      check()
      const edits = results.filter(info => info.targetEntityId !== app.data.id)
      const creates = results.length !== edits.length
      const names = edits.map(info => this.world.entities.get(info.targetEntityId).blueprint.name || 'App')
      const confirmed = await this.world.ui.confirm({
        title: edits.length ? 'Apply construction edits' : 'Import generated object',
        message: edits.length
          ? `Update ${names.map(name => `“${name}”`).join(', ')}? ${creates ? 'Replace the prompt-box with the generated object.' : 'Remove the completed prompt-box.'} The constructions keep their placement. Undo restores the full change.`
          : `Replace this prompt-box with “${results[0].blueprint.name || 'Generated Object'}”?`,
        confirmText: edits.length ? 'Apply edits' : 'Replace',
        cancelText: 'Cancel',
      })
      if (!confirmed) return false
      check()
      const assets = [...new Map(results.flatMap(info => info.assets).map(asset => [asset.url, asset])).values()]
      await Promise.all(assets.map(asset => this.world.network.upload(asset.file)))
      check()
      for (const asset of assets) this.world.loader.insert(asset.type, asset.url, asset.file)
      await Promise.all(assets.map(asset => this.world.loader.load(asset.type, asset.url)))
      check()
      const removedBox = creates ? null : structuredClone(app.data)
      const changes = results.map(info => {
        const target = this.checkTarget(app, request, info)
        const isBox = target === app
        const blueprint = { ...info.blueprint, id: uuid(), version: 0, unique: true, scene: false }
        const original = {
          blueprint: target.data.blueprint,
          position: target.root.position.toArray(),
          quaternion: target.root.quaternion.toArray(),
          scale: target.root.scale.toArray(),
          state: structuredClone(target.data.state || {}),
        }
        return {
          entityId: target.data.id,
          replacementBlueprintId: blueprint.id,
          data: original,
          blueprint,
          change: {
            id: target.data.id,
            blueprint: blueprint.id,
            position: [...original.position],
            quaternion: [...original.quaternion],
            scale: isBox ? [1, 1, 1] : [...original.scale],
            state: isBox ? {} : structuredClone(original.state),
          },
        }
      })
      const applied = []
      try {
        for (const entry of changes) {
          this.requireBuilder()
          assertPromptBoxUnchanged(app, request)
          const target = this.checkTarget(
            app,
            request,
            results.find(info => info.targetEntityId === entry.entityId)
          )
          this.world.blueprints.add(entry.blueprint)
          applied.push(entry)
          await target.modify(entry.change)
          if (target.scriptError)
            throw new Error('The generated app script failed. The original apps have been restored.')
          if (
            this.world.entities.get(entry.entityId) !== target ||
            target.data.blueprint !== entry.replacementBlueprintId ||
            !isEqual(target.root.position.toArray(), entry.change.position) ||
            !isEqual(target.root.quaternion.toArray(), entry.change.quaternion) ||
            !isEqual(target.root.scale.toArray(), entry.change.scale)
          ) {
            throw new Error(
              'A returned app changed its root placement. Author the edit in its original local coordinates.'
            )
          }
        }
        this.requireBuilder()
        if (!creates) assertPromptBoxUnchanged(app, request)
        for (const entry of changes) {
          const target = this.world.entities.get(entry.entityId)
          if (!target || target.destroyed || target.data.blueprint !== entry.replacementBlueprintId) {
            throw new Error('An edited app changed while results were being built. Try importing a fresh request.')
          }
        }
      } catch (err) {
        // No entity changes have been broadcast yet. Restore every local edit.
        for (const entry of applied.reverse()) {
          const target = this.world.entities.get(entry.entityId)
          if (target?.data.blueprint === entry.replacementBlueprintId) await target.modify(entry.data)
        }
        throw err
      }
      for (const entry of changes) {
        this.world.network.send('blueprintAdded', entry.blueprint)
        this.world.network.send('entityModified', entry.change)
      }
      if (removedBox) {
        this.world.entities.remove(app.data.id)
        this.world.network.send('entityRemoved', app.data.id)
      }
      this.lastReplacement = {
        entityId: app.data.id,
        replacementBlueprintId: changes.at(-1).replacementBlueprintId,
        changes,
        removedBox,
      }
      this.world.builder.addUndo({ name: 'replace-prompt-box', ...this.lastReplacement })
      this.world.ui.setApp(null)
      this.world.emit('prompt-box-replaced')
      return true
    } finally {
      this.busy = false
    }
  }

  undo(replacement = this.lastReplacement) {
    this.requireBuilder()
    if (!replacement) return
    const changes = replacement.changes
    // Validate every target before undoing any of them.
    for (const entry of changes) {
      const target = this.world.entities.get(entry.entityId)
      if (!target || target.data.blueprint !== entry.replacementBlueprintId) {
        throw new Error('An edited app is no longer available to restore.')
      }
      this.settle(target)
    }
    if (replacement.removedBox && this.world.entities.get(replacement.entityId)) {
      throw new Error('The original prompt-box ID is already in use.')
    }
    for (const entry of changes) {
      const change = { id: entry.entityId, ...structuredClone(entry.data) }
      this.world.entities.get(entry.entityId).modify(change)
      this.world.network.send('entityModified', change)
    }
    if (replacement.removedBox) this.world.entities.add(structuredClone(replacement.removedBox), true)
    this.lastReplacement = null
    if (this.world.builder.undos) {
      this.world.builder.undos = this.world.builder.undos.filter(
        action =>
          action.name !== 'replace-prompt-box' || action.replacementBlueprintId !== replacement.replacementBlueprintId
      )
    }
    this.world.ui.setApp(null)
    this.world.emit('prompt-box-replaced')
  }
}
