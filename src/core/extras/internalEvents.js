// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/internalEvents.js
// Event names raised by the engine itself: app hooks (App.js) and world events.
// Scripts may not emit or send them, and the server never dispatches them from the network.
export const internalEvents = [
  'transform',
  'props',
  'location',
  'fixedUpdate',
  'update',
  'updated',
  'animate',
  'lateUpdate',
  'destroy',
  'enter',
  'leave',
  'wallet',
  'chat',
  'command',
  'health',
]
