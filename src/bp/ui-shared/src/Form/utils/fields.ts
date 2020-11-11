import { Control, ControlForm, ControlType } from 'common/controls'
import _ from 'lodash'

import { ControlWithKey } from '..'
import { lang as langTr } from '../../translations'

export const fieldsToMap = (fields: ControlForm): ControlWithKey => {
  return Object.entries(fields).map(([key, entry]) => ({ key, ...entry }))
}

export const createEmptyDataFromSchema = (fields: ControlWithKey, lang?: string): any => {
  const fieldList: ControlWithKey = _.isArray(fields) ? fields : fieldsToMap(fields)
  return fieldList.reduce((acc, field) => ({ ...acc, [field.key]: getFieldDefaultValue(field, lang) }), {})
}

export const getFieldDefaultValue = (field: Control, lang?: string) => {
  if (field.defaultValue !== undefined) {
    return typeof field.defaultValue === 'string' ? langTr(field.defaultValue) : field.defaultValue
  }

  switch (field.type) {
    case ControlType.Boolean:
      return false
    case ControlType.Number:
      return
    case ControlType.Enum:
      return field.multiple ? [] : null
    case ControlType.Array:
      return field.translated ? { [lang!]: [''] } : ['']
    case ControlType.String:
    case ControlType.File:
      return field.translated ? { [lang!]: '' } : ''
  }
}
