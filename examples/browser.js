/* global app */

// Shared browser screen: the server captures this URL once and all clients
// display the same screenshot texture.
const browser = app.create('browser', {
  src: 'https://ici.radio-canada.ca/',
  width: 2.4,
  height: 1.35,
  interval: 1000,
  position: [0, 1.5, -2],
})

app.add(browser)
