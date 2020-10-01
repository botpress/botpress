import { BoxedVarContructor, BoxedVariable, ValidationData } from 'botpress/sdk'

export class BaseVariable<T, V = any> implements BoxedVariable<T, V> {
  protected _type: string
  protected _subType?: string
  protected _value?: T
  protected _confidence?: number
  protected _nbTurns: number
  protected _config?: V

  protected _getValidationData: () => ValidationData | undefined

  constructor({ type, subType, nbOfTurns, value, confidence, config, getValidationData }: BoxedVarContructor<T, V>) {
    this._type = type
    this._subType = subType
    this._confidence = confidence
    this._nbTurns = nbOfTurns
    this._config = config
    this._getValidationData = getValidationData

    if (value !== undefined && value !== null) {
      this.trySet(value, confidence ?? 1)
    }
  }

  get type() {
    return this._type
  }

  get subType() {
    return this._subType
  }

  get confidence(): number {
    return this._confidence!
  }

  get value(): T | undefined {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  set value(newValue: T | undefined) {
    this.trySet(newValue, 1)
  }

  trySet(value: T | undefined, confidence: number) {
    this._value = value
    this._confidence = confidence
  }

  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  getValidationData(): ValidationData | undefined {
    return this._getValidationData()
  }

  toString(...args: any): string {
    return (this._value as any)?.toString()
  }

  equals(other: T) {
    return this.value === other
  }

  compare(compareTo: BoxedVariable<T>): number {
    if (this.type !== compareTo.type) {
      throw new Error('You can only compare variables of the same type')
    }

    if (this.value === compareTo.value) {
      return 0
    }

    throw new Error('Compare method is not implemented')
  }

  unbox() {
    return {
      type: this._type,
      subType: this._subType,
      value: this._value,
      nbTurns: this._nbTurns,
      confidence: this._confidence!
    }
  }

  parse(text: string): T {
    return <any>text
  }
}
