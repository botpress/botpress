export const is = {
  defined: <T>(value: T | undefined): value is T => value !== undefined,
}
