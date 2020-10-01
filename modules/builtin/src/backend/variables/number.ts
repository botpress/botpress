import sdk from 'botpress/sdk'
import { BaseVariable } from 'common/variables'

import { common, createOperator, getCommonOperators } from './common'

interface Variable extends sdk.BoxedVariable<number> {
  parse(text: string): number
  smallerThan(other: number): boolean
  smallerOrEqualTo(other: number): boolean
  largerThan(other: number): boolean
  largerOrEqualTo(other: number): boolean
}

class BoxedNumber extends BaseVariable<number> implements Variable {
  constructor(args) {
    super(args)
  }

  parse(text: string): number {
    return +text
  }

  smallerThan(other: number): boolean {
    return this.value < other
  }

  smallerOrEqualTo(other: number): boolean {
    return this.value <= other
  }

  largerThan(other: number): boolean {
    return this.value > other
  }

  largerOrEqualTo(other: number): boolean {
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

  toString() {
    return this._value.toString()
  }
}

const definition: sdk.PrimitiveVarType = {
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
    fields: [
      ...common.fields,
      {
        type: 'number',
        key: 'defaultValue',
        label: 'module.builtin.defaultValue'
      }
    ],
    advancedSettings: common.advancedSettings,
    inputType: 'number',
    canAddOptions: true
  },
  box: BoxedNumber
}

export default definition
