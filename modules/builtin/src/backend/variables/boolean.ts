import { BoxedVariable, FlowVariableType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'
import yn from 'yn'

class BoxedBoolean extends BaseVariable<boolean> {
  constructor(args) {
    super(args)
  }

  trySet(value: boolean, confidence: number) {
    if (typeof value === 'boolean') {
      this._value = value
      this._confidence = confidence
    } else {
      this._value = yn(value)
      this._confidence = 0.5 * confidence
    }

    if (this._value === undefined) {
      this._confidence = 0
    }
  }

  toString(customFormat?: string) {
    // TODO: translations
    if (customFormat === 'y/n') {
      return this._value ? 'Yes' : 'No'
    } else {
      return this._value ? 'True' : 'False'
    }
  }
}

const BooleanVariableType: FlowVariableType = {
  id: 'boolean',
  config: {
    fields: [
      {
        type: 'checkbox',
        key: 'defaultValue',
        label: 'module.builtin.defaultValue'
      }
    ],
    advancedSettings: []
  },
  box: BoxedBoolean
}

export default BooleanVariableType
