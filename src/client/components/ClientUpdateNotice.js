/* eslint-disable react/no-unknown-property -- css is handled by the Firebolt JSX compiler. */
import { css } from '@firebolt-dev/css'
import { useEffect, useState } from 'react'
import { RefreshCwIcon } from 'lucide-react'

export function ClientUpdateNotice({ world }) {
  const [available, setAvailable] = useState(() => !!world.network.updateAvailable)
  useEffect(() => {
    world.on('client-update', setAvailable)
    setAvailable(!!world.network.updateAvailable)
    return () => world.off('client-update', setAvailable)
  }, [world])
  if (!available) return null
  return (
    <div
      role='status'
      css={css`
        position: absolute;
        top: 12px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 10;
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 7px 11px;
        border-radius: 8px;
        background: rgba(20, 20, 24, 0.78);
        color: rgba(255, 255, 255, 0.8);
        font-size: 12px;
        pointer-events: auto;
        button {
          display: flex;
          align-items: center;
          gap: 4px;
          color: inherit;
          cursor: pointer;
        }
      `}
    >
      <span>Update available</span>
      <button type='button' aria-label='Reload to update' onClick={() => window.location.reload()}>
        <RefreshCwIcon size={12} /> Reload
      </button>
    </div>
  )
}
