export const keys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[]

export const entries = <K extends string, V>(obj: Record<K, V>): [K, V][] => Object.entries(obj) as [K, V][]

export const fromEntries = <K extends string, V>(pairs: [K, V][]): Record<K, V> => {
  const obj = {} as Record<K, V>
  for (const [key, value] of pairs) {
    obj[key] = value
  }
  return obj
}
