import { RuntimeError } from '@botpress/sdk'

export const keepOnlySetProperties = (obj: object) => Object.fromEntries(Object.entries(obj).filter(([, v]) => !!v))

export const canonicalize = (identifier: string) => identifier.trim().toUpperCase().normalize()

export const nameCompare = (name1: string, name2: string) => canonicalize(name1) === canonicalize(name2)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const wrapWithTryCatch = <T extends (...args: any[]) => Promise<any>>(fn: T, errorMessage: string): T =>
  (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw new RuntimeError(`${errorMessage}: ${error}`, error as Error)
    }
  }) as T

export const createCsvRegex = (expression: RegExp, separators = ',; ') =>
  new RegExp(`^(?:${expression.source}(?:[${separators}]+|$))+$`)

export const extractFromCsv = (csv: string, separators = ',; ') =>
  csv
    .split(new RegExp(`[${separators}]+`))
    .map((s) => s.trim())
    .filter((s) => s.length > 0)
