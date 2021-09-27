export function isNil(input: unknown): input is null | undefined {
  return input === null || input === undefined
}
