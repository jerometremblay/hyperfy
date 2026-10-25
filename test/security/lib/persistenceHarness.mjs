// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/lib/persistenceHarness.mjs
import fs from 'node:fs'
import path from 'node:path'
import { EventEmitter } from 'node:events'
import moment from 'moment'
import * as entityPolicy from '../../../src/core/extras/entityModifyPolicy.js'
import * as blueprintPolicy from '../../../src/core/extras/blueprintPolicy.js'
import * as settingsPolicy from '../../../src/core/extras/settingsPolicy.js'
import { appPersistenceData, persistenceRecord } from '../../../src/core/extras/persistenceRecord.js'
import { createInboundGate, createInboundScheduler } from '../../../src/core/extras/inboundPolicy.js'
import { createWriteLedger } from '../../../src/core/extras/writeLedger.js'
import { briefError, createLogOnce } from '../../../src/core/extras/logOnce.js'
import { cloneDeep } from 'lodash-es'
import { createRelayDrop } from '../../../src/core/extras/playerRelayPolicy.js'
import { uuid } from '../../../src/core/utils.js'

class System extends EventEmitter {
  constructor(world) {
    super()
    this.world = world
  }
}

export function source(file) {
  return fs.readFileSync(
    process.env.REAL_PHYSX_SOURCE_ROOT
      ? path.join(process.env.REAL_PHYSX_SOURCE_ROOT, 'src', file)
      : new URL(`../../src/${file}`, import.meta.url),
    'utf8'
  )
}

export function load(file, name, extra = {}) {
  const dependencies = {
    System,
    App: class {},
    PlayerLocal: class {},
    PlayerRemote: class {},
    moment,
    cloneDeep,
    appPersistenceData,
    persistenceRecord,
    createInboundGate,
    createInboundScheduler,
    createWriteLedger,
    createRelayDrop,
    uuid,
    createLogOnce,
    briefError,
    ...entityPolicy,
    ...blueprintPolicy,
    ...settingsPolicy,
    ...extra,
  }
  const code = source(file)
    .replace(/^import[\s\S]*?from ['"][^'"]+['"]\n/gm, '')
    .replace(/^export /gm, '')
  return new Function(...Object.keys(dependencies), `${code}\nreturn ${name}`)(...Object.values(dependencies))
}

export const Network = load('core/systems/ServerNetwork.js', 'ServerNetwork')
export const Settings = load('core/systems/Settings.js', 'Settings')
export const Entities = load('core/systems/Entities.js', 'Entities')

export const appData = () => ({
  id: 'app',
  type: 'app',
  blueprint: 'bp',
  position: [0, 0, 0],
  quaternion: [0, 0, 0, 1],
  scale: [1, 1, 1],
  mover: null,
  uploader: null,
  pinned: false,
  state: {},
})

export function deferred() {
  let resolve
  const promise = new Promise(r => {
    resolve = r
  })
  return { promise, resolve }
}

export function database() {
  const tables = { entities: new Map(), blueprints: new Map(), config: new Map() }
  const writes = []
  let pause
  const write = async (table, row, remove = false) => {
    const entry = { table, row: { ...row }, remove }
    writes.push(entry)
    if (pause && pause.table === table) {
      const held = pause
      pause = null
      held.started.resolve(entry)
      await held.release.promise
    }
    if (remove) tables[table].delete(row.id)
    else tables[table].set(row.id ?? row.key, { ...row })
  }
  const db = table => ({
    insert: row => ({ onConflict: () => ({ merge: () => write(table, row) }) }),
    where: (key, id) => ({ delete: () => write(table, { id }, true), first: async () => tables[table].get(id) }),
  })
  db.pause = table => {
    pause = { table, started: deferred(), release: deferred() }
    return pause
  }
  return { db, tables, writes }
}

export function fixture(t, db = database().db) {
  const world = { server: { destroy() {} } }
  const network = new Network(world)
  world.network = network
  t.after(() => network.stopForFatal())
  network.db = db
  network.spawn = { position: [0, 0, 0], quaternion: [0, 0, 0, 1] }
  world.settings = new Settings(world)
  network.loadedConfig?.set('spawn', JSON.stringify(network.spawn))
  network.loadedConfig?.set('settings', JSON.stringify(world.settings.serialize()))
  world.settings.on('change', network.saveSettings)
  world.entities = new Entities(world)
  world.entities.add = data => {
    const entity = { data, isApp: true, modify: change => Object.assign(data, change), destroy() {} }
    world.entities.items.set(data.id, entity)
    return entity
  }
  const blueprints = new Map([['bp', { id: 'bp', version: 0, props: { n: 0 } }]])
  world.blueprints = {
    get: id => blueprints.get(id),
    canFit: () => true,
    add: data => blueprints.set(data.id, data),
    modify: change => blueprints.set(change.id, { ...blueprints.get(change.id), ...change }),
  }
  const entity = world.entities.add(appData())
  const socket = { id: 'builder', player: { isBuilder: () => true, isAdmin: () => true, data: appData() }, send() {} }
  network.send = () => {}
  const exits = []
  const fatal = source('core/World.js').match(/^ {2}fatal\(reason\) \{[^]*?^ {2}}/m)[0]
  const Fatal = new Function('getPhysicsTrapCount', 'process', `return class { ${fatal} }`)(() => 0, {
    exit: code => exits.push(code),
  })
  world.fatal = Fatal.prototype.fatal
  return { network, world, entity, socket, exits }
}
