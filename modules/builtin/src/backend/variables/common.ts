import { FormDefinition } from 'botpress/sdk'

const common: FormDefinition = {
  fields: [
    {
      type: 'text',
      key: 'name',
      required: true,
      maxLength: 150,
      placeholder: 'module.builtin.variable.namePlaceholder',
      label: 'name',
      valueManipulation: {
        regex: '[^a-z0-9-_.]',
        modifier: 'gi',
        replaceChar: '_'
      }
    },
    {
      type: 'text',
      key: 'description',
      placeholder: 'module.builtin.variable.descPlaceholder',
      label: 'description'
    },

    {
      type: 'checkbox',
      key: 'isInput',
      label: 'module.builtin.variable.input'
    },
    {
      type: 'checkbox',
      key: 'isOutput',
      label: 'module.builtin.variable.output'
    }
  ],
  advancedSettings: []
}

export default common
