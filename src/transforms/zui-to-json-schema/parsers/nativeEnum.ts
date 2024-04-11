import { ZodNativeEnumDef } from '../../../z'

export type JsonSchema7NativeEnumType = {
  type: 'string' | 'number' | ['string', 'number']
  enum: (string | number)[]
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
