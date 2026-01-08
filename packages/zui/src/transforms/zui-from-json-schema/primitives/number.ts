import { JSONSchema7 } from 'json-schema'
import z from '../../../z'

export const numberJSONSchemaToZuiNumber = ({
  type,
  minimum,
  exclusiveMinimum,
  maximum,
  exclusiveMaximum,
  multipleOf,
  format,
}: JSONSchema7 & { type: 'number' | 'integer' }): z.ZodNumber => {
  let zodNumber = z.number()

  if (type === 'integer') {
    zodNumber = zodNumber.int()
  }

  if (format === 'finite') {
    zodNumber = zodNumber.finite()
  }

  if (exclusiveMinimum !== undefined) {
    zodNumber = zodNumber.gt(exclusiveMinimum)
  } else if (minimum !== undefined) {
    zodNumber = zodNumber.gte(minimum)
  }

  if (exclusiveMaximum !== undefined) {
    zodNumber = zodNumber.lt(exclusiveMaximum)
  } else if (maximum !== undefined) {
    zodNumber = zodNumber.lte(maximum)
  }

  if (multipleOf !== undefined) {
    zodNumber = zodNumber.multipleOf(multipleOf)
  }

  return zodNumber
}
