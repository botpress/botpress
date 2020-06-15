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

  get value(): number | undefined {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  set value(newValue: number) {
    this.trySet(newValue, 1)
  }

  trySet(value: number, confidence: number) {
    if (typeof value === 'number') {
      this.value = value
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

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  getConfidence() {
    return this._confidence
  }

  toString(customFormat?: string) {
    return this._value.toString()
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedNumber.type }
  }
}

export default BoxedNumber
