import { BoxedVarContructor, BoxedVariable, FlowVariableConfig } from 'botpress/sdk'

class BoxedBoolean implements BoxedVariable<boolean> {
  public static type = 'boolean'
  public static config: FlowVariableConfig = {
    name: 'boolean',
    label: 'boolean',
    params: [
      {
        name: 'defaultValue',
        label: 'module.builtin.defaultValue',
        control: 'nullableCheckbox'
      }
    ]
  }
  private _confidence?: number
  private _value?: boolean
  private _nbTurns?: number

  constructor({ nbOfTurns, value, confidence }: BoxedVarContructor<boolean>) {
    if (value) {
      this._nbTurns = nbOfTurns
      this.trySet(value, confidence)
    }
  }

  get value(): boolean {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  set value(newValue: boolean) {
    this.trySet(newValue, 1)
  }

  trySet(value: boolean, confidence: number) {
    try {
      if (typeof value === 'boolean') {
        this._value = value
        this._confidence = confidence
      } else {
        this._value = Boolean(value)
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
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedBoolean.type }
  }
}

export default BoxedBoolean
