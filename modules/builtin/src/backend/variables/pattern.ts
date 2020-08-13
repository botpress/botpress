import { BoxedVariable, PrimitiveVarType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import common from './common'

class BoxedPattern extends BaseVariable<string> {
  constructor(args) {
    super(args)
  }

  trySet(value: string, confidence: number) {
    this._value = value
    this._confidence = confidence
  }
}

const PatternVariableType: PrimitiveVarType = {
  id: 'pattern',
  config: {
    label: 'pattern',
    icon: 'comparison',
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

export default PatternVariableType
