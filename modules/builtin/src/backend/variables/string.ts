import { BoxedVarContructor, BoxedVariable, FlowVariableConfig } from 'botpress/sdk'

class BoxedString implements BoxedVariable<string> {
  public static type = 'string'
  public static config: FlowVariableConfig = {
    name: 'string',
    label: 'string',
    params: []
  }
  private _confidence?: number
  private _value?: string
  private _nbTurns?: number

  constructor({ nbOfTurns, value, confidence }: BoxedVarContructor<string>) {
    if (value) {
      this._nbTurns = nbOfTurns
      this.trySet(value, confidence)
    }
  }

  get value(): string {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  set value(newValue: string) {
    this.trySet(newValue, 1)
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

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  getConfidence() {
    return this._confidence
  }

  toString() {
    return this._value
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedString.type }
  }
}

export default BoxedString
