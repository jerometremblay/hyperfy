import { useEffect, useRef, useState } from 'react'
import { canonical, implementationDescriptor, publishedStatus } from '../../core/extras/publishedObjects'

const labels = {
  local: 'Local',
  unverified: 'Unverified',
  checking: 'Checking',
  current: 'Up to date',
  'update-available': 'Update available',
  'check-failed': 'Check failed',
}
const buttonStyle = {
  padding: '0.45rem 0.65rem',
  border: '1px solid #ffffff40',
  borderRadius: '0.25rem',
  font: 'inherit',
  cursor: 'pointer',
}
const panelStyle = { padding: '0.875rem', display: 'grid', gap: '0.65rem', borderTop: '1px solid #ffffff15' }
const inputStyle = { width: '100%', padding: '0.5rem', border: '1px solid #ffffff40', borderRadius: '0.25rem' }

export function PublishedSource({ world, app }) {
  const [published, setPublished] = useState(app.data.published)
  const [url, setURL] = useState(published?.sourceUrl || '')
  const [source, setSource] = useState(null)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [modified, setModified] = useState(false)
  const alive = useRef(true)
  const running = useRef(false)
  useEffect(() => {
    alive.current = true
    const update = changed => {
      if (changed !== app) return
      setPublished(app.data.published)
      setURL(app.data.published?.sourceUrl || '')
      const baseline = app.data.published?.baselineImplementationFingerprint
      const descriptor = canonical(implementationDescriptor(world.blueprints.get(app.data.blueprint)))
      if (!baseline) {
        setModified(false)
        return
      }
      crypto.subtle.digest('SHA-256', new TextEncoder().encode(descriptor)).then(bytes => {
        if (alive.current)
          setModified(
            `sha256:${[...new Uint8Array(bytes)].map(byte => byte.toString(16).padStart(2, '0')).join('')}` !== baseline
          )
      })
    }
    const onBlueprint = bp => {
      if (bp.id === app.data.blueprint) update(app)
    }
    world.on('appChanged', update)
    world.blueprints.on('modify', onBlueprint)
    update(app)
    return () => {
      alive.current = false
      world.off('appChanged', update)
      world.blueprints.off('modify', onBlueprint)
    }
  }, [world, app])
  useEffect(() => {
    let active = true
    setSource(null)
    if (!published?.sourceUrl) return
    const poll = async () => {
      try {
        const result = await world.builder.published.check(published.sourceUrl)
        if (active) setSource(result)
      } catch (error) {
        if (active) setSource({ error: error.message })
      }
    }
    void poll()
    const timer = setInterval(poll, 30000)
    return () => {
      active = false
      clearInterval(timer)
    }
  }, [published?.sourceUrl, world])
  const run = async (name, action) => {
    if (running.current) return
    running.current = true
    setBusy(name)
    setError('')
    try {
      await action()
    } catch (error) {
      if (alive.current) setError(error.message)
    } finally {
      running.current = false
      if (alive.current) setBusy('')
    }
  }
  const status = publishedStatus(published, source)
  return (
    <section style={panelStyle} aria-label='Published Source'>
      <strong>Published Source</strong>
      <label>
        Source URL
        <input
          aria-label='Source URL'
          type='url'
          placeholder='https://example.org/object.hyp'
          value={url}
          disabled={!!busy}
          onChange={event => setURL(event.target.value)}
          style={inputStyle}
        />
      </label>
      <div role='status'>
        {busy === 'Installing' ? 'Installing…' : busy === 'Checking' ? 'Checking…' : labels[status]}
      </div>
      {modified && <p>Locally modified implementation. Installation requires confirmation.</p>}
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button
          style={buttonStyle}
          disabled={!!busy || !url.trim() || url === published?.sourceUrl}
          onClick={() => run('Linking', () => world.builder.published.link(app, url.trim()))}
        >
          {published ? 'Change source' : 'Link source'}
        </button>
        {published && (
          <>
            <button disabled={!!busy} onClick={() => run('Unlinking', () => world.builder.published.link(app, null))}>
              Unlink
            </button>
            <button
              style={buttonStyle}
              disabled={!!busy}
              onClick={() =>
                run('Checking', async () => {
                  const result = await world.builder.published.check(published.sourceUrl, true)
                  if (alive.current) setSource(result)
                })
              }
            >
              {status === 'check-failed' ? 'Retry' : 'Check now'}
            </button>
            <button
              style={buttonStyle}
              disabled={!!busy || !source?.hash || !!source?.error || status === 'current'}
              onClick={() => run('Installing', () => world.builder.published.install(app))}
            >
              {published.verified ? (status === 'current' ? 'Up to date' : 'Update') : 'Install from source'}
            </button>
          </>
        )}
      </div>
      {source?.checkedAt && <small>Last checked: {new Date(source.checkedAt).toLocaleString()}</small>}
      {published?.installedHash && (
        <small title={published.installedHash}>Installed: {published.installedHash.slice(0, 20)}…</small>
      )}
      {source?.hash && <small title={source.hash}>Source: {source.hash.slice(0, 20)}…</small>}
      {(error || source?.error) && <p role='alert'>{error || source.error}</p>}
      <small>
        Checks are automatic; installation is manual. Undo restores the object but cannot reverse external script side
        effects.
      </small>
    </section>
  )
}

export function ImportFromURL({ world }) {
  const [url, setURL] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const running = useRef(false)
  const alive = useRef(true)
  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
    }
  }, [])
  return (
    <form
      style={panelStyle}
      onSubmit={async event => {
        event.preventDefault()
        if (running.current) return
        running.current = true
        setBusy(true)
        setError('')
        const transform = world.builder.getSpawnTransform(true)
        try {
          await world.builder.published.install(null, url.trim(), transform)
          if (alive.current) setURL('')
        } catch (error) {
          if (alive.current) setError(error.message)
        } finally {
          running.current = false
          if (alive.current) setBusy(false)
        }
      }}
    >
      <label>
        Import from URL
        <input
          aria-label='Import .hyp URL'
          type='url'
          required
          placeholder='https://example.org/object.hyp'
          value={url}
          disabled={busy}
          onChange={event => setURL(event.target.value)}
          style={inputStyle}
        />
      </label>
      <button style={buttonStyle} type='submit' disabled={busy || !url.trim()}>
        {busy ? 'Importing…' : 'Import from URL'}
      </button>
      {error && <p role='alert'>{error}</p>}
    </form>
  )
}
