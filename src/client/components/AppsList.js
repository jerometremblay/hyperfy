import { css } from '@firebolt-dev/css'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  BoxIcon,
  BrickWallIcon,
  CrosshairIcon,
  EyeIcon,
  EyeOffIcon,
  FileCode2Icon,
  HardDriveIcon,
  HashIcon,
  OctagonXIcon,
  Rows3Icon,
  SettingsIcon,
  TriangleIcon,
} from 'lucide-react'

import { cls } from './cls'
import { orderBy } from 'lodash-es'
import { formatBytes } from '../../core/extras/formatBytes'

const defaultStats = {
  geometries: 0,
  triangles: 0,
  textureBytes: 0,
  fileBytes: 0,
}

export function AppsList({ world, query, perf, hidden, refresh, setRefresh }) {
  const [sort, setSort] = useState('count')
  const [asc, setAsc] = useState(false)
  const [target, setTarget] = useState(null)
  const [, setProfileVersion] = useState(0)
  useEffect(() => {
    world.profiler.setAppsView(perf && !hidden)
    return () => world.profiler.setAppsView(false)
  }, [world, perf, hidden])
  useEffect(() => {
    if (!perf) return
    const update = () => setProfileVersion(n => n + 1)
    world.profiler.on('change', update)
    return () => world.profiler.off('change', update)
  }, [world, perf])
  let items = useMemo(() => {
    const itemMap = new Map() // id -> { blueprint, count }
    let items = []
    for (const [_, entity] of world.entities.items) {
      if (!entity.isApp) continue
      const blueprint = world.blueprints.get(entity.data.blueprint)
      if (!blueprint) continue // still loading?
      if (!blueprint.model) continue // corrupt app?
      let item = itemMap.get(blueprint.id)
      if (!item) {
        let count = 0
        const type = blueprint.model.endsWith('.vrm') ? 'avatar' : 'model'
        const model = world.loader.get(type, blueprint.model)
        const stats = model?.getStats() || defaultStats
        const name = blueprint.name || '-'
        item = {
          blueprint,
          keywords: name.toLowerCase(),
          name,
          count,
          geometries: stats.geometries.size,
          triangles: stats.triangles,
          textureBytes: stats.textureBytes,
          textureSize: formatBytes(stats.textureBytes),
          code: blueprint.script ? 1 : 0,
          fileBytes: stats.fileBytes,
          fileSize: formatBytes(stats.fileBytes),
        }
        itemMap.set(blueprint.id, item)
      }
      item.count++
    }
    for (const [_, item] of itemMap) {
      items.push(item)
    }
    return items
  }, [refresh])
  {
    const profiler = world.profiler
    const samples = new Map(profiler.rows.map(row => [row.id, row]))
    const totals = new Map()
    if (perf && profiler.active && profiler.allowed()) {
      for (const entity of world.entities.items.values()) {
        const row = samples.get(entity.data.id)
        if (!entity.isApp || !row) continue
        const id = entity.data.blueprint
        const total = totals.get(id) || {
          cpu: 0,
          serverCpu: 0,
          network: 0,
          lights: 0,
          samples: 0,
          serverMissing: false,
        }
        total.samples++
        total.cpu += row.cpu
        total.network += row.network
        total.lights += row.lights
        if (row.serverCpu == null || !profiler.serverReady()) total.serverMissing = true
        else total.serverCpu += row.serverCpu
        totals.set(id, total)
      }
    }
    items = items.map(item => {
      const sample = totals.get(item.blueprint.id)
      const total = sample?.samples === item.count ? sample : null
      return {
        ...item,
        cpu: total?.cpu ?? null,
        serverCpu: total && !total.serverMissing ? total.serverCpu : null,
        network: total?.network ?? null,
        lights: total?.lights ?? null,
      }
    })
  }
  items = useMemo(() => {
    let newItems = items
    if (query) {
      query = query.toLowerCase()
      newItems = newItems.filter(item => item.keywords.includes(query))
    }
    newItems = orderBy(newItems, sort, asc ? 'asc' : 'desc')
    return newItems
  }, [items, sort, asc, query])
  useEffect(() => {
    function onChange() {
      setRefresh(n => n + 1)
    }
    world.entities.on('added', onChange)
    world.entities.on('removed', onChange)
    return () => {
      world.entities.off('added', onChange)
      world.entities.off('removed', onChange)
    }
  }, [])
  const reorder = key => {
    if (sort === key) {
      setAsc(!asc)
    } else {
      setSort(key)
      setAsc(false)
    }
  }
  useEffect(() => {
    return () => world.target.hide()
  }, [])
  const getClosest = item => {
    // find closest entity
    const playerPosition = world.rig.position
    let closestEntity
    let closestDistance = null
    for (const [_, entity] of world.entities.items) {
      if (entity.blueprint === item.blueprint) {
        const distance = playerPosition.distanceTo(entity.root.position)
        if (closestDistance === null || closestDistance > distance) {
          closestEntity = entity
          closestDistance = distance
        }
      }
    }
    return closestEntity
  }
  const toggleTarget = item => {
    if (target === item) {
      world.target.hide()
      setTarget(null)
      return
    }
    const entity = getClosest(item)
    if (!entity) return
    world.target.show(entity.root.position)
    setTarget(item)
  }
  const inspect = item => {
    const entity = getClosest(item)
    world.ui.setApp(entity)
    // world.ui.setMenu({ type: 'app', app: entity })
  }
  const toggle = item => {
    const blueprint = world.blueprints.get(item.blueprint.id)
    const version = blueprint.version + 1
    const disabled = !blueprint.disabled
    world.blueprints.modify({ id: blueprint.id, version, disabled })
    world.network.send('blueprintModified', { id: blueprint.id, version, disabled })
    setRefresh(n => n + 1)
  }
  return (
    <div
      className={cls('appslist', { hideperf: !perf })}
      css={css`
        flex: 1;
        display: table;
        width: ${perf ? 'max-content' : '100%'};
        min-width: 100%;
        .appslist-head {
          display: table-row;
        }
        .appslist-headitem {
          display: table-cell;
          position: sticky;
          top: 0;
          padding: 0.6rem 0.5rem;
          vertical-align: middle;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 1rem;
          font-weight: 500;
          white-space: nowrap;
          text-align: right;
          &.name {
            padding-left: 1rem;
          }
          &:hover:not(.active) {
            cursor: pointer;
          }
          &.active {
            color: #4088ff;
          }
        }
        .appslist-rows {
          display: table-row-group;
        }
        .appslist-row {
          display: table-row;
          &:hover {
            cursor: pointer;
            background: rgba(255, 255, 255, 0.03);
          }
        }
        .appslist-rowitem {
          display: table-cell;
          padding: 0.6rem 0.5rem;
          vertical-align: middle;
          font-size: 1rem;
          color: rgba(255, 255, 255, 0.8);
          white-space: nowrap;
          text-align: right;
          &.name {
            padding-left: 1rem;
            text-align: left;
          }
          &.actions {
            padding-right: 1rem;
          }
        }
        .appslist-action {
          display: inline-flex;
          margin-left: 0.625rem;
          color: #5d6077;
          &.active {
            color: white;
          }
          &:hover {
            cursor: pointer;
          }
        }
        &.hideperf {
          .appslist-head {
            display: none;
          }
          .appslist-rowitem {
            &.count,
            &.code,
            &.geometries,
            &.triangles,
            &.textureSize,
            &.fileSize,
            &.profile {
              display: none;
            }
          }
        }
      `}
    >
      <div className='appslist-head'>
        <div
          className={cls('appslist-headitem name', { active: sort === 'name' })}
          onClick={() => reorder('name')}
          title='Name'
        >
          <span></span>
        </div>
        <div
          className={cls('appslist-headitem count', { active: sort === 'count' })}
          onClick={() => reorder('count')}
          title='Instances'
        >
          <HashIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem geometries', { active: sort === 'geometries' })}
          onClick={() => reorder('geometries')}
          title='Geometries'
        >
          <BoxIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem triangles', { active: sort === 'triangles' })}
          onClick={() => reorder('triangles')}
          title='Triangles'
        >
          <TriangleIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem textureSize', { active: sort === 'textureBytes' })}
          onClick={() => reorder('textureBytes')}
          title='Texture Memory Size'
        >
          <BrickWallIcon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem code', { active: sort === 'code' })}
          onClick={() => reorder('code')}
          title='Code'
        >
          <FileCode2Icon size='1.125rem' />
        </div>
        <div
          className={cls('appslist-headitem fileSize', { active: sort === 'fileBytes' })}
          onClick={() => reorder('fileBytes')}
          title='File Size'
        >
          <HardDriveIcon size={16} />
        </div>
        {[
          ['cpu', 'Client CPU', 'Client script CPU (ms/s), summed across instances'],
          ['serverCpu', 'Server CPU', 'Server script CPU (ms/s), summed across instances'],
          ['network', 'Network', 'Network traffic (B/s), summed across instances'],
          ['lights', 'Lights', 'Mounted lights, summed across instances'],
        ].map(([key, label, title]) => (
          <div
            key={key}
            className={cls('appslist-headitem profile', { active: sort === key })}
            onClick={() => reorder(key)}
            title={title}
          >
            {label}
          </div>
        ))}
        <div className='appslist-headitem actions' />
      </div>
      <div className='appslist-rows'>
        {items.map(item => (
          <div key={item.blueprint.id} className='appslist-row'>
            <div className='appslist-rowitem name' onClick={() => inspect(item)} title={item.name}>
              <span>{item.name}</span>
            </div>
            <div className='appslist-rowitem count'>
              <span>{item.count}</span>
            </div>
            <div className='appslist-rowitem geometries'>
              <span>{item.geometries}</span>
            </div>
            <div className='appslist-rowitem triangles'>
              <span>{formatNumber(item.triangles)}</span>
            </div>
            <div className='appslist-rowitem textureSize'>
              <span>{item.textureSize}</span>
            </div>
            <div className='appslist-rowitem code'>
              <span>{item.code ? 'Yes' : 'No'}</span>
            </div>
            <div className='appslist-rowitem fileSize'>
              <span>{item.fileSize}</span>
            </div>
            {['cpu', 'serverCpu', 'network', 'lights'].map(key => (
              <div key={key} className='appslist-rowitem profile'>
                <span>{item[key] == null ? '—' : String(Math.round(item[key] * 100) / 100)}</span>
              </div>
            ))}
            <div className={'appslist-rowitem actions'}>
              {!item.blueprint.scene && (
                <>
                  <div
                    className={cls('appslist-action', { active: item.blueprint.disabled })}
                    onClick={() => toggle(item)}
                  >
                    <OctagonXIcon size='1rem' />
                  </div>
                  <div
                    className={cls('appslist-action', { active: target === item })}
                    onClick={() => toggleTarget(item)}
                  >
                    <CrosshairIcon size='1rem' />
                  </div>
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatNumber(num) {
  if (num === null || num === undefined || isNaN(num)) {
    return '0'
  }
  const million = 1000000
  const thousand = 1000
  let result
  if (num >= million) {
    result = (num / million).toFixed(1) + 'M'
  } else if (num >= thousand) {
    result = (num / thousand).toFixed(1) + 'K'
  } else {
    result = Math.round(num).toString()
  }
  return result
    .replace(/\.0+([KM])?$/, '$1') // Replace .0K with K or .0M with M
    .replace(/(\.\d+[1-9])0+([KM])?$/, '$1$2') // Trim trailing zeros (1.50M → 1.5M)
}
