// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/server/escapeHtml.js
const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }

// escapes a value for html text/attribute content; coerces non-strings the way replaceAll did
export function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, ch => entities[ch])
}

export function renderShell(template, { url, title, desc, image, loadingImage, arrivalImage }) {
  const values = {
    url: escapeHtml(url),
    title: escapeHtml(title),
    desc: escapeHtml(desc),
    image: escapeHtml(image),
    loadingImage: JSON.stringify(loadingImage || '').replaceAll('<', '\\u003c'),
    arrivalImage: arrivalImage ? 'true' : 'false',
  }
  // One pass: text supplied by users cannot introduce another template replacement.
  return template.replace(/\{(url|title|desc|image|loadingImage|arrivalImage)\}/g, (_, key) => values[key])
}
