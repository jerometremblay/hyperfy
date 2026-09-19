import assert from 'node:assert/strict'
import test from 'node:test'

import { getAddableBlueprints } from './addableBlueprints.js'

test('includes installed world blueprints in the add catalog', () => {
  const builtIn = { id: 'model', name: 'Model' }
  const spiralClimb = { id: 'spiral-climb-prototype', name: 'Spiral Climb' }

  const world = {
    collections: {
      get(id) {
        assert.equal(id, 'default')
        return { blueprints: [builtIn] }
      },
    },
    blueprints: {
      serialize() {
        return [
          builtIn,
          spiralClimb,
          { id: '$scene', scene: true },
          { id: 'disabled-app', disabled: true },
        ]
      },
    },
  }

  assert.deepEqual(
    getAddableBlueprints(world).map(blueprint => blueprint.id),
    ['model', 'spiral-climb-prototype']
  )
})
