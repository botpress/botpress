import { zuiKey } from '../../../ui/constants'
import { ZuiExtensionObject } from '../../../ui/types'
import { ZodNativeEnumDef } from '../../../z/index'

export type JsonSchema7NativeEnumType = {
  type: 'string' | 'number' | ['string', 'number']
  enum: (string | number)[]
  [zuiKey]?: ZuiExtensionObject
}

export function parseNativeEnumDef(def: ZodNativeEnumDef): JsonSchema7NativeEnumType {
  const object = def.values
  const actualKeys = Object.keys(def.values).filter((key: string) => {
    return typeof object[object[key]!] !== 'number'
  })

  const actualValues = actualKeys.map((key: string) => object[key])

  const parsedTypes = Array.from(new Set(actualValues.map((values) => typeof values)))

  return {
    type: parsedTypes.length === 1 ? (parsedTypes[0] === 'string' ? 'string' : 'number') : ['string', 'number'],
    enum: actualValues.filter(
      (value): value is number | string => typeof value === 'string' || typeof value === 'number',
    ),
  }
}
