// Kept verbatim (incl. "false") so prompts for empty inputs stay unchanged
const EMPTY_INPUT = '<input is null, false, undefined or empty>'

export const stringify = (input: unknown, beautify = true): string => {
  if (input === null || input === undefined || input === '') {
    return EMPTY_INPUT
  }

  if (typeof input === 'string') {
    return input
  }

  if (typeof input === 'number' || typeof input === 'boolean' || typeof input === 'bigint') {
    return String(input)
  }

  if (typeof input === 'function' || typeof input === 'symbol') {
    return String(input)
  }

  const indent = beautify ? 2 : undefined
  try {
    return JSON.stringify(input, null, indent) ?? String(input)
  } catch {
    // Circular references, BigInt values nested in objects, throwing toJSON(), etc.
    try {
      const seen = new WeakSet<object>()
      return (
        JSON.stringify(
          input,
          (_key, value: unknown) => {
            if (typeof value === 'bigint') {
              return value.toString()
            }
            if (value !== null && typeof value === 'object') {
              if (seen.has(value)) {
                return '[Circular]'
              }
              seen.add(value)
            }
            return value
          },
          indent
        ) ?? String(input)
      )
    } catch {
      return String(input)
    }
  }
}

export function fastHash(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0 // Convert to 32bit integer
  }
  return (hash >>> 0).toString(16) // Convert to unsigned and then to hex
}

export const takeUntilTokens = <T>(arr: T[], tokens: number, count: (el: T) => number) => {
  const result: T[] = []
  let total = 0

  for (const value of arr) {
    const valueTokens = count(value)
    if (total + valueTokens > tokens) {
      break
    }
    total += valueTokens
    result.push(value)
  }

  return result
}

export type GenerationMetadata = {
  model: string
  cost: {
    input: number
    output: number
  }
  latency: number
  tokens: {
    input: number
    output: number
  }
}

type Abortable = { controller: AbortController }

/**
 * `.catch()` handler for parallel chunk work: on the first failure, aborts the operation's context so
 * sibling chunks stop spending model calls whose results would be discarded, then rethrows.
 */
export const abortSiblingsOnFailure =
  (ctx: Abortable) =>
  (err: unknown): never => {
    if (!ctx.controller.signal.aborted) {
      ctx.controller.abort(err)
    }
    throw err
  }

/** `Promise.all` that aborts the operation's context on the first rejection (see `abortSiblingsOnFailure`). */
export const allOrAbort = <T>(ctx: Abortable, promises: Array<Promise<T>>): Promise<T[]> =>
  Promise.all(promises.map((promise) => promise.catch(abortSiblingsOnFailure(ctx))))
