import { Condition } from 'botpress/sdk'
import _ from 'lodash'

export default {
  id: 'extracted_entity',
  label: 'module.nlu.conditions.variableExtractedFromMessage',
  description: 'Entity {type} {comparison} {value}',
  fields: [
    {
      key: 'type',
      type: 'select',
      label: 'module.nlu.conditions.fields.label.variableType',
      placeholder: 'module.nlu.conditions.fields.placeholder.pickVariableType',
      dynamicOptions: {
        endpoint: 'BOT_API_PATH/nlu/entities',
        valueField: 'label',
        labelField: 'label'
      }
    },
    {
      key: 'comparison',
      label: 'module.nlu.conditions.fields.label.comparisonMethod',
      placeholder: 'module.nlu.conditions.fields.placeholder.pickComparisonMethod',
      type: 'select',
      options: [
        { label: 'module.nlu.conditions.fields.label.none', value: 'none' },
        { label: 'module.nlu.conditions.fields.label.equal', value: 'equal' },
        { label: 'module.nlu.conditions.fields.label.notEqual', value: 'notEqual' },
        { label: 'module.nlu.conditions.fields.label.biggerThan', value: 'biggerThan' },
        { label: 'module.nlu.conditions.fields.label.lessThan', value: 'lessThan' }
      ]
    },
    { key: 'expectedValue', label: 'module.nlu.conditions.fields.label.expectedValue', type: 'text' }
  ],
  evaluate: (event, params) => {
    const { type, comparison, expectedValue } = params
    const entity = event.nlu?.entities?.find(x => x.type === type)

    if (!entity) {
      return 0
    } else if (!comparison || !expectedValue || comparison === 'none') {
      return 1
    }

    const entityValue = entity.data?.value

    return (comparison === 'equal' && entityValue === expectedValue) ||
      (comparison === 'notEqual' && entityValue !== expectedValue) ||
      (comparison === 'biggerThan' && entityValue > expectedValue) ||
      (comparison === 'lessThan' && entityValue < expectedValue)
      ? 1
      : 0
  }
} as Condition
