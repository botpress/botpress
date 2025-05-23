import { LRUCache } from 'lru-cache'

import babel from 'prettier/plugins/babel'
import estree from 'prettier/plugins/estree'
import typescript from 'prettier/plugins/typescript'
import { format } from 'prettier/standalone'

import { CodeFormattingError } from './errors.js'

const cache = new LRUCache<string, string>({ max: 1000 })

export type CodeFormatOptions = Parameters<typeof format>[1] & {
  throwOnError?: boolean
}

export async function formatTypings(typings: string, options?: CodeFormatOptions): Promise<string> {
  if (cache.has(typings)) {
    return cache.get(typings)!
  }

  try {
    options ??= {}
    options.throwOnError ??= true

    const result = (
      await format(typings, {
        singleAttributePerLine: true,
        bracketSameLine: true,
        semi: false,
        ...options,
        embeddedLanguageFormatting: 'off',
        plugins: [estree, babel, typescript],
        parser: 'typescript',
        filepath: 'tools.d.ts',
      })
    ).trim()
    cache.set(typings, result)
    return result
  } catch (err) {
    if (options?.throwOnError) {
      // TODO: fix error here
      throw new CodeFormattingError(err instanceof Error ? err.message : (err?.toString() ?? 'Unknown Error'), typings)
    }
    return typings
  }
}
