import { BoxedVarContructor, BoxedVariable } from 'botpress/sdk'
import { FlowVariableConfig, FlowVariableType } from 'common/typings'
import yn from 'yn'

class BoxedBoolean implements BoxedVariable<boolean> {
  private _confidence?: number
  private _value?: boolean
  private _nbTurns?: number

  constructor({ nbOfTurns, value, confidence }: BoxedVarContructor<boolean>) {
    if (value) {
      this._nbTurns = nbOfTurns
      this.trySet(value, confidence)
    }
  }

  get value(): boolean | undefined {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  set value(newValue: boolean) {
    this.trySet(newValue, 1)
  }

  trySet(value: boolean, confidence: number) {
    if (typeof value === 'boolean') {
      this._value = value
      this._confidence = confidence
    } else {
      this._value = yn(value)
      this._confidence = 0.5 * confidence
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
    if (customFormat === 'y/n') {
      return this._value ? 'Yes' : 'No'
    } else {
      return this._value ? 'True' : 'False'
    }
  }

  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BooleanVariableType.id }
  }
}

const BooleanVariableConfig: FlowVariableConfig = {
  fields: [
    {
      type: 'checkbox',
      key: 'defaultValue',
      label: 'module.builtin.defaultValue'
    }
  ],
  advancedSettings: []
}

const BooleanVariableType: FlowVariableType = {
  id: 'boolean',
  config: BooleanVariableConfig,
  box: BoxedBoolean
}

export default BooleanVariableType
