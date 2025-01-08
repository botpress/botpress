export const pairs = <K extends string, V>(obj: Record<K, V>) => Object.entries(obj) as [K, V][]
export const values = <K extends string, V>(obj: Record<K, V>) => Object.values(obj) as V[]
export const mapValues = <K extends string, V, R>(obj: Record<K, V>, fn: (value: V, key: K) => R): Record<K, R> =>
  Object.fromEntries(pairs(obj).map(([key, value]) => [key, fn(value, key)])) as Record<K, R>
