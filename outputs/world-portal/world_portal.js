// Optional construction example. Travel is built into the native portal node.
// +Y up, +X right, -Z forward; the portal faces local +Z.
app.add(
  app.create('portal', {
    portalId: app.instanceId,
    url: props.destination || '',
    target: props.destinationPortalId || '',
    doubleside: props.doubleside === 'true',
    position: [0, 1.2, 0],
  })
)
