import { BoxedVarContructor, BoxedVariable, FlowVariableConfig } from 'botpress/sdk'

class BoxedBoolean implements BoxedVariable<boolean> {
  public static config: FlowVariableConfig = {
    type: 'boolean',
    fields: [
      {
        type: 'checkbox',
        key: 'defaultValue',
        label: 'module.builtin.defaultValue'
      }
    ],
    advancedSettings: []
  }

  private _confidence?: number
  private _value?: boolean
  private _nbTurns?: number

  constructor({ nbOfTurns, value }: BoxedVarContructor<boolean | string>) {
    if (typeof value === 'boolean') {
      this._value = value
      this._confidence = 1
    } else if (typeof value === 'string') {
      this._value = Boolean(value)
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

  trySet(val: boolean, confidence: number) {
    this._value = val
    this._confidence = confidence
  }

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  toString() {
    return this._value ? 'Yes' : 'No'
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedBoolean.config.type }
  }
}

export default BoxedBoolean
