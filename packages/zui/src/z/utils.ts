export type ValueOf<T> = T[keyof T]

export const unique = <T>(arr: T[]): T[] => {
  return Array.from(new Set(arr))
}
