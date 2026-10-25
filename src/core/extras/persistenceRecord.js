// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/persistenceRecord.js
import { cloneDeep } from 'lodash-es'

export function appPersistenceData(data, change = {}) {
  // Never read or traverse script state, including node proxies and their native getters.
  const record = { state: null }
  for (const key of [
    'id',
    'type',
    'blueprint',
    'position',
    'quaternion',
    'scale',
    'mover',
    'uploader',
    'pinned',
    'spawnedBy',
  ]) {
    record[key] = Object.prototype.hasOwnProperty.call(change, key) ? change[key] : data[key]
  }
  return record
}

export function persistenceRecord(data) {
  return { id: data.id, data: JSON.stringify(cloneDeep(data)) }
}
