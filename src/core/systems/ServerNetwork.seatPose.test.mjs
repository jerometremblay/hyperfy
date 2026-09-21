import assert from 'node:assert/strict'
import Module from 'node:module'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'
import { build } from 'esbuild'
import { seatPoseProfileStorageKey, seatPoseStorageKey } from '../extras/seatPose.js'

const entryPoint = fileURLToPath(new URL('./ServerNetwork.js', import.meta.url))
const bundle = await build({
  entryPoints: [entryPoint],
  bundle: true,
  format: 'cjs',
  platform: 'node',
  write: false,
})
const compiled = new Module(entryPoint)
compiled.filename = entryPoint
compiled.paths = Module._nodeModulePaths(path.dirname(entryPoint))
compiled._compile(bundle.outputFiles[0].text, entryPoint)
const { ServerNetwork } = compiled.exports

const avatarUrl = 'asset://test.vrm'
const pose = { hips: { rotation: [0, 0, 0, 1], position: [0, 0.1, 0] } }

function createFixture({ occupied = true, profileId = null } = {}) {
  const stored = new Map()
  const broadcasts = []
  const replies = []
  const player = {
    isPlayer: true,
    data: {
      id: 'user-1',
      owner: 'user-1',
      userId: 'user-1',
      avatar: avatarUrl,
      effect: occupied ? { anchorId: 'chair:seat' } : null,
    },
    modify(data) {
      const { ef, ...changes } = data
      Object.assign(this.data, changes)
      if (Object.hasOwn(data, 'ef')) this.data.effect = ef
    },
  }
  const world = {
    anchors: {
      get: id => (occupied && id === 'chair:seat' ? {} : null),
      getProfileId: id => (id === 'chair:seat' ? profileId : null),
    },
    storage: {
      get: key => stored.get(key),
      set: (key, value) => stored.set(key, value),
    },
    entities: { get: id => (id === player.data.id ? player : null) },
  }
  const network = new ServerNetwork(world)
  clearInterval(network.socketIntervalId)
  network.send = (...args) => broadcasts.push(args)
  const socket = {
    id: 'user-1',
    player,
    send: (...args) => replies.push(args),
  }
  return { broadcasts, network, player, replies, socket, stored }
}

test('accepts a pose only from its owner while still occupying the claimed seat', () => {
  const { broadcasts, network, player, replies, socket, stored } = createFixture()
  const request = {
    anchorId: 'chair:seat',
    avatarUrl,
    offset: [0.1, 0, -0.2],
    rotation: [0, 0.2, 0, 1],
    pose,
  }

  network.onPlayerSeatPose(socket, request)

  const record = player.data.seatPose
  assert.equal(record.version, 1)
  assert.equal(record.anchorId, 'chair:seat')
  assert.equal(record.avatarUrl, avatarUrl)
  assert.deepEqual(record.offset, request.offset)
  assert.ok(Math.abs(Math.hypot(...record.rotation) - 1) < 1e-10)
  assert.equal(stored.size, 1)
  assert.deepEqual(broadcasts, [['entityModified', { id: 'user-1', seatPose: record }]])
  assert.deepEqual(replies, [['playerSeatPoseResult', { ok: true }]])
})

test('saves an explicit profile default and restores it on another compatible seat', async () => {
  const profileId = 'modular-couch-v1:middle'
  const { broadcasts, network, player, replies, socket, stored } = createFixture({ profileId })
  const request = {
    anchorId: 'chair:seat',
    avatarUrl,
    offset: [0.1, 0, -0.2],
    rotation: [0, 0.2, 0, 1],
    pose,
    profileId,
    saveToProfile: true,
  }

  network.onPlayerSeatPose(socket, request)

  const profileKey = seatPoseProfileStorageKey('user-1', avatarUrl, profileId)
  const savedProfile = stored.get(profileKey)
  assert.equal(savedProfile.version, 1)
  assert.equal(savedProfile.profileId, profileId)
  assert.equal(savedProfile.avatarUrl, avatarUrl)
  assert.deepEqual(savedProfile.offset, request.offset)
  assert.equal(player.data.seatPose.profileId, profileId)
  assert.deepEqual(replies.at(-1), ['playerSeatPoseResult', { ok: true }])

  const nextAnchorId = 'second-chair:middle'
  network.world.anchors.get = id => (id === nextAnchorId ? {} : null)
  network.world.anchors.getProfileId = id => (id === nextAnchorId ? profileId : null)
  await network.onEntityModified(socket, { id: player.data.id, ef: { anchorId: nextAnchorId } })

  assert.equal(player.data.seatPose.anchorId, nextAnchorId)
  assert.equal(player.data.seatPose.profileId, profileId)
  assert.deepEqual(player.data.seatPose.offset, request.offset)
  assert.deepEqual(broadcasts.at(-1)[1].seatPose, player.data.seatPose)
})

test('rejects a client-selected profile that differs from the occupied anchor profile', () => {
  const { network, replies, socket, stored } = createFixture({ profileId: 'approved-profile' })
  network.onPlayerSeatPose(socket, {
    anchorId: 'chair:seat',
    avatarUrl,
    offset: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    pose,
    profileId: 'forged-profile',
    saveToProfile: true,
  })

  assert.equal(stored.size, 0)
  assert.equal(replies[0][1].ok, false)
})

test('restores the matching saved pose when a player sits and informs that player', async () => {
  const { broadcasts, network, player, replies, socket, stored } = createFixture({ occupied: false })
  const record = {
    version: 1,
    anchorId: 'chair:seat',
    avatarUrl,
    offset: [0.1, 0, -0.2],
    rotation: [0, 0, 0, 1],
    pose,
  }
  stored.set(seatPoseStorageKey('user-1', avatarUrl, 'chair:seat'), record)
  network.world.anchors.get = id => (id === 'chair:seat' ? {} : null)

  await network.onEntityModified(socket, { id: 'user-1', ef: { anchorId: 'chair:seat' } })

  assert.deepEqual(player.data.seatPose, record)
  assert.deepEqual(broadcasts, [
    ['entityModified', { id: 'user-1', ef: { anchorId: 'chair:seat' }, seatPose: record }, 'user-1'],
  ])
  assert.deepEqual(replies, [['entityModified', { id: 'user-1', seatPose: record }]])
})

test('rejects forged ownership, stale seats, and users who are no longer seated', () => {
  const first = createFixture()
  first.network.onPlayerSeatPose(
    { ...first.socket, id: 'intruder' },
    {
      anchorId: 'chair:seat',
      avatarUrl,
      offset: [0, 0, 0],
      rotation: [0, 0, 0, 1],
      pose,
    }
  )
  assert.equal(first.stored.size, 0)
  assert.equal(first.replies[0][1].ok, false)

  const second = createFixture()
  second.network.onPlayerSeatPose(second.socket, {
    anchorId: 'other-chair:seat',
    avatarUrl,
    offset: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    pose,
  })
  assert.equal(second.stored.size, 0)
  assert.match(second.replies[0][1].message, /seat changed/i)

  const third = createFixture({ occupied: false })
  third.network.onPlayerSeatPose(third.socket, {
    anchorId: 'chair:seat',
    avatarUrl,
    offset: [0, 0, 0],
    rotation: [0, 0, 0, 1],
    pose,
  })
  assert.equal(third.stored.size, 0)
  assert.match(third.replies[0][1].message, /sitting/i)
})

test('stores private reusable styles by user and upserts names case-insensitively', () => {
  const { network, replies, socket, stored } = createFixture()
  const styleKey = 'seatPoseStyles:user-1'

  network.onPlayerSeatPoseStyles(socket, { action: 'save', name: 'Relaxed', pose })
  network.onPlayerSeatPoseStyles(socket, {
    action: 'save',
    name: 'relaxed',
    pose: { hips: { rotation: [0, 0.3, 0, 1] } },
  })
  assert.equal(stored.get(styleKey).length, 1)
  assert.equal(stored.get(styleKey)[0].name, 'relaxed')
  assert.ok(replies.at(-1)[1].styles[0].pose.hips)

  network.onPlayerSeatPoseStyles(socket, { action: 'list' })
  assert.deepEqual(replies.at(-1)[1].styles, stored.get(styleKey))
  network.onPlayerSeatPoseStyles(socket, { action: 'delete', name: 'RELAXED' })
  assert.deepEqual(stored.get(styleKey), [])
})
