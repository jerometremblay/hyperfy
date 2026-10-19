import assert from 'node:assert/strict'
import test from 'node:test'

import { getServerProvidedBlueprints } from './addableBlueprints.js'

test('lists server collection blueprints without adding installed world blueprints', () => {
  const builtIn = { id: 'model', name: 'Model' }
  const serverProvided = { id: 'tree', name: 'Tree' }

  const world = {
    collections: {
      serialize() {
        return [
          { id: 'default', blueprints: [builtIn] },
          { id: 'nature', blueprints: [serverProvided] },
        ]
      },
    },
    blueprints: {
      serialize() {
        return [
          { id: 'installed-in-world', name: 'World Object' },
        ]
      },
    },
  }

  assert.deepEqual(
    getServerProvidedBlueprints(world).map(blueprint => blueprint.id),
    ['model', 'tree']
  )
})
