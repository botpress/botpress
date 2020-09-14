import sdk from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import { common, getCommonOperators } from './common'

interface Variable extends sdk.BoxedVariable<string> {}

class BoxedEnum extends BaseVariable<string> implements Variable {
  constructor(args) {
    super(args)
  }

  trySet(value: string, confidence: number) {
    const valid = this.getValidationData?.()?.elements.find(x => x.name === value || x.synonyms.find(s => s === value))
    if (valid) {
      this._value = valid.name
      this._confidence = confidence
      return
    }

    if (this.value === undefined) {
      this._confidence = 0
    }

    // TODO Should we throw instead ? Or use the logger ?
    console.error(`Value ${value} is invalid for enum type ${this._subType}`)
  }
}

const definition: sdk.PrimitiveVarType = {
  id: 'enumeration',
  config: {
    label: 'enum',
    icon: 'properties',
    operators: [...getCommonOperators('enumeration')],
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
  box: BoxedEnum
}

export default definition
