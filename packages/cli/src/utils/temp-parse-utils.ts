import { Logger } from '../logger'

export function tryParseJSON<T extends any = any>(raw: string, debugText: string): T {
  try {
    return JSON.parse(raw)
  } catch (thrown: unknown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    new Logger().error(
      `Failed to read JSON file (${debugText}) -> "${error.message}"\n\n${JSON.stringify({ raw }, null, 2)}`
    )
    throw error
  }
}
