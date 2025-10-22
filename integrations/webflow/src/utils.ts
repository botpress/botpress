export const safeJsonParse = <T extends unknown>(
  str: string
): { success: true; data: T } | { success: false; err: Error } => {
  try {
    const object: T = JSON.parse(str)
    return { success: true, data: object }
  } catch (thrown) {
    const err = thrown instanceof Error ? thrown : new Error(String(thrown))
    return { success: false, err }
  }
}
