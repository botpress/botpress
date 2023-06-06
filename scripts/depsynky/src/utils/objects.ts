export const keys = <T extends object>(obj: T): (keyof T)[] => Object.keys(obj) as (keyof T)[]

export const mapValues = <K extends string, V1, V2>(obj: Record<K, V1>, fn: (value: V1) => V2): Record<K, V2> => {
  return keys(obj).reduce((acc, key) => {
    return { ...acc, [key]: fn(obj[key]) }
  }, {} as Record<K, V2>)
}
