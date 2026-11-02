// Y up, +X right, -Z forward; the native portal's front (+Z) faces the pool.
// This is an explicit link to the house's two portal doors.
if (world.isClient) {
  const portal = app.get('WorldPortal')
  const portalId = props.portalId || app.instanceId
  world.on('larch-house-portal-preview', message => {
    if (message?.portalId !== portalId || typeof message.enabled !== 'boolean') return
    portal.previewFront = message.enabled
  })
  app.emit('larch-house-portal-preview-request', { portalId })
}
