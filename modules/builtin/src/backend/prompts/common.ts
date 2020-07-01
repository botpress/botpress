import { FormDefinition } from 'botpress/sdk'

const common: FormDefinition = {
  fields: [
    {
      type: 'text',
      key: 'output',
      label: 'module.builtin.setValueTo',
      placeholder: 'module.builtin.setValueToPlaceholder',
      valueManipulation: {
        regex: '[^a-z0-9-_.]',
        modifier: 'gi',
        replaceChar: '_'
      }
    },
    {
      type: 'text',
      key: 'question',
      translated: true,
      maxLength: 150,
      placeholder: 'module.builtin.messagePlaceholder',
      label: 'message'
    }
  ],
  advancedSettings: [
    {
      type: 'text',
      key: 'confirm',
      translated: true,
      maxLength: 150,
      placeholder: 'module.builtin.customConfirmPlaceholder',
      label: 'module.builtin.customConfirm'
    },
    {
      type: 'number',
      key: 'duration',
      defaultValue: 5,
      min: 0,
      moreInfo: { label: 'module.builtin.durationMoreInfo' },
      label: 'module.builtin.duration'
    },
    {
      type: 'number',
      key: 'searchBackCount',
      defaultValue: 0,
      min: 0,
      max: 10,
      moreInfo: { label: 'module.builtin.searchBackCountMoreInfo' },
      label: 'module.builtin.searchBackCount'
    },
    {
      type: 'checkbox',
      key: 'confirmBeforeCancel',
      moreInfo: { label: 'module.builtin.confirmBeforeCancelMoreInfo' },
      label: 'module.builtin.confirmBeforeCancel'
    }
  ]
}

export default common
