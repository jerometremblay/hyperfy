import { css } from '@firebolt-dev/css'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Sidebar } from './Sidebar'

export function XRSidebar({ world, ui, children }) {
  const ref = useRef()
  useEffect(() => {
    world.xrUI.setElement(ref.current)
    return () => world.xrUI.setElement(null)
  }, [world])
  return createPortal(
    <div
      ref={ref}
      className='xr-sidebar'
      css={css`
        position: fixed;
        left: -10000px;
        top: 0;
        width: 680px;
        height: 720px;
        border-radius: 16px;
        background: #0b0a15;
        color: white;
        pointer-events: auto;
        overflow: hidden;
        .xr-sidebar-header,
        .xr-sidebar-footer {
          position: absolute;
          left: 16px;
          right: 16px;
          display: flex;
          align-items: center;
          gap: 12px;
          height: 48px;
          font-size: 18px;
        }
        .xr-sidebar-header {
          top: 12px;
        }
        .xr-sidebar-footer {
          bottom: 12px;
        }
        .xr-sidebar-title {
          flex: 1;
        }
        button {
          color: white;
          background: #2a2b39;
          border: 0;
          border-radius: 8px;
          padding: 12px 16px;
          min-height: 48px;
          font: inherit;
        }
        .sidebar {
          inset: 76px 16px;
        }
        .sidebar-sections {
          overflow-y: auto;
        }
        .sidebar-btn {
          width: 60px;
          height: 48px;
        }
        .sidebarpane,
        .sidebar-content {
          width: calc(100% - 70px);
          min-width: 0;
        }
        .script {
          width: calc(100% - 70px) !important;
        }
        .script-resizer,
        .script-resizer-bottom,
        .script-resizer-corner {
          display: none;
        }
        .sidebar-content-main {
          max-height: 100%;
          overflow-y: auto;
        }
      `}
    >
      <div className='xr-sidebar-header'>
        <span className='xr-sidebar-title'>Hyperfy</span>
        <button onClick={() => world.xrUI.placePanel()}>Recenter</button>
        <button onClick={() => world.xrUI.setVisible(false)}>Close</button>
      </div>
      <Sidebar world={world} ui={{ ...ui, visible: true, active: true }} xr />
      <div className='xr-sidebar-footer'>
        <span className='xr-sidebar-title'>Point and pinch to click</span>
        <button onClick={() => world.xrUI.scroll(-1)}>Up</button>
        <button onClick={() => world.xrUI.scroll(1)}>Down</button>
      </div>
      {children}
      <div id='core-ui-portal' />
    </div>,
    document.body
  )
}
