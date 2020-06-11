import { BoxedVarContructor, BoxedVariable, FlowVariableConfig } from 'botpress/sdk'

class BoxedNumber implements BoxedVariable<number> {
  public static type = 'number'
  public static config: FlowVariableConfig = {
    name: 'number',
    label: 'number',
    params: []
  }
  private _confidence?: number
  private _value?: number
  private _nbTurns?: number

  constructor({ nbOfTurns, value, confidence }: BoxedVarContructor<number>) {
    if (value) {
      this._nbTurns = nbOfTurns
      this.trySet(value, confidence)
    }
  }

  get value(): number {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  set value(newValue: number) {
    this.trySet(newValue, 1)
  }

  trySet(value: number, confidence: number) {
    try {
      if (typeof value === 'number') {
        this._value = value
        this._confidence = confidence
      } else {
        this._value = Number(value)
        this._confidence = 0.5
      }
    } catch {
      this._confidence = 0
    }
  }

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  getConfidence() {
    return this._confidence
  }

  toString() {
    return this._value.toString()
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedNumber.type }
  }
}

export default BoxedNumber
