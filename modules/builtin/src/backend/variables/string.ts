import sdk from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import { common, createOperator, getCommonOperators } from './common'

interface Variable extends sdk.BoxedVariable<string> {
  parse(text: string): string
  contains: (str: string) => boolean
  startsWith: (str: string) => boolean
  endsWith: (str: string) => boolean
}

class BoxedString extends BaseVariable<string> implements Variable {
  constructor(args) {
    super(args)
  }

  parse(text: string): string {
    // We replace escaped '
    return text.replace(/\\'/gs, "'")
  }

  contains(other: string) {
    return this.value.includes(other)
  }

  startsWith(other: string) {
    return this.value.startsWith(other)
  }

  endsWith(other: string) {
    return this.value.endsWith(other)
  }

  trySet(value: string, confidence: number) {
    if (typeof value === 'string') {
      this._value = value
      this._confidence = confidence
    } else {
      this._value = String(value)
      this._confidence = 0.5 * confidence
    }

    if (this.value === undefined) {
      this._confidence = 0
    }
  }

  compare(compareTo: Variable) {
    if (this.type !== compareTo.type) {
      throw new Error('You can only compare variables of the same type')
    }

    return this.value.localeCompare(compareTo.value)
  }

  toString() {
    return this._value
  }
}

const definition: sdk.PrimitiveVarType = {
  id: 'string',
  config: {
    label: 'string',
    icon: 'font',
    operators: [
      ...getCommonOperators('string'),
      createOperator('string', 'contains'),
      createOperator('string', 'startsWith'),
      createOperator('string', 'endsWith'),
      createOperator('string', 'isIncludedIn')
    ],
    fields: [
      ...common.fields,
      {
        type: 'text',
        key: 'defaultValue',
        label: 'module.builtin.defaultValue'
      }
    ],
    advancedSettings: common.advancedSettings,
    inputType: 'textarea',
    canAddOptions: true
  },
  box: BoxedString
}

export default definition
