import { startServer } from './server.js'
import { createDisplay } from './render.js'
import { startClient } from './client.js'

// Y up, +X right, -Z forward. Root at floor; board front faces +Z.
app.configure([{ key: 'boardTexture', type: 'file', kind: 'texture', label: 'Dartboard artwork' }])
if (world.isServer) startServer(world, app)
if (world.isClient || world.isPreview) {
  const display = createDisplay(app, props.boardTexture?.url || DARTS_TEXTURE)
  if (!world.isPreview) startClient(world, app, display)
}
