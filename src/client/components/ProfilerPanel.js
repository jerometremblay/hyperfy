/* eslint-disable react/no-unknown-property */
import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const metrics = {
  cpu: 'Client script CPU (ms/s)',
  serverCpu: 'Server script CPU (ms/s)',
  triangles: 'Triangles',
  bodies: 'Physics bodies',
  network: 'Network (B/s)',
  lights: 'Lights',
}
// SES deliberately tames locale formatting; round before string conversion.
const number = value => (value == null ? '—' : String(Math.round(value * 100) / 100))

export function ProfilerPanel({ world }) {
  const profiler = world.profiler
  const [, refresh] = useState(0)
  useEffect(() => {
    const change = () => refresh(n => n + 1)
    profiler.on('change', change)
    world.stats.on('change', change)
    world.on('rank', change)
    world.settings.on('change', change)
    return () => {
      profiler.off('change', change)
      world.stats.off('change', change)
      world.off('rank', change)
      world.settings.off('change', change)
    }
  }, [world, profiler])
  if (!world.stats.active || !world.ui.state.visible || !profiler.allowed()) return null
  const rows = [...profiler.rows].sort(
    (a, b) => (b[profiler.metric] ?? -1) - (a[profiler.metric] ?? -1) || a.id.localeCompare(b.id)
  )
  const selected = rows.find(row => row.id === profiler.selected)
  return createPortal(
    <section
      aria-label='Object performance profiler'
      css={css`
        width: 100%;
        box-sizing: border-box;
        max-height: calc(100dvh - 48px);
        overflow: auto;
        pointer-events: auto;
        padding: 0.75rem;
        border-radius: 0 0 0.6rem 0.6rem;
        background: rgba(15, 16, 24, 0.95);
        color: white;
        font-size: 0.85rem;
        line-height: 1.5;
        label {
          display: block;
        }
        header {
          display: flex;
          justify-content: space-between;
          gap: 1rem;
        }
        h2 {
          font-size: 1.1rem;
          margin: 0;
        }
        button,
        select,
        input {
          color: white;
          background: #303541;
          border: 1px solid #596170;
          border-radius: 0.25rem;
          padding: 0.3rem;
          font: inherit;
        }
        select {
          width: 100%;
          margin: 0.5rem 0;
        }
        ol {
          padding-left: 1.5rem;
          max-height: 15rem;
          overflow: auto;
        }
        li button {
          display: flex;
          justify-content: space-between;
          width: 100%;
          text-align: left;
          margin-bottom: 0.2rem;
          gap: 0.5rem;
        }
        li button[aria-pressed='true'] {
          border-color: #ffd25a;
        }
        small {
          color: #b7bfcc;
        }
        dl {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 0.2rem;
        }
        dt,
        dd {
          margin: 0;
        }
      `}
    >
      <header>
        <h2>Object profiler</h2>
        <button
          aria-expanded={profiler.active}
          aria-controls='object-profiler-details'
          onClick={() => profiler.toggle(!profiler.active)}
        >
          {profiler.active ? 'Hide details' : 'Show details'}
        </button>
      </header>
      {profiler.active && (
        <div id='object-profiler-details'>
          <small>Client + server · green → red relative to this scene; gray = unavailable</small>
          <label>
            Rank and color by
            <select
              aria-label='Profiler metric'
              value={profiler.metric}
              onChange={e => profiler.setMetric(e.target.value)}
            >
              {Object.entries(metrics).map(([key, name]) => (
                <option key={key} value={key}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <small>
            {profiler.serverReady()
              ? 'Server sample received · updates about once a second'
              : 'Waiting for a fresh server sample…'}
          </small>
          <br />
          <small>{rows.length} apps · select an orb or a row to inspect</small>
          <ol>
            {rows.map(row => (
              <li key={row.id}>
                <button aria-pressed={row.id === profiler.selected} onClick={() => profiler.select(row.id)}>
                  <span>{row.name}</span>
                  <strong>{number(row[profiler.metric])}</strong>
                </button>
              </li>
            ))}
          </ol>
          {selected && (
            <>
              <h3>{selected.name}</h3>
              <small>App {selected.id}</small>
              <dl>
                <dt>Client script CPU (smoothed)</dt>
                <dd>{number(selected.cpu)} ms/s</dd>
                <dt>Client peak callback</dt>
                <dd>{number(selected.peak)} ms</dd>
                <dt>Server script CPU</dt>
                <dd>{number(selected.serverCpu)} ms/s</dd>
                <dt>Server peak callback</dt>
                <dd>{number(selected.serverPeak)} ms</dd>
                <dt>Mounted triangles / meshes</dt>
                <dd>
                  {number(selected.triangles)} / {selected.meshes}
                </dd>
                <dt>Materials</dt>
                <dd>{selected.materials}</dd>
                <dt>Bodies / colliders</dt>
                <dd>
                  {selected.bodies} / {selected.colliders}
                </dd>
                <dt>Active bodies / contact links</dt>
                <dd>
                  {selected.activeBodies} / {selected.contacts}
                </dd>
                <dt>Lights / shadow casters</dt>
                <dd>
                  {selected.lights} / {selected.shadows}
                </dd>
                <dt>Sent / received</dt>
                <dd>
                  {number(selected.sent)} / {number(selected.received)} B/s
                </dd>
                <dt>App messages</dt>
                <dd>{number(selected.messages)}/s</dd>
              </dl>
              <details>
                <summary>Client callback CPU in last sample</summary>
                {Object.entries(selected.callbacks).map(([key, value]) => (
                  <div key={key}>
                    {key}: {number(value)} ms/s
                  </div>
                ))}
              </details>
              <details>
                <summary>Server callback CPU in last sample</summary>
                {selected.serverCallbacks ? (
                  Object.entries(selected.serverCallbacks).map(([key, value]) => (
                    <div key={key}>
                      {key}: {number(value)} ms/s
                    </div>
                  ))
                ) : (
                  <small>Waiting for a matching server sample.</small>
                )}
              </details>
            </>
          )}
          <p>
            <small>
              CPU measures synchronous app events, world events and timers; excludes async continuations and native node
              handlers. Geometry and physics are mounted counts, not GPU or per-body milliseconds. Network counts app
              entity packets including MessagePack headers, excluding WebSocket overhead, assets and shared traffic.
              Rates use a 2-second moving average for client CPU and byte rates. Server CPU uses its actual sample
              window. GPU, splat rendering and engine physics time are not measured.
            </small>
          </p>
        </div>
      )}
    </section>,
    world.stats.extension
  )
}
