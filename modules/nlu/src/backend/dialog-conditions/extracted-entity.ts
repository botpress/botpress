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
    comparison: {
      label: 'Comparison method',
      type: 'list',
      list: {
        items: [
          { label: 'None', value: 'none' },
          { label: 'Equal', value: 'equal' },
          { label: 'Not equal', value: 'notEqual' },
          { label: 'Bigger than', value: 'biggerThan' },
          { label: 'Less than', value: 'lessThan' }
        ]
      }
    },
    expectedValue: { label: 'Expected value', type: 'string' }
  },
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
