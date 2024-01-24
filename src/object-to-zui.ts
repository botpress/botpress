import { z } from 'zod'
import { ZuiTypeAny, zui } from './zui'

// Using a basic regex do determine if it's a date or not to avoid using another lib for that
const dateTimeRegex =
  /^\d{4}-\d{2}-\d{2}(T|\s)?((\d{2}:\d{2}:\d{2}(\.\d{1,3})?)|(\d{2}:\d{2}))?(\s?([+-]\d{2}:\d{2}|Z))?$/

export const objectToZui = (obj: any) => {
  if (typeof obj !== 'object') {
    throw new Error('Input must be an object')
  }

  const schema = Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === null) {
      acc[key] = zui.null().optional()
    } else {
      switch (typeof value) {
        case 'string':
          acc[key] = dateTimeRegex.test(value) ? zui.string().datetime().optional() : zui.string().optional()
          break
        case 'number':
          acc[key] = zui.number().optional()
          break
        case 'boolean':
          acc[key] = zui.boolean().optional()
          break
        case 'object':
          if (Array.isArray(value)) {
            if (value.length === 0) {
              acc[key] = zui.array(z.unknown()).optional()
            } else if (typeof value[0] === 'object') {
              acc[key] = zui.array(objectToZui(value[0])).optional()
            } else if (['string', 'number', 'boolean'].includes(typeof value[0])) {
              acc[key] = zui.array((zui as any)[typeof value[0] as any]()).optional()
            }
          } else {
            acc[key] = objectToZui(value).optional()
          }
          break
        default:
          throw new Error(`Unsupported type for key ${key}`)
      }
    }
    return acc
  }, {} as ZuiTypeAny)

  return zui.object(schema)
}
