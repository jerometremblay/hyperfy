/* eslint react/no-unknown-property: ["error", {"ignore": ["css"]}] -- Firebolt JSX supports css. */
import { css } from '@firebolt-dev/css'
import { useEffect, useRef, useState } from 'react'
import { FieldBtn, FieldNumber, FieldTextarea } from './Fields'
import { downloadFile } from '../../core/extras/downloadFile'
import { isPromptBox, MIN_PROMPT_BOX_SIZE } from '../../core/extras/promptBoxTools'
import { resizePromptBoxFace } from '../../core/extras/PromptBoxResizeControls'
import { getPromptBoxIntersections } from '../../core/extras/promptBoxIntersections'

export function PromptBoxPanel({ world, app, blueprint }) {
  const fileInput = useRef()
  const running = useRef(false)
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [dimensions, setDimensions] = useState(() => app.root.scale.toArray())
  const readIntersections = () =>
    getPromptBoxIntersections(world, app).map(other => ({
      id: other.data.id,
      name: other.blueprint.name || 'App',
    }))
  const [intersections, setIntersections] = useState(readIntersections)
  useEffect(() => {
    const timer = setInterval(() => {
      if (app.destroyed || app.data.blueprint !== blueprint.id || !isPromptBox(app.blueprint)) {
        world.ui.setApp(null)
        return
      }
      const size = app.root.scale.toArray()
      setDimensions(prev => (size.some((n, i) => n !== prev[i]) ? size : prev))
      const apps = getPromptBoxIntersections(world, app).map(other => ({
        id: other.data.id,
        name: other.blueprint.name || 'App',
      }))
      setIntersections(prev =>
        apps.length === prev.length && apps.every((other, i) => other.id === prev[i].id && other.name === prev[i].name)
          ? prev
          : apps
      )
    }, 250)
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
        hint='Describe a new object or an edit to the intersected construction. The box marks the intended area.'
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
        hint='Download all overlapping prompt-box requests, their placements, and intersected .hyp apps for ChatGPT.'
        onClick={() =>
          run(async () => {
            downloadFile(await world.builder.promptBoxes.export(app))
            setStatus('Submit the ZIP to ChatGPT, then import the returned .hyp or result ZIP here.')
          })
        }
      />
      <div
        css={css`
          padding: 0.5rem 1rem;
          font-size: 0.875rem;
          line-height: 1.4;
        `}
      >
        <div>
          {intersections.length} intersected {intersections.length === 1 ? 'app' : 'apps'} included in ZIP
        </div>
        {intersections.length > 0 && (
          <ul
            css={css`
              margin: 0.5rem 0;
              padding-left: 1rem;
            `}
          >
            {intersections.map(other => (
              <li key={other.id}>
                {other.name} ({other.id})
              </li>
            ))}
          </ul>
        )}
        <small>Overlapping prompt-boxes are processed together. Construction edits align to the existing app.</small>
      </div>
      <FieldBtn
        label='Import result'
        hint='Apply the returned construction edits and generated objects together.'
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
        {status || 'Use the box to mark an edit area, or define the size of a new standalone object.'}
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
  if (!replacement || (app && !replacement.changes.some(entry => entry.entityId === app.data.id))) return null
  return (
    <>
      <FieldBtn
        label='Undo prompt result'
        hint='Restore the prompt-box and all edited constructions together.'
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
