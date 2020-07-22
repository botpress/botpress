import { BoxedVariable, FlowVariableType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

class BoxedString extends BaseVariable<string> {
  constructor(args) {
    super(args)
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

  compare(compareTo: BoxedVariable<string>) {
    if (this.type !== compareTo.type) {
      throw new Error('You can only compare variables of the same type')
    }

    return this.value.localeCompare(compareTo.value)
  }

  toString() {
    return this._value
  }
}

const StringVariableType: FlowVariableType = {
  id: 'string',
  config: {
    fields: [],
    advancedSettings: []
  },
  box: BoxedString
}

export default StringVariableType
