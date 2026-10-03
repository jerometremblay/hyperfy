import { uuid } from '../utils'
import { hashFile } from '../utils-client'
import * as THREE from './three'
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
    const request = {
      format: 'hyperfy-prompt-box',
      version: 1,
      requestId: uuid(),
      world: this.world.network.apiUrl,
      blueprintVersion: bp.version + 1,
      coordinates: { units: 'meters', handedness: 'right', up: '+Y', forward: '-Z', origin: 'box-center' },
      box,
      result: { file: 'generated.hyp', scale: [1, 1, 1], baseY: -box.dimensions[1] / 2 },
    }
    const blueprint = { ...bp, version: request.blueprintVersion, props: { ...bp.props, promptBoxRequest: request } }
    // Build the package before marking it as the latest request.
    const file = await exportPromptBox({ blueprint }, request, this.world.loader.loadFile)
    this.requireBuilder()
    this.settle(app)
    if (
      this.world.blueprints.get(bp.id).version !== bp.version ||
      JSON.stringify(getPromptBoxSnapshot(app)) !== JSON.stringify(box)
    ) {
      throw new Error('The prompt-box changed during export. Try exporting again.')
    }
    this.world.blueprints.modify({ id: bp.id, version: blueprint.version, props: blueprint.props })
    this.world.network.send('blueprintModified', { id: bp.id, version: blueprint.version, props: blueprint.props })
    return file
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
      const info = await readPromptBoxResult(file, request)
      assertPromptBoxUnchanged(app, request)
      const confirmed = await this.world.ui.confirm({
        title: 'Import generated object',
        message: `Replace this prompt-box with “${info.blueprint.name || 'Generated Object'}”?`,
        confirmText: 'Replace',
        cancelText: 'Cancel',
      })
      if (!confirmed) return false
      await Promise.all(info.assets.map(asset => this.world.network.upload(asset.file)))
      this.requireBuilder()
      this.settle(app)
      assertPromptBoxUnchanged(app, request)
      for (const asset of info.assets) this.world.loader.insert(asset.type, asset.url, asset.file)
      await Promise.all(info.assets.map(asset => this.world.loader.load(asset.type, asset.url)))
      this.requireBuilder()
      this.settle(app)
      assertPromptBoxUnchanged(app, request)
      const blueprint = { ...info.blueprint, id: uuid(), version: 0, unique: true, scene: false }
      const replacement = {
        entityId: app.data.id,
        replacementBlueprintId: blueprint.id,
        data: {
          blueprint: app.data.blueprint,
          position: [...request.box.position],
          quaternion: [...request.box.quaternion],
          scale: [...request.box.dimensions],
          state: structuredClone(app.data.state),
        },
      }
      this.world.blueprints.add(blueprint, true)
      const change = {
        id: app.data.id,
        blueprint: blueprint.id,
        scale: [1, 1, 1],
        position: [...request.box.position],
        quaternion: [...request.box.quaternion],
        state: {},
      }
      try {
        await app.modify(change)
        if (app.scriptError) throw new Error('The generated app script failed. The prompt-box has been restored.')
      } catch (err) {
        await app.modify(replacement.data)
        throw err
      }
      this.world.network.send('entityModified', change)
      this.lastReplacement = replacement
      this.world.builder.addUndo({ name: 'replace-prompt-box', ...this.lastReplacement })
      // Close the old inspector so its blueprint/field state cannot edit the replacement.
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
    const app = this.world.entities.get(replacement.entityId)
    if (!app || app.data.blueprint !== replacement.replacementBlueprintId) {
      throw new Error('The generated object is no longer available to restore.')
    }
    this.settle(app)
    const change = { id: app.data.id, ...replacement.data }
    app.modify(change)
    this.world.network.send('entityModified', change)
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
