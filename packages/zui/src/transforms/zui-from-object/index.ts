import * as z from '../../z'
import * as errors from '../common/errors'

// Using a basic regex do determine if it's a date or not to avoid using another lib for that
const dateTimeRegex =
  /^\d{4}-\d{2}-\d{2}(T|\s)?((\d{2}:\d{2}:\d{2}(\.\d{1,3})?)|(\d{2}:\d{2}))?(\s?([+-]\d{2}:\d{2}|Z))?$/

export type ObjectToZuiOptions = { optional?: boolean; nullable?: boolean; passtrough?: boolean }

/**
 * Converts a plain object to a Zod schema, by inferring the types of its properties.
 *
 * @param obj - The object to convert.
 * @param opts - Options to customize the Zod schema:
 * @returns A Zod schema representing the object.
 */
export const fromObject = (obj: object, opts?: ObjectToZuiOptions, isRoot = true): z.ZodType => {
  if (typeof obj !== 'object') {
    throw new errors.ObjectToZuiError('Input must be an object')
  }

  const applyOptions = (zodType: z.ZodType) => {
    let newType = zodType
    if (opts?.nullable) {
      newType = newType.nullable()
    }
    if (opts?.optional) {
      newType = newType.optional()
    }
    if (opts?.passtrough && z.is.zuiObject(newType)) {
      newType = newType.passthrough()
    }
    return newType
  }

  const schema: z.ZodRawShape = Object.entries(obj).reduce((acc: z.ZodRawShape, [key, value]: [string, unknown]) => {
    if (value === null) {
      acc[key] = applyOptions(z.null())
    } else {
      switch (typeof value) {
        case 'string':
          acc[key] = dateTimeRegex.test(value) ? applyOptions(z.string().datetime()) : applyOptions(z.string())
          break
        case 'number':
          acc[key] = applyOptions(z.number())
          break
        case 'boolean':
          acc[key] = applyOptions(z.boolean())
          break
        case 'object':
          if (Array.isArray(value)) {
            const [first] = value as unknown[]
            if (first === undefined || first === null) {
              acc[key] = applyOptions(z.array(z.unknown()))
            } else if (typeof first === 'object') {
              acc[key] = applyOptions(z.array(fromObject(first, opts, false)))
            } else if (typeof first === 'string' || typeof first === 'number' || typeof first === 'boolean') {
              const inner = _getInnerType(first)
              acc[key] = applyOptions(z.array(inner))
            }
          } else {
            acc[key] = applyOptions(fromObject(value, opts, false))
          }
          break
        default:
          throw new errors.ObjectToZuiError(`Unsupported type for key ${key}`)
      }
    }
    return acc
  }, {} as z.ZodRawShape)

  const hasProperties = Object.keys(schema).length > 0
  if (opts?.passtrough || (!isRoot && !hasProperties)) {
    return z.object(schema).passthrough()
  }

  return z.object(schema)
}

const _getInnerType = (first: string | number | boolean): z.ZodType => {
  if (typeof first === 'string') {
    return z.string()
  }
  if (typeof first === 'number') {
    return z.number()
  }
  if (typeof first === 'boolean') {
    return z.boolean()
  }
  first satisfies never
  return z.unknown()
}
