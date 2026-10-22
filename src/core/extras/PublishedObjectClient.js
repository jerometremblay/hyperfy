import { cloneDeep } from 'lodash-es'
import { storage } from '../storage'
import { publishedExpectation } from './publishedObjects'
import { stageAppReplacement, waitForReplacement } from './appTools'

// Small client coordinator; all provenance and commit decisions belong to the server.
export class PublishedObjectClient {
  constructor(world) {
    this.world = world
    this.busy = new Set()
  }
  async request(operation, data) {
    if (!this.world.builder.canBuild()) throw new Error('Builder permission is required.')
    const response = await fetch(`${this.world.network.apiUrl}/published/${operation}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${storage.get('authToken')}` },
      body: JSON.stringify(data),
      signal: AbortSignal.timeout(60000),
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error || `Published object request failed (${response.status}).`)
    return result
  }
  async link(app, url) {
    const result = await this.request('link', {
      id: app.data.id,
      url,
      expected: publishedExpectation(app, this.world.blueprints),
    })
    // Broadcast and acknowledgement can arrive in either order; metadata-only application is idempotent.
    if (!app.destroyed && (app.data.publishedRevision || 0) <= result.change.publishedRevision)
      app.modify(result.change)
    return result
  }
  check(url, force = false) {
    return this.request('check', { url, force })
  }
  async install(app, url, transform) {
    const key = app?.data.id || '$import'
    if (this.busy.has(key)) throw new Error('An installation is already in progress.')
    this.busy.add(key)
    if (app) app.publishedInstalling = true
    const expected = app && publishedExpectation(app, this.world.blueprints)
    const check = () => {
      if (!this.world.builder.canBuild()) throw new Error('Builder permission is required.')
      if (
        app &&
        (app.destroyed ||
          this.world.entities.get(app.data.id) !== app ||
          app.data.mover ||
          app.data.uploader ||
          publishedExpectation(app, this.world.blueprints) !== expected)
      )
        throw new Error('This app changed during installation. Retry.')
    }
    let rollback
    let preparedToken
    let committing = false
    let created
    try {
      check()
      const input = app ? { id: app.data.id, expected } : { url, ...transform }
      let prepared = await this.request('prepare', input)
      check()
      if (prepared.current) {
        this.world.emit('toast', 'Already up to date.')
        return
      }
      if (prepared.confirmation) {
        const confirmed = await this.world.ui.confirm({
          title: 'Install from source',
          message: `${prepared.confirmation} Undo restores the object, but cannot reverse external script side effects.`,
          confirmText: 'Replace implementation',
          cancelText: 'Cancel',
        })
        if (!confirmed) return
        check()
        prepared = await this.request('prepare', { ...input, confirm: true })
        check()
        if (prepared.current) return
      }
      preparedToken = prepared.token
      const { blueprint, change } = prepared
      const assets = []
      if (blueprint.model && blueprint.model !== 'script-only')
        assets.push([
          /\.(ply|splat|ksplat|spz)$/.test(blueprint.model)
            ? 'splat'
            : blueprint.model.endsWith('.vrm')
              ? 'avatar'
              : 'model',
          blueprint.model,
        ])
      if (blueprint.script) assets.push(['script', blueprint.script])
      if (blueprint.image?.url) assets.push(['texture', blueprint.image.url])
      for (const value of Object.values(blueprint.props || {})) if (value?.url) assets.push([value.type, value.url])
      await waitForReplacement(Promise.all(assets.map(([type, asset]) => this.world.loader.load(type, asset))))
      check()
      if (app)
        rollback = await stageAppReplacement(
          this.world,
          app,
          blueprint,
          { id: change.id, blueprint: change.blueprint, state: change.state },
          check
        )
      else {
        this.world.blueprints.add(blueprint)
        created = this.world.entities.add(cloneDeep(change))
        await waitForReplacement(created.buildPromise)
        if (created.scriptError || created.loadError) throw new Error('The app failed to load.')
      }
      // Commit is idempotent: an acknowledgement lost in transit can be recovered with the same token.
      let result
      committing = true
      try {
        result = await this.request('commit', { token: prepared.token, stateSnapshot: rollback?.state })
      } catch (error) {
        if (error instanceof TypeError || error.name === 'TimeoutError')
          result = await this.request('commit', { token: prepared.token, stateSnapshot: rollback?.state })
        else throw error
      }
      if (app) app.modify({ published: result.change.published, publishedRevision: result.change.publishedRevision })
      if (result.undoToken)
        this.world.builder.addUndo({ name: 'published-update', token: result.undoToken, entityId: app.data.id })
      if (result.created) created = null
      rollback = null
      this.world.emit('appChanged', app || this.world.entities.get(change.id))
      this.world.emit(
        'toast',
        `Object ${app ? 'updated. Use Undo to restore the previous version.' : 'imported.'}${prepared.reset?.length ? ` Reset/removed properties: ${prepared.reset.join(', ')}.` : ''}`
      )
      if (result.warning) this.world.emit('toast', result.warning)
      return result
    } catch (error) {
      if (preparedToken && !committing) await this.request('cancel', { token: preparedToken }).catch(() => {})
      if (rollback) await rollback()
      if (created && !created.destroyed) created.destroy()
      throw error
    } finally {
      this.busy.delete(key)
      if (app) app.publishedInstalling = false
    }
  }
  async undo(action) {
    const app = this.world.entities.get(action.entityId)
    if (!app || app.destroyed) throw new Error('The object is no longer available.')
    const result = await this.request('undo', { token: action.token })
    this.world.blueprints.add(result.blueprint)
    await app.modify(result.change)
    this.world.emit('appChanged', app)
    if (app.scriptError || app.loadError)
      this.world.emit(
        'toast',
        'Undo was restored on the server, but this client could not load it. Reconnect to retry.'
      )
  }
}
