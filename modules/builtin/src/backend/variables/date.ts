import sdk from 'botpress/sdk'
import { BaseVariable } from 'common/variables'
import moment from 'moment'

import { common, createOperator, getCommonOperators } from './common'

type BoxedDateType = string | Date | moment.Moment

interface DateConfig {
  format: string
}

interface Variable extends sdk.BoxedVariable<BoxedDateType, DateConfig> {
  parse(text: string): BoxedDateType
  equals: (other: Date) => boolean
  isBefore: (other: Date) => boolean
  isAfter: (other: Date) => boolean
}

class BoxedDate extends BaseVariable<BoxedDateType, DateConfig> implements Variable {
  constructor(args) {
    super(args)
  }

  parse(text: string): BoxedDateType {
    return moment(text).toDate()
  }

  equals(other: Date) {
    return (
      moment(this.value)
        .toDate()
        .getTime() === other.getTime()
    )
  }

  isBefore(other: Date) {
    return moment(this.value).toDate() < other
  }

  isAfter(other: Date) {
    return moment(this.value).toDate() > other
  }

  trySet(value: BoxedDateType, confidence?: number) {
    try {
      this._value = moment(value).toDate()
      this._confidence = confidence ?? +moment(value).isValid()
    } catch (err) {
      this._confidence = 0
    }
  }

  compare(compareTo: sdk.BoxedVariable<BoxedDateType, DateConfig>) {
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

const definition: sdk.PrimitiveVarType = {
  id: 'date',
  config: {
    label: 'date',
    icon: 'calendar',
    operators: [...getCommonOperators('date'), createOperator('date', 'isBefore'), createOperator('date', 'isAfter')],
    fields: [
      ...common.fields,
      {
        type: 'text',
        key: 'format',
        label: 'format'
      }
    ],
    advancedSettings: common.advancedSettings
  },
  box: BoxedDate
}

export default definition
