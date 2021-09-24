export function isNotNil<T>(input: T | null | undefined): input is T {
  return input !== null && input !== undefined
}

export function isRecord(input: unknown): input is Record<string, unknown> {
  return isNotNil(input) && typeof input === 'object' && !Array.isArray(input)
}
