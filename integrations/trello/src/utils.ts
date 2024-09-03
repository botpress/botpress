import { RuntimeError } from '@botpress/sdk'

export const keepOnlySetProperties = (obj: object) => Object.fromEntries(Object.entries(obj).filter(([_, v]) => !!v))

export const canonicalize = (identifier: string) => identifier.trim().toUpperCase().normalize()

export const nameCompare = (name1: string, name2: string) => canonicalize(name1) === canonicalize(name2)

export const wrapWithTryCatch = <T extends (...args: any[]) => Promise<any>>(fn: T, errorMessage: string): T =>
  (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args)
    } catch (error) {
      throw new RuntimeError(`${errorMessage}: ${error}`)
    }
  }) as T
