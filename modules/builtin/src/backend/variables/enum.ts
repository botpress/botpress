import { BoxedVarContructor, BoxedVariable, FlowVariableType } from 'botpress/sdk'

class BoxedEnum implements BoxedVariable<string> {
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
    this._value = value
    this._confidence = confidence

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
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: EnumVariableType.id }
  }
}

const EnumVariableType: FlowVariableType = {
  id: 'enum',
  config: {
    fields: [],
    advancedSettings: []
  },
  box: BoxedEnum
}

export default EnumVariableType
