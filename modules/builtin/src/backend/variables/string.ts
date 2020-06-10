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

  constructor({ nbOfTurns, value }: BoxedVarContructor<string>) {
    this._value = value
    this._confidence = 1

    this._nbTurns = nbOfTurns
  }

  get value() {
    return this._value
  }

  set value(val) {
    this._value = val
  }

  trySet(val: string, confidence: number) {
    this._value = val
    this._confidence = confidence
  }

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  toString() {
    return this._value
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedString.type }
  }
}

export default BoxedString
