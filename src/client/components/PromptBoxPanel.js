/* eslint react/no-unknown-property: ["error", {"ignore": ["css"]}] -- Firebolt JSX supports css. */
import { css } from '@firebolt-dev/css'
import { useEffect, useRef, useState } from 'react'
import { FieldBtn, FieldNumber, FieldTextarea } from './Fields'
import { downloadFile } from '../../core/extras/downloadFile'
import { isPromptBox, MIN_PROMPT_BOX_SIZE } from '../../core/extras/promptBoxTools'
import { resizePromptBoxFace } from '../../core/extras/PromptBoxResizeControls'

export function PromptBoxPanel({ world, app, blueprint }) {
  const fileInput = useRef()
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [dimensions, setDimensions] = useState(() => app.root.scale.toArray())
  useEffect(() => {
    const timer = setInterval(() => {
      if (app.destroyed || app.data.blueprint !== blueprint.id || !isPromptBox(app.blueprint)) {
        world.ui.setApp(null)
        return
      }
      const size = app.root.scale.toArray()
      setDimensions(prev => (size.some((n, i) => n !== prev[i]) ? size : prev))
    }, 100)
    return () => clearInterval(timer)
  }, [app, blueprint.id, world])
  const run = async action => {
    if (running.current || blueprint.frozen) return
    running.current = true
    setBusy(true)
    setStatus('')
    try {
      world.builder.promptBoxes.requireBuilder()
      if (app.data.blueprint !== blueprint.id || !isPromptBox(app.blueprint)) {
        throw new Error('This prompt-box has already been replaced.')
      }
      await action()
    } catch (err) {
      setStatus(err.message)
    } finally {
      running.current = false
      setBusy(false)
    }
  }
  const changePrompt = prompt => {
    const bp = world.blueprints.get(app.data.blueprint)
    if (!world.builder.canBuild() || bp.id !== blueprint.id || !isPromptBox(bp)) return
    if (prompt === bp.props.prompt) return
    const change = { id: bp.id, version: bp.version + 1, props: { ...bp.props, prompt } }
    world.blueprints.modify(change)
    world.network.send('blueprintModified', change)
  }
  const resize = (axis, value) => {
    if (busy || !Number.isFinite(value) || value < MIN_PROMPT_BOX_SIZE) return
    world.builder.promptBoxes.settle(app)
    const scale = app.root.scale.toArray()
    const change =
      axis === 1
        ? resizePromptBoxFace(
            app.root.position.toArray(),
            app.root.quaternion.toArray(),
            scale,
            axis,
            1,
            value - scale[axis]
          )
        : { scale: [...scale] }
    change.scale[axis] = value
    app.modify(change)
    world.network.send('entityModified', { id: app.data.id, ...change })
    setDimensions(change.scale)
  }
  return (
    <fieldset
      disabled={busy || blueprint.frozen}
      css={css`
        border: 0;
        padding: 0;
        margin: 0;
        min-width: 0;
      `}
    >
      <FieldTextarea
        label='Prompt'
        hint='Describe the new object to create inside this box.'
        placeholder='Create a coffee mug'
        value={blueprint.props.prompt}
        onChange={changePrompt}
      />
      {['Width (m)', 'Height (m)', 'Depth (m)'].map((label, axis) => (
        <FieldNumber
          key={label}
          label={label}
          hint='Intended object size in meters.'
          dp={3}
          min={MIN_PROMPT_BOX_SIZE}
          step={0.01}
          bigStep={0.1}
          value={dimensions[axis]}
          onChange={value => run(() => resize(axis, value))}
        />
      ))}
      <FieldBtn
        label='Resize with face handles'
        hint='Drag the spheres to move one face. The opposite face stays fixed.'
        onClick={() =>
          run(() => {
            if (app.data.pinned) throw new Error('Unpin the box before resizing it with handles.')
            world.builder.toggle(true)
            world.builder.setMode('scale')
            world.builder.select(app)
            setStatus('Drag a face sphere to resize. Export when ready, or press Escape to finish.')
          })
        }
      />
      <FieldBtn
        label={busy ? 'Working…' : 'Export prompt ZIP'}
        hint='Download the prompt, exact box placement, and .hyp reference for ChatGPT.'
        onClick={() =>
          run(async () => {
            downloadFile(await world.builder.promptBoxes.export(app))
            setStatus('Submit the ZIP to ChatGPT, then import the returned .hyp or result ZIP here.')
          })
        }
      />
      <FieldBtn
        label='Import result'
        hint='Replace this prompt-box with the generated object.'
        onClick={() => {
          if (!busy && !blueprint.frozen) fileInput.current.click()
        }}
      />
      <input
        ref={fileInput}
        type='file'
        accept='.hyp,.zip'
        hidden
        style={{ display: 'none' }}
        onChange={event => {
          const file = event.target.files[0]
          event.target.value = ''
          if (file) run(() => world.builder.promptBoxes.import(app, file))
        }}
      />
      <p
        role='status'
        css={css`
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          line-height: 1.4;
        `}
      >
        {status || 'The object fits this volume. Its base aligns with the bottom face.'}
      </p>
    </fieldset>
  )
}

export function UndoPromptBox({ world, app }) {
  const [replacement, setReplacement] = useState(world.builder.promptBoxes.lastReplacement)
  const [error, setError] = useState('')
  useEffect(() => {
    const update = () => setReplacement(world.builder.promptBoxes.lastReplacement)
    world.on('prompt-box-replaced', update)
    return () => world.off('prompt-box-replaced', update)
  }, [world])
  if (!replacement || (app && app.data.id !== replacement.entityId)) return null
  return (
    <>
      <FieldBtn
        label='Undo prompt-box replacement'
        hint='Restore the original box, dimensions, and prompt.'
        onClick={() => {
          try {
            world.builder.promptBoxes.undo()
          } catch (err) {
            setError(err.message)
          }
        }}
      />
      {error && <p role='alert'>{error}</p>}
    </>
  )
}
