import { z, SomeZodObject, ZodTypeAny } from '../../z/index'
import * as errors from '../common/errors'

// Using a basic regex do determine if it's a date or not to avoid using another lib for that
const dateTimeRegex =
  /^\d{4}-\d{2}-\d{2}(T|\s)?((\d{2}:\d{2}:\d{2}(\.\d{1,3})?)|(\d{2}:\d{2}))?(\s?([+-]\d{2}:\d{2}|Z))?$/

export type ObjectToZuiOptions = { optional?: boolean; nullable?: boolean; passtrough?: boolean }

export const objectToZui = (obj: any, opts?: ObjectToZuiOptions, isRoot = true): ZodTypeAny => {
  if (typeof obj !== 'object') {
    throw new errors.ObjectToZuiError('Input must be an object')
  }

  const applyOptions = (zodType: any) => {
    let newType = zodType
    if (opts?.nullable) {
      newType = newType.nullable()
    }
    if (opts?.optional) {
      newType = newType.optional()
    }
    if (opts?.passtrough && typeof newType.passthrough === 'function') {
      newType = newType.passthrough()
    }
    return newType
  }

  const schema = Object.entries(obj).reduce((acc: any, [key, value]) => {
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
            if (value.length === 0) {
              acc[key] = applyOptions(z.array(z.unknown()))
            } else if (typeof value[0] === 'object') {
              acc[key] = applyOptions(z.array(objectToZui(value[0], opts, false)))
            } else if (['string', 'number', 'boolean'].includes(typeof value[0])) {
              acc[key] = applyOptions(z.array((z as any)[typeof value[0] as any]()))
            }
          } else {
            acc[key] = applyOptions(objectToZui(value, opts, false))
          }
          break
        default:
          throw new errors.ObjectToZuiError(`Unsupported type for key ${key}`)
      }
    }
    return acc
  }, {} as SomeZodObject)

  const hasProperties = Object.keys(schema).length > 0
  if (opts?.passtrough || (!isRoot && !hasProperties)) {
    return z.object(schema).passthrough()
  }

  return z.object(schema)
}
