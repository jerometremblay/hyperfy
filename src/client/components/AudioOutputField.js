import { useState } from 'react'
import { FieldBtn, FieldSelect } from './Fields'

export function AudioOutputField({ world }) {
  const [devices, setDevices] = useState(null)
  const [selected, setSelected] = useState(world.audio.outputDevice)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)
  if (!world.audio.ctx.setSinkId) return null
  const load = async () => {
    setBusy(true)
    setError(null)
    try {
      setDevices(await world.audio.getOutputDevices())
    } catch {
      setError('Allow browser audio permission to list your speakers and headphones.')
    } finally {
      setBusy(false)
    }
  }
  const select = async deviceId => {
    setError(null)
    try {
      await world.audio.setOutputDevice(deviceId)
      setSelected(deviceId)
    } catch {
      setError('That output is unavailable. Refresh the list and choose another device.')
    }
  }
  return (
    <>
      <FieldBtn
        label='Audio output'
        note={busy ? 'Loading…' : devices ? 'Refresh' : 'Choose'}
        hint='Choose headphones or speakers for Hyperfy playback when streaming your Mac audio.'
        onClick={() => !busy && load()}
      />
      {devices && (
        <FieldSelect
          label='Playback device'
          hint='Use a physical output to keep Hyperfy playback out of the stream.'
          options={[
            { label: 'System default', value: '' },
            ...devices.map(device => ({ label: device.label || 'Audio output', value: device.deviceId })),
          ]}
          value={selected}
          onChange={select}
        />
      )}
      {error && <p role='alert' style={{ padding: '0.5rem 1rem' }}>{error}</p>}
    </>
  )
}
