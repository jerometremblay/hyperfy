export function portalFields(portalId) {
  return [
    {
      key: 'doubleside',
      type: 'switch',
      label: 'Sides',
      options: [
        { label: 'One-sided', value: 'false' },
        { label: 'Two-sided', value: 'true' },
      ],
      initial: 'false',
      hint: 'One-sided portals are entered from the front (+Z) only; the inactive back is light gray.',
    },
    {
      key: 'destination',
      type: 'text',
      label: 'Destination world URL',
      placeholder: 'https://…',
      hint: 'Leave blank to link to another portal in this world.',
      initial: '',
    },
    {
      key: 'destinationPortalId',
      type: 'text',
      label: 'Destination portal ID',
      placeholder: 'Paste a portal ID',
      hint: 'Copy the ID from the destination portal. Add a world URL for another world.',
      initial: '',
    },
    {
      key: 'resolution',
      type: 'switch',
      label: 'Preview resolution',
      options: [
        { label: 'Low (256 px)', value: '256' },
        { label: 'Medium (512 px)', value: '512' },
        { label: 'High (1024 px)', value: '1024' },
        { label: 'Max (current render resolution)', value: 'max' },
      ],
      initial: '256',
    },
    {
      key: 'updateRate',
      type: 'switch',
      label: 'Preview update rate',
      options: [
        { label: 'Low (15 FPS)', value: '15' },
        { label: 'Medium (30 FPS)', value: '30' },
        { label: 'Every frame', value: '0' },
      ],
      initial: '15',
    },
    {
      key: 'portalId',
      type: 'copy',
      label: 'Copy portal ID',
      value: portalId,
      hint: 'Copies this portal’s unique ID to the clipboard.',
    },
  ]
}
