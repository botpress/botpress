import { BoxedVariable, FlowVariableType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

class BoxedEnum extends BaseVariable<string> {
  constructor(args) {
    super(args)
  }

  trySet(value: string, confidence: number) {
    const valid = this.getEnumList().find(x => x.name === value || x.synonyms.find(s => s === value))
    if (valid) {
      this._value = valid.name
      this._confidence = confidence
      return
    }

    if (this.value === undefined) {
      this._confidence = 0
    }

    // TODO Should we throw instead ? Or use the logger ?
    console.error(`Value ${value} is invalid for enum type ${this._enumType}`)
  }
}

const EnumVariableType: FlowVariableType = {
  id: 'enum',
  config: {
    fields: [],
    advancedSettings: []
  },
  box: BoxedEnum
}

export default EnumVariableType
