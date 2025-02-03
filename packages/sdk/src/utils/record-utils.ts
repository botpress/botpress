export const pairs = <K extends string, V>(obj: Record<K, V>) => Object.entries(obj) as [K, V][]
export const values = <K extends string, V>(obj: Record<K, V>) => Object.values(obj) as V[]
export const mapValues = <K extends string, V, R>(obj: Record<K, V>, fn: (value: V, key: K) => R): Record<K, R> =>
  Object.fromEntries(pairs(obj).map(([key, value]) => [key, fn(value, key)])) as Record<K, R>
export const stripUndefinedProps = <K extends string, V>(obj: Record<K, V | undefined>): Record<K, V> =>
  Object.fromEntries(pairs(obj).filter(([, value]) => value !== undefined)) as Record<K, V>

export const mergeRecords = <K extends string, V>(
  a: Record<K, V>,
  b: Record<K, V>,
  merge: (v1: V, v2: V) => V
): Record<K, V> => {
  const allKeys = [...Object.keys(a), ...Object.keys(b)] as K[]
  const uniqueKeys = [...new Set(allKeys)]
  const result: Record<K, V> = {} as Record<K, V>
  for (const key of uniqueKeys) {
    const aValue = a[key]
    const bValue = b[key]
    if (aValue && bValue) {
      result[key] = merge(aValue, bValue)
    } else if (aValue) {
      result[key] = aValue
    } else if (bValue) {
      result[key] = bValue
    }
  }
  return result
}
