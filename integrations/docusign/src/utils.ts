import { Result } from './types'

export const safeParseJson = (json: string): Result<unknown> => {
  try {
    return {
      success: true,
      data: JSON.parse(json),
    } as const
  } catch (thrown: unknown) {
    return {
      success: false,
      error: thrown instanceof Error ? thrown : new Error(String(thrown)),
    } as const
  }
}
