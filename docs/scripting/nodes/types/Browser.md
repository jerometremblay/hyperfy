# Browser

Displays a shared, read-only browser page as a WebGL texture. The Hyperfy server captures the configured URL with the Chrome DevTools Protocol, and every client receives the same screenshot.

This node does not support interaction or navigation yet. The server-side Chrome session owns the page state, including cookies and login state.

## Setup

Start Chrome with remote debugging enabled. Chrome 136 and later require a non-default profile directory:

```bash
/Applications/Google\\ Chrome.app/Contents/MacOS/Google\\ Chrome \\
  --remote-debugging-port=9222 \\
  --user-data-dir=/tmp/hyperfy-browser-profile
```

Keep port `9222` bound to localhost. Set `BROWSER_CDP_URL` only when Chrome is running at another local endpoint.

## Properties

### `.src`: String

The absolute `http://` or `https://` URL captured by the server.

### `.width`: Number

The screen width in meters. Defaults to `2.4`.

### `.height`: Number

The screen height in meters. Defaults to `1.35`.

### `.interval`: Number

How often each client requests the latest shared screenshot, in milliseconds. Defaults to `1000`.

### `.doubleside`: Boolean

Whether the texture is visible from both sides. Defaults to `false`.

### `.{...Node}`

Inherits all [Node](/docs/scripting/nodes/Node.md) properties.

## Example

```javascript
const browser = app.create('browser', {
  src: 'https://ici.radio-canada.ca/',
  width: 2.4,
  height: 1.35,
  interval: 1000,
  position: [0, 1.5, -2],
})

app.add(browser)
```
