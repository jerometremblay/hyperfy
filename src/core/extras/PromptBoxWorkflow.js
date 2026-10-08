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
    const boxes = [box, ...context.filter(item => item.snapshot.promptBox).map(item => item.snapshot.promptBox)]
    if (boxes.some(box => !box.prompt.trim()))
      throw new Error('Write a prompt in every intersected prompt-box before exporting.')
    const request = {
      format: 'hyperfy-prompt-box',
      version: 2,
      requestId: uuid(),
      world: this.world.network.apiUrl,
      blueprintVersion: bp.version + 1,
      coordinates: { units: 'meters', handedness: 'right', up: '+Y', forward: '-Z', origin: 'box-center' },
      box,
      boxes,
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
    const boxFrame = {
      root: {
        position: new THREE.Vector3().fromArray(request.box.position),
        quaternion: new THREE.Quaternion().fromArray(request.box.quaternion),
        scale: new THREE.Vector3().fromArray(request.box.dimensions),
      },
    }
    if (!isEqual(getIntersectionSnapshot(target, boxFrame), snapshot)) {
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
      const boxes = request.boxes || [request.box]
      const boxIds = new Set(boxes.map(box => box.entityId))
      const boxById = new Map(boxes.map(box => [box.entityId, box]))
      // Replace the placeholder last, keeping its request available while other apps build.
      results.sort((a, b) => Number(a.targetEntityId === app.data.id) - Number(b.targetEntityId === app.data.id))
      const editInfos = results.filter(info => !boxIds.has(info.targetEntityId))
      const boxGroups = new Map()
      for (const info of results) {
        if (!boxIds.has(info.targetEntityId)) continue
        let group = boxGroups.get(info.targetEntityId)
        if (!group) boxGroups.set(info.targetEntityId, (group = []))
        group.push(info)
      }
      const primaryBoxInfos = [...boxGroups.values()].map(group => group[0])
      const extraBoxInfos = [...boxGroups.values()].flatMap(group => group.slice(1))

      const getBoxPlacement = info => {
        const box = boxById.get(info.targetEntityId)
        if (!box) throw new Error('Generated object references an unknown prompt-box.')
        const placement = info.blueprint.props?.promptBoxPlacement || {}
        if (placement.space && placement.space !== 'box-local-meters') {
          throw new Error('promptBoxPlacement.space must be "box-local-meters".')
        }
        const localPosition = new THREE.Vector3().fromArray(placement.position || [0, 0, 0])
        const localQuaternion = new THREE.Quaternion().fromArray(placement.quaternion || [0, 0, 0, 1])
        const boxPosition = new THREE.Vector3().fromArray(box.position)
        const boxQuaternion = new THREE.Quaternion().fromArray(box.quaternion)
        const position = localPosition.applyQuaternion(boxQuaternion).add(boxPosition)
        const quaternion = boxQuaternion.clone().multiply(localQuaternion)
        const scale = placement.scale || [1, 1, 1]
        return { position: position.toArray(), quaternion: quaternion.toArray(), scale: [...scale] }
      }

      const check = () => {
        this.requireBuilder()
        this.settle(app)
        assertPromptBoxUnchanged(app, request)
        for (const box of boxes) {
          if (box.entityId !== app.data.id) this.checkTarget(app, request, { targetEntityId: box.entityId })
        }
        for (const info of editInfos) this.checkTarget(app, request, info)
      }
      check()
      const edits = editInfos
      const selectedCreates = boxGroups.has(app.data.id)
      const generatedCount = [...boxGroups.values()].reduce((count, group) => count + group.length, 0)
      const names = edits.map(info => this.world.entities.get(info.targetEntityId).blueprint.name || 'App')
      const confirmed = await this.world.ui.confirm({
        title: edits.length ? 'Apply construction edits' : 'Import generated object',
        message:
          boxes.length > 1
            ? `Apply ${results.length} returned apps and complete ${boxes.length} prompt-boxes? ${names.length ? `Update ${names.map(name => `“${name}”`).join(', ')}. ` : ''}${generatedCount ? `Create ${generatedCount} generated object${generatedCount === 1 ? '' : 's'}. ` : ''}Construction edits keep their placement. Boxes without generated objects are removed. Undo restores the full change.`
            : edits.length
              ? `Update ${names.map(name => `“${name}”`).join(', ')}? ${generatedCount ? `Create ${generatedCount} generated object${generatedCount === 1 ? '' : 's'}.` : 'Remove the completed prompt-box.'} The constructions keep their placement. Undo restores the full change.`
              : generatedCount === 1
                ? `Replace this prompt-box with “${primaryBoxInfos[0].blueprint.name || 'Generated Object'}”?`
                : `Replace this prompt-box with ${generatedCount} independent generated objects?`,
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
      const removedBox = selectedCreates ? null : structuredClone(app.data)
      const removedBoxes = boxes
        .filter(box => !boxGroups.has(box.entityId))
        .map(box => structuredClone(this.world.entities.get(box.entityId).data))

      const changeInfos = [...editInfos, ...primaryBoxInfos]
      changeInfos.sort((a, b) => Number(a.targetEntityId === app.data.id) - Number(b.targetEntityId === app.data.id))
      const changes = changeInfos.map(info => {
        const target = this.checkTarget(app, request, info)
        const isBox = boxIds.has(target.data.id)
        const blueprint = { ...info.blueprint, id: uuid(), version: 0, unique: true, scene: false }
        const original = {
          blueprint: target.data.blueprint,
          position: target.root.position.toArray(),
          quaternion: target.root.quaternion.toArray(),
          scale: target.root.scale.toArray(),
          state: structuredClone(target.data.state || {}),
        }
        const placement = isBox ? getBoxPlacement(info) : null
        return {
          entityId: target.data.id,
          replacementBlueprintId: blueprint.id,
          targetEntityId: info.targetEntityId,
          isBox,
          data: original,
          blueprint,
          change: {
            id: target.data.id,
            blueprint: blueprint.id,
            position: isBox ? placement.position : [...original.position],
            quaternion: isBox ? placement.quaternion : [...original.quaternion],
            scale: isBox ? placement.scale : [...original.scale],
            state: isBox ? {} : structuredClone(original.state),
          },
        }
      })
      const createdEntries = extraBoxInfos.map(info => {
        const blueprint = { ...info.blueprint, id: uuid(), version: 0, unique: true, scene: false }
        const placement = getBoxPlacement(info)
        return {
          entityId: uuid(),
          replacementBlueprintId: blueprint.id,
          targetEntityId: info.targetEntityId,
          blueprint,
          data: {
            id: null,
            type: 'app',
            blueprint: blueprint.id,
            position: placement.position,
            quaternion: placement.quaternion,
            scale: placement.scale,
            mover: null,
            uploader: null,
            pinned: false,
            state: {},
          },
        }
      })
      for (const entry of createdEntries) entry.data.id = entry.entityId

      const constructionChanges = changes.filter(entry => !entry.isBox)
      const boxChanges = changes.filter(entry => entry.isBox)
      boxChanges.sort((a, b) => Number(a.entityId === app.data.id) - Number(b.entityId === app.data.id))
      const applied = []
      const created = []
      const applyChange = async entry => {
        this.requireBuilder()
        assertPromptBoxUnchanged(app, request)
        const target = this.checkTarget(app, request, { targetEntityId: entry.targetEntityId })
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
          throw new Error('A returned app changed its root placement while importing.')
        }
      }
      try {
        // Keep every prompt-box intact until construction edits and extra generated
        // objects are built. The selected prompt-box replacement remains last so
        // its promptBoxRequest stays available throughout validation/rollback.
        for (const entry of constructionChanges) await applyChange(entry)

        for (const entry of createdEntries) {
          this.requireBuilder()
          assertPromptBoxUnchanged(app, request)
          this.world.blueprints.add(entry.blueprint)
          const entity = this.world.entities.add(entry.data)
          created.push(entry)
          await entity.build()
          if (entity.scriptError)
            throw new Error('The generated app script failed. The original apps have been restored.')
        }

        for (const entry of boxChanges) await applyChange(entry)

        this.requireBuilder()
        if (!selectedCreates) assertPromptBoxUnchanged(app, request)
        for (const box of removedBoxes) this.checkTarget(app, request, { targetEntityId: box.id })
        for (const entry of changes) {
          const target = this.world.entities.get(entry.entityId)
          if (!target || target.destroyed || target.data.blueprint !== entry.replacementBlueprintId) {
            throw new Error('An edited app changed while results were being built. Try importing a fresh request.')
          }
        }
        for (const entry of createdEntries) {
          const target = this.world.entities.get(entry.entityId)
          if (!target || target.destroyed || target.data.blueprint !== entry.replacementBlueprintId) {
            throw new Error('A generated app changed while results were being built. Try importing a fresh request.')
          }
        }
      } catch (err) {
        // No entity changes have been broadcast yet. Restore every local edit.
        for (const entry of created.reverse()) {
          if (this.world.entities.get(entry.entityId)) this.world.entities.remove(entry.entityId)
        }
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
      for (const entry of createdEntries) {
        this.world.network.send('blueprintAdded', entry.blueprint)
        this.world.network.send('entityAdded', entry.data)
      }
      for (const box of removedBoxes) {
        this.world.entities.remove(box.id)
        this.world.network.send('entityRemoved', box.id)
      }
      const replacementBlueprintId =
        boxChanges.find(entry => entry.entityId === app.data.id)?.replacementBlueprintId ||
        changes.at(-1)?.replacementBlueprintId ||
        createdEntries.at(-1)?.replacementBlueprintId
      this.lastReplacement = {
        entityId: app.data.id,
        replacementBlueprintId,
        changes,
        createdEntries,
        removedBox,
        removedBoxes,
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
    const createdEntries = replacement.createdEntries || []
    // Validate every target before undoing any of them.
    for (const entry of changes) {
      const target = this.world.entities.get(entry.entityId)
      if (!target || target.data.blueprint !== entry.replacementBlueprintId) {
        throw new Error('An edited app is no longer available to restore.')
      }
      this.settle(target)
    }
    for (const entry of createdEntries) {
      const target = this.world.entities.get(entry.entityId)
      if (!target || target.data.blueprint !== entry.replacementBlueprintId) {
        throw new Error('A generated app is no longer available to remove.')
      }
      this.settle(target)
    }
    const removedBoxes = replacement.removedBoxes || (replacement.removedBox ? [replacement.removedBox] : [])
    for (const box of removedBoxes) {
      if (this.world.entities.get(box.id)) throw new Error('The original prompt-box ID is already in use.')
    }
    for (const entry of changes) {
      const change = { id: entry.entityId, ...structuredClone(entry.data) }
      this.world.entities.get(entry.entityId).modify(change)
      this.world.network.send('entityModified', change)
    }
    for (const entry of createdEntries) {
      this.world.entities.get(entry.entityId)?.destroy(true)
    }
    for (const box of removedBoxes) this.world.entities.add(structuredClone(box), true)
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
