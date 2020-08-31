import { BoxedVariable, PrimitiveVarType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import { common } from './common'

class BoxedComplex extends BaseVariable<string> {
  constructor(args) {
    super(args)
  }

  trySet(value: string, confidence: number) {
    try {
      let valid = false
      for (const regex of this.getValidationData().patterns) {
        if (regex.test(value)) {
          valid = true
          break
        }
      }

      if (this.getValidationData().elements.find(x => x.name === value || x.synonyms.find(s => s === value))) {
        valid = true
      }

      if (valid) {
        this._value = value
        this._confidence = confidence
      }
    } catch (err) {
      console.error("Value doesn't match pattern")
    }
  }
}

const ComplexVariableType: PrimitiveVarType = {
  id: 'complex',
  config: {
    label: 'complex',
    icon: 'list-columns',
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
  box: BoxedComplex
}

export default ComplexVariableType
