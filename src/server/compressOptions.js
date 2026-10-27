// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/compressOptions.js
// @fastify/compress options. Responses keep every encoding (encoding is not the risky side), but request
// bodies are decompressed only from gzip and deflate: no client of this server sends a compressed body, and
// keeping Brotli off unauthenticated input means a Brotli decoder flaw (CVE-2026-111497) cannot be reached
// that way. A Brotli-encoded request is refused before any decoding (the plugin raises 415; the server's error
// handler answers 415), and routes declared before the plugin loads never decode request bodies at all.
// A route that sets config.decompress to an object must repeat requestEncodings: the plugin rebuilds the
// route's decompression params from that object and would otherwise allow every encoding again.
export function compressOptions() {
  return { requestEncodings: ['gzip', 'deflate', 'identity'] }
}
