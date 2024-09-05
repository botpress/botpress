export const awaitRecord = async <T>(record: Record<string, Promise<T>>): Promise<Record<string, T>> => {
  const keys = Object.keys(record)
  const values = await Promise.all(Object.values(record))
  return keys.reduce((acc, key, index) => ({ ...acc, [key]: values[index] }), {})
}
