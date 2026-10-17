/* global app, props */

const presets = [
  'Ash Small',
  'Ash Medium',
  'Ash Large',
  'Aspen Small',
  'Aspen Medium',
  'Aspen Large',
  'Bush 1',
  'Bush 2',
  'Bush 3',
  'Oak Small',
  'Oak Medium',
  'Oak Large',
  'Pine Small',
  'Pine Medium',
  'Pine Large',
  'Trellis',
]

app.configure([
  {
    key: 'preset',
    type: 'switch',
    label: 'Preset',
    initial: 'Oak Small',
    options: presets.map(value => ({ value, label: value })),
  },
  {
    key: 'seed',
    type: 'text',
    label: 'Seed',
    initial: '',
    placeholder: 'Preset seed',
    hint: 'Set a numeric seed for a repeatable tree. Leave blank to use the preset or Advanced JSON seed.',
  },
  {
    key: 'randomizeSeed',
    type: 'randomize',
    target: 'seed',
    label: 'Randomize Seed',
    hint: 'Generate a new seed for a different tree shape.',
  },
  {
    key: 'advanced',
    type: 'toggle',
    label: 'Advanced Mode',
    initial: false,
  },
  {
    key: 'advancedOptions',
    type: 'textarea',
    label: 'EZ-Tree Parameters (JSON)',
    initial: '{}',
    hint: 'Partial TreeOptions JSON merged over the selected preset. See the Tree node reference for all parameters.',
    when: [{ key: 'advanced', op: 'eq', value: true }],
  },
])

function getAdvancedOptions(value) {
  if (typeof value !== 'string' || !value.trim()) return {}
  try {
    const options = JSON.parse(value)
    if (!options || typeof options !== 'object' || Array.isArray(options)) {
      throw new Error('Options must be a JSON object')
    }
    return options
  } catch (error) {
    console.error('[tree] invalid advanced options JSON', error)
    return {}
  }
}

function getSeed(value) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value !== 'string' || !value.trim()) return null
  const seed = Number(value)
  if (Number.isFinite(seed)) return seed
  console.error('[tree] seed must be a finite number')
  return null
}

const tree = app.create('tree', {
  preset: props.preset || 'Oak Small',
  seed: getSeed(props.seed),
  options: props.advanced ? getAdvancedOptions(props.advancedOptions) : {},
})
app.add(tree)
