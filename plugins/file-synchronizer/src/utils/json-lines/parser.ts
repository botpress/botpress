import * as sdk from '@botpress/sdk'

type _JsonParseResult<T> = { rawLine: string } & ({ value: T } | { error: Error })

export function* parseJsonLines<TLineSchema extends sdk.ZodTypeAny>(
  rawJsonLines: string,
  zodSchema: TLineSchema
): Generator<_JsonParseResult<sdk.z.infer<TLineSchema>>, void, undefined> {
  let startCursor = 0

  for (let endCursor = 0; endCursor <= rawJsonLines.length; endCursor++) {
    if (rawJsonLines[endCursor] === '\n' || endCursor === rawJsonLines.length) {
      const line = rawJsonLines.slice(startCursor, endCursor).trim()
      startCursor = endCursor + 1

      if (line) {
        try {
          yield { rawLine: line, value: zodSchema.parse(JSON.parse(line)) }
        } catch (thrown: unknown) {
          const err: Error = thrown instanceof Error ? thrown : new Error(String(thrown))
          yield { rawLine: line, error: err }
        }
      }
    }
  }
}
