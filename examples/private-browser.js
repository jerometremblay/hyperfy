/* global app */

// Each client gets its own interactive iframe and page state.
const browser = app.create('webview', {
  src: 'https://ici.radio-canada.ca/',
  width: 2.4,
  height: 1.35,
  factor: 240,
  interactive: true,
  position: [0, 1.5, -2],
})

app.add(browser)
