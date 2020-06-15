import { BoxedVarContructor, BoxedVariable } from 'botpress/sdk'
import { FlowVariableConfig, FlowVariableType } from 'common/typings'

class BoxedNumber implements BoxedVariable<number> {
  private _confidence?: number
  private _value?: number
  private _nbTurns?: number

  constructor({ nbOfTurns, value }: BoxedVarContructor<number | string>) {
    if (typeof value === 'boolean') {
      this._value = value
      this._confidence = 1
    } else if (typeof value === 'string') {
      this._value = Number(value)
      this._confidence = 0.5
    }

    this._nbTurns = nbOfTurns
  }

  get value() {
    return this._value
  }

  set value(val) {
    this._value = val
  }

  trySet(val: number, confidence: number) {
    this._value = val
    this._confidence = confidence
  }

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  toString() {
    return this._value.toString()
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: NumberVariableType.id }
  }
}

const NumberVariableType: FlowVariableType = {
  id: 'number',
  config: undefined,
  box: BoxedNumber
}

export default NumberVariableType
