import sdk from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import { common, getCommonOperators } from './common'

interface Variable extends sdk.BoxedVariable<string> {}

class BoxedPattern extends BaseVariable<string> implements Variable {
  constructor(args) {
    super(args)
  }

  parse(text: string): string {
    // We replace escaped '
    return text.replace(/\\'/gs, "'")
  }

  trySet(value: string, confidence: number) {
    try {
      for (const regex of this.getValidationData().patterns) {
        if (regex.test(value)) {
          this._value = value
          this._confidence = confidence
          return
        }
      }

      this._confidence = 0
    } catch (err) {
      console.error("Value doesn't match pattern")
    }
  }
}

const definition: sdk.PrimitiveVarType = {
  id: 'pattern',
  config: {
    label: 'pattern',
    icon: 'comparison',
    operators: [...getCommonOperators('pattern')],
    fields: [
      ...common.fields,
      {
        type: 'hidden',
        key: 'subType',
        label: 'subType'
      }
    ],
    advancedSettings: common.advancedSettings
  },
  box: BoxedPattern
}

export default definition
