export type ParseJsonResult<T> =
  | {
      success: true
      data: T
    }
  | {
      success: false
      error: Error
    }

export const safeParseJson = <T>(jsonStr: string): ParseJsonResult<T> => {
  try {
    const data: T = JSON.parse(jsonStr)
    return { success: true, data }
  } catch (thrown) {
    const error = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { success: false, error }
  }
}
