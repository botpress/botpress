import { BoxedVarContructor, BoxedVariable, NLU } from 'botpress/sdk'

export class BaseVariable<T, V = any> implements BoxedVariable<T, V> {
  protected _type: string
  protected _enumType?: string
  protected _value?: T
  protected _confidence?: number
  protected _nbTurns: number
  protected _config?: V

  protected _getEnumList: () => NLU.EntityDefOccurrence[]

  constructor({ type, enumType, nbOfTurns, value, confidence, config, getEnumList }: BoxedVarContructor<T, V>) {
    this._type = type
    this._enumType = enumType
    this._confidence = confidence
    this._nbTurns = nbOfTurns
    this._config = config
    this._getEnumList = getEnumList

    if (value !== undefined) {
      this.trySet(value, confidence ?? 1)
    }
  }

  get type() {
    return this._type
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

  getEnumList(): NLU.EntityDefOccurrence[] | undefined {
    return this._getEnumList()
  }

  toString(...args: any): string {
    return (this._value as any)?.toString()
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
      enumType: this._enumType,
      value: this._value,
      nbTurns: this._nbTurns,
      confidence: this._confidence!
    }
  }
}
