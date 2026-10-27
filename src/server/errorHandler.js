// Adapted from https://github.com/dwebxr/coo-world/blob/f40fb416e19909b1a22e5807d18be587b6d8b871/src/server/errorHandler.js
// The root error handler. A client error keeps its 4xx status and the error's own headers (such as
// Content-Range on a 416): fastify's own 400/413/415 body-parser answers, a refused Brotli request body, or a
// non-canonical static path such as `//index.css` (@fastify/static 10 refuses those with 403). Anyone can send
// those in a loop, so a 4xx logs one line without a stack. The line still matters: @fastify/static also answers
// 403, with the cause discarded, when it cannot read a static directory (EIO, EMFILE), so a run of 403s on
// ordinary paths is a storage fault. Only the path is logged (see loggedPath).
// Everything else is logged with its stack and answered 500 with the existing generic JSON response.
const MAX_LOGGED_PATH = 200
const SCHEME_AND_AUTHORITY = /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i

// the request target's path, spelled as sent (`//` and `/./` kept): no query or fragment (/ws carries the auth
// token in its query), and no scheme or authority (an absolute-form target such as `http://user:pass@host/x`
// carries credentials). Any other target form (`*`, `host:port`) logs as `-`.
export function loggedPath(url) {
  let target = String(url ?? '')
  const absolute = SCHEME_AND_AUTHORITY.exec(target)
  if (absolute) target = target.slice(absolute[0].length)
  target = target.split(/[?#]/)[0]
  if (absolute && target === '') target = '/'
  return target.startsWith('/') ? target.slice(0, MAX_LOGGED_PATH) : '-'
}

export function errorHandler(err, req, reply) {
  const code = err?.statusCode
  if (Number.isInteger(code) && code >= 400 && code < 500) {
    console.error(`[http] ${code} ${req.method} ${loggedPath(req.url)}`)
    if (err.headers && typeof err.headers === 'object') reply.headers(err.headers)
    return reply.status(code).send({ error: err.message })
  }
  console.error(err)
  reply.status(500).send({ error: 'Internal server error' })
}
