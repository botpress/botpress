import { PrimitiveVarType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import { common, createOperator, getCommonOperators } from './common'

class BoxedNumber extends BaseVariable<number> {
  constructor(args) {
    super(args)
  }

  parse(text: string): number {
    return +text
  }

  smallerThan(other: number) {
    return this.value < other
  }

  smallerOrEqualTo(other: number) {
    return this.value <= other
  }

  largerThan(other: number) {
    return this.value > other
  }

  largerOrEqualTo(other: number) {
    return this.value >= other
  }

  trySet(value: number, confidence: number) {
    if (typeof value === 'number') {
      this._value = value
      this._confidence = confidence
    } else if (typeof value === 'string') {
      const extracted = (<string>value).replace(/^\D+/g, '')
      this._value = Number(extracted)
      this._confidence = confidence * 0.75
    } else {
      this._value = Number(value)
      this._confidence = confidence * 0.5
    }

    if (this._value === undefined) {
      this._confidence = 0
    }
  }

  toString(customFormat?: string) {
    return this._value.toString()
  }
}

const NumberVariableType: PrimitiveVarType = {
  id: 'number',
  config: {
    label: 'number',
    icon: 'numerical',
    operators: [
      ...getCommonOperators('number'),
      createOperator('number', 'smallerThan'),
      createOperator('number', 'largerThan'),
      createOperator('number', 'smallerOrEqualTo'),
      createOperator('number', 'largerOrEqualTo')
    ],
    fields: common.fields,
    advancedSettings: common.advancedSettings
  },
  box: BoxedNumber
}

export default NumberVariableType
