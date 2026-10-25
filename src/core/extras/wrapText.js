// Backported from https://github.com/dwebxr/coo-world/blob/bfa578afee8b08133018ac637a548f45a374f739/src/core/extras/wrapText.js
// characters that must not start a line; one of them may hang past the edge at the end of the previous line
const hangingPunctuation = new Set('、。，．,.!?！？）」』】〕〉》ーっゃゅょぁぃぅぇぉッャュョァィゥェォ')
const segmenter =
  typeof Intl.Segmenter === 'function' ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null

export function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ')
  const lines = []
  let currentLine = ''

  for (let i = 0; i < words.length; i++) {
    const word = words[i]
    const nextLine = i === 0 ? word : currentLine + ' ' + word
    if (ctx.measureText(nextLine).width <= maxWidth) {
      currentLine = nextLine
      continue
    }
    if (currentLine) {
      lines.push(currentLine)
      currentLine = ''
    }
    // a word that does not fit on its own line (e.g. text without spaces) breaks between graphemes;
    // only one hanging character may pass the edge, so a run of them still wraps
    const graphemes = segmenter ? Array.from(segmenter.segment(word), part => part.segment) : Array.from(word)
    let overhung = false
    for (const grapheme of graphemes) {
      if (currentLine && ctx.measureText(currentLine + grapheme).width > maxWidth) {
        if (!overhung && hangingPunctuation.has(grapheme[0])) {
          overhung = true
        } else {
          lines.push(currentLine)
          currentLine = ''
          overhung = false
        }
      }
      currentLine += grapheme
    }
  }
  lines.push(currentLine)

  return lines
}
