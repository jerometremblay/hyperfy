import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'
import { importPolyforkModel } from '../../core/extras/polyspoonImport'

export function PolyforkCatalog({ world, onPlace, onClose }) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [results, setResults] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [hd, setHd] = useState(true)
  const [cdnBase, setCdnBase] = useState(() => localStorage.getItem('polyforkCdnBase') || '')
  useEffect(() => {
    const controller = new AbortController()
    setResults(null)
    setError('')
    const args = new URLSearchParams({ q: search, page: String(page), per_page: '12' })
    fetch(`https://polyfork.dev/api/assets?${args}`, { signal: controller.signal, credentials: 'omit' })
      .then(response => {
        if (!response.ok) throw new Error('Could not load the catalog')
        return response.json()
      })
      .then(setResults)
      .catch(err => {
        if (err.name !== 'AbortError') setError(err.message || 'Could not load the catalog')
      })
    return () => controller.abort()
  }, [search, page])
  return (
    <div
      css={css`
        margin-bottom: 1rem;
        .polyfork-head,
        .polyfork-search,
        .polyfork-pages {
          display: flex;
          gap: 0.5rem;
          align-items: center;
          margin-bottom: 0.6rem;
        }
        .polyfork-head strong {
          flex: 1;
        }
        input:not([type='checkbox']) {
          min-width: 0;
          flex: 1;
          padding: 0.6rem;
          color: white;
          background: #1c1d22;
          border: 1px solid #3a3b44;
          border-radius: 0.5rem;
        }
        button {
          padding: 0.55rem;
          color: white;
          background: #3b5965;
          border: 0;
          border-radius: 0.5rem;
          cursor: pointer;
        }
        button:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .polyfork-grid {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 0.5rem;
        }
        .polyfork-model {
          padding: 0;
          overflow: hidden;
          background: #1c1d22;
          text-align: center;
        }
        .polyfork-model img {
          display: block;
          width: 100%;
          aspect-ratio: 1;
          object-fit: cover;
        }
        .polyfork-model span {
          display: block;
          padding: 0.4rem;
          overflow-wrap: anywhere;
        }
        .polyfork-pages {
          justify-content: space-between;
          margin-top: 0.6rem;
        }
      `}
    >
      <div className='polyfork-head'>
        <strong>Polyfork catalog</strong>
        <button type='button' onClick={onClose}>
          Close
        </button>
      </div>
      <form
        className='polyfork-search'
        onSubmit={event => {
          event.preventDefault()
          setPage(1)
          setSearch(query.trim())
        }}
      >
        <input
          aria-label='Search Polyfork models'
          placeholder='Search models'
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button type='submit'>Search</button>
      </form>
      <label>
        <input type='checkbox' checked={hd} onChange={event => setHd(event.target.checked)} /> Prefer HD edition
      </label>
      {hd && (
        <input
          aria-label='Polyfork account CDN URL'
          placeholder='Account CDN URL (optional if configured on server)'
          value={cdnBase}
          onChange={event => {
            const value = event.target.value.trim()
            setCdnBase(value)
            localStorage.setItem('polyforkCdnBase', value)
          }}
        />
      )}
      {error && <p role='alert'>{error}</p>}
      {busy && <p>Preparing model…</p>}
      {!results && !error && <p>Loading models…</p>}
      {results && (
        <>
          {!results.assets?.length && <p>No models found.</p>}
          <div className='polyfork-grid'>
            {results.assets?.map(asset => (
              <button
                className='polyfork-model'
                type='button'
                key={asset.id}
                disabled={busy}
                title={hd && !asset.hd ? 'Standard edition (no HD available)' : undefined}
                onClick={async () => {
                  setBusy(true)
                  setError('')
                  try {
                    const blueprint = await importPolyforkModel(
                      world,
                      asset,
                      fetch,
                      {},
                      { hd: hd && !!asset.hd, cdnBase }
                    )
                    onPlace(blueprint)
                  } catch (err) {
                    setError(err.message || 'Could not add the model')
                  } finally {
                    setBusy(false)
                  }
                }}
              >
                <img src={`https://polyfork.dev/files/${asset.id}/renders/hero.png`} alt='' loading='lazy' />
                <span>
                  {asset.title}
                  {hd && !asset.hd ? ' (standard)' : ''}
                </span>
              </button>
            ))}
          </div>
          <div className='polyfork-pages'>
            <button type='button' disabled={page <= 1 || busy} onClick={() => setPage(page - 1)}>
              Previous
            </button>
            <span>Page {page}</span>
            <button
              type='button'
              disabled={busy || page * (results.per_page || 12) >= results.total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  )
}
