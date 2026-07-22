import { CodeFormattingError } from './errors.js'
import { formatTypingsUnsafe } from './typings-formatter.js'

export type CodeFormatOptions = {
  throwOnError?: boolean
}

export async function formatTypings(typings: string, options?: CodeFormatOptions): Promise<string> {
  try {
    return formatTypingsUnsafe(typings)
  } catch (err) {
    if (options?.throwOnError ?? true) {
      throw new CodeFormattingError(err instanceof Error ? err.message : (err?.toString() ?? 'Unknown Error'), typings)
    }
    return typings
  }
}
