import { FormDefinition } from 'botpress/sdk'

const common: FormDefinition = {
  fields: [],
  advancedSettings: [
    {
      type: 'number',
      key: 'duration',
      defaultValue: 5,
      moreInfo: {
        label: 'The number of turns (exchange between bot and user) before the prompt is cancelled automatically'
      },
      label: 'module.builtin.duration'
    },
    {
      type: 'number',
      key: 'searchBackCount',
      defaultValue: 0,
      moreInfo: { label: 'The number of previous events to analyze to try extracting the information' },
      label: 'module.builtin.searchBackCount'
    },
    {
      type: 'checkbox',
      key: 'confirmBeforeCancel',
      moreInfo: { label: 'Ask a confirmation to the user before cancelling or moving to another flow' },
      label: 'module.builtin.confirmBeforeCancel'
    }
  ]
}

export default common
