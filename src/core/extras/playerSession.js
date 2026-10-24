export function sanitizePlayerSession(value) {
  const vector = (value, length) => Array.isArray(value) && value.length === length && value.every(Number.isFinite)
  if (!value || !vector(value.position, 3) || !vector(value.quaternion, 4)) return null
  const normalize = value => {
    const length = Math.hypot(...value)
    return length > 0 ? value.map(component => component / length) : null
  }
  const quaternion = normalize(value.quaternion)
  const camera = value.camera
  if (
    !quaternion ||
    !camera ||
    !vector(camera.quaternion, 4) ||
    !Number.isFinite(camera.zoom) ||
    camera.zoom < 0 ||
    camera.zoom > 100 ||
    typeof camera.firstPerson !== 'boolean'
  )
    return null
  const orientation = normalize(camera.quaternion)
  if (!orientation) return null
  return {
    position: value.position.slice(),
    quaternion,
    camera: { quaternion: orientation, zoom: camera.zoom, firstPerson: camera.firstPerson },
  }
}
