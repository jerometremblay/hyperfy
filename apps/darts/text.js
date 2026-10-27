// Hyperfy's UIText wraps whitespace, including newlines. Use stable child rows.
export function textLines(app, panel, count, options) {
  const rows = Array.from({ length: count }, () => {
    const row = app.create('uitext', { ...options, value: '', display: 'none' })
    panel.add(row)
    return row
  })
  return value => {
    const lines = String(value).split('\n')
    rows.forEach((row, index) => {
      const line = lines[index] || ''
      if (row.value !== line) row.value = line
      const display = line ? 'flex' : 'none'
      if (row.display !== display) row.display = display
    })
  }
}
