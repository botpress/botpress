export const is = {
  defined: <T>(value: T | undefined): value is T => value !== undefined,
  notNull: <T>(value: T | null): value is T => value !== null,
}
