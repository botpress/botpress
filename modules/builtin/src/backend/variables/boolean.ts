import { PrimitiveVarType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'
import yn from 'yn'

import { common, getCommonOperators } from './common'

class BoxedBoolean extends BaseVariable<boolean> {
  constructor(args) {
    super(args)
  }

  parse(text: string): boolean {
    return yn(text)
  }

  isTrue() {
    return this.value
  }

  isFalse() {
    return !this.value
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

const BooleanVariableType: PrimitiveVarType = {
  id: 'boolean',
  config: {
    label: 'boolean',
    icon: 'segmented-control',
    operators: [
      ...getCommonOperators('boolean'),
      {
        func: 'isTrue',
        label: `module.builtin.operator.isTrue`,
        caption: 'module.builtin.operations.selfOperation',
        fields: [],
        advancedSettings: []
      },
      {
        func: 'isFalse',
        label: `module.builtin.operator.isFalse`,
        caption: 'module.builtin.operations.selfOperation',
        fields: [],
        advancedSettings: []
      }
    ],
    fields: [
      ...common.fields,
      {
        type: 'checkbox',
        key: 'defaultValue',
        label: 'module.builtin.defaultValue'
      }
    ],
    advancedSettings: common.advancedSettings
  },
  box: BoxedBoolean
}

export default BooleanVariableType
