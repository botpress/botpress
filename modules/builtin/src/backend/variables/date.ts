import { BoxedVariable, FlowVariableType } from 'botpress/sdk'
import { BaseVariable } from 'common/variables'
import moment from 'moment'

type BoxedDateType = string | Date | moment.Moment

interface DateConfig {
  format: string
}

class BoxedDate extends BaseVariable<BoxedDateType, DateConfig> {
  constructor(args) {
    super(args)
  }

  trySet(value: BoxedDateType, confidence?: number) {
    try {
      this._value = moment(value).toDate()
      this._confidence = confidence ?? +moment(value).isValid()
    } catch (err) {
      this._confidence = 0
    }
  }

  compare(compareTo: BoxedVariable<BoxedDateType, DateConfig>) {
    const dateA = this.value
    const dateB = moment(compareTo.value)

    if (dateA > dateB) {
      return 1
    } else if (dateA < dateB) {
      return -1
    }

    return 0
  }

  toString(customFormat?: string) {
    return moment(this._value).format(customFormat ?? this._config?.format ?? 'YYYY-MM-DD')
  }
}

const DateVariableType: FlowVariableType = {
  id: 'date',
  config: {
    fields: [
      {
        type: 'text',
        key: 'format',
        label: 'format'
      }
    ],
    advancedSettings: []
  },
  box: BoxedDate
}

export default DateVariableType
