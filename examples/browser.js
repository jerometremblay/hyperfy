/* global app */

// V1 browser screen: load a URL into a read-only world-space webview.
//
// This uses Hyperfy's existing CSS3D webview path. It behaves like a 3D
// screen, but is intentionally not a WebGL texture yet. A true texture for
// arbitrary websites needs a server-side browser renderer.
const browser = app.create('webview', {
  src: 'https://example.com',
  width: 2.4,
  height: 1.35,
  factor: 160,
  interactive: false,
  position: [0, 1.5, -2],
})

app.add(browser)
