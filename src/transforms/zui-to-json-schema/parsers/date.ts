import { ZodDateDef } from '../../../z/index'
import { Refs } from '../Refs'
import { ErrorMessages, setResponseValueAndErrors } from '../errorMessages'
import { JsonSchema7NumberType } from './number'

export type JsonSchema7DateType = {
  type: 'integer' | 'string'
  format: 'unix-time' | 'date-time'
  minimum?: number
  maximum?: number
  errorMessage?: ErrorMessages<JsonSchema7NumberType>
}

export function parseDateDef(def: ZodDateDef, refs: Refs): JsonSchema7DateType {
  if (refs.dateStrategy == 'integer') {
    return integerDateParser(def, refs)
  } else {
    return {
      type: 'string',
      format: 'date-time',
    }
  }
}

const integerDateParser = (def: ZodDateDef, refs: Refs) => {
  const res: JsonSchema7DateType = {
    type: 'integer',
    format: 'unix-time',
  }

  for (const check of def.checks) {
    switch (check.kind) {
      case 'min':
        if (refs.target === 'jsonSchema7') {
          setResponseValueAndErrors(
            res,
            'minimum',
            check.value, // This is in milliseconds
            check.message,
            refs,
          )
        }
        break
      case 'max':
        if (refs.target === 'jsonSchema7') {
          setResponseValueAndErrors(
            res,
            'maximum',
            check.value, // This is in milliseconds
            check.message,
            refs,
          )
        }
        break
    }
  }

  return res
}
