import { JsonSchemaObject } from './types'

export const half = <T>(arr: T[]): [T[], T[]] => {
  return [arr.slice(0, arr.length / 2), arr.slice(arr.length / 2)]
}

export const omit = <T extends object, K extends keyof T>(obj: T, ...keys: K[]): Omit<T, K> =>
  Object.keys(obj).reduce((acc: Record<string, unknown>, key) => {
    if (!keys.includes(key as K)) {
      acc[key] = obj[key as K]
    }

    return acc
  }, {}) as Omit<T, K>

type Opener = string
type MessagePrefix = string
type Closer = string

type Builder = [Opener, Closer] | [Opener, MessagePrefix, Closer]

export function withMessage(
  schema: JsonSchemaObject,
  key: string,
  get: (props: { value: unknown; json: string }) => Builder | void,
) {
  const value = schema[key as keyof typeof schema]

  let r = ''

  if (value !== undefined) {
    const got = get({ value, json: JSON.stringify(value) })

    if (got) {
      const opener = got[0]
      const prefix = got.length === 3 ? got[1] : ''
      const closer = got.length === 3 ? got[2] : got[1]

      r += opener

      if (schema.errorMessage?.[key] !== undefined) {
        r += prefix + JSON.stringify(schema.errorMessage[key])
      }
      r
      r += closer
    }
  }

  return r
}
