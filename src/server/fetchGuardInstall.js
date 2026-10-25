// Backported from https://github.com/dwebxr/coo-world/blob/66d5ff94742886ae8034661e870af681dbf57749/src/server/fetchGuardInstall.js
// Side effect: install the server-side fetch Brotli guard before any repo module can fetch.
// Imported by index.js right after the SES lockdown; see fetchGuard.js.
import { installFetchBrotliGuard } from './fetchGuard.js'

installFetchBrotliGuard()
console.log('[fetch] brotli guard installed')
