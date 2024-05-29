export const setNullOnMissingValues = <A, B>(
  record: Record<string, A> = {},
  oldRecord: Record<string, B> = {}
): Record<string, A | null> => {
  const newRecord: Record<string, A | null> = {}

  for (const [key, value] of Object.entries(record)) {
    newRecord[key] = value
  }

  for (const value of Object.keys(oldRecord)) {
    if (!record[value]) {
      newRecord[value] = null
    }
  }

  return newRecord
}

export const zipObjects = <A, B>(
  recordA: Record<string, A>,
  recordB: Record<string, B>
): Record<string, [A | null, B | null]> => {
  const allKeys = new Set([...Object.keys(recordA), ...Object.keys(recordB)])
  const newRecord: Record<string, [A | null, B | null]> = {}

  for (const key of allKeys) {
    newRecord[key] = [recordA[key] ?? null, recordB[key] ?? null]
  }

  return newRecord
}

export const mapValues = <A, B>(record: Record<string, A>, fn: (value: A, key: string) => B): Record<string, B> => {
  const newRecord: Record<string, B> = {}

  for (const [key, value] of Object.entries(record)) {
    newRecord[key] = fn(value, key)
  }

  return newRecord
}

export const mapKeys = <A>(record: Record<string, A>, fn: (value: A, key: string) => string): Record<string, A> => {
  const newRecord: Record<string, A> = {}

  for (const [key, value] of Object.entries(record)) {
    const newKey = fn(value, key) as string
    newRecord[newKey] = value
  }

  return newRecord
}

export function filterValues<A, B extends A>(
  record: Record<string, A>,
  fn: (value: A, key: string) => value is B
): Record<string, B>
export function filterValues<A, _B extends A>(
  record: Record<string, A>,
  fn: (value: A, key: string) => boolean
): Record<string, A>
export function filterValues<A>(record: Record<string, A>, fn: (value: A, key: string) => boolean) {
  const newRecord: Record<string, A> = {}

  for (const [key, value] of Object.entries(record)) {
    if (fn(value, key)) {
      newRecord[key] = value
    }
  }

  return newRecord
}
