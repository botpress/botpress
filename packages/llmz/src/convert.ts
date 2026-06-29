import { z } from '@bpinternal/zui'

export type StaticValue = string | number | boolean | null | undefined | readonly StaticValue[] | StaticObject

export type StaticObject = { readonly [key: string]: StaticValue }

/**
 * Transforms static input values to Zui schemas that narrow manually provided values to literals.
 */
export function convertObjectToZuiLiterals<T extends StaticObject>(
  obj: T,
  nested?: false
): keyof T extends never ? z.ZodTypeAny : z.ZodRawShape
export function convertObjectToZuiLiterals<T extends StaticValue>(obj: T, nested: true): z.ZodTypeAny
export function convertObjectToZuiLiterals<T extends Exclude<StaticValue, StaticObject>>(
  obj: T,
  nested?: false
): z.ZodTypeAny
export function convertObjectToZuiLiterals(obj: unknown, nested = false): z.ZodRawShape | z.ZodTypeAny {
  if (typeof obj === 'string') {
    return z.literal(obj).catch(() => obj)
  }

  if (typeof obj === 'number') {
    return z.literal(obj).catch(() => obj)
  }

  if (typeof obj === 'boolean') {
    return z.literal(obj).catch(() => obj)
  }

  if (Array.isArray(obj)) {
    if (obj.length === 0) {
      return z.tuple([]).catch(() => obj as [])
    }

    const items = obj.map((child) => convertObjectToZuiLiterals(child as StaticValue, true)) as unknown as [
      z.ZodTypeAny,
      ...z.ZodTypeAny[],
    ]
    return z.tuple(items).catch(() => obj as [unknown, ...unknown[]])
  }

  if (obj !== null && typeof obj === 'object') {
    const shape: z.ZodRawShape = {}
    for (const [key, value] of Object.entries(obj)) {
      shape[key] = convertObjectToZuiLiterals(value as StaticValue, true)
    }
    if (nested) {
      return z.object(shape).catch(() => obj)
    }
    // We need to return a zod empty object for empty objects otherwise clone doesn't work properly.
    if (Object.keys(shape).length === 0) {
      return z.object({}).catch(() => obj)
    }
    return shape
  }

  if (obj === undefined) {
    return z.undefined().catch(() => undefined)
  }

  if (obj === null) {
    return z.null().catch(() => null)
  }

  throw new Error(`Unsupported object type ${typeof obj}, ${obj})`)
}
