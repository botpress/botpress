import { FlowVariableOperator, FormDefinition } from 'botpress/sdk'

export const common: FormDefinition = {
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

export const getCommonOperators = (variableType: string): FlowVariableOperator[] => {
  return [createOperator(variableType, 'equals')]
}

export const createOperator = (variableType: string, func: string): FlowVariableOperator => {
  return {
    func,
    label: `module.builtin.operator.${func}`,
    caption: 'module.builtin.operations.standard',
    fields: [
      {
        type: 'text',
        superInput: true,
        key: 'other',
        required: true,
        label: 'module.builtin.value',
        placeholder: 'module.builtin.enterValue',
        variableTypes: [variableType],
        defaultVariableType: variableType
      }
    ],
    advancedSettings: []
  }
}
