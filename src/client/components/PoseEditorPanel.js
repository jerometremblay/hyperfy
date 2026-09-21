/* eslint-disable react/no-unknown-property */

import { css } from '@firebolt-dev/css'
import { jsx as createJSX } from '@firebolt-dev/jsx/jsx-runtime'
import { useEffect, useState } from 'react'

const AXES = ['x', 'y', 'z']
const LIMBS = [
  ['leftHand', 'Left hand'],
  ['rightHand', 'Right hand'],
  ['leftFoot', 'Left foot'],
  ['rightFoot', 'Right foot'],
  ['back', 'Back'],
]
const GUIDES = [
  ['seat', 'Align hips to seat'],
  ['backrest', 'Align back to backrest'],
  ['leftArmrest', 'Align left hand'],
  ['rightArmrest', 'Align right hand'],
]

export function SittingPoseButton({ world, player }) {
  if (!player?.data.effect?.anchorId || player.isXR || world.poseEditor?.session) return null
  return (
    <button
      type='button'
      onClick={() => world.poseEditor.open(player)}
      css={css`
        position: absolute;
        right: 1.5rem;
        bottom: 1.5rem;
        z-index: 20;
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.24);
        border-radius: 0.5rem;
        padding: 0.65rem 0.9rem;
        color: white;
        background: rgba(16, 21, 29, 0.9);
        font: inherit;
        cursor: pointer;
        &:hover {
          background: rgba(44, 57, 73, 0.96);
        }
      `}
    >
      Customize sitting
    </button>
  )
}

export function PoseEditorPanel({ world }) {
  const [state, setState] = useState(() => world.poseEditor.getViewState())
  const [styleName, setStyleName] = useState('')
  const [selectedStyle, setSelectedStyle] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')

  useEffect(() => {
    const update = value => setState({ ...value })
    world.on('poseEditor', update)
    update(world.poseEditor.getViewState())
    return () => world.off('poseEditor', update)
  }, [world])

  useEffect(() => {
    if (state.active && state.previewAvatarUrl) setPreviewUrl(state.previewAvatarUrl)
  }, [state.active, state.previewAvatarUrl])

  if (!state.active) return null

  const editor = world.poseEditor
  const selectedRotation = state.selectedRotation || { x: 0, y: 0, z: 0 }
  const hipsPosition = state.hipsPosition || [0, 0, 0]
  const placement = state.placement || { position: [0, 0, 0], yaw: 0 }
  const target = state.ikTarget || [0, 0, 0]
  const historyInteraction = {
    onInteractionStart: () => editor.beginHistoryGroup(),
    onInteractionEnd: () => editor.endHistoryGroup(),
  }

  return (
    <section
      aria-label='Sitting pose editor'
      className='sitting-pose-editor'
      css={css`
        position: absolute;
        top: 50%;
        right: 1.5rem;
        z-index: 30;
        width: min(23rem, calc(100vw - 2rem));
        max-height: min(82vh, 52rem);
        overflow: auto;
        transform: translateY(-50%);
        pointer-events: auto;
        border: 1px solid rgba(255, 255, 255, 0.16);
        border-radius: 0.8rem;
        padding: 1rem;
        color: #f5f7fa;
        background: rgba(16, 20, 27, 0.97);
        box-shadow: 0 1rem 3rem rgba(0, 0, 0, 0.45);
        font-size: 0.875rem;
        @media (max-width: 42rem) {
          top: auto;
          right: 0.75rem;
          bottom: 0.75rem;
          left: 0.75rem;
          width: auto;
          max-height: min(48vh, 26rem);
          transform: none;
        }
        h2 {
          margin: 0;
          font-size: 1.1rem;
        }
        h3 {
          margin: 1rem 0 0.45rem;
          font-size: 0.9rem;
        }
        label {
          display: grid;
          grid-template-columns: 5.5rem 1fr 3.2rem;
          align-items: center;
          gap: 0.5rem;
          margin: 0.45rem 0;
          color: #d7dce4;
        }
        input[type='range'] {
          width: 100%;
          accent-color: #69c5ff;
        }
        output {
          text-align: right;
          font-variant-numeric: tabular-nums;
          color: #aeb8c5;
        }
        select,
        input[type='text'] {
          min-width: 0;
          border: 1px solid #454d58;
          border-radius: 0.35rem;
          padding: 0.45rem 0.55rem;
          color: #f5f7fa;
          background: #252b34;
          font: inherit;
        }
        input[type='number'] {
          min-width: 0;
          width: 3.2rem;
          border: 1px solid #454d58;
          border-radius: 0.35rem;
          padding: 0.3rem;
          color: #f5f7fa;
          background: #252b34;
          font: inherit;
          font-variant-numeric: tabular-nums;
          text-align: right;
        }
        .pose-header,
        .pose-footer,
        .pose-tabs,
        .pose-row {
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .pose-header,
        .pose-footer {
          justify-content: space-between;
        }
        .pose-tabs {
          margin-top: 0.8rem;
        }
        .pose-help {
          margin: 0.55rem 0 0;
          color: #aeb8c5;
          line-height: 1.35;
        }
        .pose-row {
          margin: 0.55rem 0;
          flex-wrap: wrap;
        }
        .pose-editor-button {
          border: 1px solid #454d58;
          border-radius: 0.4rem;
          padding: 0.42rem 0.55rem;
          color: #e8edf4;
          background: #252b34;
          font: inherit;
          cursor: pointer;
        }
        .pose-editor-button:hover {
          background: #343d49;
        }
        .pose-editor-button[aria-pressed='true'] {
          border-color: #69c5ff;
          background: #253e51;
        }
        .pose-editor-button.primary {
          border-color: #368fc1;
          background: #176b9d;
        }
        .pose-editor-button:disabled {
          opacity: 0.5;
          cursor: default;
        }
        .pose-error {
          margin: 0.7rem 0;
          color: #ff9f9f;
        }
        .pose-check {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          margin: 0.5rem 0;
          color: #d7dce4;
        }
        .pose-style-row > * {
          flex: 1;
        }
      `}
    >
      <div className='pose-header'>
        <h2>Sitting pose</h2>
        <button
          className='pose-editor-button'
          type='button'
          onClick={() => editor.close()}
          aria-label='Cancel pose editing'
        >
          Close
        </button>
      </div>

      <div className='pose-tabs'>
        {['placement', 'posture', 'ik'].map(mode => (
          <button
            key={mode}
            className='pose-editor-button'
            type='button'
            aria-pressed={state.mode === mode}
            onClick={() => editor.setMode(mode)}
          >
            {mode === 'ik' ? 'IK' : mode[0].toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <div className='pose-row' aria-label='Preview camera view'>
        {['front', 'back', 'left', 'right', 'orbit'].map(view => (
          <button
            key={view}
            className='pose-editor-button'
            type='button'
            aria-pressed={state.cameraView === view}
            disabled={state.applying}
            onClick={() => editor.setCameraView(view)}
          >
            {view[0].toUpperCase() + view.slice(1)}
          </button>
        ))}
      </div>
      <label className='pose-check'>
        <input
          type='checkbox'
          checked={state.skeletonVisible}
          disabled={state.applying}
          onChange={event => editor.setSkeletonVisible(event.target.checked)}
        />
        Show skeleton
      </label>
      <RangeControl
        {...historyInteraction}
        label='Skeleton opacity'
        value={state.skeletonOpacity}
        min={0}
        max={1}
        step={0.05}
        disabled={state.applying}
        onChange={value => editor.setSkeletonOpacity(value)}
      />
      <RangeControl
        {...historyInteraction}
        label='Marker size'
        value={state.markerSize}
        min={0.5}
        max={2}
        step={0.1}
        disabled={state.applying}
        onChange={value => editor.setMarkerSize(value)}
      />

      {state.mode === 'placement' && (
        <p className='pose-help'>
          Drag the avatar to reposition it. Shift-drag moves it vertically; right-drag orbits the view.
        </p>
      )}
      {state.mode === 'posture' && (
        <p className='pose-help'>
          Select a joint marker, drag its rotation gizmo, or use the numeric controls. Right-drag orbits the view.
        </p>
      )}

      {state.error && <p className='pose-error'>{state.error}</p>}
      {state.styleError && <p className='pose-error'>{state.styleError}</p>}
      {state.profileId && (
        <p className='pose-help' title={state.profileId}>
          Compatible furniture profile: {state.profileId}
        </p>
      )}

      {state.mode === 'placement' && (
        <>
          <h3>Avatar placement</h3>
          {AXES.map((axis, index) =>
            createJSX(
              RangeControl,
              {
                ...historyInteraction,
                label: `Offset ${axis.toUpperCase()}`,
                value: placement.position[index],
                min: -2,
                max: 2,
                step: 0.01,
                disabled: state.applying,
                onChange: value => editor.setPlacementAxis(axis, value),
              },
              axis
            )
          )}
          <RangeControl
            {...historyInteraction}
            label='Yaw'
            value={placement.yaw}
            min={-180}
            max={180}
            step={1}
            disabled={state.applying}
            onChange={value => editor.setPlacementYaw(value)}
          />
          <GuideButtons state={state} editor={editor} />
          {Number.isFinite(state.guides?.floorY) && (
            <RangeControl
              {...historyInteraction}
              label='Floor height'
              value={state.guides.floorY}
              min={-2}
              max={2}
              step={0.01}
              disabled={state.applying}
              onChange={value => editor.setFloorY(value)}
            />
          )}
        </>
      )}

      {state.mode === 'posture' && (
        <>
          <div className='pose-row'>
            <button
              className='pose-editor-button'
              type='button'
              disabled={state.applying}
              onClick={() => editor.setPosePreset('tPose')}
            >
              T-pose
            </button>
            <button
              className='pose-editor-button'
              type='button'
              disabled={state.applying}
              onClick={() => editor.setPosePreset('relaxedStanding')}
            >
              Relaxed standing
            </button>
            <button
              className='pose-editor-button'
              type='button'
              title='Return to the seated posture captured when editing began'
              disabled={state.applying}
              onClick={() => editor.setPosePreset('sitting')}
            >
              Sitting
            </button>
          </div>
          <div className='pose-row' aria-label='Posture editing tool'>
            <button
              className='pose-editor-button'
              type='button'
              aria-pressed={state.postureTool === 'rotate'}
              disabled={state.applying}
              onClick={() => editor.setPostureTool('rotate')}
            >
              Rotate joint
            </button>
            <button
              className='pose-editor-button'
              type='button'
              aria-pressed={state.postureTool === 'moveHips'}
              disabled={state.applying}
              onClick={() => editor.setPostureTool('moveHips')}
            >
              Move hips
            </button>
          </div>
          {state.postureTool === 'rotate' && (
            <>
              <h3>Humanoid bone: {state.selectedBone}</h3>
              <select
                aria-label='Selected humanoid bone'
                value={state.selectedBone}
                disabled={state.applying}
                onChange={event => editor.setSelectedBone(event.target.value)}
              >
                {state.boneNames.map(name => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
              <div className='pose-row'>
                <button
                  className='pose-editor-button'
                  type='button'
                  disabled={state.applying}
                  onClick={() => editor.resetSelectedJoint()}
                >
                  Reset joint
                </button>
                <button
                  className='pose-editor-button'
                  type='button'
                  disabled={state.applying || !state.mirrorTargetAvailable}
                  onClick={() => editor.mirrorSelectedJoint()}
                >
                  Mirror to other side
                </button>
              </div>
              {AXES.map(axis =>
                createJSX(
                  RangeControl,
                  {
                    ...historyInteraction,
                    numeric: true,
                    label: `Rotate ${axis.toUpperCase()}`,
                    value: selectedRotation[axis],
                    min: -180,
                    max: 180,
                    step: 1,
                    disabled: state.applying,
                    onChange: value => editor.setSelectedRotation(axis, value),
                  },
                  axis
                )
              )}
              <label className='pose-check'>
                <input
                  type='checkbox'
                  checked={state.mirror}
                  disabled={state.applying}
                  onChange={event => editor.setMirror(event.target.checked)}
                />
                Mirror paired limbs
              </label>
              <label className='pose-check'>
                <input
                  type='checkbox'
                  checked={state.jointLimits}
                  disabled={state.applying}
                  onChange={event => editor.setJointLimits(event.target.checked)}
                />
                Respect joint limits
              </label>
            </>
          )}
          {state.postureTool === 'moveHips' && (
            <>
              <h3>Move hips relative to avatar root</h3>
              {AXES.map((axis, index) =>
                createJSX(
                  RangeControl,
                  {
                    ...historyInteraction,
                    numeric: true,
                    label: `Hips ${axis.toUpperCase()}`,
                    value: hipsPosition[index],
                    min: -1,
                    max: 1,
                    step: 0.01,
                    disabled: state.applying,
                    onChange: value => editor.setHipsTranslation(axis, value),
                  },
                  `hips-${axis}`
                )
              )}
              <p className='pose-help'>
                These offsets move the hips within the avatar. Use Placement to move the whole avatar relative to the
                seat.
              </p>
            </>
          )}
          <h3>Preview on another avatar</h3>
          <div className='pose-row pose-style-row'>
            <input
              aria-label='Preview avatar URL'
              type='text'
              maxLength={2048}
              value={previewUrl}
              onChange={event => setPreviewUrl(event.target.value)}
            />
            <button
              className='pose-editor-button'
              type='button'
              disabled={!previewUrl.trim() || state.previewLoading || state.applying}
              onClick={() => editor.setPreviewAvatar(previewUrl)}
            >
              {state.previewLoading ? 'Loading…' : 'Preview'}
            </button>
            <button
              className='pose-editor-button'
              type='button'
              disabled={(!state.previewingAnotherAvatar && !state.previewLoading) || state.applying}
              onClick={() => {
                setPreviewUrl(state.avatarUrl)
                editor.setPreviewAvatar(state.avatarUrl)
              }}
            >
              Use my avatar
            </button>
          </div>
          {state.previewingAnotherAvatar && (
            <p className='pose-help'>
              Preview only. Save this as a reusable style, then switch back to your avatar before applying.
            </p>
          )}
          <h3>Reusable styles</h3>
          <div className='pose-row pose-style-row'>
            <select
              aria-label='Saved pose styles'
              value={selectedStyle}
              onChange={event => setSelectedStyle(event.target.value)}
            >
              <option value=''>Choose style</option>
              {state.styles.map(style => (
                <option key={style.name} value={style.name}>
                  {style.name}
                </option>
              ))}
            </select>
            <button
              className='pose-editor-button'
              type='button'
              disabled={!selectedStyle || state.applying}
              onClick={() => editor.applyStyle(selectedStyle)}
            >
              Apply
            </button>
            <button
              className='pose-editor-button'
              type='button'
              disabled={!selectedStyle || state.applying}
              onClick={() => editor.deleteStyle(selectedStyle)}
            >
              Delete
            </button>
          </div>
          <div className='pose-row pose-style-row'>
            <input
              aria-label='New pose style name'
              type='text'
              maxLength={32}
              value={styleName}
              onChange={event => setStyleName(event.target.value)}
            />
            <button
              className='pose-editor-button'
              type='button'
              disabled={!styleName.trim() || state.applying}
              onClick={() => {
                editor.saveStyle(styleName)
                setStyleName('')
              }}
            >
              Save style
            </button>
          </div>
        </>
      )}

      {state.mode === 'ik' && (
        <>
          <h3>IK target</h3>
          <select
            aria-label='IK limb'
            value={state.ikLimb}
            disabled={state.applying}
            onChange={event => editor.setIKLimb(event.target.value)}
          >
            {LIMBS.filter(([name]) =>
              name === 'back' ? state.boneNames.includes('spine') : state.boneNames.includes(name)
            ).map(([name, label]) => (
              <option key={name} value={name}>
                {label}
              </option>
            ))}
          </select>
          {AXES.map((axis, index) =>
            createJSX(
              RangeControl,
              {
                ...historyInteraction,
                label: `Target ${axis.toUpperCase()}`,
                value: target[index],
                min: -2,
                max: 2,
                step: 0.01,
                disabled: state.applying,
                onChange: value => editor.setIKTargetAxis(axis, value),
              },
              axis
            )
          )}
          <GuideButtons state={state} editor={editor} />
          {Number.isFinite(state.guides?.floorY) && (
            <button
              className='pose-editor-button'
              type='button'
              disabled={state.applying}
              onClick={() => editor.alignGuide('floor')}
            >
              Align feet to floor
            </button>
          )}
        </>
      )}

      <div className='pose-footer'>
        <div className='pose-row'>
          <button
            className='pose-editor-button'
            type='button'
            disabled={state.applying || !state.canUndo}
            onClick={() => editor.undo()}
          >
            Undo
          </button>
          <button
            className='pose-editor-button'
            type='button'
            disabled={state.applying || !state.canRedo}
            onClick={() => editor.redo()}
          >
            Redo
          </button>
          <button className='pose-editor-button' type='button' disabled={state.applying} onClick={() => editor.reset()}>
            Reset all
          </button>
        </div>
        <div className='pose-row'>
          <button className='pose-editor-button' type='button' disabled={state.applying} onClick={() => editor.close()}>
            Cancel
          </button>
          <button
            className='pose-editor-button primary'
            type='button'
            disabled={state.applying || state.previewingAnotherAvatar || state.previewLoading}
            onClick={() => editor.apply()}
          >
            {state.applying ? 'Applying…' : state.previewingAnotherAvatar ? 'Preview only' : 'Apply to this seat'}
          </button>
          {state.profileId && (
            <button
              className='pose-editor-button'
              type='button'
              title={`Save this calibration as the default for compatible seats (${state.profileId})`}
              disabled={state.applying || state.previewingAnotherAvatar || state.previewLoading}
              onClick={() => editor.apply(true)}
            >
              Save for profile
            </button>
          )}
        </div>
      </div>
    </section>
  )
}

function RangeControl({
  label,
  value = 0,
  min,
  max,
  step,
  disabled,
  numeric = false,
  onChange,
  onInteractionStart,
  onInteractionEnd,
}) {
  const safeValue = Number.isFinite(value) ? value : 0
  const [numericEditing, setNumericEditing] = useState(false)
  const [numericDraft, setNumericDraft] = useState(String(safeValue))

  useEffect(() => {
    if (!numericEditing) setNumericDraft(safeValue.toFixed(step < 1 ? 2 : 0))
  }, [numericEditing, safeValue, step])

  const commitNumeric = event => {
    const rawValue = event.currentTarget.value
    const nextValue = Number(rawValue)
    if (rawValue.trim() && Number.isFinite(nextValue)) onChange(nextValue)
    setNumericEditing(false)
    onInteractionEnd?.()
  }

  return (
    <label>
      <span>{label}</span>
      <input
        type='range'
        min={min}
        max={max}
        step={step}
        value={safeValue}
        disabled={disabled}
        onPointerDown={onInteractionStart}
        onPointerUp={onInteractionEnd}
        onPointerCancel={onInteractionEnd}
        onBlur={onInteractionEnd}
        onChange={event => onChange(Number(event.target.value))}
      />
      {numeric ? (
        <input
          type='number'
          aria-label={`${label} numeric value`}
          min={min}
          max={max}
          step={step}
          value={numericDraft}
          disabled={disabled}
          onFocus={() => {
            setNumericEditing(true)
            setNumericDraft(String(safeValue))
            onInteractionStart?.()
          }}
          onChange={event => setNumericDraft(event.target.value)}
          onBlur={commitNumeric}
          onKeyDown={event => {
            if (event.key === 'Enter') event.currentTarget.blur()
          }}
        />
      ) : (
        <output>{safeValue.toFixed(step < 1 ? 2 : 0)}</output>
      )}
    </label>
  )
}

function GuideButtons({ state, editor }) {
  return (
    <div className='pose-row'>
      {GUIDES.filter(([name]) => state.guides?.[name]).map(([name, label]) => (
        <button
          key={name}
          className='pose-editor-button'
          type='button'
          disabled={state.applying}
          onClick={() => editor.alignGuide(name)}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
