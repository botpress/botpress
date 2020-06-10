import { BoxedVariable, FlowVariableConfig } from 'botpress/sdk'
import moment from 'moment'

type BoxedDateType = string | Date | moment.Moment

class BoxedDate implements BoxedVariable<BoxedDateType> {
  public static config: FlowVariableConfig = {
    type: 'date',
    fields: [
      {
        type: 'text',
        key: 'format',
        label: 'format'
      }
    ],
    advancedSettings: []
  }

  private _value?: BoxedDateType
  private _nbTurns?: number
  private _confidence: number = 0

  // This is the value loaded by the state manager. nbTurns is incremented before the constructor is called
  constructor({ nbOfTurns, value, confidence }) {
    if (value) {
      this._nbTurns = nbOfTurns
      this.trySet(value, confidence)
    }
  }

  // As long as there's some turns left, the value is returned. -1 is unlimited
  get value(): BoxedDateType {
    return this._nbTurns !== 0 ? this._value : undefined
  }

  // Setting the value directly implies a top confidence, as long as the value is valid
  set value(newValue: BoxedDateType) {
    this.trySet(newValue, 1)
  }

  // Prompts will call this method with their expected confidence for the value
  trySet(value: BoxedDateType, confidence?: number) {
    try {
      this._value = moment(value).toDate()
      this._confidence = confidence ?? +moment(value).isValid()
    } catch (err) {
      this._confidence = 0
    }
  }

  // Display the boxed value, with a custom format if requested by the user
  toString(customFormat?: string) {
    return moment(this._value).format(customFormat || 'YYYY-MM-DD')
  }

  getConfidence() {
    return this._confidence
  }

  // We can adjust the retention of the value with this method
  setRetentionPolicy(nbOfTurns: number) {
    this._nbTurns = nbOfTurns
  }

  // This method must return a simple object that will be stored with the session
  unbox() {
    return { value: this._value, nbTurns: this._nbTurns, confidence: this._confidence, type: BoxedDate.config.type }
  }
}

export default BoxedDate
