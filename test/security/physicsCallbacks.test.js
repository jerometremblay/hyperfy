// Adapted from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/test/physicsCallbacks.test.js
import assert from 'node:assert/strict'
import { before, after, test } from 'node:test'
import { bundleRealPhysx, runRealPhysx } from './lib/realPhysx.mjs'

let bundle
before(async () => {
  bundle = await bundleRealPhysx()
})
after(() => bundle?.destroy())

const probe = (name, fn, args) => test(name, () => runRealPhysx(bundle, fn, args))

probe('real PhysX: SES contact mutation survives 700 begin/end cycles', ({ body, move, step, healthy }) => {
  let begins = 0
  let ends = 0
  const handler = new Compartment({ seen: () => begins++ }).evaluate(`
    (event) => { seen(); event.contacts[0].position = {} }
  `)
  body('RigidBody', { type: 'static', onContactStart: handler, onContactEnd: () => ends++ })
  const moving = body('RigidBody', { position: [1.5, 0, 0] })
  for (let i = 0; i < 700; i++) {
    move(moving, 1.5)
    step()
    move(moving, 10)
    step()
  }
  assert.equal(begins, 700)
  assert.equal(ends, 700)
  healthy()
})

probe(
  'real PhysX: recipients have independent vectors, arrays and snapshotted callbacks/metadata',
  ({ body, step, healthy }) => {
    const seen = []
    const receivers = []
    let replacementCalls = 0
    function receive(event) {
      receivers.push(this)
      seen.push(event)
      if (seen.length === 1) {
        event.contacts[0].position = {}
        event.contacts[0].normal.x = 12345
        event.contacts[0].impulse.y = 12345
        event.contacts.push({ poisoned: true })
        a.tag = b.tag = 'changed'
        a.onContactStart = b.onContactStart = () => replacementCalls++
      }
    }
    const a = body('RigidBody', { type: 'static', tag: 'a', onContactStart: receive })
    const b = body('RigidBody', { tag: 'b', position: [1.5, 0, 0], onContactStart: receive })
    step()
    assert.equal(seen.length, 2)
    assert.deepEqual(receivers, [undefined, undefined])
    assert.notEqual(seen[0], seen[1])
    assert.notEqual(seen[0].contacts, seen[1].contacts)
    assert.ok(Number.isFinite(seen[1].contacts[0].position.x))
    assert.notEqual(seen[1].contacts[0].normal.x, 12345)
    assert.notEqual(seen[1].contacts[0].impulse.y, 12345)
    assert.equal(seen[1].contacts.at(-1).poisoned, undefined)
    assert.deepEqual(seen.map(e => e.tag).sort(), ['a', 'b'])
    assert.equal(replacementCalls, 0)
    healthy()
  }
)

probe('real PhysX: retained contact and end events are never cleared or reused', ({ body, move, step, healthy }) => {
  const starts = []
  const ends = []
  body('RigidBody', { type: 'static', onContactStart: e => starts.push(e), onContactEnd: e => ends.push(e) })
  const moving = body('RigidBody', { position: [1.5, 0, 0] })
  step()
  const snapshot = JSON.stringify(starts[0])
  move(moving, 10)
  step()
  assert.equal(ends.length, 1)
  assert.deepEqual(ends[0].contacts, [])
  move(moving, 1.5)
  step()
  assert.equal(starts.length, 2)
  assert.equal(JSON.stringify(starts[0]), snapshot)
  assert.notEqual(starts[0], starts[1])
  assert.deepEqual(ends[0].contacts, [])
  healthy()
})

probe(
  'real PhysX: synthetic FIFO precedes simulate; contact FIFO/0/1 then triggers follow fetch before sampling',
  ({ body, root, step, physics, callbacks, PHYSX }) => {
    const trace = []
    const removed = body('RigidBody', { type: 'static', tag: 'removed' })
    body('RigidBody', { tag: 'survivor', position: [1.5, 0, 0], onContactEnd: () => trace.push('synthetic') })
    step()
    trace.length = 0
    root.remove(removed)
    assert.deepEqual(trace, [])
    const expected = []
    const onContact = callbacks.simulation.onContact
    callbacks.simulation.onContact = (header, pairs, count) => {
      const h = PHYSX.wrapPointer(header, PHYSX.PxContactPairHeader)
      const handles = [0, 1].map(i => physics.handles.get(h.get_actors(i).ptr))
      if (handles.every(Boolean)) {
        for (let i = 0; i < count; i++) {
          const pair = PHYSX.NativeArrayHelpers.prototype.getContactPairAt(pairs, i)
          if (pair.events.isSet(PHYSX.PxPairFlagEnum.eNOTIFY_TOUCH_FOUND)) {
            expected.push(...handles.map(handle => handle.tag))
          }
        }
      }
      onContact(header, pairs, count)
    }
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        const tag = `${i}:${j}`
        body('RigidBody', { position: [20 + i * 10 + j * 1.5, 0, 0], tag, onContactStart: () => trace.push(tag) })
      }
    }
    body('RigidBody', {
      type: 'static',
      trigger: true,
      position: [50, 0, 0],
      onTriggerEnter: () => trace.push('trigger'),
    })
    body('RigidBody', { position: [50, 0, 0] })
    const simulate = physics.scene.simulate.bind(physics.scene)
    const fetch = physics.scene.fetchResults.bind(physics.scene)
    physics.scene.simulate = delta => {
      trace.push('simulate')
      return simulate(delta)
    }
    physics.scene.fetchResults = block => {
      const result = fetch(block)
      trace.push('fetch')
      return result
    }
    const sample = PHYSX.SupportFunctions.prototype.PxScene_getActiveActors
    PHYSX.SupportFunctions.prototype.PxScene_getActiveActors = function (scene) {
      trace.push('sample')
      return sample.call(this, scene)
    }
    step()
    assert.equal(expected.length, 4)
    assert.deepEqual(trace, ['synthetic', 'simulate', 'fetch', ...expected, 'trigger', 'sample'])
  }
)

probe(
  'real PhysX: contact extraction is capped at 64 and preserves native normal orientation',
  ({ body, step, PHYSX }) => {
    const seen = []
    const normals = []
    const read = PHYSX.PxContactPair.prototype.extractContacts
    const limits = []
    PHYSX.PxContactPair.prototype.extractContacts = function (buffer, limit) {
      limits.push(limit)
      const count = read.call(this, buffer, limit)
      const points = buffer
      normals.push([points.normal.x, points.normal.y, points.normal.z])
      return count
    }
    body('RigidBody', { type: 'static', onContactStart: e => seen.push(e) })
    body('RigidBody', { position: [1.5, 0, 0], onContactStart: e => seen.push(e) })
    step()
    assert.deepEqual(limits, [64])
    assert.equal(seen.length, 2)
    assert.ok(seen[0].contacts.length > 0 && seen[0].contacts.length <= 64)
    for (const event of seen) assert.deepEqual(event.contacts[0].normal.toArray(), normals[0])
    // Retained normals must not be shared even though their orientation stays identical.
    assert.notEqual(seen[0].contacts[0].normal, seen[1].contacts[0].normal)
  }
)

for (const kind of ['RigidBody', 'Prim', 'Controller']) {
  for (const trigger of [false, true]) {
    probe(
      `real PhysX: ${kind} deferred ${trigger ? 'trigger leave' : 'contact end'} removal preserves siblings`,
      ({ B, body, root, step, physics, handleOf, healthy }, { kind, trigger }) => {
        let entered = 0
        let left = 0
        let duringRemoval = false
        const synchronous = []
        const events = []
        const a = body(kind, { tag: 'a' })
        const h = handleOf(a)
        const sibling = new B.Node()
        root.add(sibling)
        const b = body('RigidBody', {
          trigger,
          position: [kind === 'Controller' ? 1 : 1.5, 0, 0],
          onContactStart: () => entered++,
          onTriggerEnter: () => entered++,
          [trigger ? 'onTriggerLeave' : 'onContactEnd']: event => {
            left++
            synchronous.push(duringRemoval)
            if (left === 1) root.remove(a)
            events.push(event)
          },
        })
        step()
        assert.equal(entered, 1)
        const destroy = a.actorHandle.destroy
        duringRemoval = true
        root.remove(a)
        duringRemoval = false
        assert.equal(left, 0, 'no script dispatch on the teardown stack')
        assert.equal(physics.handles.has(h.actor.ptr), false)
        assert.equal(physics.active.has(h), false)
        destroy()
        assert.equal(a.parent, null)
        assert.equal(a.actorHandle, null)
        if (kind === 'Controller') assert.equal(a.controller, null)
        else assert.equal(a.actor, null)
        if (kind === 'Prim') {
          assert.equal(a.shape, null)
          assert.equal(a._tm, null)
        }
        assert.ok(root.children.includes(sibling))
        assert.equal(sibling.parent, root)
        assert.equal(sibling.mounted, true)
        step()
        assert.equal(left, 1)
        assert.deepEqual(synchronous, [false])
        assert.equal(events[0].tag, 'a')
        assert.ok(root.children.includes(sibling))
        assert.equal(sibling.parent, root)
        root.remove(b)
        step(2)
        assert.equal(left, 1, 'no stale synthetic/native trigger leave')
        healthy()
      },
      { kind, trigger }
    )
  }
}

probe(
  'real PhysX: synthetic trigger leaves snapshot local-player metadata and retained events',
  ({ body, root, step, handleOf, healthy }) => {
    const leaves = []
    body('RigidBody', { type: 'static', trigger: true, onTriggerLeave: e => leaves.push(e) })
    const a = body('Controller', { position: [0, 0, 0], tag: 'local-player' })
    handleOf(a).playerId = 'local'
    step()
    root.remove(a)
    step()
    const snapshot = JSON.stringify(leaves[0])
    assert.deepEqual(leaves[0], { tag: 'local-player', playerId: 'local', isLocalPlayer: true })
    const b = body('Controller', { position: [0, 0, 0], tag: 'remote-player' })
    handleOf(b).playerId = 'remote'
    step()
    root.remove(b)
    step()
    assert.equal(leaves.length, 2)
    assert.equal(leaves[1].isLocalPlayer, false)
    assert.notEqual(leaves[0], leaves[1])
    assert.equal(JSON.stringify(leaves[0]), snapshot)
    healthy()
  }
)

probe(
  'real PhysX: removing a trigger clears membership in surviving entrants',
  ({ body, root, step, handleOf, healthy }) => {
    let leaves = 0
    const trigger = body('RigidBody', { type: 'static', trigger: true, onTriggerLeave: () => leaves++ })
    const entrant = body('Controller')
    step()
    const h = handleOf(entrant)
    assert.equal(h.triggeredHandles.size, 1)
    root.remove(trigger)
    assert.equal(h.triggeredHandles.size, 0)
    root.remove(entrant)
    step(2)
    assert.equal(leaves, 0)
    healthy()
  }
)

probe(
  'real PhysX: synthetic callbacks enqueued during a drain wait for the next invocation',
  ({ body, root, step }) => {
    const seen = []
    const a = body('RigidBody', { type: 'static' })
    const c = body('RigidBody', { type: 'static', position: [20, 0, 0] })
    body('RigidBody', {
      position: [1.5, 0, 0],
      onContactEnd: () => {
        seen.push('first')
        root.remove(c)
      },
    })
    body('RigidBody', { position: [21.5, 0, 0], onContactEnd: () => seen.push('next') })
    step()
    root.remove(a)
    assert.deepEqual(seen, [])
    step()
    assert.deepEqual(seen, ['first'])
    step()
    assert.deepEqual(seen, ['first', 'next'])
  }
)

for (const kind of ['RigidBody', 'Prim', 'Controller']) {
  for (const action of ['remove', 'remount', 'rebuild', 'pointer reuse']) {
    probe(
      `real PhysX: queued recipient ${kind} is dropped after ${action}`,
      ({ body, root, step, physics, handleOf, entity, healthy }, { kind, action }) => {
        let calls = 0
        const recipient = body(kind, { onContactEnd: () => calls++ })
        const removed = body('RigidBody', { type: 'dynamic', position: [kind === 'Controller' ? 1 : 1.5, 0, 0] })
        step()
        const oldHandle = handleOf(recipient)
        assert.equal(oldHandle.contactedHandles.size, 1, 'real contact established')
        const ptr = oldHandle.actor.ptr
        root.remove(removed)
        assert.equal(calls, 0, 'queued until the next step')
        if (action === 'remove') root.remove(recipient)
        if (action === 'remount') {
          recipient.deactivate()
          recipient.activate()
        }
        if (action === 'rebuild') {
          // App.unbuild's existing hook is the script-run identity, not the app id.
          entity.deadHook.dead = true
          entity.deadHook = { dead: false }
        }
        if (action === 'pointer reuse') {
          root.remove(recipient)
          let replacement
          for (let i = 0; i < 100; i++) {
            replacement = body(kind, { position: [30, 0, 0] })
            if (handleOf(replacement).actor.ptr === ptr) break
            root.remove(replacement)
          }
          assert.equal(handleOf(replacement).actor.ptr, ptr, 'real allocator reused the original actor address')
          assert.notEqual(physics.handles.get(ptr), oldHandle)
        }
        step()
        assert.equal(calls, 0, 'old recipient/run must not execute')
        healthy()
      },
      { kind, action }
    )
  }
}

for (const kind of ['RigidBody', 'Prim', 'Controller']) {
  probe(
    `real PhysX: earlier normal recipient removes later ${kind} recipient`,
    ({ body, root, step, healthy }, kind) => {
      let calls = 0
      let first = false
      const a = body(kind)
      const b = body('RigidBody', { position: [kind === 'Controller' ? 1 : 1.5, 0, 0] })
      // Both participants remove the other, so the actual native 0/1 ordering is immaterial.
      const removeOther = other => () => {
        calls++
        if (!first) {
          first = true
          root.remove(other)
        }
      }
      a.onContactStart = removeOther(b)
      b.onContactStart = removeOther(a)
      step()
      assert.equal(calls, 1)
      healthy()
    },
    kind
  )
}

for (const kind of ['RigidBody', 'Prim', 'Controller']) {
  for (const trigger of [false, true]) {
    probe(
      `real PhysX: queued ${kind} ${trigger ? 'trigger leave' : 'contact end'} can rebuild an App`,
      async ({ B, world, body, step, healthy }, { kind, trigger }) => {
        world.loader = { get: () => ({ toNodes: () => new B.Node() }) }
        const app = new B.App(world, { id: 'rebuilt', blueprint: 'bp', state: {} })
        await Promise.resolve()
        const originalRun = app.deadHook
        const a = body(kind, {}, app.root)
        const sibling = new B.Node()
        app.root.add(sibling)
        let builds = 0
        body('RigidBody', {
          position: [kind === 'Controller' ? 1 : 1.5, 0, 0],
          trigger,
          [trigger ? 'onTriggerLeave' : 'onContactEnd']: () => {
            builds++
            app.build()
          },
        })
        step()
        app.root.remove(a)
        assert.equal(builds, 0)
        assert.ok(app.root.children.includes(sibling))
        step()
        await Promise.resolve()
        assert.equal(builds, 1)
        assert.equal(originalRun.dead, true)
        assert.notEqual(app.deadHook, originalRun)
        assert.equal(sibling.mounted, false)
        healthy()
      },
      { kind, trigger }
    )
  }
}

probe(
  'real PhysX: native callback failures are contained, bounded, classified and logged after fetch',
  ({ step, callbacks, physics, PHYSX, healthy }) => {
    const logs = []
    const log = console.error
    console.error = (...args) => logs.push(args)
    const bad = new Proxy(
      {},
      {
        getPrototypeOf() {
          throw null
        },
      }
    )
    const wrap = PHYSX.wrapPointer
    PHYSX.wrapPointer = () => {
      throw bad
    }
    for (let i = 0; i < 100; i++) {
      assert.doesNotThrow(() => callbacks.simulation.onContact(0, 0, 0))
      assert.doesNotThrow(() => callbacks.simulation.onTrigger(0, 0))
      assert.equal(callbacks.query.simplePreFilter(0, 0), PHYSX.PxQueryHitType.eNONE)
    }
    PHYSX.wrapPointer = wrap
    assert.equal(physics.callbackFailures.length, 32)
    assert.equal(logs.length, 0)
    step()
    assert.equal(physics.callbackFailures.length, 0)
    assert.equal(logs.length, 3)
    assert.ok(logs.every(args => args.length === 1 && typeof args[0] === 'string'))
    const errors = [new WebAssembly.RuntimeError('secret'), { name: 'RuntimeError' }, null, 42]
    const recorded = []
    const hook = physics.handleContainedCallbackFailures.bind(physics)
    physics.handleContainedCallbackFailures = failures => {
      recorded.push(...failures)
      hook(failures)
    }
    for (const error of errors) {
      PHYSX.wrapPointer = () => {
        throw error
      }
      callbacks.simulation.onContact(0, 0, 0)
      PHYSX.wrapPointer = wrap
      step()
    }
    assert.deepEqual(
      recorded.map(f => f.runtimeError),
      [true, false, false, false]
    )
    assert.equal(logs.length, 4, 'same phase/class logs once')
    assert.ok(!JSON.stringify(logs).includes('secret'))
    console.error = log
    healthy()
  }
)

probe('real PhysX: all binding callback slots have safe explicit defaults', ({ callbacks, PHYSX }) => {
  assert.equal(callbacks.simulation.onWake(0, 0), undefined)
  assert.equal(callbacks.simulation.onSleep(0, 0), undefined)
  assert.equal(callbacks.simulation.onConstraintBreak(0, 0), undefined)
  assert.equal(callbacks.query.simplePostFilter(0, 0), PHYSX.PxQueryHitType.eNONE)
  assert.equal(callbacks.cct.filter(0, 0), true)
})

probe(
  'real PhysX: failing real controller prefilter returns safely and drains after move',
  ({ body, B, PHYSX, physics, healthy }) => {
    body('RigidBody', { type: 'static', position: [1, 0, 0] })
    const controller = body('Controller', { position: [-2, 0, 0] })
    const read = PHYSX.PxShape.prototype.getQueryFilterData
    let calls = 0
    let inMove = false
    const log = console.error
    const loggedDuringMove = []
    console.error = () => loggedDuringMove.push(inMove)
    PHYSX.PxShape.prototype.getQueryFilterData = () => {
      calls++
      throw new Error('filter fault')
    }
    const move = controller.controller.move.bind(controller.controller)
    controller.controller.move = (...args) => {
      inMove = true
      try {
        return move(...args)
      } finally {
        inMove = false
      }
    }
    controller.move(new B.THREE.Vector3(4, 0, 0))
    PHYSX.PxShape.prototype.getQueryFilterData = read
    console.error = log
    assert.ok(calls > 0, 'native controller move entered the JS filter')
    assert.deepEqual(loggedDuringMove, [false])
    assert.equal(physics.callbackFailures.length, 0)
    healthy()
  }
)

probe('real PhysX: each normal contact-end recipient gets its own empty array', ({ body, move, step }) => {
  const seen = []
  const lengths = []
  const receive = event => {
    lengths.push(event.contacts.length)
    seen.push(event)
    event.contacts.push('script-only')
  }
  body('RigidBody', { type: 'static', onContactEnd: receive })
  const moving = body('RigidBody', { position: [1.5, 0, 0], onContactEnd: receive })
  step()
  move(moving, 10)
  step()
  assert.deepEqual(lengths, [0, 0])
  assert.notEqual(seen[0].contacts, seen[1].contacts)
})

probe(
  'real PhysX: normal trigger events are fresh, retained, and have no receiver',
  ({ body, move, step, handleOf }) => {
    const events = []
    const receivers = []
    const receive = function (event) {
      receivers.push(this)
      events.push(event)
    }
    body('RigidBody', { type: 'static', trigger: true, onTriggerEnter: receive, onTriggerLeave: receive })
    const entrant = body('RigidBody', { tag: 'entrant' })
    Object.defineProperty(handleOf(entrant), 'playerId', { value: 'local' })
    step()
    assert.equal(events.length, 1)
    events[0].tag = 'script mutation'
    move(entrant, 10)
    step()
    assert.equal(events.length, 2)
    assert.notEqual(events[0], events[1])
    assert.equal(events[0].tag, 'script mutation')
    assert.deepEqual(events[1], { tag: 'entrant', playerId: 'local', isLocalPlayer: true })
    assert.deepEqual(receivers, [undefined, undefined])
  }
)

probe(
  'real PhysX: contact removal suppresses a later normal trigger recipient',
  ({ body, root, step, healthy, callbacks }) => {
    let calls = 0
    let nativeTriggers = 0
    const onTrigger = callbacks.simulation.onTrigger
    callbacks.simulation.onTrigger = (...args) => {
      nativeTriggers += args[1]
      onTrigger(...args)
    }
    let removals = 0
    const trigger = body('RigidBody', {
      type: 'static',
      trigger: true,
      position: [20, 0, 0],
      onTriggerEnter: () => calls++,
    })
    body('RigidBody', { position: [20, 0, 0] })
    body('RigidBody', {
      type: 'static',
      onContactStart: () => {
        removals++
        root.remove(trigger)
      },
    })
    body('RigidBody', { position: [1.5, 0, 0] })
    step()
    assert.equal(removals, 1)
    assert.equal(nativeTriggers, 1)
    assert.equal(calls, 0)
    healthy()
  }
)

probe('real PhysX: synthetic FIFO drops a later recipient removed by the first', ({ body, root, step }) => {
  const order = []
  const a = body('RigidBody', { type: 'static' })
  const c = body('RigidBody', { type: 'static', position: [20, 0, 0] })
  body('RigidBody', {
    position: [1.5, 0, 0],
    onContactEnd: () => {
      order.push('first')
      root.remove(d)
    },
  })
  const d = body('RigidBody', { position: [21.5, 0, 0], onContactEnd: () => order.push('removed') })
  step()
  root.remove(a)
  root.remove(c)
  assert.deepEqual(order, [])
  step()
  assert.deepEqual(order, ['first'])
})

for (const trigger of [false, true]) {
  probe(
    `real PhysX: an injected ${trigger ? 'trigger' : 'contact'} copy-out failure cannot unwind fetchResults`,
    ({ body, physics, step, PHYSX, healthy }, trigger) => {
      body('RigidBody', { type: 'static', trigger })
      body('RigidBody', { position: [1.5, 0, 0] })
      const method = trigger ? 'getTriggerPairAt' : 'getContactPairAt'
      const helpers = PHYSX.NativeArrayHelpers.prototype
      const original = helpers[method]
      let calls = 0
      helpers[method] = () => {
        calls++
        throw new WebAssembly.RuntimeError('injected native failure')
      }
      const logs = []
      const error = console.error
      let fetching = false
      console.error = line => logs.push({ fetching, line })
      const fetch = physics.scene.fetchResults.bind(physics.scene)
      physics.scene.fetchResults = (...args) => {
        fetching = true
        try {
          return fetch(...args)
        } finally {
          fetching = false
        }
      }
      step()
      helpers[method] = original
      console.error = error
      assert.equal(calls, 1)
      assert.equal(logs.length, 1)
      assert.equal(logs[0].fetching, false)
      assert.ok(logs[0].line.includes('native failure'))
      healthy()
    },
    trigger
  )
}
