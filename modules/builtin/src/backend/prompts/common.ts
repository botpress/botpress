import { FormDefinition } from 'botpress/sdk'

const common: FormDefinition = {
  fields: [
    {
      type: 'text',
      key: 'question',
      translated: true,
      required: true,
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
      // moreInfo: { label: 'module.builtin.durationMoreInfo' },
      label: 'module.builtin.duration'
    },
    {
      type: 'number',
      key: 'searchBackCount',
      defaultValue: 2,
      min: 0,
      max: 10,
      // moreInfo: { label: 'module.builtin.searchBackCountMoreInfo' },
      label: 'module.builtin.searchBackCount'
    },
    {
      type: 'checkbox',
      key: 'cancellable',
      defaultValue: true,
      label: 'Prompt can be cancelled'
    },
    {
      type: 'checkbox',
      key: 'confirmCancellation',
      // moreInfo: { label: 'module.builtin.confirmBeforeCancelMoreInfo' },
      label: 'module.builtin.confirmBeforeCancel'
    }
  ]
}

export default common
