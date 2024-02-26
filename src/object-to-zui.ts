import { z } from 'zod'
import { ZuiTypeAny, zui } from './zui'

// Using a basic regex do determine if it's a date or not to avoid using another lib for that
const dateTimeRegex =
  /^\d{4}-\d{2}-\d{2}(T|\s)?((\d{2}:\d{2}:\d{2}(\.\d{1,3})?)|(\d{2}:\d{2}))?(\s?([+-]\d{2}:\d{2}|Z))?$/

export type ObjectToZuiOptions = { optional?: boolean; nullable?: boolean; passtrough?: boolean }

export const objectToZui = (obj: any, opts?: ObjectToZuiOptions, isRoot = true) => {
  if (typeof obj !== 'object') {
    throw new Error('Input must be an object')
  }

  const applyOptions = (zuiType: ZuiTypeAny) => {
    let newType = zuiType
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

  const schema = Object.entries(obj).reduce((acc, [key, value]) => {
    if (value === null) {
      acc[key] = applyOptions(zui.null())
    } else {
      switch (typeof value) {
        case 'string':
          acc[key] = dateTimeRegex.test(value) ? applyOptions(zui.string().datetime()) : applyOptions(zui.string())
          break
        case 'number':
          acc[key] = applyOptions(zui.number())
          break
        case 'boolean':
          acc[key] = applyOptions(zui.boolean())
          break
        case 'object':
          if (Array.isArray(value)) {
            if (value.length === 0) {
              acc[key] = applyOptions(zui.array(z.unknown()))
            } else if (typeof value[0] === 'object') {
              acc[key] = applyOptions(zui.array(objectToZui(value[0], opts, false)))
            } else if (['string', 'number', 'boolean'].includes(typeof value[0])) {
              acc[key] = applyOptions(zui.array((zui as any)[typeof value[0] as any]()))
            }
          } else {
            acc[key] = applyOptions(objectToZui(value, opts, false))
          }
          break
        default:
          throw new Error(`Unsupported type for key ${key}`)
      }
    }
    return acc
  }, {} as ZuiTypeAny)

  const hasProperties = Object.keys(schema).length > 0
  if (opts?.passtrough || (!isRoot && !hasProperties)) {
    return zui.object(schema).passthrough()
  }

  return zui.object(schema)
}
